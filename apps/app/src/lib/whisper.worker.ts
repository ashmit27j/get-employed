/// <reference lib="webworker" />
// Whisper in the browser (docs/interviews.md): loaded only when Web Speech isn't available or fails.
// Messages in: {type:"load", model} | {type:"transcribe", audio: Float32Array (16 kHz mono)}.
// Messages out: {type:"progress", pct} | {type:"ready"} | {type:"text", text} | {type:"error", message}.

type Asr = (
  audio: Float32Array,
  options?: Record<string, unknown>,
) => Promise<{ text: string } | { text: string }[]>;

let asr: Promise<Asr> | null = null;

function load(model: string): Promise<Asr> {
  asr ??= (async () => {
    const { pipeline } = await import("@huggingface/transformers");
    const pipe = await pipeline("automatic-speech-recognition", model, {
      progress_callback: (p: { status?: string; progress?: number }) => {
        if (p.status === "progress" && typeof p.progress === "number")
          self.postMessage({ type: "progress", pct: Math.round(p.progress) });
      },
    });
    return pipe as unknown as Asr;
  })();
  return asr;
}

self.onmessage = async (
  e: MessageEvent<
    { type: "load"; model: string } | { type: "transcribe"; audio: Float32Array; model: string }
  >,
) => {
  try {
    const run = await load(e.data.model);
    if (e.data.type === "load") {
      self.postMessage({ type: "ready" });
      return;
    }
    // Short chunks keep memory low on phones.
    const out = await run(e.data.audio, { chunk_length_s: 20, stride_length_s: 4 });
    const text = Array.isArray(out) ? out.map((o) => o.text).join(" ") : out.text;
    self.postMessage({ type: "text", text: text.trim() });
  } catch (err) {
    asr = null;
    self.postMessage({ type: "error", message: err instanceof Error ? err.message : String(err) });
  }
};
