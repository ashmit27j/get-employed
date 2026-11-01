"""Coding Arena sandbox Lambda: compile and run untrusted C++ or Python code.

The function runs in a VPC with no route out, has an IAM role with nothing but log writing,
and never sees expected outputs: it returns what the program printed, and the executor
Lambda compares outside. Each program runs under runbox (rlimits + seccomp, no sockets) in
its own session, and every invocation starts and ends by killing leftover processes and
wiping /tmp, because Lambda reuses execution environments between invocations.

Event:  {language, code, inputs[], timeLimitMs, memoryLimitMb, compileOnly?, stopOnFailure?}
Result: {ok, compile: {ok, output, timeMs}, results: [{status, stdout, stdoutTruncated,
         stderr, exitCode, signal, timeMs, wallMs, memKb}], cleaned}
"""

from __future__ import annotations

import ctypes
import math
import os
import shutil
import signal
import stat
import subprocess
import sys
import time
import uuid

# Make this process non-dumpable so code we run (same uid) can't read our /proc/<pid>/environ
# (which holds the function's AWS credentials) or /proc/<pid>/mem.
try:
    ctypes.CDLL(None, use_errno=True).prctl(4, 0, 0, 0, 0)  # PR_SET_DUMPABLE = 4
except Exception:  # pragma: no cover - only matters on Linux
    pass

HERE = os.path.dirname(os.path.abspath(__file__))
RUNBOX = os.path.join(HERE, "runbox")
PYTHON = "/var/lang/bin/python3.12" if os.path.exists("/var/lang/bin/python3.12") else sys.executable
GXX = "/usr/bin/g++"
WORK_ROOT = "/tmp"
SCRUB_DIRS = ("/tmp", "/dev/shm")

MAX_CODE_BYTES = 64 * 1024
MAX_INPUTS = 10
MAX_INPUT_BYTES = 4 * 1024 * 1024  # total, keeps the request under Lambda's 6 MB payload
STDOUT_CAP = 700_000  # bytes returned per test; 5 tests + JSON escaping stay under 6 MB
STDERR_CAP = 4096
COMPILE_OUTPUT_CAP = 8192
FILE_LIMIT_MB = 16  # RLIMIT_FSIZE: a program printing forever stops here (SIGXFSZ)
RUN_NPROC = 32
RUN_NOFILE = 64
MEMORY_MARKERS = ("MemoryError", "std::bad_alloc", "Cannot allocate memory", "[ENOMEM]")

LANGS = {"cpp": "main.cpp", "python": "main.py"}


# ── cleanup ────────────────────────────────────────────────────────────────────────────


def _ancestors(pid: int) -> set[int]:
    seen: set[int] = set()
    while pid > 1 and pid not in seen:
        seen.add(pid)
        try:
            with open(f"/proc/{pid}/stat", "rb") as f:
                data = f.read()
            pid = int(data[data.rindex(b")") + 2 :].split()[1])
        except (OSError, ValueError, IndexError):
            break
    return seen


def kill_strays() -> int:
    """SIGKILL every process of our uid except us, our ancestors and PID 1. Returns the count."""
    if not os.path.isdir("/proc"):
        return 0
    me = os.getpid()
    protected = _ancestors(me) | {me, 1}
    uid = os.getuid()
    killed = 0
    for _ in range(100):  # fork bombs respawn; NPROC bounds them, so a few rounds suffice
        victims = []
        for name in os.listdir("/proc"):
            if not name.isdigit():
                continue
            pid = int(name)
            if pid in protected:
                continue
            try:
                if os.stat(f"/proc/{pid}").st_uid == uid:
                    victims.append(pid)
            except OSError:
                continue
        if not victims:
            break
        for pid in victims:
            try:
                os.kill(pid, signal.SIGKILL)
                killed += 1
            except OSError:
                pass
        _reap()
        time.sleep(0.01)
    _reap()
    return killed


def _reap() -> None:
    while True:
        try:
            pid, _ = os.waitpid(-1, os.WNOHANG)
        except ChildProcessError:
            return
        if pid == 0:
            return


def _force_remove(path: str) -> None:
    try:
        st = os.lstat(path)
    except OSError:
        return
    if stat.S_ISDIR(st.st_mode):
        try:
            os.chmod(path, 0o700)  # user code may have chmod 000'd its own dirs
        except OSError:
            pass
        try:
            names = os.listdir(path)
        except OSError:
            names = []
        for n in names:
            _force_remove(os.path.join(path, n))
        try:
            os.rmdir(path)
        except OSError:
            pass
    else:
        try:
            os.unlink(path)
        except OSError:
            pass


def scrub() -> int:
    """Kill leftovers and empty /tmp (and /dev/shm). Returns how many processes were killed."""
    killed = kill_strays()
    for root in SCRUB_DIRS:
        try:
            names = os.listdir(root)
        except OSError:
            continue
        for n in names:
            _force_remove(os.path.join(root, n))
    return killed


# ── running one program ────────────────────────────────────────────────────────────────


def _tail(path: str, cap: int) -> str:
    try:
        with open(path, "rb") as f:
            data = f.read(cap + 1)
    except OSError:
        return ""
    text = data[:cap].decode("utf-8", errors="replace")
    return text + ("\n…(truncated)" if len(data) > cap else "")


def run_limited(
    argv: list[str],
    cwd: str,
    stdin_path: str,
    *,
    cpu_ms: int,
    wall_ms: int,
    as_mb: int,
    stack_mb: int,
    fsize_mb: int,
    nproc: int,
    nofile: int,
    tag: str,
) -> dict:
    out_path = os.path.join(cwd, f".{tag}.out")
    err_path = os.path.join(cwd, f".{tag}.err")
    cpu_s = max(1, math.ceil(cpu_ms / 1000))
    cmd = [RUNBOX, str(cpu_s), str(as_mb), str(stack_mb), str(fsize_mb), str(nproc), str(nofile), "--", *argv]
    timed_out = False
    with open(stdin_path, "rb") as fin, open(out_path, "wb") as fout, open(err_path, "wb") as ferr:
        start = time.monotonic()
        proc = subprocess.Popen(
            cmd, cwd=cwd, stdin=fin, stdout=fout, stderr=ferr, env={}, start_new_session=True, close_fds=True
        )
        deadline = start + wall_ms / 1000
        while True:
            pid, status, usage = os.wait4(proc.pid, os.WNOHANG)
            if pid:
                break
            if time.monotonic() >= deadline:
                timed_out = True
                _killpg(proc.pid)
                pid, status, usage = os.wait4(proc.pid, 0)
                break
            time.sleep(0.004)
        wall = int((time.monotonic() - start) * 1000)
        proc.returncode = status  # we reaped it ourselves
    _killpg(proc.pid)  # anything it forked into its group

    sig = os.WTERMSIG(status) if os.WIFSIGNALED(status) else None
    code = os.WEXITSTATUS(status) if os.WIFEXITED(status) else None
    cpu = int((usage.ru_utime + usage.ru_stime) * 1000)
    mem_kb = int(usage.ru_maxrss)  # kilobytes on Linux
    size = os.path.getsize(out_path)
    with open(out_path, "rb") as f:
        raw = f.read(STDOUT_CAP)
    return {
        "stdout": raw.decode("utf-8", errors="replace"),
        "stdoutBytes": size,
        "stdoutTruncated": size > STDOUT_CAP,
        "stderr": _tail(err_path, STDERR_CAP),
        "exitCode": code,
        "signal": signal.Signals(sig).name if sig else None,
        "timeMs": cpu,
        "wallMs": wall,
        "memKb": mem_kb,
        "timedOut": timed_out,
    }


def _killpg(pgid: int) -> None:
    try:
        os.killpg(pgid, signal.SIGKILL)
    except OSError:
        pass


def classify(r: dict, time_limit_ms: int, memory_limit_mb: int) -> str:
    """Resource verdict only; correctness is decided outside the sandbox."""
    if r["stderr"].startswith("runbox:") and r["exitCode"] == 126:
        raise RuntimeError(f"sandbox setup failed: {r['stderr'][:200]}")
    if r["timedOut"] or r["signal"] in ("SIGXCPU",) or r["timeMs"] > time_limit_ms:
        return "TLE"
    if r["signal"] == "SIGKILL" and r["timeMs"] >= time_limit_ms:
        return "TLE"
    if r["signal"] == "SIGXFSZ" or r["stdoutBytes"] >= FILE_LIMIT_MB * 1024 * 1024:
        return "OLE"
    if r["memKb"] > memory_limit_mb * 1024 or (
        (r["exitCode"] not in (0, None) or r["signal"]) and any(m in r["stderr"] for m in MEMORY_MARKERS)
    ):
        return "MLE"
    if r["signal"] or r["exitCode"] != 0:
        return "RE"
    return "OK"


# ── the judge ──────────────────────────────────────────────────────────────────────────


def _bad(msg: str) -> dict:
    return {"ok": False, "error": msg}


def _validate(event: dict) -> str | None:
    if not isinstance(event, dict):
        return "event must be an object"
    if event.get("language") not in LANGS:
        return "language must be cpp or python"
    code = event.get("code")
    if not isinstance(code, str) or not code.strip():
        return "code is required"
    if len(code.encode()) > MAX_CODE_BYTES:
        return "code is larger than 64 KB"
    inputs = event.get("inputs", [])
    if not isinstance(inputs, list) or len(inputs) > MAX_INPUTS or not all(isinstance(i, str) for i in inputs):
        return f"inputs must be a list of at most {MAX_INPUTS} strings"
    if sum(len(i.encode()) for i in inputs) > MAX_INPUT_BYTES:
        return "inputs are larger than 4 MB"
    tl, ml = event.get("timeLimitMs"), event.get("memoryLimitMb")
    if not isinstance(tl, int) or not 100 <= tl <= 15000:
        return "timeLimitMs must be 100..15000"
    if not isinstance(ml, int) or not 16 <= ml <= 512:
        return "memoryLimitMb must be 16..512"
    return None


def compile_code(language: str, work: str) -> dict:
    empty = os.path.join(work, ".empty")
    open(empty, "wb").close()
    if language == "cpp":
        argv = [GXX, "-std=c++17", "-O2", "-pipe", "-o", "main", "main.cpp"]
        limits = dict(cpu_ms=20000, wall_ms=30000, as_mb=2048, stack_mb=64, fsize_mb=64, nproc=64, nofile=128)
    else:
        argv = [PYTHON, "-I", "-S", "-c", "import sys;compile(open('main.py','rb').read(),'main.py','exec')"]
        limits = dict(cpu_ms=5000, wall_ms=10000, as_mb=512, stack_mb=16, fsize_mb=1, nproc=8, nofile=32)
    r = run_limited(argv, work, empty, tag="compile", **limits)
    ok = r["exitCode"] == 0 and not r["timedOut"]
    output = _tail(os.path.join(work, ".compile.err"), COMPILE_OUTPUT_CAP)
    if language == "python":
        # Python reports syntax errors as a traceback; keep just the useful part.
        output = output.replace('File "main.py"', "main.py")
    if r["timedOut"]:
        output = "Compilation took too long."
    return {"ok": ok, "output": output.strip(), "timeMs": r["wallMs"]}


def judge(event: dict) -> dict:
    err = _validate(event)
    if err:
        return _bad(err)
    language = event["language"]
    tl = event["timeLimitMs"]
    ml = event["memoryLimitMb"]
    work = os.path.join(WORK_ROOT, f"run-{uuid.uuid4().hex}")
    os.makedirs(work, mode=0o700)
    with open(os.path.join(work, LANGS[language]), "w", encoding="utf-8") as f:
        f.write(event["code"])

    compiled = compile_code(language, work)
    result = {"ok": True, "compile": compiled, "results": []}
    if not compiled["ok"] or event.get("compileOnly"):
        return result

    if language == "cpp":
        argv, as_mb = ["./main"], ml + 16
    else:
        argv, as_mb = [PYTHON, "-I", "-S", "main.py"], ml + 64  # interpreter's own mappings
    for i, data in enumerate(event.get("inputs", [])):
        in_path = os.path.join(work, f".in{i}")
        with open(in_path, "w", encoding="utf-8") as f:
            f.write(data)
        r = run_limited(
            argv,
            work,
            in_path,
            cpu_ms=tl,
            wall_ms=tl * 3 + 1000,  # Lambda's CPU share is fractional; CPU time decides TLE
            as_mb=as_mb,
            stack_mb=ml,
            fsize_mb=FILE_LIMIT_MB,
            nproc=RUN_NPROC,
            nofile=RUN_NOFILE,
            tag=f"run{i}",
        )
        r["status"] = classify(r, tl, ml)
        del r["timedOut"]
        result["results"].append(r)
        kill_strays()  # nothing from test i may still be running during test i+1
        if r["status"] != "OK" and event.get("stopOnFailure"):
            break
    return result


def handler(event, _context=None):
    cleaned = scrub()
    try:
        out = judge(event)
    finally:
        cleaned += scrub()
    out["cleaned"] = cleaned
    return out
