import { existsSync, readFileSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

/** Stack outputs written by `pnpm deploy` (cdk deploy --outputs-file outputs.json). */
export interface StackOutputs {
  HttpApiUrl: string;
  WebSocketUrl: string;
  TableName: string;
  TestsBucket: string;
  SandboxFunction: string;
  StateMachineArn: string;
  DlqUrl: string;
}

export function stackOutputs(): StackOutputs {
  const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../outputs.json");
  if (!existsSync(file))
    throw new Error("outputs.json is missing: run `pnpm --filter @ge/coding-arena deploy` first.");
  const all = JSON.parse(readFileSync(file, "utf8")) as Record<string, StackOutputs>;
  const out = all.CodingArena;
  if (!out) throw new Error("outputs.json has no CodingArena stack");
  return out;
}
