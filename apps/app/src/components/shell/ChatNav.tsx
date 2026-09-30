"use client";
import { useState, useTransition, type DragEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Icon, Modal, TextInput, cx } from "@ge/ui";
import {
  createGroup,
  deleteThread,
  moveThread,
  renameThread,
  togglePinThread,
} from "@/server/actions/chats";
import type { ChatGroupItem, ChatThreadItem } from "@/server/shell";
import { GROUP_COLORS } from "./nav";
import { useStoredJson } from "./useStoredJson";

type Dialog =
  { kind: "rename"; thread: ChatThreadItem } | { kind: "group"; threadId?: string } | null;

function ChatMenu({
  thread,
  groups,
  onClose,
  onAction,
}: {
  thread: ChatThreadItem;
  groups: ChatGroupItem[];
  onClose: () => void;
  onAction: (a: "pin" | "rename" | "delete" | "new-group" | { move: string | null }) => void;
}) {
  const [sub, setSub] = useState(false);
  const item =
    "box-border flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-2.5 py-[7px] text-left text-small text-ink hover:bg-surface-3";
  const act = (a: Parameters<typeof onAction>[0]) => {
    onAction(a);
    onClose();
  };
  return (
    <>
      <div className="fixed inset-0 z-59" onClick={onClose} />
      <div
        role="menu"
        className="absolute top-[calc(100%+2px)] right-0 z-60 flex w-[190px] flex-col gap-px rounded-md border border-hairline-strong bg-surface-2 p-1 shadow-edge"
      >
        <button type="button" role="menuitem" className={item} onClick={() => act("pin")}>
          <Icon name="pin" size={14} className="text-ink-subtle" />
          {thread.pinned ? "Unpin" : "Pin"}
        </button>
        <button type="button" role="menuitem" className={item} onClick={() => act("rename")}>
          <Icon name="pencil" size={14} className="text-ink-subtle" />
          Rename
        </button>
        <div className="relative">
          <button
            type="button"
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={sub}
            className={cx(item, "justify-between")}
            onClick={(e) => {
              e.stopPropagation();
              setSub(!sub);
            }}
          >
            <span className="flex items-center gap-2.5">
              <Icon name="folder" size={14} className="text-ink-subtle" />
              Move to group
            </span>
            <Icon name="chevron-right" size={14} className="text-ink-tertiary" />
          </button>
          {sub && (
            <div
              role="menu"
              className="absolute top-0 left-[calc(100%+4px)] z-61 flex w-[180px] flex-col gap-px rounded-md border border-hairline-strong bg-surface-2 p-1 shadow-edge"
            >
              {groups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  role="menuitem"
                  className={item}
                  onClick={() => act({ move: g.id })}
                >
                  <span
                    aria-hidden="true"
                    className="size-2 flex-none rounded-full"
                    style={{ background: GROUP_COLORS[g.colorIndex % GROUP_COLORS.length] }}
                  />
                  {g.name}
                </button>
              ))}
              {thread.groupId && (
                <button
                  type="button"
                  role="menuitem"
                  className={item}
                  onClick={() => act({ move: null })}
                >
                  <Icon name="x" size={14} className="text-ink-subtle" />
                  Remove from group
                </button>
              )}
              <button
                type="button"
                role="menuitem"
                className={item}
                onClick={() => act("new-group")}
              >
                <Icon name="plus" size={14} className="text-ink-subtle" />
                New group…
              </button>
            </div>
          )}
        </div>
        <div aria-hidden="true" className="mx-1.5 my-[3px] h-px bg-hairline" />
        <button
          type="button"
          role="menuitem"
          className={cx(item, "text-danger-ink")}
          onClick={() => act("delete")}
        >
          <Icon name="trash-2" size={14} />
          Delete
        </button>
      </div>
    </>
  );
}

function ChatRow({
  thread,
  active,
  menuOpen,
  setMenu,
  groups,
  onAction,
}: {
  thread: ChatThreadItem;
  active: boolean;
  menuOpen: boolean;
  setMenu: (open: boolean) => void;
  groups: ChatGroupItem[];
  onAction: (a: "pin" | "rename" | "delete" | "new-group" | { move: string | null }) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", thread.id)}
      className={cx(
        "group/row relative flex h-[30px] cursor-grab items-center gap-1.5 rounded-sm pr-1.5 pl-2.5 transition-colors duration-(--duration-base) ease-standard",
        menuOpen && "z-50",
        active ? "bg-surface-2" : menuOpen ? "bg-surface-1" : "hover:bg-surface-1",
      )}
    >
      <Link
        href={`/assistant?thread=${thread.id}`}
        aria-current={active ? "page" : undefined}
        className={cx(
          "flex min-w-0 flex-1 items-center gap-2 text-small",
          active ? "text-ink" : "text-ink-subtle hover:text-ink",
        )}
      >
        <span
          aria-hidden="true"
          className={cx(
            "box-border size-1.5 flex-none rounded-full border-[1.5px] border-current",
            thread.pinned && "bg-current",
          )}
        />
        <span className="min-w-0 flex-1 truncate">{thread.title}</span>
      </Link>
      <div
        className={cx(
          "relative ml-auto flex-none",
          !menuOpen && "opacity-0 group-hover/row:opacity-100 focus-within:opacity-100",
        )}
      >
        <button
          type="button"
          aria-label={`Options for ${thread.title}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={(e) => {
            e.preventDefault();
            setMenu(!menuOpen);
          }}
          className="inline-flex size-5 cursor-pointer items-center justify-center rounded-xs text-ink-subtle hover:text-ink"
        >
          <Icon name="ellipsis" size={14} />
        </button>
        {menuOpen && (
          <ChatMenu
            thread={thread}
            groups={groups}
            onClose={() => setMenu(false)}
            onAction={onAction}
          />
        )}
      </div>
    </div>
  );
}

function SectionHead({
  open,
  label,
  onToggle,
}: {
  open: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="group/head box-border flex w-full cursor-pointer items-center gap-1.5 px-2.5 pb-1"
    >
      <span className="flex-1 text-left text-caption font-medium tracking-(--text-eyebrow--letter-spacing) text-ink-tertiary uppercase">
        {label}
      </span>
      <Icon
        name={open ? "chevron-down" : "chevron-right"}
        size={11}
        className="invisible text-ink-tertiary group-hover/head:visible"
      />
    </button>
  );
}

/** The sidebar's AI tab: new chat, search, pinned chats, groups (drag chats onto them), recent chats. */
export function AINav({
  threads,
  groups,
  active,
}: {
  threads: ChatThreadItem[];
  groups: ChatGroupItem[];
  active: boolean;
}) {
  const current = useSearchParams().get("thread");
  const [q, setQ] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [sections, setSections] = useStoredJson<Record<string, boolean>>("ge-ai-sections", {});
  const [expanded, setExpanded] = useStoredJson<Record<string, boolean>>("ge-groups-open", {});
  const [dialog, setDialog] = useState<Dialog>(null);
  const [draft, setDraft] = useState("");
  const [pending, start] = useTransition();

  const isOpen = (id: string) => sections[id] !== false;
  const toggle = (id: string) => setSections({ ...sections, [id]: !isOpen(id) });

  const filtered = threads.filter(
    (t) => !q.trim() || t.title.toLowerCase().includes(q.trim().toLowerCase()),
  );
  const pinned = filtered.filter((t) => t.pinned);
  const grouped = groups.map((g) => ({
    group: g,
    items: filtered.filter((t) => t.groupId === g.id && !t.pinned),
  }));
  const recents = filtered.filter((t) => !t.pinned && !t.groupId);

  const onAction =
    (thread: ChatThreadItem) =>
    (a: "pin" | "rename" | "delete" | "new-group" | { move: string | null }) => {
      if (a === "rename") {
        setDraft(thread.title);
        setDialog({ kind: "rename", thread });
      } else if (a === "new-group") {
        setDraft("");
        setDialog({ kind: "group", threadId: thread.id });
      } else
        start(async () => {
          if (a === "pin") await togglePinThread(thread.id);
          else if (a === "delete") await deleteThread(thread.id);
          else await moveThread(thread.id, a.move);
        });
    };
  const row = (t: ChatThreadItem) => (
    <ChatRow
      key={t.id}
      thread={t}
      active={active && current === t.id}
      menuOpen={openMenu === t.id}
      setMenu={(o) => setOpenMenu(o ? t.id : null)}
      groups={groups}
      onAction={onAction(t)}
    />
  );
  const onDrop = (groupId: string) => (e: DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/plain");
    if (id) start(() => moveThread(id, groupId));
  };
  const submitDialog = () => {
    const name = draft.trim();
    if (!name || !dialog) return;
    start(async () => {
      if (dialog.kind === "rename") await renameThread(dialog.thread.id, name);
      else await createGroup(name, dialog.threadId);
      setDialog(null);
    });
  };

  return (
    <div
      className={cx(
        "flex flex-1 flex-col gap-3.5 overflow-x-hidden overflow-y-auto px-3 pb-3",
        pending && "opacity-80",
      )}
    >
      <Link
        href="/assistant?new=1"
        className="box-border flex h-8 flex-none items-center gap-2 rounded-sm border border-hairline bg-surface-1 px-2.5 text-small font-medium text-ink hover:text-ink"
      >
        <Icon name="plus" size={14} />
        New chat
      </Link>
      <label className="box-border flex h-[30px] flex-none items-center gap-2 rounded-sm border border-hairline bg-surface-1 px-2.5">
        <Icon name="search" size={13} className="text-ink-tertiary" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search chats"
          aria-label="Search chats"
          className="min-w-0 flex-1 bg-transparent text-small text-ink outline-none placeholder:text-ink-tertiary"
        />
      </label>
      <div className="flex flex-col gap-2.5">
        {pinned.length > 0 && (
          <div className="flex flex-col gap-px">
            <SectionHead open={isOpen("pinned")} label="Pinned" onToggle={() => toggle("pinned")} />
            {isOpen("pinned") && pinned.map(row)}
          </div>
        )}
        {groups.length > 0 && (
          <div className="flex flex-col gap-0.5">
            <SectionHead open={isOpen("groups")} label="Groups" onToggle={() => toggle("groups")} />
            {isOpen("groups") &&
              grouped.map(({ group, items }) => {
                const open = !!expanded[group.id];
                const color = GROUP_COLORS[group.colorIndex % GROUP_COLORS.length];
                return (
                  <div key={group.id} className="flex flex-col">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setExpanded({ ...expanded, [group.id]: !open })}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnter={() => setDragOver(group.id)}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={onDrop(group.id)}
                      className={cx(
                        "group/folder box-border flex h-[30px] cursor-pointer items-center gap-2 rounded-sm pr-2 pl-2.5 text-small text-ink",
                        dragOver === group.id &&
                          "bg-surface-2 outline-1 -outline-offset-1 outline-dashed",
                      )}
                      style={dragOver === group.id ? { outlineColor: color } : undefined}
                    >
                      <Icon
                        name="folder"
                        size={14}
                        className="text-ink-subtle group-hover/folder:hidden"
                      />
                      <Icon
                        name={open ? "chevron-down" : "chevron-right"}
                        size={14}
                        className="hidden text-ink-tertiary group-hover/folder:block"
                      />
                      <span className="min-w-0 flex-1 truncate text-left">{group.name}</span>
                      <span className="font-mono text-caption text-ink-tertiary">
                        {items.length}
                      </span>
                    </button>
                    {open && (
                      <div className="relative flex flex-col gap-px pt-px pb-0.5 pl-5">
                        <span
                          aria-hidden="true"
                          className="absolute top-0 bottom-1 left-[17px] w-px bg-hairline-strong"
                        />
                        {items.length === 0 ? (
                          <div className="px-2.5 py-1 text-caption text-ink-tertiary">
                            Drag chats here
                          </div>
                        ) : (
                          items.map(row)
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
        <div className="flex flex-col gap-px">
          <SectionHead open={isOpen("chats")} label="Chats" onToggle={() => toggle("chats")} />
          {isOpen("chats") &&
            (recents.length === 0 ? (
              <div className="px-2.5 py-1 text-caption text-ink-tertiary">No chats yet</div>
            ) : (
              recents.map(row)
            ))}
        </div>
      </div>
      <Modal
        open={dialog != null}
        onClose={() => setDialog(null)}
        title={dialog?.kind === "rename" ? "Rename chat" : "New group"}
        width={400}
        footer={
          <>
            <Button variant="tertiary" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button onClick={submitDialog} disabled={!draft.trim() || pending}>
              {dialog?.kind === "rename" ? "Rename" : "Create group"}
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitDialog();
          }}
        >
          <TextInput
            label={dialog?.kind === "rename" ? "Chat name" : "Group name"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
          />
        </form>
      </Modal>
    </div>
  );
}
