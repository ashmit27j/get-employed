# Email and Google

## Constraint

The project uses no Google OAuth **restricted** scopes. Restricted scopes need a paid third-party security assessment when their data is stored on or passed through our servers, and we won't do that.

## Scopes

| Purpose                             | Scope                                    | Google class  | What it needs                                                                                  |
| ----------------------------------- | ---------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------- |
| Sign in / sign up with Google       | `openid`, `email`, `profile`             | Non-sensitive | Brand verification (free)                                                                      |
| Send outreach from the user's Gmail | `gmail.send`                             | **Sensitive** | Google's app verification (free: privacy policy, homepage, demo video). No security assessment |
| Read the inbox (replies, bounces)   | `gmail.readonly` / `metadata` / `modify` | Restricted    | **Not used**                                                                                   |

- `gmail.send` is requested **incrementally**, only when the user connects their mailbox in `/mailbox` (its first-visit connect step), not at sign-in. Signing up with Google does not grant it.
- Until verification is done, the OAuth app runs in **Testing** mode: up to 100 test users added by hand, which covers the planned first cohort. Refresh tokens expire after 7 days in Testing mode, so the UI must handle "reconnect Gmail" cleanly.
- Source: Google's Gmail API scope list, which classes `gmail.send` as sensitive and `readonly`, `compose`, `insert`, `modify`, `metadata` and full mail access as restricted.

## Sending

- **Approval is mandatory.** A draft becomes `approved` only through an explicit user action, which sets `approved_at`. `email.send` checks the status again before sending, and a database check constraint makes it impossible to reach `sent` without `approved_at`. Nothing is ever sent, and no job applied to, without approval.
- **Providers:** Gmail API (`users.messages.send` with `gmail.send`) or SMTP (`mailbox_connections.kind = smtp`, for self-hosters or users with an app password).
- Mailbox settings from the prototype are honoured: sending window, daily limit and follow-up rules.
- Transactional mail (reset codes, verification) goes through `RESEND_API_KEY` or SMTP, separate from outreach.

## Tracking without reading the inbox

| State     | How we know                                                                                                      |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| `sent`    | The provider accepted the message                                                                                |
| `opened`  | A tracking pixel (`/t/o/[token]`) in the HTML body. Approximate: image blocking and proxy pre-fetching affect it |
| `replied` | The user marks it replied (with an optional paste of the reply), **or** an optional IMAP connection (roadmap)    |
| `bounced` | A synchronous SMTP rejection, **or** the user marks it, **or** IMAP (roadmap)                                    |

Roadmap: an optional IMAP connection using an app password. It needs no Google verification because the user supplies their own credentials, and it detects replies and bounces automatically. Self-hosters with their own OAuth client in Testing mode may also turn on `gmail.readonly` for their own account, because that's their own data on their own machine.

## Contact finding

Contacts are found by domain pattern match (`first@`, `first.l@`…), then an MX lookup. Where the host allows outbound port 25, an SMTP handshake (RCPT TO without sending) raises the confidence. Each result records its method and confidence as shown in the prototype (for example "Verified by SMTP handshake"). Many cloud hosts and home ISPs block port 25, so the method falls back to MX only.
