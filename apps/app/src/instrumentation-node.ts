import { existsSync } from "node:fs";
import { join } from "node:path";

const file = join(process.cwd(), "../../.env");
if (existsSync(file)) process.loadEnvFile(file);
