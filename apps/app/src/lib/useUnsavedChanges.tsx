"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal } from "@ge/ui";

/**
 * Warns before leaving a page with unsaved edits: the browser's own prompt on reload or close,
 * and a dialog for in-app links (any same-origin <a> that goes to another page).
 * Render the returned `dialog` somewhere in the page.
 */
export function useUnsavedChanges(dirty: boolean, onSave: () => Promise<boolean>) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const dirtyRef = useRef(dirty);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    const click = (e: MouseEvent) => {
      if (!dirtyRef.current || e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      e.preventDefault();
      e.stopPropagation();
      setPending(url.pathname + url.search + url.hash);
    };
    window.addEventListener("beforeunload", beforeUnload);
    // Capture phase, so it runs before next/link's own handler.
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", click, true);
    };
  }, []);

  const leave = (href: string) => {
    dirtyRef.current = false;
    setPending(null);
    router.push(href);
  };

  const dialog = pending && (
    <Modal
      open
      onClose={() => setPending(null)}
      title="Leave with unsaved changes?"
      sub="Your edits to this page haven't been saved."
      width={440}
      footer={
        <>
          <Button variant="tertiary" size="sm" onClick={() => setPending(null)}>
            Stay
          </Button>
          <Button variant="secondary" size="sm" onClick={() => leave(pending)}>
            Leave without saving
          </Button>
          <Button
            size="sm"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              const ok = await onSave();
              setSaving(false);
              if (ok) leave(pending);
            }}
          >
            {saving ? "Saving…" : "Save and leave"}
          </Button>
        </>
      }
    />
  );
  return dialog;
}
