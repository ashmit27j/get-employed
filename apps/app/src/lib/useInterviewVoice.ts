"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

interface RecognitionResultEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}
const canRecord = () =>
  typeof window !== "undefined" &&
  "MediaRecorder" in window &&
  "Worker" in window &&
  !!navigator.mediaDevices;

/** Web Speech errors after which it won't recover this session (docs/interviews.md). */
const FATAL = new Set(["network", "service-not-allowed", "audio-capture"]);
const WHISPER_MODEL = process.env.NEXT_PUBLIC_WHISPER_MODEL || "Xenova/whisper-tiny.en";
const noSubscribe = () => () => {};

export type SttEngine = "webspeech" | "whisper" | "typed";

/** Decode a recording and resample it to 16 kHz mono for Whisper. */
async function toPcm16k(blob: Blob): Promise<Float32Array> {
  const ctx = new AudioContext();
  const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
  await ctx.close();
  const off = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
  const src = off.createBufferSource();
  src.buffer = decoded;
  src.connect(off.destination);
  src.start();
  return (await off.startRendering()).getChannelData(0);
}

/**
 * The live interview's voice. The interviewer speaks with Google Cloud TTS (/api/tts, tiered), or
 * the browser's voice when that's off or over budget. Answers are transcribed with Web Speech;
 * if it's missing or fails at runtime the session switches to Whisper in a Web Worker, and typing
 * is the last resort. Answering is click to start, click to stop: the mic is never always on.
 */
export function useInterviewVoice(lang = "en-IN") {
  const supported = useSyncExternalStore(
    noSubscribe,
    () => !!recognitionCtor() || canRecord(),
    () => false,
  );
  const [engine, setEngine] = useState<SttEngine>(() =>
    recognitionCtor() ? "webspeech" : "whisper",
  );
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [modelProgress, setModelProgress] = useState<number | null>(null);
  const [interim, setInterim] = useState("");
  const [failed, setFailed] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const rec = useRef<Recognition | null>(null);
  const finalText = useRef("");
  const wantListening = useRef(false);
  const startedAt = useRef(0);
  const spokenMs = useRef(0);
  const interimRef = useRef("");
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const worker = useRef<Worker | null>(null);
  const cloudVoice = useRef(true);
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    interimRef.current = interim;
  }, [interim]);

  /* ---------- speaking ---------- */

  const browserSpeak = useCallback(
    (text: string) =>
      new Promise<void>((resolve) => {
        const synth = window.speechSynthesis;
        if (!synth) {
          window.setTimeout(resolve, Math.min(8000, 400 + text.length * 55));
          return;
        }
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang;
        const voice =
          synth.getVoices().find((v) => v.lang === lang) ??
          synth.getVoices().find((v) => v.lang.startsWith("en"));
        if (voice) u.voice = voice;
        u.onend = () => resolve();
        u.onerror = () => resolve();
        synth.speak(u);
      }),
    [lang],
  );

  const speak = useCallback(
    async (text: string) => {
      setSpeaking(true);
      try {
        if (cloudVoice.current) {
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          }).catch(() => null);
          if (res?.ok && res.headers.get("Content-Type")?.includes("audio")) {
            const url = URL.createObjectURL(await res.blob());
            await new Promise<void>((resolve) => {
              const a = new Audio(url);
              audio.current = a;
              a.onended = () => resolve();
              a.onerror = () => resolve();
              a.play().catch(() => resolve());
            });
            URL.revokeObjectURL(url);
            return;
          }
          // No Cloud TTS on this server (or over budget): use the browser's voice from now on.
          cloudVoice.current = false;
        }
        await browserSpeak(text);
      } finally {
        setSpeaking(false);
      }
    },
    [browserSpeak],
  );

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    audio.current?.pause();
    setSpeaking(false);
  }, []);

  /* ---------- Whisper ---------- */

  const whisper = useCallback(() => {
    if (!worker.current) {
      worker.current = new Worker(new URL("./whisper.worker.ts", import.meta.url), {
        type: "module",
      });
      worker.current.addEventListener(
        "message",
        (e: MessageEvent<{ type: string; pct?: number }>) => {
          if (e.data.type === "progress") setModelProgress(e.data.pct ?? 0);
          if (e.data.type === "ready") setModelProgress(null);
        },
      );
      setModelProgress(0);
      worker.current.postMessage({ type: "load", model: WHISPER_MODEL });
    }
    return worker.current;
  }, []);

  const switchToWhisper = useCallback(
    (why: string) => {
      if (!canRecord()) {
        setEngine("typed");
        setFailed(`${why} Type your answer instead.`);
        return;
      }
      setEngine("whisper");
      setNotice(`${why} Switched to on-device transcription; answer again.`);
      whisper();
    },
    [whisper],
  );

  const transcribe = useCallback(
    (blob: Blob) =>
      new Promise<string>((resolve) => {
        void toPcm16k(blob)
          .then((pcm) => {
            const w = whisper();
            const onMsg = (e: MessageEvent<{ type: string; text?: string; message?: string }>) => {
              if (e.data.type === "text") {
                w.removeEventListener("message", onMsg);
                resolve(e.data.text ?? "");
              } else if (e.data.type === "error") {
                w.removeEventListener("message", onMsg);
                setEngine("typed");
                setFailed("On-device transcription didn't load. Type your answer instead.");
                resolve("");
              }
            };
            w.addEventListener("message", onMsg);
            w.postMessage({ type: "transcribe", audio: pcm, model: WHISPER_MODEL }, [pcm.buffer]);
          })
          .catch(() => resolve(""));
      }),
    [whisper],
  );

  /* ---------- listening ---------- */

  const beginWebSpeech = useCallback(() => {
    const C = recognitionCtor();
    if (!C) return false;
    const r = new C();
    r.lang = lang;
    r.continuous = true;
    r.interimResults = true;
    let committed = finalText.current;
    let heard = false;
    r.onresult = (e) => {
      heard = true;
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i]!;
        if (res.isFinal) committed = `${committed} ${res[0].transcript}`.trim();
        else live += res[0].transcript;
      }
      finalText.current = committed;
      setInterim(`${committed} ${live}`.trim());
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed") {
        wantListening.current = false;
        setListening(false);
        setEngine("typed");
        setFailed("Microphone access is blocked. Allow it in your browser, or type your answer.");
      } else if (FATAL.has(e.error) && !heard) {
        // Brave and Firefox expose the API and then fail: move to Whisper for the rest of the session.
        wantListening.current = false;
        setListening(false);
        switchToWhisper("This browser's speech recognition isn't working.");
      }
    };
    // Chrome ends recognition after a pause; keep going until the user stops.
    r.onend = () => {
      if (wantListening.current) {
        try {
          r.start();
          return;
        } catch {
          // Fall through and stop.
        }
      }
      setListening(false);
    };
    rec.current = r;
    r.start();
    return true;
  }, [lang, switchToWhisper]);

  const startListening = useCallback(async () => {
    stopSpeaking();
    setNotice(null);
    finalText.current = "";
    setInterim("");
    wantListening.current = true;
    startedAt.current = Date.now();
    if (engine === "webspeech" && beginWebSpeech()) {
      setListening(true);
      return;
    }
    if (engine === "typed") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find((m) =>
        MediaRecorder.isTypeSupported(m),
      );
      const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.start(1000);
      recorder.current = r;
      whisper();
      setListening(true);
    } catch {
      wantListening.current = false;
      setEngine("typed");
      setFailed("Microphone access is blocked. Allow it in your browser, or type your answer.");
    }
  }, [beginWebSpeech, engine, stopSpeaking, whisper]);

  /** Stops listening and resolves with what was said. */
  const stopListening = useCallback(async (): Promise<string> => {
    wantListening.current = false;
    if (startedAt.current) spokenMs.current += Date.now() - startedAt.current;
    startedAt.current = 0;
    setListening(false);
    if (rec.current && engine === "webspeech") {
      rec.current.stop();
      return finalText.current.trim() || interimRef.current.trim();
    }
    const r = recorder.current;
    if (!r) return "";
    const done = new Promise<Blob>((resolve) => {
      r.onstop = () => resolve(new Blob(chunks.current, { type: r.mimeType }));
    });
    r.stop();
    r.stream.getTracks().forEach((t) => t.stop());
    recorder.current = null;
    setTranscribing(true);
    try {
      const text = await transcribe(await done);
      setInterim(text);
      return text;
    } finally {
      setTranscribing(false);
    }
  }, [engine, transcribe]);

  useEffect(
    () => () => {
      wantListening.current = false;
      rec.current?.abort();
      recorder.current?.stream.getTracks().forEach((t) => t.stop());
      window.speechSynthesis?.cancel();
      audio.current?.pause();
      // Release the model when the session ends (docs/interviews.md).
      worker.current?.terminate();
    },
    [],
  );

  return {
    supported,
    engine,
    listening,
    speaking,
    transcribing,
    /** Whisper model download, 0–100, while it loads. */
    modelProgress,
    interim,
    failed,
    notice,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    speakingSeconds: () => Math.round(spokenMs.current / 1000),
  };
}
