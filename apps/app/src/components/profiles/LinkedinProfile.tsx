"use client";
import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Button,
  DiffBlock,
  Dropzone,
  Icon,
  IconButton,
  TextInput,
  MatchRing,
  PageHeader,
  Panel,
  StepList,
  isIconName,
  type DiffStatus,
} from "@ge/ui";
import { useResumeUpload } from "@/lib/useResumeUpload";
import { importLinkedinUrl, removeLinkedin } from "@/server/actions/profiles";
import type { LinkedinData } from "@/server/profiles";

const STEPS = [
  {
    title: "Open the Resources menu",
    body: "On your LinkedIn profile, click Resources under your headline.",
  },
  { title: "Choose Save to PDF", body: "LinkedIn downloads a PDF of your full profile." },
  { title: "Drop the file above", body: "We rebuild your profile in a few seconds." },
];
const POLL_MS = 3000;

/** Refresh server data while an import is running. */
export function usePollWhile(active: boolean) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => router.refresh(), POLL_MS);
    return () => clearInterval(t);
  }, [active, router]);
}

export function BrandHeader({ img, title, sub }: { img: string; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="box-border flex size-11 flex-none items-center justify-center rounded-md border border-hairline-strong bg-surface-2">
        <Image src={img} alt="" width={22} height={22} className="block rounded-xs" />
      </span>
      <PageHeader title={title} sub={sub} />
    </div>
  );
}

export function LinkedinProfile({ data }: { data: LinkedinData }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  // The import came from a profile URL rather than the PDF export.
  const fromUrl = !!data.source?.startsWith("https://");
  const fileName = data.source?.split("/").pop() ?? "";
  const {
    upload,
    start: startUpload,
    reset,
  } = useResumeUpload({
    url: "/api/uploads/linkedin",
    initial:
      data.source && !fromUrl
        ? { state: "done", name: fileName, size: "", progress: 100 }
        : undefined,
  });
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const hasSource = fromUrl || upload.state !== "idle";
  const importing = (fromUrl || upload.state === "done") && !data.snapshot && !data.error;
  usePollWhile(importing);
  // Refresh once the upload lands so the page picks up the pending import.
  useEffect(() => {
    if (upload.state === "done" && upload.key) router.refresh();
  }, [upload.state, upload.key, router]);

  const [status, setStatus] = useState<Record<number, DiffStatus>>({});
  const [alt, setAlt] = useState<Record<number, number>>({});
  const [copied, setCopied] = useState<string | null>(null);

  return (
    <>
      <BrandHeader
        img="/linkedin.svg"
        title="Optimize your LinkedIn profile"
        sub="Upload your LinkedIn PDF export or paste your profile link. We rebuild it into an editable profile and suggest improvements that match your main resume."
      />
      {fromUrl ? (
        <div className="flex items-center gap-3 rounded-lg border border-hairline bg-surface-1 px-4 py-3.5 shadow-edge">
          <span className="flex size-9 flex-none items-center justify-center rounded-md border border-hairline bg-surface-2 text-ink-subtle">
            <Icon name="link" size={16} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-small text-ink">
              {data.source!.replace("https://www.", "")}
            </span>
            <span className="text-caption text-ink-subtle" aria-live="polite">
              {importing
                ? "Rebuilding your profile from the page…"
                : data.error
                  ? "Import didn't finish"
                  : "Imported from your profile link"}
            </span>
          </div>
          <IconButton
            icon="x"
            title="Remove import"
            onClick={() =>
              start(async () => {
                await removeLinkedin();
                router.refresh();
              })
            }
          />
        </div>
      ) : hasSource ? (
        <Dropzone
          title="Drop your LinkedIn PDF here"
          hint="PDF up to 10 MB"
          accept=".pdf"
          buttonLabel="Choose PDF"
          state={upload.state}
          fileName={upload.name}
          fileSize={upload.size}
          progress={upload.progress}
          onFile={startUpload}
          onRemove={() => {
            reset();
            start(async () => {
              await removeLinkedin();
              router.refresh();
            });
          }}
          summary={importing ? "Rebuilding your profile from the PDF…" : undefined}
        />
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-4 max-md:grid-cols-1">
          <Dropzone
            title="Drop your LinkedIn PDF here"
            hint="PDF up to 10 MB"
            accept=".pdf"
            buttonLabel="Choose PDF"
            state={upload.state}
            fileName={upload.name}
            fileSize={upload.size}
            progress={upload.progress}
            onFile={startUpload}
            onRemove={reset}
          />
          <div className="flex flex-col items-center justify-center gap-2 text-caption text-ink-tertiary uppercase max-md:flex-row">
            <span className="w-px flex-1 bg-hairline max-md:h-px max-md:w-auto" />
            or
            <span className="w-px flex-1 bg-hairline max-md:h-px max-md:w-auto" />
          </div>
          <form
            className="flex flex-col justify-center gap-3 rounded-lg border border-hairline bg-surface-1 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              setUrlError(null);
              start(async () => {
                const r = await importLinkedinUrl(url);
                if (!r.ok) setUrlError(r.error);
                else router.refresh();
              });
            }}
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-small font-medium text-ink">Paste your profile link</span>
              <span className="text-caption text-pretty text-ink-subtle">
                Works with public profiles. Same result as the PDF.
              </span>
            </div>
            <TextInput
              aria-label="LinkedIn profile URL"
              placeholder="linkedin.com/in/your-name"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlError(null);
              }}
              inputMode="url"
              autoComplete="url"
            />
            {urlError && (
              <p role="alert" className="m-0 text-caption text-danger-ink">
                {urlError}
              </p>
            )}
            <Button type="submit" disabled={!url.trim() || pending} className="self-start">
              Import profile
            </Button>
          </form>
        </div>
      )}
      {data.error && (
        <p role="alert" className="m-0 text-small text-danger-ink">
          {data.error}
        </p>
      )}
      {upload.error && (
        <p role="alert" className="m-0 text-small text-danger-ink">
          {upload.error}
        </p>
      )}

      {data.snapshot && (fromUrl || upload.state === "done") && (
        <>
          <div className="flex flex-col gap-0.5">
            <h2 className="m-0 text-body font-semibold">Your rebuilt profile</h2>
            <span className="text-caption text-ink-subtle">
              Reconstructed from your {fromUrl ? "profile page" : "PDF export"}, section by section.
            </span>
          </div>
          <Panel>
            {data.snapshot.sections.map((sec) => (
              <div
                key={sec.title}
                className="flex gap-4 border-b border-hairline px-5 py-4 last:border-b-0"
              >
                <span className="flex size-8 flex-none items-center justify-center rounded-sm border border-hairline bg-surface-2 text-ink-subtle">
                  <Icon name={isIconName(sec.icon) ? sec.icon : "file-text"} size={16} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-small font-medium">{sec.title}</span>
                  <span className="text-small text-pretty whitespace-pre-line text-ink-muted">
                    {sec.body}
                  </span>
                </div>
              </div>
            ))}
          </Panel>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="m-0 text-body font-semibold">Suggested improvements</h2>
              <span className="text-caption text-ink-subtle" aria-live="polite">
                {copied
                  ? `Copied the new ${copied} text. Paste it into LinkedIn.`
                  : "Accepted changes are copied to your clipboard section by section. Paste them into LinkedIn."}
              </span>
            </div>
            <MatchRing value={data.snapshot.strength} size={44} caption="Profile strength" />
          </div>
          {data.suggestions.map((d, i) => {
            const options = [d.new, ...d.alts];
            const after = options[(alt[i] ?? 0) % options.length]!;
            return (
              <DiffBlock
                key={d.section}
                section={d.section}
                before={d.old}
                after={after}
                reason={d.reason}
                status={status[i] ?? "pending"}
                onAccept={() => {
                  setStatus((s) => ({ ...s, [i]: "accepted" }));
                  void navigator.clipboard?.writeText(after);
                  setCopied(d.section.toLowerCase());
                }}
                onReject={() => setStatus((s) => ({ ...s, [i]: "rejected" }))}
                onUndo={() => setStatus((s) => ({ ...s, [i]: "pending" }))}
                onRegenerate={
                  options.length > 1
                    ? () => setAlt((a) => ({ ...a, [i]: (a[i] ?? 0) + 1 }))
                    : undefined
                }
              />
            );
          })}
        </>
      )}

      <Panel title="How to export your LinkedIn PDF" meta="Takes about 10 seconds" padded>
        <div className="flex flex-wrap items-start gap-8">
          <div className="aspect-[2106/2147] w-[370px] flex-[0_0_370px] overflow-hidden rounded-lg border border-hairline max-md:w-full max-md:flex-[1_1_100%]">
            <Image
              src="/linkedin-export-guide.png"
              alt="LinkedIn profile with Resources menu open"
              width={740}
              height={754}
              className="block size-full object-contain"
            />
          </div>
          <div className="min-w-[220px] flex-[1_1_260px]">
            <StepList steps={STEPS} />
          </div>
        </div>
      </Panel>
    </>
  );
}
