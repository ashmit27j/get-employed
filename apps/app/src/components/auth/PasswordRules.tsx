import { Icon, cx } from "@ge/ui";
import { PASSWORD_RULES } from "@ge/core";

/** Live checklist under a new-password field. */
export function PasswordRules({ value }: { value: string }) {
  return (
    <ul
      className="m-0 grid list-none grid-cols-2 gap-x-4 gap-y-1 p-0 max-sm:grid-cols-1"
      aria-label="Password requirements"
    >
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(value);
        return (
          <li
            key={r.id}
            className={cx(
              "flex items-center gap-1.5 text-caption",
              ok ? "text-success-ink" : "text-ink-subtle",
            )}
          >
            <Icon name={ok ? "circle-check" : "circle"} size={12} />
            {r.label}
            <span className="sr-only">{ok ? "(done)" : "(missing)"}</span>
          </li>
        );
      })}
    </ul>
  );
}
