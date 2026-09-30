import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/server/auth";

export const dynamic = "force-dynamic";

export const { GET, POST } = toNextJsHandler((request: Request) => auth().handler(request));
