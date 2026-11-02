"use client";
// Loaded with next/dynamic (ssr: false): Monaco touches `window` as soon as it's imported.
// It's bundled from node_modules (no CDN), so self-hosted installs work offline.
import { useEffect, useRef } from "react";
import Editor, { loader, type OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

declare global {
  interface Window {
    MonacoEnvironment?: monaco.Environment;
  }
}

window.MonacoEnvironment = {
  getWorker: () =>
    new Worker(new URL("../../lib/monaco.worker.ts", import.meta.url), { type: "module" }),
};
loader.config({ monaco });

/** Resolves a CSS colour token to rrggbb (no #), the only form Monaco themes accept. */
function token(name: string): string | undefined {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim();
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx || !raw) return undefined;
  ctx.fillStyle = raw;
  const v = ctx.fillStyle; // the browser normalises opaque colours to #rrggbb
  return v.startsWith("#") ? v.slice(1) : undefined;
}

const RULES: [string, string, string?][] = [
  ["comment", "ink-tertiary", "italic"],
  ["keyword", "primary"],
  ["string", "success-ink"],
  ["number", "warning-ink"],
  ["type", "teal-ink"],
];
const COLORS: [string, string][] = [
  ["editor.background", "surface-1"],
  ["editor.foreground", "ink"],
  ["editorLineNumber.foreground", "ink-tertiary"],
  ["editorLineNumber.activeForeground", "ink-muted"],
  ["editor.lineHighlightBackground", "surface-2"],
  ["editor.selectionBackground", "primary-soft"],
  ["editorCursor.foreground", "primary"],
  ["editorIndentGuide.background1", "hairline"],
  ["editorWidget.background", "surface-2"],
  ["editorWidget.border", "hairline-strong"],
];

function defineTheme() {
  const light = document.documentElement.dataset.theme === "light";
  monaco.editor.defineTheme("ge", {
    base: light ? "vs" : "vs-dark",
    inherit: true,
    rules: RULES.flatMap(([t, name, fontStyle]) => {
      const foreground = token(name);
      return foreground ? [{ token: t, foreground, fontStyle }] : [];
    }),
    colors: Object.fromEntries(
      COLORS.flatMap(([key, name]) => {
        const v = token(name);
        return v ? [[key, `#${v}`]] : [];
      }),
    ),
  });
  monaco.editor.setTheme("ge");
}

export interface CodeEditorProps {
  language: "cpp" | "python";
  value: string;
  onChange: (value: string) => void;
  /** Ctrl/Cmd+Enter inside the editor. */
  onSubmit?: () => void;
  /** Called once Monaco has mounted. */
  onReady?: () => void;
  readOnly?: boolean;
  label: string;
}

export default function CodeEditor({
  language,
  value,
  onChange,
  onSubmit,
  onReady,
  readOnly,
  label,
}: CodeEditorProps) {
  const submit = useRef(onSubmit);
  useEffect(() => {
    submit.current = onSubmit;
  });

  // Follow the app theme (dark, light or system) as it changes.
  useEffect(() => {
    const obs = new MutationObserver(defineTheme);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  const onMount: OnMount = (editor) => {
    defineTheme();
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => submit.current?.());
    onReady?.();
  };

  return (
    <Editor
      language={language}
      value={value}
      onChange={(v) => onChange(v ?? "")}
      onMount={onMount}
      theme="ge"
      loading={<span className="text-caption text-ink-subtle">Loading the editor…</span>}
      options={{
        ariaLabel: label,
        readOnly,
        fontFamily: "var(--font-mono), ui-monospace, monospace",
        fontSize: 13,
        lineHeight: 20,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        tabSize: 4,
        insertSpaces: true,
        automaticLayout: true,
        padding: { top: 12, bottom: 12 },
        renderLineHighlight: "line",
        smoothScrolling: true,
        accessibilitySupport: "auto",
        fixedOverflowWidgets: true,
      }}
    />
  );
}
