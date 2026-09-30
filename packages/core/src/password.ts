/** Password policy for new passwords (sign-up, reset, change). Checked in the browser and by the auth server. */
export const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "upper", label: "An uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lower", label: "A lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { id: "number", label: "A number", test: (p: string) => /\d/.test(p) },
  { id: "special", label: "A special character", test: (p: string) => /[^A-Za-z0-9\s]/.test(p) },
] as const;

export const passwordOk = (p: string) => PASSWORD_RULES.every((r) => r.test(p));

export const PASSWORD_HINT =
  "Use at least 8 characters with an uppercase letter, a lowercase letter, a number and a special character.";
