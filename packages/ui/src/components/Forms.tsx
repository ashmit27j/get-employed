"use client";
import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cx, transition } from "../lib/cx";
import { Icon } from "./Icon";

/** Shared look of a text field: surface-1, hairline, focus ring on focus. */
export const fieldClass = cx(
  "box-border w-full rounded-md border border-hairline bg-surface-1 px-3 py-2 font-sans text-small leading-[1.5] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-tertiary hover:border-hairline-strong focus:border-hairline-strong focus:shadow-focus disabled:opacity-50",
  transition,
);

/** Label, control and hint stacked with the 6px gap. */
export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex min-w-0 flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-small font-medium text-ink-muted">
          {label}
        </label>
      )}
      {children}
      {hint && <span className="text-caption text-ink-subtle">{hint}</span>}
    </div>
  );
}

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  iconLeft?: ReactNode;
  inputClassName?: string;
}

/** Design-system text input (marketing hero search, sign-up). Body-size text, 38px tall. */
export function TextInput({
  label,
  hint,
  iconLeft,
  className,
  inputClassName,
  disabled,
  id,
  type = "text",
  ...rest
}: TextInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Field label={label} hint={hint} htmlFor={inputId} className={className}>
      <span
        className={cx(
          "box-border flex min-h-[38px] items-center gap-2 rounded-md border border-hairline bg-surface-1 px-3 py-2 transition-[border-color,box-shadow] hover:border-hairline-strong has-[input:focus]:border-hairline-strong has-[input:focus]:shadow-focus",
          transition,
          disabled && "opacity-50",
        )}
      >
        {iconLeft && <span className="flex text-ink-subtle">{iconLeft}</span>}
        <input
          id={inputId}
          type={type}
          disabled={disabled}
          data-ds-focus=""
          className={cx(
            "min-w-0 flex-1 border-none bg-transparent p-0 font-sans text-body leading-[1.3] text-ink outline-none placeholder:text-ink-tertiary",
            inputClassName,
          )}
          {...rest}
        />
      </span>
    </Field>
  );
}

export function TextArea({
  label,
  hint,
  mono,
  className,
  id,
  rows = 4,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: ReactNode;
  hint?: ReactNode;
  mono?: boolean;
}) {
  const autoId = useId();
  const areaId = id ?? autoId;
  return (
    <Field label={label} hint={hint} htmlFor={areaId} className={className}>
      <textarea
        id={areaId}
        rows={rows}
        data-ds-focus=""
        className={cx(fieldClass, "resize-y", mono && "font-mono!")}
        {...rest}
      />
    </Field>
  );
}

/** Native select styled as a field. */
export function Select({
  label,
  hint,
  options,
  placeholder,
  className,
  id,
  value,
  ...rest
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  label?: ReactNode;
  hint?: ReactNode;
  options: readonly string[];
  /** Option shown dimmed as "nothing chosen". */
  placeholder?: string;
}) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <Field label={label} hint={hint} htmlFor={selectId} className={className}>
      <span className="relative flex">
        <select
          id={selectId}
          value={value}
          data-ds-focus=""
          className={cx(
            fieldClass,
            "min-h-[38px] cursor-pointer appearance-none pr-8",
            placeholder != null && value === placeholder && "text-ink-tertiary!",
          )}
          {...rest}
        >
          {options.map((o) => (
            <option key={o} value={o} className="bg-surface-2 text-ink">
              {o}
            </option>
          ))}
        </select>
        <Icon
          name="chevron-down"
          size={12}
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-subtle"
        />
      </span>
    </Field>
  );
}

/** Compact "Sort <value>" select used above lists. */
export function SortSelect({
  label = "Sort",
  value,
  options,
  onChange,
}: {
  label?: string;
  value: string;
  options: readonly string[];
  onChange?: (value: string) => void;
}) {
  const id = useId();
  return (
    <span
      className={cx(
        "box-border inline-flex h-8 items-center gap-2 rounded-md border border-hairline bg-surface-1 pr-2.5 pl-3 text-small transition-[border-color,box-shadow] has-[select:focus-visible]:border-hairline-strong has-[select:focus-visible]:shadow-focus",
        transition,
      )}
    >
      <label htmlFor={id} className="text-ink-subtle">
        {label}
      </label>
      <span className="relative inline-flex items-center">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          data-ds-focus=""
          className="cursor-pointer appearance-none border-none bg-transparent pr-5 font-sans text-small font-medium text-ink outline-none"
        >
          {options.map((o) => (
            <option key={o} value={o} className="bg-surface-2">
              {o}
            </option>
          ))}
        </select>
        <Icon
          name="chevron-down"
          size={14}
          className="pointer-events-none absolute right-0 text-ink-subtle"
        />
      </span>
    </span>
  );
}

/** On/off switch. Controlled with `on`, or uncontrolled with `defaultOn`. */
export function Toggle({
  on,
  defaultOn = false,
  onChange,
  label,
  disabled,
}: {
  on?: boolean;
  defaultOn?: boolean;
  onChange?: (on: boolean) => void;
  /** Accessible name. */
  label: string;
  disabled?: boolean;
}) {
  const [inner, setInner] = useState(defaultOn);
  const value = on ?? inner;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        setInner(!value);
        onChange?.(!value);
      }}
      className={cx(
        "relative h-[18px] w-8 flex-none cursor-pointer rounded-full transition-colors disabled:cursor-default disabled:opacity-50",
        transition,
        value ? "bg-primary" : "bg-surface-4",
      )}
    >
      <span
        className={cx(
          "absolute top-0.5 size-3.5 rounded-full transition-[left,background-color]",
          transition,
          value ? "left-4 bg-on-primary" : "left-0.5 bg-ink-muted",
        )}
      />
    </button>
  );
}
