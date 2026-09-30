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

/** Errors after which Web Speech won't recover this session (docs/interviews.md). */
const FATAL = new Set(["network", "service-not-allowed", "audio-capture", "not-allowed"]);
const noSubscribe = () => () => {};

/**
 * The live interview's voice: the interviewer speaks with speechSynthesis (Cloud TTS tiers come in
 * Phase 6) and answers are transcribed with Web Speech, click to start and click to stop. When
 * recognition is missing or fails, `failed` is set and the page falls back to a typed answer.
 */
export function useInterviewVoice(lang = "en-IN") {
  const supported = useSyncExternalStore(
    noSubscribe,
    () => !!recognitionCtor(),
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState("");
  const [failed, setFailed] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  const finalText = useRef("");
  const wantListening = useRef(false);
  const startedAt = useRef(0);
  const spokenMs = useRef(0);
  const interimRef = useRef("");
  useEffect(() => {
    interimRef.current = interim;
  }, [interim]);

  const speak = useCallback(
    (text: string) =>
      new Promise<void>((resolve) => {
        const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
        if (!synth) {
          setSpeaking(true);
          window.setTimeout(
            () => {
              setSpeaking(false);
              resolve();
            },
            Math.min(8000, 400 + text.length * 55),
          );
          return;
        }
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang;
        u.rate = 1;
        const voice =
          synth.getVoices().find((v) => v.lang === lang) ??
          synth.getVoices().find((v) => v.lang.startsWith("en"));
        if (voice) u.voice = voice;
        const done = () => {
          setSpeaking(false);
          resolve();
        };
        u.onend = done;
        u.onerror = done;
        setSpeaking(true);
        synth.speak(u);
      }),
    [lang],
  );

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const begin = useCallback(() => {
    const C = recognitionCtor();
    if (!C) {
      setFailed("This browser can't transcribe speech. Type your answer instead.");
      return;
    }
    const r = new C();
    r.lang = lang;
    r.continuous = true;
    r.interimResults = true;
    let committed = finalText.current;
    r.onresult = (e) => {
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
      if (FATAL.has(e.error)) {
        wantListening.current = false;
        setFailed(
          e.error === "not-allowed"
            ? "Microphone access is blocked. Allow it in your browser, or type your answer."
            : "Speech recognition stopped working in this browser. Type your answer instead.",
        );
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
  }, [lang]);

  const startListening = useCallback(() => {
    stopSpeaking();
    finalText.current = "";
    setInterim("");
    wantListening.current = true;
    startedAt.current = Date.now();
    setListening(true);
    begin();
  }, [begin, stopSpeaking]);

  /** Stops listening and returns what was said. */
  const stopListening = useCallback((): string => {
    wantListening.current = false;
    rec.current?.stop();
    if (startedAt.current) spokenMs.current += Date.now() - startedAt.current;
    startedAt.current = 0;
    setListening(false);
    return finalText.current.trim() || interimRef.current.trim();
  }, []);

  useEffect(
    () => () => {
      wantListening.current = false;
      rec.current?.abort();
      window.speechSynthesis?.cancel();
    },
    [],
  );

  return {
    supported,
    listening,
    speaking,
    interim,
    failed,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    speakingSeconds: () => Math.round(spokenMs.current / 1000),
  };
}
