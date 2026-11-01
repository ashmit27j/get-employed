// Lambda authorizers for the HTTP API (Authorization: Bearer <arena token>) and the
// WebSocket $connect route (?ticket=<arena token>). Tokens are minted by GetEmployed
// (apps/app/src/app/api/arena/token) and signed with the secret in SSM Parameter Store.
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import { verifyArenaToken } from "@ge/core/arena-token";
import type {
  APIGatewayRequestAuthorizerEvent,
  APIGatewayRequestSimpleAuthorizerHandlerV2WithContext,
  APIGatewayAuthorizerResult,
} from "aws-lambda";
import { env } from "../shared/aws";

const ssm = new SSMClient({});
let cached: { value: string; at: number } | undefined;
const SECRET_CACHE_MS = 5 * 60 * 1000;

async function secret(): Promise<string> {
  if (cached && Date.now() - cached.at < SECRET_CACHE_MS) return cached.value;
  const out = await ssm.send(
    new GetParameterCommand({ Name: env("TOKEN_SECRET_PARAM"), WithDecryption: true }),
  );
  const value = out.Parameter?.Value;
  if (!value) throw new Error("token secret parameter is empty");
  cached = { value, at: Date.now() };
  return value;
}

type Ctx = { userId: string; isAdmin: string };

export const http: APIGatewayRequestSimpleAuthorizerHandlerV2WithContext<Ctx> = async (event) => {
  const header = event.headers?.authorization ?? event.headers?.Authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const claims = token ? await verifyArenaToken(token, await secret()) : null;
  if (!claims) return { isAuthorized: false, context: { userId: "", isAdmin: "false" } };
  return {
    isAuthorized: true,
    context: { userId: claims.userId, isAdmin: String(claims.isAdmin) },
  };
};

export async function ws(
  event: APIGatewayRequestAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> {
  const ticket = event.queryStringParameters?.ticket ?? "";
  const claims = ticket ? await verifyArenaToken(ticket, await secret()) : null;
  return {
    principalId: claims?.userId ?? "anonymous",
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: claims ? "Allow" : "Deny",
          Resource: event.methodArn,
        },
      ],
    },
    context: claims ? { userId: claims.userId, isAdmin: String(claims.isAdmin) } : {},
  };
}
