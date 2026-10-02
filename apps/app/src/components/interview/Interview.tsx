"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Button,
  Combobox,
  Dropdown,
  Icon,
  IconButton,
  Modal,
  PageHeader,
  Panel,
  cx,
  type IconName,
} from "@ge/ui";
import { MCQ_BANK, acknowledge, interviewQuestions, type InterviewType } from "@ge/core";
import { PageBody, Topbar } from "@/components/shell/AppShell";
import { useIsMobile, useShell } from "@/components/shell/ShellProvider";
import { useInterviewVoice } from "@/lib/useInterviewVoice";
import { checkLiveCap, saveInterviewSession } from "@/server/actions/interview";
import type { InterviewData } from "@/server/interview";
import { AIOrb, MeetingButton, TranscriptReadout, type TranscriptLine } from "./parts";

type Mode = "live" | "typed" | "mcq";
type Screen = "setup" | Mode;

const NO_COMPANY = "Not company specific";
const NO_ROLE = "Not role specific";
const ROLES = [
  NO_ROLE,
  "Backend Engineer",
  "Frontend Engineer",
  "Full-stack Engineer",
  "SDE-1",
  "Software Engineer Intern",
  "Graduate Software Engineer",
  "iOS Engineer",
  "Android Engineer",
  "Data Engineer",
  "Data Analyst",
  "ML Engineer",
  "DevOps Engineer",
  "Security Engineer",
  "Product Manager",
  "QA Engineer",
];
const TYPES: InterviewType[] = ["Mixed", "Technical", "Behavioural", "Aptitude"];
const LENGTHS = ["10 min", "15 min", "30 min"];
const STRICTNESS = ["Lenient", "Standard", "Strict"] as const;
type Strictness = (typeof STRICTNESS)[number];
/** Follow-up questions Gemini may ask in one session, on top of the planned six. */
const MAX_FOLLOW_UPS = 2;

const MODES: { id: Mode; title: string; icon: IconName; sub: string; meta: string }[] = [
  {
    id: "live",
    title: "Live interview",
    icon: "mic",
    sub: "Speak with an AI interviewer on camera. It follows up on what you say.",
    meta: "Voice and video · 15 min",
  },
  {
    id: "typed",
    title: "Typed",
    icon: "keyboard",
    sub: "Read each question and type your answer. The AI replies with a follow-up.",
    meta: "Text only · 6 questions",
  },
  {
    id: "mcq",
    title: "Multiple choice",
    icon: "list-checks",
    sub: "Quick technical questions with four options. See the answer right away.",
    meta: "Text only · 8 questions",
  },
];
const MODE_SUB: Record<Mode, string> = {
  live: "A 15-minute voice session with an AI interviewer that asks questions from the job description and follows up on your answers. Voice is required; camera is optional.",
  typed:
    "Answer interview questions in writing. Good for practising structure before a live round.",
  mcq: "A short multiple-choice test on core technical topics, marked as you go.",
};
const INFO: Record<"typed" | "mcq", { title: string; lines: string[] }> = {
  typed: {
    title: "How the typed interview works",
    lines: [
      "Six questions drawn from the role and your resume.",
      "Type each answer, then submit. The AI acknowledges it and asks the next one.",
      "Skip any question; it counts as unanswered in the report.",
      "You get the same rubric as a live session, minus delivery metrics.",
    ],
  },
  mcq: {
    title: "How the multiple-choice test works",
    lines: [
      "Eight questions on APIs, data structures, systems and databases.",
      "Pick one option. Correct answers turn green, wrong ones red.",
      "Each answer shows a short explanation.",
      "Your score and a full review appear at the end.",
    ],
  },
};
const CRUMB: Record<Screen, string> = {
  setup: "Interview prep",
  live: "Live",
  typed: "Typed",
  mcq: "Multiple choice",
};

const fmt = (n: number) =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
const SKIPPED = "(Skipped)";

export function Interview({
  data,
  firstName,
  startMcq,
}: {
  data: InterviewData;
  firstName: string;
  startMcq: boolean;
}) {
  const router = useRouter();
  const mobile = useIsMobile();
  const { setFocusMode, setAssistantDisabled } = useShell();
  const voice = useInterviewVoice();

  const [screen, setScreen] = useState<Screen>("setup");
  const [mode, setMode] = useState<Mode>(startMcq ? "mcq" : "live");
  const [company, setCompany] = useState(NO_COMPANY);
  const [role, setRole] = useState(NO_ROLE);
  const [type, setType] = useState<InterviewType>("Mixed");
  const [length, setLength] = useState("15 min");
  const [strictness, setStrictness] = useState<Strictness>("Standard");
  const [cam, setCam] = useState<"off" | "on" | "denied">("off");
  const [sec, setSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  // Live and typed sessions.
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [finished, setFinished] = useState(false);
  const [captions, setCaptions] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  // Multiple choice.
  const [mq, setMq] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>(() => MCQ_BANK.map(() => null));

  const [stream, setStream] = useState<MediaStream | null>(null);
  const timedOut = useRef(false);
  const startedAt = useRef<string>(new Date().toISOString());
  const chatRef = useRef<HTMLDivElement>(null);

  /* ---------- What the session is about ---------- */
  const companies = useMemo(
    () => [NO_COMPANY, ...new Set(data.jobs.map((j) => j.company))],
    [data.jobs],
  );
  const job = useMemo(() => {
    if (company === NO_COMPANY) return null;
    const at = data.jobs.filter((j) => j.company === company);
    return (
      (role !== NO_ROLE
        ? at.find((j) => j.title.toLowerCase().includes(role.toLowerCase()))
        : undefined) ??
      at[0] ??
      null
    );
  }, [company, role, data.jobs]);
  const skills = job?.skills ?? data.profileSkills;
  const label = job
    ? `${job.title} · ${job.company}`
    : `${role !== NO_ROLE ? role : "General"} · ${company !== NO_COMPANY ? company : "SWE"}`;
  const questions = useMemo(() => interviewQuestions({ skills, type }), [skills, type]);
  const limit = Number.parseInt(length, 10) * 60;

  /* ---------- Shell: collapse the sidebar in a session, turn the assistant off while live ---------- */
  const enterSession = (next: Mode) => {
    setFocusMode(true);
    setAssistantDisabled(next === "live");
  };
  const leaveSession = useCallback(() => {
    setAssistantDisabled(false);
    setFocusMode(false);
  }, [setAssistantDisabled, setFocusMode]);
  useEffect(() => () => leaveSession(), [leaveSession]);

  /* ---------- Clock ---------- */
  const running = screen !== "setup";
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setSec((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [running]);

  /* ---------- Camera ---------- */
  const attachVideo = useCallback(
    (el: HTMLVideoElement | null) => {
      if (el && stream && el.srcObject !== stream) el.srcObject = stream;
    },
    [stream],
  );
  const stopCam = () => {
    setStream(null);
    setCam("off");
  };
  const enableCam = async () => {
    try {
      setStream(await navigator.mediaDevices.getUserMedia({ video: true, audio: false }));
      setCam("on");
    } catch {
      setCam("denied");
    }
  };
  // Releases the camera when it's turned off or the page closes.
  useEffect(() => () => stream?.getTracks().forEach((t) => t.stop()), [stream]);

  /* ---------- Transcript ---------- */
  const secRef = useRef(0);
  useEffect(() => {
    secRef.current = sec;
  }, [sec]);
  // Kept in refs as well, so async turns read the latest transcript.
  const linesRef = useRef<TranscriptLine[]>([]);
  const say = (who: TranscriptLine["who"], text: string) => {
    const line = { who, t: fmt(secRef.current), text };
    linesRef.current = [...linesRef.current, line];
    setLines(linesRef.current);
  };
  /** Every question actually asked (follow-ups too) with its answer, for grading. */
  const qa = useRef<{ q: string; a: string }[]>([]);
  const asking = useRef("");
  const followUps = useRef(0);

  /**
   * The interviewer's next line after answer `i`: Gemini decides between a follow-up and the
   * next planned question when configured (/api/interview/turn); the rules move on otherwise.
   */
  const nextLine = async (
    answer: string,
    i: number,
  ): Promise<{ text: string; followUp: boolean }> => {
    const planned = i + 1 < questions.length ? questions[i + 1]!.q : null;
    const closing = `That's everything from me. Select ${screen === "typed" ? "See feedback" : "End and review"} for your report.`;
    if (data.ai) {
      try {
        const res = await fetch("/api/interview/turn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: label,
            strictness,
            transcript: linesRef.current.map((l) => ({ who: l.who, text: l.text })),
            nextQuestion: planned,
            followUpsLeft: Math.max(0, MAX_FOLLOW_UPS - followUps.current),
          }),
        });
        const json = (await res.json()) as {
          text?: string;
          followUp?: boolean;
          fallback?: boolean;
        };
        if (res.ok && json.text && !json.fallback)
          return {
            text: planned || json.followUp ? json.text : `${json.text} ${closing}`,
            followUp: !!json.followUp,
          };
      } catch {
        // Offline or the LLM failed: the rules take over for this turn.
      }
    }
    return {
      text: planned
        ? `${acknowledge(answer, i)} ${planned}`
        : `${acknowledge(answer, i)} ${closing}`,
      followUp: false,
    };
  };

  /** Record an answer to the current question and move the interview on. */
  const takeAnswer = async (text: string, speakReply: boolean) => {
    const answer = text.trim() || SKIPPED;
    const i = qi;
    setAnswers((a) => {
      const next = [...a];
      // A follow-up's answer joins the answer to its question.
      next[i] = next[i] && next[i] !== SKIPPED ? `${next[i]} ${answer}` : answer;
      return next;
    });
    qa.current.push({ q: asking.current, a: answer === SKIPPED ? "" : answer });
    if (answer !== SKIPPED) say("you", answer);
    const reply = await nextLine(answer, i);
    say("ai", reply.text);
    if (reply.followUp) {
      followUps.current++;
      asking.current = reply.text;
    } else if (i + 1 < questions.length) {
      asking.current = questions[i + 1]!.q;
      setQi(i + 1);
    } else {
      setQi(questions.length);
      setFinished(true);
    }
    if (speakReply) await voice.speak(reply.text);
  };

  /* ---------- Live ---------- */
  const ask = async () => {
    const q = questions[0]!.q;
    asking.current = q;
    const text = `Hi ${firstName}. I'll ask ${questions.length} questions. Take your time. First: ${q}`;
    say("ai", text);
    await voice.speak(text);
  };
  const [thinking, setThinking] = useState(false);
  const recordAnswer = async (text: string) => {
    setThinking(true);
    try {
      await takeAnswer(text, true);
    } finally {
      setThinking(false);
    }
  };
  const toggleAnswer = async () => {
    if (finished || thinking || voice.transcribing) return;
    if (voice.listening) await recordAnswer(await voice.stopListening());
    else await voice.startListening();
  };
  const skipLive = async () => {
    if (finished || thinking) return;
    if (voice.listening) await voice.stopListening();
    voice.stopSpeaking();
    await recordAnswer("");
  };

  /* ---------- Typed ---------- */
  const submitTyped = (skip: boolean) => {
    if (typing) return;
    const text = skip ? SKIPPED : draft.trim();
    if (!text) return;
    setDraft("");
    setTyping(true);
    void takeAnswer(text, false).finally(() => setTyping(false));
  };
  useEffect(() => {
    const c = chatRef.current;
    if (c) requestAnimationFrame(() => (c.scrollTop = c.scrollHeight));
  }, [lines.length, typing]);

  /* ---------- Start, end, save ---------- */
  const reset = () => {
    setSec(0);
    setQi(0);
    setAnswers([]);
    setLines([]);
    setFinished(false);
    setDraft("");
    setTyping(false);
    setMq(0);
    setPicks(MCQ_BANK.map(() => null));
    setError(null);
    timedOut.current = false;
    linesRef.current = [];
    qa.current = [];
    followUps.current = 0;
    asking.current = questions[0]?.q ?? "";
    startedAt.current = new Date().toISOString();
  };
  const start = async (m: Mode = mode) => {
    setError(null);
    if (m === "live") {
      const cap = await checkLiveCap();
      if (!cap.ok) {
        setError(
          "You've used this month's live sessions. Typed and Multiple choice are still available.",
        );
        return;
      }
    }
    reset();
    enterSession(m);
    setScreen(m);
    window.scrollTo({ top: 0 });
    if (m === "typed")
      say(
        "ai",
        `Hi ${firstName}. I'll ask six questions; take your time and type each answer. First: ${questions[0]!.q}`,
      );
    if (m === "live") void ask();
  };
  // /interview?start=mcq (Retake on a test result) starts straight away.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (startMcq && !autoStarted.current) {
      autoStarted.current = true;
      void start("mcq");
    }
  });

  const quit = () => {
    if (voice.listening) void voice.stopListening();
    voice.stopSpeaking();
    stopCam();
    leaveSession();
    reset();
    setScreen("setup");
    if (startMcq) router.replace("/interview");
  };

  const end = async () => {
    if (saving) return;
    setConfirmEnd(false);
    const live = screen === "live";
    let final = answers;
    if (live && voice.listening) {
      const last = (await voice.stopListening()) || SKIPPED;
      final = [...answers];
      final[qi] = final[qi] ? `${final[qi]} ${last}` : last;
      qa.current.push({ q: asking.current, a: last === SKIPPED ? "" : last });
    }
    voice.stopSpeaking();
    stopCam();
    setSaving(true);
    try {
      const id = await saveInterviewSession({
        jobId: job?.id ?? null,
        label: screen === "mcq" ? "Multiple choice · Technical" : label,
        type: screen === "mcq" ? "Technical" : type,
        format: live ? "voice" : screen === "typed" ? "typed" : "mcq",
        skills,
        startedAt: startedAt.current,
        durationS: sec,
        answers: questions.map((_, i) => final[i] ?? ""),
        transcript: lines.map((l) => {
          const [m, s] = l.t.split(":").map(Number);
          return {
            role: l.who === "ai" ? ("interviewer" as const) : ("candidate" as const),
            text: l.text,
            at: (m ?? 0) * 60 + (s ?? 0),
          };
        }),
        speakingSeconds: live ? voice.speakingSeconds() : undefined,
        sttEngine: live ? voice.engine : null,
        mcqPicks: screen === "mcq" ? picks : undefined,
        strictness,
        qa: screen === "mcq" ? undefined : qa.current,
      });
      leaveSession();
      router.push(`/interview?session=${id}`);
    } catch (err) {
      setSaving(false);
      setError(
        err instanceof Error && err.message.startsWith("You've")
          ? err.message
          : "We couldn't save this session. Try again.",
      );
    }
  };

  // The session ends itself when the time runs out.
  useEffect(() => {
    if ((screen === "live" || screen === "typed") && sec >= limit && !timedOut.current) {
      timedOut.current = true;
      void end();
    }
  });

  const crumbs =
    screen === "setup"
      ? [{ label: "Interview prep" }]
      : [{ label: "Interview prep", href: "/interview" }, { label: CRUMB[screen] }];

  return (
    <>
      <Topbar crumbs={crumbs} />
      <PageBody>
        {screen === "setup" && (
          <Setup
            mode={mode}
            setMode={setMode}
            companies={companies}
            company={company}
            setCompany={setCompany}
            role={role}
            setRole={setRole}
            type={type}
            setType={setType}
            length={length}
            setLength={setLength}
            strictness={strictness}
            setStrictness={setStrictness}
            cap={data.cap}
            cam={cam}
            enableCam={enableCam}
            attachVideo={attachVideo}
            sttSupported={voice.supported}
            error={error}
            latest={data.sessions[0]?.id}
            onStart={() => void start()}
          />
        )}

        {screen === "live" && (
          <section aria-label="Live interview" className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 rounded-lg border border-hairline bg-surface-1 px-5 py-4">
              <div className="flex items-start gap-4">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-caption text-ink-subtle">
                    {finished
                      ? "All questions asked"
                      : `Question ${qi + 1} of ${questions.length} · ${questions[qi]!.kind === "behavioural" ? "Behavioural" : "Technical"}`}
                  </span>
                  <span className="text-body text-pretty text-ink">
                    {finished ? "Select End and review for your report." : questions[qi]!.q}
                  </span>
                </div>
                <div className="flex flex-none flex-col items-end gap-0.5">
                  <span className="font-mono text-body text-ink">
                    {fmt(Math.max(0, limit - sec))}
                  </span>
                  <span className="text-caption text-ink-subtle">left of {fmt(limit)}</span>
                </div>
              </div>
              <Segments count={questions.length} done={finished ? questions.length : qi} />
            </div>

            <div className="flex h-[clamp(400px,calc(100vh-320px),700px)] items-stretch gap-4">
              <div className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-7 overflow-hidden rounded-xl border border-hairline bg-surface-1 px-6 pt-[72px] pb-[120px]">
                <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3">
                  <div className="flex h-7 items-center gap-2 rounded-full border border-hairline-strong bg-surface-2 px-2.5 font-mono text-caption text-ink">
                    <span className="size-1.5 rounded-full bg-danger-ink" />
                    REC {fmt(sec)}
                  </div>
                  <span className="text-caption text-ink-subtle">
                    {voice.speaking
                      ? "Listen to the full question"
                      : "Take a moment, then answer out loud"}
                  </span>
                </div>
                <AIOrb speaking={voice.speaking} size={mobile ? 140 : 180} />
                <div className="flex flex-col items-center gap-1 text-center">
                  <span className="text-body font-medium text-ink">AI interviewer</span>
                  <span className="text-caption text-ink-subtle" role="status">
                    {voice.speaking
                      ? "Speaking"
                      : voice.listening
                        ? "Listening"
                        : voice.transcribing
                          ? "Transcribing…"
                          : thinking
                            ? "Thinking…"
                            : finished
                              ? "Done"
                              : "Waiting · select the mic to answer"}
                  </span>
                  {voice.modelProgress != null && (
                    <div className="mt-2 flex w-56 flex-col gap-1" role="status">
                      <span className="text-caption text-ink-subtle">
                        Loading on-device transcription · {voice.modelProgress}%
                      </span>
                      <div className="h-1 overflow-hidden rounded-full bg-surface-3">
                        <div
                          className="h-full rounded-[inherit] bg-primary transition-[width] duration-150"
                          style={{ width: `${voice.modelProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {voice.notice && !voice.failed && (
                    <span className="mt-1 max-w-sm text-caption text-pretty text-warning-ink">
                      {voice.notice}
                    </span>
                  )}
                </div>
                {voice.failed && !finished && (
                  <TypedFallback message={voice.failed} onSubmit={(t) => void recordAnswer(t)} />
                )}
                {captions && !voice.failed && (
                  <div className="absolute inset-x-4 bottom-4 flex justify-center">
                    <div className="flex max-w-[640px] flex-col gap-1 rounded-lg border border-hairline-strong bg-surface-2 px-4 py-3">
                      <span className="text-caption text-ink-subtle">
                        {voice.listening ? "You" : "AI interviewer"}
                      </span>
                      <span className="text-body text-pretty text-ink">
                        {voice.listening
                          ? voice.interim || "…"
                          : ([...lines].reverse().find((l) => l.who === "ai")?.text ?? "")}
                      </span>
                    </div>
                  </div>
                )}
                <div
                  className={cx(
                    "absolute right-4 flex items-center justify-center overflow-hidden rounded-lg border-2 bg-surface-3 transition-[border-color,bottom] duration-150",
                    mobile ? "aspect-[3/4] w-[104px]" : "aspect-[16/10] w-[200px]",
                    captions && !voice.failed
                      ? mobile
                        ? "bottom-[132px]"
                        : "bottom-[104px]"
                      : "bottom-4",
                    voice.listening ? "border-primary" : "border-hairline-strong",
                    voice.failed && "hidden",
                  )}
                >
                  {cam === "on" ? (
                    <video
                      ref={attachVideo}
                      autoPlay
                      muted
                      playsInline
                      className="absolute inset-0 size-full -scale-x-100 object-cover"
                    />
                  ) : (
                    <Avatar name={firstName} size={48} />
                  )}
                  <div className="absolute bottom-2 left-2 flex h-[22px] items-center gap-1.5 rounded-full bg-surface-2 px-2 text-caption text-ink">
                    {!voice.listening && <Icon name="mic-off" size={12} />}
                    You
                  </div>
                </div>
              </div>
              {showTranscript && !mobile && (
                <div className="flex min-h-0 w-[340px] flex-none flex-col overflow-hidden rounded-xl border border-hairline bg-surface-1">
                  <div className="flex h-12 flex-none items-center justify-between border-b border-hairline pr-2 pl-4">
                    <span className="text-small font-medium">Transcript</span>
                    <IconButton
                      icon="x"
                      title="Close transcript"
                      onClick={() => setShowTranscript(false)}
                    />
                  </div>
                  <div className="min-h-0 flex-1 p-4">
                    <TranscriptReadout
                      live
                      lines={
                        voice.listening
                          ? [...lines, { who: "you", t: fmt(sec), text: voice.interim || "…" }]
                          : lines
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <MeetingButton
                icon={voice.listening ? "mic" : "mic-off"}
                label={voice.listening ? "Finish answer" : "Answer"}
                off={!voice.listening}
                disabled={finished || !!voice.failed || thinking || voice.transcribing}
                onClick={() => void toggleAnswer()}
              />
              <MeetingButton
                icon={cam === "on" ? "video" : "video-off"}
                label={cam === "on" ? "Turn off camera" : "Turn on camera"}
                off={cam !== "on"}
                onClick={() => (cam === "on" ? stopCam() : void enableCam())}
              />
              <MeetingButton
                icon="captions"
                label={captions ? "Turn off captions" : "Turn on captions"}
                off={!captions}
                onClick={() => setCaptions((c) => !c)}
              />
              <MeetingButton
                icon="skip-forward"
                label="Skip question"
                disabled={finished}
                onClick={() => void skipLive()}
              />
              {!mobile && (
                <MeetingButton
                  icon="scroll-text"
                  label={showTranscript ? "Hide transcript" : "Show transcript"}
                  onClick={() => setShowTranscript((v) => !v)}
                />
              )}
              <MeetingButton
                icon="phone-off"
                label="End and review"
                danger
                disabled={saving}
                onClick={() => setConfirmEnd(true)}
              />
            </div>
            {error && <ErrorLine text={error} />}
            <Modal
              open={confirmEnd}
              onClose={() => setConfirmEnd(false)}
              title="End the interview?"
              sub={
                finished
                  ? "You'll go to your feedback report."
                  : "You can't continue this session after it ends. Your answers so far go into the feedback report."
              }
              width={420}
              footer={
                <>
                  <Button variant="tertiary" onClick={() => setConfirmEnd(false)}>
                    Keep going
                  </Button>
                  <Button disabled={saving} onClick={() => void end()}>
                    End and review
                  </Button>
                </>
              }
            />
          </section>
        )}

        {screen === "typed" && (
          <section aria-label="Typed interview" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex min-w-[220px] flex-1 flex-col gap-2">
                <div className="flex justify-between gap-3 text-caption text-ink-subtle">
                  <span>
                    Question {Math.min(qi + 1, questions.length)} of {questions.length}
                  </span>
                  <span className="font-mono">{fmt(sec)}</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-[inherit] bg-primary transition-[width] duration-150"
                    style={{ width: `${(qi / questions.length) * 100}%` }}
                  />
                </div>
              </div>
              <Button variant="secondary" size="sm" disabled={saving} onClick={() => void end()}>
                End and review
              </Button>
            </div>
            <div className="flex h-[clamp(460px,calc(100vh-240px),780px)] items-stretch gap-4">
              <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-hairline bg-surface-1">
                <div
                  ref={chatRef}
                  className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-6 max-md:p-4"
                  aria-live="polite"
                >
                  {lines.map((m, i) => (
                    <div
                      key={i}
                      className={cx(
                        "flex flex-col gap-1.5",
                        m.who === "ai" ? "items-start" : "items-end",
                      )}
                    >
                      <span className="text-caption text-ink-subtle">
                        {m.who === "ai" ? "AI interviewer" : "You"}
                      </span>
                      <div
                        className={cx(
                          "max-w-[620px] rounded-lg border px-4 py-3.5 text-small whitespace-pre-wrap text-pretty text-ink",
                          m.who === "ai"
                            ? "border-hairline bg-canvas"
                            : "border-hairline-strong bg-surface-2",
                        )}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {typing && (
                    <span className="text-caption text-ink-subtle">
                      AI interviewer is writing a follow-up…
                    </span>
                  )}
                </div>
                {qi < questions.length || typing ? (
                  <div className="flex flex-none flex-col gap-3 border-t border-hairline px-5 py-4">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          submitTyped(false);
                        }
                      }}
                      rows={4}
                      placeholder="Type your answer. Lead with your approach, then the details."
                      aria-label="Your answer"
                      className="box-border min-h-24 w-full resize-y rounded-md border border-hairline-strong bg-canvas p-3 font-sans text-small text-ink outline-none placeholder:text-ink-tertiary focus:border-primary! focus:shadow-focus"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex-1 text-caption text-ink-subtle">
                        {draft.trim() ? draft.trim().split(/\s+/).length : 0} words
                      </span>
                      <Button
                        variant="tertiary"
                        size="sm"
                        disabled={typing}
                        onClick={() => submitTyped(true)}
                      >
                        Skip
                      </Button>
                      <Button
                        size="sm"
                        disabled={!draft.trim() || typing}
                        onClick={() => submitTyped(false)}
                      >
                        Submit answer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-none flex-wrap items-center gap-3 border-t border-hairline px-5 py-4">
                    <span className="flex-1 text-small text-ink-muted">
                      All {questions.length} questions answered.
                    </span>
                    <Button size="sm" disabled={saving} onClick={() => void end()}>
                      See feedback
                    </Button>
                  </div>
                )}
              </div>
              {!mobile && (
                <div className="flex w-[300px] flex-none flex-col gap-3">
                  <div className="flex flex-col overflow-hidden rounded-xl border border-hairline bg-surface-1">
                    <span className="border-b border-hairline px-4 py-3.5 text-small font-medium">
                      Questions
                    </span>
                    {questions.map((q, i) => {
                      const done = i < qi;
                      const cur = i === qi;
                      return (
                        <div
                          key={q.q}
                          className="grid grid-cols-[18px_minmax(0,1fr)] items-start gap-2.5 px-4 py-2.5"
                        >
                          <Icon
                            name={done ? "circle-check" : cur ? "circle-dot" : "circle"}
                            size={16}
                            className={cx(
                              "mt-px",
                              done ? "text-primary" : cur ? "text-ink" : "text-ink-tertiary",
                            )}
                          />
                          <span
                            className={cx(
                              "text-caption",
                              cur ? "text-ink" : done ? "text-ink-muted" : "text-ink-subtle",
                            )}
                          >
                            {q.q}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="rounded-lg border border-hairline px-4 py-3.5 text-caption text-pretty text-ink-subtle">
                    Aim for 80–150 words. Press Ctrl Enter to submit.
                  </div>
                </div>
              )}
            </div>
            {error && <ErrorLine text={error} />}
          </section>
        )}

        {screen === "mcq" && (
          <Mcq
            mq={mq}
            setMq={setMq}
            picks={picks}
            pick={(i) => setPicks((p) => p.map((v, k) => (k === mq && v == null ? i : v)))}
            clock={fmt(sec)}
            saving={saving}
            error={error}
            onQuit={quit}
            onFinish={() => void end()}
          />
        )}
      </PageBody>
    </>
  );
}

function Segments({ count, done }: { count: number; done: number }) {
  return (
    <div className="flex gap-1" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={cx(
            "h-1 flex-1 rounded-full",
            i < done ? "bg-primary" : i === done ? "bg-ink-muted" : "bg-surface-3",
          )}
        />
      ))}
    </div>
  );
}

function ErrorLine({ text }: { text: string }) {
  return (
    <p role="alert" className="m-0 text-center text-caption text-danger-ink">
      {text}
    </p>
  );
}

/** When speech recognition isn't available, the live session takes typed answers (docs/interviews.md). */
function TypedFallback({
  message,
  onSubmit,
}: {
  message: string;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");
  return (
    <form
      className="absolute inset-x-4 bottom-4 flex flex-col gap-2 rounded-lg border border-hairline-strong bg-surface-2 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(text);
        setText("");
      }}
    >
      <span className="text-caption text-ink-subtle">{message}</span>
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          aria-label="Your answer"
          placeholder="Type your answer"
          className="box-border min-w-0 flex-1 resize-none rounded-md border border-hairline-strong bg-canvas p-2.5 font-sans text-small text-ink outline-none placeholder:text-ink-tertiary focus:border-primary! focus:shadow-focus"
        />
        <Button type="submit" size="sm">
          Submit answer
        </Button>
      </div>
    </form>
  );
}

function Setup({
  attachVideo,
  ...p
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
  companies: string[];
  company: string;
  setCompany: (v: string) => void;
  role: string;
  setRole: (v: string) => void;
  type: InterviewType;
  setType: (v: InterviewType) => void;
  length: string;
  setLength: (v: string) => void;
  strictness: Strictness;
  setStrictness: (v: Strictness) => void;
  cap: InterviewData["cap"];
  cam: "off" | "on" | "denied";
  enableCam: () => Promise<void>;
  attachVideo: (el: HTMLVideoElement | null) => void;
  sttSupported: boolean;
  error: string | null;
  latest?: string;
  onStart: () => void;
}) {
  const live = p.mode === "live";
  const capReached = p.cap.max != null && p.cap.used >= p.cap.max;
  const blocked = live && (p.cam === "denied" || !p.sttSupported || capReached);
  const reason = !live
    ? null
    : capReached
      ? "You've used this month's live sessions. Typed and Multiple choice are still available."
      : !p.sttSupported
        ? "This browser can't transcribe speech. Use Chrome, Edge or Safari, or choose Typed."
        : p.cam === "denied"
          ? "Camera access is blocked. Allow it in your browser, or continue with audio only."
          : null;
  const info = p.mode === "live" ? null : INFO[p.mode];
  return (
    <section aria-label="Interview setup" className="flex flex-col gap-6">
      <PageHeader title="Mock interview" sub={MODE_SUB[p.mode]}>
        {p.latest && (
          <Button variant="secondary" href={`/interview?session=${p.latest}`}>
            Last feedback
          </Button>
        )}
      </PageHeader>
      <div
        role="radiogroup"
        aria-label="Interview format"
        className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3"
      >
        {MODES.map((m) => {
          const on = p.mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => p.setMode(m.id)}
              className={cx(
                "box-border flex cursor-pointer flex-col gap-2 rounded-lg border p-[18px] text-left transition-[background-color,border-color,opacity] duration-150 hover:border-hairline-strong hover:bg-surface-2 hover:opacity-100 focus-visible:shadow-focus focus-visible:outline-none",
                on
                  ? "border-primary! bg-glow-soft! opacity-100 shadow-glow-active"
                  : "border-hairline bg-surface-1 opacity-55",
              )}
            >
              <span className="flex items-center justify-between gap-3">
                <Icon name={m.icon} size={20} className={on ? "text-primary" : "text-ink-subtle"} />
                <span
                  className={cx(
                    "box-border size-3.5 rounded-full",
                    on ? "border-4 border-primary" : "border border-hairline-strong",
                  )}
                />
              </span>
              <span className="text-body font-semibold text-ink">{m.title}</span>
              <span className="text-small text-pretty text-ink-muted">{m.sub}</span>
              <span className="text-caption text-ink-subtle">{m.meta}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-4">
          <Panel padded>
            <div className="flex flex-col gap-4">
              <Combobox
                label="Company"
                options={p.companies}
                value={p.company}
                onChange={(v) => p.setCompany(v || NO_COMPANY)}
                placeholder="Search or type a company"
              />
              <Dropdown
                label="Role"
                options={ROLES}
                value={p.role}
                onChange={p.setRole}
                placeholder={NO_ROLE}
              />
            </div>
            <div className="flex flex-wrap gap-6">
              <Dropdown
                label="Interview type"
                options={TYPES}
                value={p.type}
                onChange={(v) => p.setType(v as InterviewType)}
                className="min-w-[220px] flex-[2_1_220px]"
              />
              <Dropdown
                label="Length"
                options={LENGTHS}
                value={p.length}
                onChange={p.setLength}
                className="min-w-[160px] flex-[1_1_160px]"
              />
              <Dropdown
                label="Strictness"
                options={STRICTNESS}
                value={p.strictness}
                onChange={(v) => p.setStrictness(v as Strictness)}
                className="min-w-[160px] flex-[1_1_160px]"
              />
            </div>
          </Panel>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between gap-3 text-small">
              <span className="text-ink-muted">Live sessions this month</span>
              <span className="font-mono text-ui text-ink-subtle">
                {p.cap.used}
                {p.cap.max != null && ` / ${p.cap.max}`}
              </span>
            </div>
            <span className="text-caption text-ink-subtle">
              Typed and Multiple choice don&apos;t count against this.
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3">
          {live ? (
            <>
              <div className="relative flex aspect-video max-h-[220px] items-center justify-center overflow-hidden rounded-xl border border-hairline bg-surface-1">
                {p.cam === "on" ? (
                  <video
                    ref={attachVideo}
                    autoPlay
                    muted
                    playsInline
                    className="absolute inset-0 size-full -scale-x-100 object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2.5 p-4 text-center">
                    <Icon name="video-off" size={20} className="text-ink-subtle" />
                    <span className="text-small text-ink-muted">
                      {p.cam === "denied"
                        ? "Camera access was blocked. You can still practise with audio only."
                        : "Check your framing before you start."}
                    </span>
                    <Button variant="secondary" size="sm" onClick={() => void p.enableCam()}>
                      Enable camera
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3.5 rounded-lg border border-hairline bg-surface-1 p-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-caption font-semibold tracking-[0.4px] text-ink-subtle uppercase">
                    Requirements
                  </span>
                  <Requirement
                    icon={p.sttSupported ? "circle-check" : "alert-circle"}
                    tone={p.sttSupported ? "text-success-ink" : "text-danger-ink"}
                    label={
                      p.sttSupported
                        ? "Microphone and speech recognition"
                        : "Speech recognition isn't available in this browser"
                    }
                  />
                  <Requirement
                    icon={
                      p.cam === "on"
                        ? "circle-check"
                        : p.cam === "denied"
                          ? "alert-circle"
                          : "circle-dashed"
                    }
                    tone={
                      p.cam === "on"
                        ? "text-success-ink"
                        : p.cam === "denied"
                          ? "text-warning-ink"
                          : "text-ink-tertiary"
                    }
                    label={
                      p.cam === "on"
                        ? "Camera connected"
                        : p.cam === "denied"
                          ? "Camera access blocked"
                          : "Camera not connected (optional)"
                    }
                  />
                </div>
                <div className="h-px bg-hairline" />
                <div className="flex flex-col gap-1.5">
                  <span className="text-caption font-semibold tracking-[0.4px] text-ink-subtle uppercase">
                    Tips
                  </span>
                  <div className="flex items-center gap-2 text-small text-ink-muted">
                    <Icon name="circle-dashed" size={16} className="text-ink-tertiary" />
                    Quiet room, face lit from the front
                  </div>
                </div>
              </div>
              <span className="text-caption text-ink-subtle">
                Recordings stay on your device unless you choose to save them.
              </span>
            </>
          ) : (
            info && (
              <>
                <div className="flex flex-col gap-4 rounded-xl border border-hairline bg-surface-1 p-6">
                  <span className="text-body font-semibold">{info.title}</span>
                  {info.lines.map((l) => (
                    <div key={l} className="flex items-start gap-2.5 text-small text-ink-muted">
                      <Icon name="check" size={16} className="mt-0.5 text-ink-subtle" />
                      <span className="text-pretty">{l}</span>
                    </div>
                  ))}
                </div>
                <span className="text-caption text-ink-subtle">
                  No camera or microphone needed.
                </span>
              </>
            )
          )}
          {(reason ?? p.error) && <ErrorLine text={(reason ?? p.error)!} />}
          <Button size="lg" fullWidth disabled={blocked} onClick={p.onStart}>
            {p.mode === "mcq" ? "Start test" : "Start session"}
          </Button>
        </div>
      </div>
    </section>
  );
}

function Requirement({ icon, tone, label }: { icon: IconName; tone: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-small text-ink">
      <Icon name={icon} size={16} className={tone} />
      {label}
    </div>
  );
}

function Mcq(p: {
  mq: number;
  setMq: (i: number) => void;
  picks: (number | null)[];
  pick: (i: number) => void;
  clock: string;
  saving: boolean;
  error: string | null;
  onQuit: () => void;
  onFinish: () => void;
}) {
  const q = MCQ_BANK[p.mq]!;
  const picked = p.picks[p.mq] ?? null;
  const answered = p.picks.filter((x) => x != null).length;
  const right = p.picks.filter((x, i) => x != null && x === MCQ_BANK[i]!.a).length;
  const last = p.mq === MCQ_BANK.length - 1;
  return (
    <section
      aria-label="Multiple choice"
      className="mx-auto flex w-full max-w-[760px] flex-col gap-5"
    >
      <div className="flex flex-col gap-2">
        <div className="flex justify-between gap-3 text-caption text-ink-subtle">
          <span>
            Question {p.mq + 1} of {MCQ_BANK.length}
          </span>
          <span className="flex gap-3">
            <span className="text-success-ink">{right} correct</span>
            <span className="text-danger-ink">{answered - right} wrong</span>
            <span className="font-mono">{p.clock}</span>
          </span>
        </div>
        <div className="flex gap-1">
          {MCQ_BANK.map((b, i) => {
            const v = p.picks[i];
            return (
              <button
                key={b.q}
                type="button"
                aria-label={`Go to question ${i + 1}`}
                aria-current={i === p.mq ? "step" : undefined}
                onClick={() => p.setMq(i)}
                className={cx(
                  "h-1.5 flex-1 cursor-pointer rounded-full outline-offset-2 focus-visible:shadow-focus",
                  v == null
                    ? i === p.mq
                      ? "bg-ink-muted"
                      : "bg-surface-3"
                    : v === b.a
                      ? "bg-success-ink"
                      : "bg-danger-ink",
                  i === p.mq && "outline outline-1 outline-ink-muted",
                )}
              />
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-5 rounded-xl border border-hairline bg-surface-1 p-7 max-md:p-5">
        <div className="flex flex-col gap-2">
          <span className="text-caption text-ink-subtle">{q.topic}</span>
          <span className="text-title font-medium text-pretty text-ink">{q.q}</span>
        </div>
        <div className="flex flex-col gap-2" role="group" aria-label="Options">
          {q.opts.map((text, i) => {
            const done = picked != null;
            const ok = done && i === q.a;
            const bad = done && i === picked && i !== q.a;
            return (
              <button
                key={text}
                type="button"
                disabled={done}
                onClick={() => p.pick(i)}
                className={cx(
                  "box-border flex items-center gap-3 rounded-md border px-4 py-3.5 text-left text-small text-ink transition-[background-color,border-color] duration-150 focus-visible:shadow-focus focus-visible:outline-none",
                  done ? "cursor-default" : "cursor-pointer hover:border-ink-subtle",
                  ok
                    ? "border-success-ink bg-success-soft"
                    : bad
                      ? "border-danger-ink bg-danger-soft"
                      : "border-hairline-strong bg-canvas",
                  done && !ok && !bad && "opacity-55",
                )}
              >
                <span
                  className={cx(
                    "flex size-[26px] flex-none items-center justify-center rounded-sm border font-mono text-caption font-semibold",
                    ok
                      ? "border-success-ink bg-success-ink text-on-primary"
                      : bad
                        ? "border-danger-ink bg-danger-ink text-on-primary"
                        : "border-hairline-strong text-ink-muted",
                  )}
                >
                  {"ABCD"[i]}
                </span>
                <span className="min-w-0 flex-1">{text}</span>
                {ok && <Icon name="check" size={18} className="text-success-ink" />}
                {bad && <Icon name="x" size={18} className="text-danger-ink" />}
              </button>
            );
          })}
        </div>
        {picked != null && (
          <div
            className="flex flex-col gap-1 rounded-md border border-hairline bg-surface-2 px-4 py-3.5 text-small"
            role="status"
          >
            <span className="font-semibold text-ink">
              {picked === q.a ? "Correct" : `Not quite. The answer is ${"ABCD"[q.a]}.`}
            </span>
            <span className="text-pretty text-ink-muted">{q.why}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="tertiary"
          size="sm"
          disabled={p.mq === 0}
          onClick={() => p.setMq(Math.max(0, p.mq - 1))}
        >
          Previous
        </Button>
        <span className="flex-1" />
        <Button variant="tertiary" size="sm" onClick={p.onQuit}>
          Quit
        </Button>
        <Button
          size="sm"
          disabled={picked == null || p.saving}
          onClick={() => (last ? p.onFinish() : p.setMq(p.mq + 1))}
        >
          {last ? "See results" : "Next"}
        </Button>
      </div>
      {p.error && <ErrorLine text={p.error} />}
    </section>
  );
}
