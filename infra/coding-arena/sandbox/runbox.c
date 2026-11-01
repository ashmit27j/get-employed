/*
 * runbox: the last step before untrusted code runs in the Coding Arena sandbox.
 *
 *   runbox <cpu_s> <as_mb> <stack_mb> <fsize_mb> <nproc> <nofile> -- <prog> [args...]
 *
 * The parent (handler.py) has already put this process in a new session and wired
 * stdin/stdout/stderr to files. runbox then:
 *   1. sets resource limits (CPU, address space, stack, file size, processes, open files),
 *   2. sets PR_SET_NO_NEW_PRIVS and installs a seccomp filter that fails every socket,
 *      ptrace and cross-process memory call with EPERM (no network, not even the
 *      Lambda Runtime API on 127.0.0.1:9001; no reading the handler's memory),
 *   3. execs the program with an empty environment apart from a few safe variables.
 *
 * Exit codes owned by runbox: 126 = setup failed (sandbox bug), 127 = exec failed.
 * Both print "runbox: ..." to stderr so the handler can tell them from user exits.
 */
#define _GNU_SOURCE
#include <errno.h>
#include <linux/audit.h>
#include <linux/filter.h>
#include <linux/seccomp.h>
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/prctl.h>
#include <sys/resource.h>
#include <sys/stat.h>
#include <sys/syscall.h>
#include <unistd.h>

#if defined(__x86_64__)
#define ARENA_AUDIT_ARCH AUDIT_ARCH_X86_64
#elif defined(__aarch64__)
#define ARENA_AUDIT_ARCH AUDIT_ARCH_AARCH64
#else
#error "unsupported architecture"
#endif

static void die(const char *what) {
  fprintf(stderr, "runbox: %s: %s\n", what, strerror(errno));
  _exit(126);
}

static long arg_num(const char *s) {
  char *end = NULL;
  long v = strtol(s, &end, 10);
  if (!s[0] || *end || v < 0) {
    fprintf(stderr, "runbox: bad number '%s'\n", s);
    _exit(126);
  }
  return v;
}

static void limit(int resource, rlim_t soft, rlim_t hard) {
  struct rlimit rl = {soft, hard};
  if (setrlimit(resource, &rl) != 0) die("setrlimit");
}

/* Syscalls that untrusted code never needs. Each one returns EPERM. */
static const int DENIED[] = {
    SYS_socket, SYS_socketpair, SYS_connect, SYS_bind, SYS_listen, SYS_accept,
#ifdef SYS_accept4
    SYS_accept4,
#endif
    SYS_ptrace, SYS_process_vm_readv, SYS_process_vm_writev, SYS_mount, SYS_umount2,
    SYS_unshare, SYS_setns, SYS_pivot_root, SYS_chroot, SYS_keyctl, SYS_add_key,
    SYS_request_key, SYS_bpf, SYS_perf_event_open, SYS_kexec_load, SYS_init_module,
    SYS_finit_module, SYS_delete_module, SYS_swapon, SYS_swapoff, SYS_reboot, SYS_acct,
    SYS_name_to_handle_at, SYS_open_by_handle_at,
#ifdef SYS_userfaultfd
    SYS_userfaultfd,
#endif
#ifdef SYS_io_uring_setup
    SYS_io_uring_setup, SYS_io_uring_enter, SYS_io_uring_register,
#endif
#ifdef SYS_kexec_file_load
    SYS_kexec_file_load,
#endif
};
#define N_DENIED (sizeof(DENIED) / sizeof(DENIED[0]))

static void install_seccomp(void) {
  /* layout: [0..3] arch check + load nr, [4] x32 guard, [5..5+N) denies, allow, deny */
  struct sock_filter prog[8 + N_DENIED];
  size_t i = 0;
  const size_t deny_at = 5 + N_DENIED + 1;

  prog[i++] = (struct sock_filter)BPF_STMT(BPF_LD | BPF_W | BPF_ABS,
                                           offsetof(struct seccomp_data, arch));
  prog[i++] = (struct sock_filter)BPF_JUMP(BPF_JMP | BPF_JEQ | BPF_K, ARENA_AUDIT_ARCH, 1, 0);
  prog[i++] = (struct sock_filter)BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_KILL_PROCESS);
  prog[i++] = (struct sock_filter)BPF_STMT(BPF_LD | BPF_W | BPF_ABS,
                                           offsetof(struct seccomp_data, nr));
  /* x32 ABI syscalls (nr with bit 30 set) would bypass the table below: refuse them. */
  prog[i] = (struct sock_filter)BPF_JUMP(BPF_JMP | BPF_JGE | BPF_K, 0x40000000,
                                         (unsigned char)(deny_at - i - 1), 0);
  i++;
  for (size_t d = 0; d < N_DENIED; d++, i++) {
    prog[i] = (struct sock_filter)BPF_JUMP(BPF_JMP | BPF_JEQ | BPF_K, (unsigned)DENIED[d],
                                           (unsigned char)(deny_at - i - 1), 0);
  }
  prog[i++] = (struct sock_filter)BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_ALLOW);
  prog[i++] = (struct sock_filter)BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_ERRNO | (EPERM & SECCOMP_RET_DATA));

  struct sock_fprog fprog = {(unsigned short)i, prog};
  if (prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0) != 0) die("no_new_privs");
  if (prctl(PR_SET_SECCOMP, SECCOMP_MODE_FILTER, &fprog) != 0) die("seccomp");
}

int main(int argc, char **argv) {
  if (argc < 9 || strcmp(argv[7], "--") != 0) {
    fprintf(stderr, "runbox: usage: runbox cpu_s as_mb stack_mb fsize_mb nproc nofile -- prog [args]\n");
    return 126;
  }
  const rlim_t mb = 1024 * 1024;
  long cpu = arg_num(argv[1]), as_mb = arg_num(argv[2]), stack_mb = arg_num(argv[3]);
  long fsize_mb = arg_num(argv[4]), nproc = arg_num(argv[5]), nofile = arg_num(argv[6]);

  /* Soft CPU limit sends SIGXCPU, the hard limit one second later is SIGKILL. */
  limit(RLIMIT_CPU, (rlim_t)cpu, (rlim_t)cpu + 1);
  limit(RLIMIT_AS, (rlim_t)as_mb * mb, (rlim_t)as_mb * mb);
  limit(RLIMIT_STACK, (rlim_t)stack_mb * mb, (rlim_t)stack_mb * mb);
  limit(RLIMIT_FSIZE, (rlim_t)fsize_mb * mb, (rlim_t)fsize_mb * mb);
  limit(RLIMIT_NPROC, (rlim_t)nproc, (rlim_t)nproc);
  limit(RLIMIT_NOFILE, (rlim_t)nofile, (rlim_t)nofile);
  limit(RLIMIT_CORE, 0, 0);
  limit(RLIMIT_MEMLOCK, 0, 0);
  umask(077);

  char cwd[512];
  if (!getcwd(cwd, sizeof cwd)) die("getcwd");
  static char home[600], tmp[600];
  snprintf(home, sizeof home, "HOME=%s", cwd);
  snprintf(tmp, sizeof tmp, "TMPDIR=%s", cwd);
  char *envp[] = {"PATH=/usr/bin:/bin", home, tmp, "LANG=C.UTF-8", "PYTHONIOENCODING=utf-8",
                  "PYTHONDONTWRITEBYTECODE=1", NULL};

  install_seccomp();
  execve(argv[8], &argv[8], envp);
  int err = errno;
  fprintf(stderr, "runbox: exec failed: %s%s\n", strerror(err), err == ENOMEM ? " [ENOMEM]" : "");
  return 127;
}
