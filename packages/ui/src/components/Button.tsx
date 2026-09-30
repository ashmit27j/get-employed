"use client";
import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from "react";
import { cx, transition } from "../lib/cx";
import { UiLink } from "./Link";

export type ButtonVariant = "primary" | "secondary" | "tertiary";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-primary text-on-primary shadow-glow-cta hover:bg-primary-hover hover:shadow-glow-cta-hover active:bg-primary-pressed active:shadow-none focus-visible:shadow-[var(--shadow-glow-cta),var(--shadow-focus)]",
  secondary:
    "bg-surface-1 text-ink border-hairline hover:bg-surface-2 hover:border-hairline-strong active:bg-surface-3 focus-visible:shadow-focus",
  tertiary:
    "border-transparent bg-transparent text-ink hover:bg-surface-1 active:bg-surface-2 focus-visible:shadow-focus",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-7 px-2.5 py-1.5 text-ui",
  md: "min-h-9 px-3.5 py-2 text-small",
  lg: "min-h-11 px-5 py-3 text-body",
};

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  /** Renders a link styled as a button. */
  href?: string;
  target?: string;
  children?: ReactNode;
}

/** Primary is the one CTA per view (blue, glow); secondary for the rest; tertiary inside the app. */
export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  iconLeft,
  iconRight,
  href,
  target,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = cx(
    "box-border inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border font-sans font-medium leading-[1.2] no-underline outline-none transition-[background-color,box-shadow,border-color,color]",
    transition,
    sizes[size],
    disabled
      ? "cursor-not-allowed border-hairline bg-surface-1 text-ink-tertiary shadow-none"
      : variants[variant],
    fullWidth && "w-full",
    // Links pick up the global a:hover colour, so keep the button's own text colour.
    href && !disabled && (variant === "primary" ? "hover:text-on-primary" : "hover:text-ink"),
    className,
  );
  const content = (
    <>
      {iconLeft}
      {children}
      {iconRight}
    </>
  );
  if (href && !disabled) {
    return (
      <UiLink
        href={href}
        target={target}
        rel={target === "_blank" ? "noreferrer" : undefined}
        onClick={rest.onClick as MouseEventHandler<HTMLAnchorElement> | undefined}
        data-ds-focus=""
        className={classes}
      >
        {content}
      </UiLink>
    );
  }
  return (
    <button
      type={type}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      data-ds-focus=""
      className={classes}
      {...rest}
    >
      {content}
    </button>
  );
}
