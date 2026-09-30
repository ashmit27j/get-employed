import { createElement, type CSSProperties } from "react";
import { icons, type IconName } from "../icons";
import { cx } from "../lib/cx";

export interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** Lucide stroke width; DESIGN.md allows 1.5–2. */
  strokeWidth?: number;
}

/** Lucide icon by kebab-case name. Decorative (aria-hidden); label the control that holds it. */
export function Icon({ name, size = 16, className, style, strokeWidth = 2 }: IconProps) {
  return createElement(icons[name], {
    "aria-hidden": true,
    width: size,
    height: size,
    strokeWidth,
    className: cx("flex-none", className),
    style,
  });
}

export function isIconName(value: string): value is IconName {
  return value in icons;
}
