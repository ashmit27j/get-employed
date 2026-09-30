"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/* Minimal typings for the Web Speech API (not in lib.dom for every browser). */
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

function ctor(): RecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const noSubscribe = () => () => {};

/**
 * Short dictation into a text field with the browser's speech recognition. Unsupported browsers get
 * `supported: false`, so the mic button can hide. (Interviews use the fuller fallback chain in docs/interviews.md.)
 */
export function useDictation(onText: (text: string) => void, lang = "en-IN") {
  const supported = useSyncExternalStore(
    noSubscribe,
    () => !!ctor(),
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  const latest = useRef(onText);
  useEffect(() => {
    latest.current = onText;
  });

  const stop = useCallback(() => {
    rec.current?.stop();
  }, []);

  const start = useCallback(() => {
    const C = ctor();
    if (!C) return;
    const r = new C();
    r.lang = lang;
    r.continuous = false;
    r.interimResults = true;
    let text = "";
    r.onresult = (e) => {
      text = Array.from({ length: e.results.length }, (_, i) => e.results[i]![0].transcript).join(
        " ",
      );
      latest.current(text.trim());
    };
    r.onerror = (e) =>
      setError(
        e.error === "not-allowed"
          ? "Microphone access is blocked."
          : "Dictation stopped. Try again or type instead.",
      );
    r.onend = () => setListening(false);
    rec.current = r;
    setError(null);
    setListening(true);
    r.start();
  }, [lang]);

  useEffect(() => () => rec.current?.abort(), []);
  return { supported, listening, error, start, stop, toggle: () => (listening ? stop() : start()) };
}
