import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import type { SandboxRequest, SandboxResponse } from "../../shared/types";

/**
 * SANDBOX_URL=http://localhost:9000 → the image under the Lambda Runtime Interface Emulator
 *   (pnpm sandbox:build && pnpm sandbox:run).
 * SANDBOX_FUNCTION=<name> → the deployed function (needs AWS credentials).
 */
export const target = process.env.SANDBOX_URL
  ? `local image at ${process.env.SANDBOX_URL}`
  : process.env.SANDBOX_FUNCTION
    ? `deployed function ${process.env.SANDBOX_FUNCTION}`
    : null;

const lambda = new LambdaClient({});

export async function invoke(
  req: Partial<SandboxRequest> & Pick<SandboxRequest, "language" | "code">,
) {
  const payload: SandboxRequest = { inputs: [""], timeLimitMs: 2000, memoryLimitMb: 256, ...req };
  let text: string;
  if (process.env.SANDBOX_URL) {
    const res = await fetch(
      `${process.env.SANDBOX_URL}/2015-03-31/functions/function/invocations`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
    text = await res.text();
  } else {
    const out = await lambda.send(
      new InvokeCommand({
        FunctionName: process.env.SANDBOX_FUNCTION,
        Payload: Buffer.from(JSON.stringify(payload)),
      }),
    );
    text = Buffer.from(out.Payload ?? new Uint8Array()).toString("utf8");
    if (out.FunctionError) throw new Error(`sandbox function error: ${text}`);
  }
  const parsed = JSON.parse(text) as SandboxResponse & { errorMessage?: string };
  if (parsed.errorMessage) throw new Error(`sandbox crashed: ${parsed.errorMessage}`);
  return parsed;
}

export const first = (r: SandboxResponse) => {
  const x = r.results?.[0];
  if (!x) throw new Error(`no result: ${JSON.stringify(r).slice(0, 500)}`);
  return x;
};
