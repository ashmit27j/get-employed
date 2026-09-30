"use client";
import { useState } from "react";
import type { DropzoneState } from "@ge/ui";

export interface ResumeUpload {
  state: DropzoneState;
  name: string;
  size: string;
  progress: number;
  /** Storage key returned by /api/uploads/resume. */
  key?: string;
  error?: string;
}

const IDLE: ResumeUpload = { state: "idle", name: "", size: "", progress: 0 };
const FAILED = "That upload didn't work. Try again.";

/**
 * Uploads a file (a resume to /api/uploads/resume by default) with progress for the Dropzone. `defer` stores the file
 * without queueing resume.parse (the caller queues it later with its own options).
 */
export function useResumeUpload({
  defer = false,
  initial,
  url = "/api/uploads/resume",
}: { defer?: boolean; initial?: ResumeUpload; url?: string } = {}) {
  const [upload, setUpload] = useState<ResumeUpload>(initial ?? IDLE);
  const start = (file: File) => {
    const size = `${Math.max(1, Math.round(file.size / 1024))} KB`;
    setUpload({ state: "uploading", name: file.name, size, progress: 0 });
    const body = new FormData();
    body.append("file", file);
    if (defer) body.append("defer", "1");
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        setUpload((u) => ({ ...u, progress: Math.round((e.loaded / e.total) * 100) }));
    };
    xhr.onload = () => {
      let json: { error?: string; key?: string } = {};
      try {
        json = JSON.parse(xhr.responseText) as typeof json;
      } catch {
        // Keep the generic message.
      }
      if (xhr.status >= 200 && xhr.status < 300)
        setUpload((u) => ({ ...u, state: "done", progress: 100, key: json.key }));
      else setUpload({ ...IDLE, error: json.error ?? FAILED });
    };
    xhr.onerror = () => setUpload({ ...IDLE, error: FAILED });
    xhr.send(body);
  };
  return { upload, start, reset: () => setUpload(IDLE) };
}
