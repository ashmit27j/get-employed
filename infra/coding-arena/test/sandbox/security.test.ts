// Sandbox security suite. Every case must produce the right verdict AND leave the
// environment clean for the next invocation (Lambda reuses warm environments).
import { describe, expect, it } from "vitest";
import { first, invoke, target } from "./invoke";

const suite = target ? describe : describe.skip;

suite(`sandbox security (${target ?? "no target: set SANDBOX_URL or SANDBOX_FUNCTION"})`, () => {
  it("runs a correct C++ program", async () => {
    const r = await invoke({
      language: "cpp",
      code: '#include <bits/stdc++.h>\nint main(){long long a,b;std::cin>>a>>b;std::cout<<a+b<<"\\n";}',
      inputs: ["2 40\n"],
    });
    expect(r.compile?.ok).toBe(true);
    expect(first(r)).toMatchObject({ status: "OK", stdout: "42\n", exitCode: 0 });
  });

  it("runs a correct Python program", async () => {
    const r = await invoke({
      language: "python",
      code: "a,b=map(int,input().split())\nprint(a+b)",
      inputs: ["2 40"],
    });
    expect(first(r)).toMatchObject({ status: "OK", stdout: "42\n" });
  });

  it("infinite loop → TLE", async () => {
    const r = await invoke({
      language: "cpp",
      code: "int main(){volatile long x=0;for(;;)x++;}",
      timeLimitMs: 1000,
    });
    expect(first(r).status).toBe("TLE");
  });

  it("Python infinite loop → TLE", async () => {
    const r = await invoke({
      language: "python",
      code: "while True:\n    pass",
      timeLimitMs: 1000,
    });
    expect(first(r).status).toBe("TLE");
  });

  it("sleeping forever (no CPU) → TLE by wall clock", async () => {
    const r = await invoke({
      language: "python",
      code: "import time\ntime.sleep(60)",
      timeLimitMs: 500,
    });
    expect(first(r).status).toBe("TLE");
  });

  it("fork bomb is contained and leaves nothing running", async () => {
    const r = await invoke({
      language: "cpp",
      code: "#include <unistd.h>\nint main(){for(;;)fork();}",
      timeLimitMs: 1000,
    });
    expect(["RE", "TLE"]).toContain(first(r).status);

    // The next invocation must see no leftover processes of the sandbox user.
    const probe = await invoke({
      language: "python",
      code: [
        "import os",
        "me=os.getuid(); n=0",
        "for p in os.listdir('/proc'):",
        "    if p.isdigit():",
        "        try:",
        "            if os.stat('/proc/'+p).st_uid==me and os.readlink('/proc/'+p+'/exe').endswith('main'): n+=1",
        "        except OSError: pass",
        "print(n)",
      ].join("\n"),
    });
    expect(first(probe).stdout.trim()).toBe("0");
  });

  it("Python fork bomb is contained", async () => {
    const r = await invoke({
      language: "python",
      code: "import os\nwhile True:\n    try: os.fork()\n    except OSError: pass",
      timeLimitMs: 1000,
    });
    expect(["RE", "TLE"]).toContain(first(r).status);
  });

  it("memory hog → MLE (C++)", async () => {
    const r = await invoke({
      language: "cpp",
      code: "#include <bits/stdc++.h>\nint main(){std::vector<std::vector<char>> v;for(;;){v.emplace_back(1<<20,'x');}}",
      memoryLimitMb: 64,
    });
    expect(first(r).status).toBe("MLE");
  });

  it("memory hog → MLE (Python)", async () => {
    const r = await invoke({
      language: "python",
      code: "a=[]\nwhile True:\n    a.append(bytearray(1<<20))",
      memoryLimitMb: 64,
    });
    expect(first(r).status).toBe("MLE");
  });

  it("huge output is capped", async () => {
    const r = await invoke({
      language: "cpp",
      code: '#include <cstdio>\nint main(){for(;;)fputs("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\\n",stdout);}',
      timeLimitMs: 3000,
    });
    const x = first(r);
    expect(["OLE", "TLE"]).toContain(x.status);
    expect(x.stdout.length).toBeLessThanOrEqual(700_000);
    expect(x.stdoutTruncated).toBe(true);
  });

  it("outbound network fails (Python socket, C++ socket, curl)", async () => {
    const py = await invoke({
      language: "python",
      code: [
        "import socket",
        "out=[]",
        "for host,port in [('1.1.1.1',80),('169.254.169.254',80),('127.0.0.1',9001),('169.254.170.2',80)]:",
        "    try:",
        "        s=socket.create_connection((host,port),timeout=2); out.append('OPEN '+host)",
        "    except Exception as e: out.append('BLOCKED')",
        "print(' '.join(out))",
      ].join("\n"),
      timeLimitMs: 5000,
    });
    expect(first(py).stdout.trim()).toBe("BLOCKED BLOCKED BLOCKED BLOCKED");

    const cpp = await invoke({
      language: "cpp",
      code: '#include <sys/socket.h>\n#include <cstdio>\nint main(){int s=socket(AF_INET,SOCK_STREAM,0);puts(s<0?"BLOCKED":"OPEN");}',
    });
    expect(first(cpp).stdout.trim()).toBe("BLOCKED");

    const curl = await invoke({
      language: "python",
      code: "import os\nrc=os.system('curl -s -m 3 https://example.com >/dev/null 2>&1')\nprint('BLOCKED' if rc!=0 else 'OPEN')",
      timeLimitMs: 5000,
    });
    expect(first(curl).stdout.trim()).toBe("BLOCKED");
  });

  it("can't read a previous submission's files from /tmp", async () => {
    await invoke({
      language: "python",
      code: "import os\nopen('/tmp/leak.txt','w').write('secret')\nopen('stash.txt','w').write('secret')\nos.makedirs('/tmp/x/y',exist_ok=True)\nos.chmod('/tmp/x',0)\nprint('wrote')",
    });
    const r = await invoke({
      language: "python",
      code: [
        // Everything under /tmp except this run's own working directory must be gone.
        "import os",
        "cwd=os.getcwd(); found=[]",
        "for root,dirs,files in os.walk('/tmp'):",
        "    if root.startswith(cwd): continue",
        "    found += [os.path.join(root,x) for x in dirs+files if os.path.join(root,x)!=cwd]",
        "print('EMPTY' if not found else ' '.join(found))",
      ].join("\n"),
    });
    expect(first(r).stdout.trim()).toBe("EMPTY");
  });

  it("can't reach AWS: no credentials in the environment, none readable from the handler, no network", async () => {
    const r = await invoke({
      language: "python",
      code: [
        "import os",
        "leaks=[k for k in os.environ if k.startswith('AWS_')]",
        "for p in os.listdir('/proc'):",
        "    if p.isdigit() and int(p)!=os.getpid():",
        "        try:",
        "            if b'AWS_SECRET_ACCESS_KEY' in open('/proc/'+p+'/environ','rb').read(): leaks.append('proc'+p)",
        "        except OSError: pass",
        "try:",
        "    import boto3; boto3.client('sts').get_caller_identity(); leaks.append('boto3')",
        "except Exception: pass",
        "import urllib.request",
        "try:",
        "    urllib.request.urlopen('http://127.0.0.1:9001/2018-06-01/runtime/invocation/next',timeout=2); leaks.append('runtime-api')",
        "except Exception: pass",
        "print('DENIED' if not leaks else 'LEAK '+' '.join(leaks))",
      ].join("\n"),
      timeLimitMs: 5000,
    });
    expect(first(r).stdout.trim()).toBe("DENIED");
  });

  it("compile error → CE with the compiler's message", async () => {
    const r = await invoke({ language: "cpp", code: "int main(){ return x; }" });
    expect(r.compile?.ok).toBe(false);
    expect(r.compile?.output).toMatch(/error/i);
    expect(r.compile?.output).toContain("x");
    expect(r.results).toEqual([]);
  });

  it("Python syntax error → CE", async () => {
    const r = await invoke({ language: "python", code: "def f(:\n  pass" });
    expect(r.compile?.ok).toBe(false);
    expect(r.compile?.output).toMatch(/SyntaxError/);
  });

  it("runtime error → RE", async () => {
    const r = await invoke({
      language: "cpp",
      code: "#include <cstdlib>\nint main(){int*p=nullptr;return *p;}",
    });
    expect(first(r).status).toBe("RE");
    const py = await invoke({ language: "python", code: "raise ValueError('nope')" });
    expect(first(py).status).toBe("RE");
    expect(first(py).stderr).toContain("ValueError");
  });

  it("stops after the first failing input when asked", async () => {
    const r = await invoke({
      language: "python",
      code: "n=int(input())\nassert n<2\nprint(n)",
      inputs: ["1", "5", "0"],
      stopOnFailure: true,
    });
    expect(r.results?.map((x) => x.status)).toEqual(["OK", "RE"]);
  });

  it("rejects malformed requests", async () => {
    const r = await invoke({ language: "java" as never, code: "x" });
    expect(r.ok).toBe(false);
  });
});
