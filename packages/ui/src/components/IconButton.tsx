"use client";
import type { MouseEventHandler } from "react";
import type { IconName } from "../icons";
import { cx, transition } from "../lib/cx";
import { Icon } from "./Icon";
import { UiLink } from "./Link";

export interface IconButtonProps {
  icon: IconName;
  /** Accessible name and tooltip. */
  title: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  href?: string;
  /** Toggled-on state (e.g. "read aloud" playing); shown in the accent colour. */
  active?: boolean;
  size?: number;
  disabled?: boolean;
  className?: string;
}

export function IconButton({
  icon,
  title,
  onClick,
  href,
  active,
  size = 32,
  disabled,
  className,
}: IconButtonProps) {
  const classes = cx(
    "box-border inline-flex flex-none cursor-pointer items-center justify-center rounded-sm transition-[background-color,color] hover:bg-surface-2 hover:text-ink disabled:cursor-default disabled:text-ink-tertiary disabled:hover:bg-transparent",
    transition,
    active ? "text-primary" : "text-ink-subtle",
    className,
  );
  const glyph = <Icon name={icon} size={size < 28 ? 14 : 16} />;
  if (href) {
    return (
      <UiLink
        href={href}
        title={title}
        aria-label={title}
        className={classes}
        style={{ width: size, height: size }}
      >
        {glyph}
      </UiLink>
    );
  }
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      style={{ width: size, height: size }}
    >
      {glyph}
    </button>
  );
}
