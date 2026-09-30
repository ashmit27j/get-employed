// Dev only: an SMTP server on :2525 that accepts any login and writes each message to stdout.
import { SMTPServer } from "smtp-server";
new SMTPServer({
  authOptional: true,
  disabledCommands: ["STARTTLS"],
  onAuth: (_auth, _session, cb) => cb(null, { user: "dev" }),
  onData(stream, session, cb) {
    let raw = "";
    stream.on("data", (c) => (raw += c));
    stream.on("end", () => {
      console.log(
        `--- message to ${session.envelope.rcptTo.map((r) => r.address).join(", ")} (${raw.length} bytes)\n${raw.slice(0, 1500)}`,
      );
      cb();
    });
  },
}).listen(2525, () => console.log("smtp sink on :2525"));
