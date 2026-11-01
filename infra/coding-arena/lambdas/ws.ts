// WebSocket API routes: $connect stores the connection (the authorizer already checked the
// ticket), $disconnect removes it, $default answers pings so idle sockets stay open.
import { DeleteCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyResult, APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import { ddb, env } from "../shared/aws";
import { TTL, epochSeconds, keys } from "../shared/keys";

type WsEvent = APIGatewayProxyWebsocketEventV2 & {
  requestContext: APIGatewayProxyWebsocketEventV2["requestContext"] & {
    authorizer?: { userId?: string };
  };
};

export async function handler(event: WsEvent): Promise<APIGatewayProxyResult> {
  const { routeKey, connectionId } = event.requestContext;
  const table = env("TABLE_NAME");

  if (routeKey === "$connect") {
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) return { statusCode: 401, body: "" };
    await ddb().send(
      new PutCommand({
        TableName: table,
        Item: {
          ...keys.connection(connectionId),
          ...keys.connectionByUser(userId, connectionId),
          type: "connection",
          connectionId,
          userId,
          connectedAt: new Date().toISOString(),
          ttl: epochSeconds() + TTL.connectionSeconds,
        },
      }),
    );
    return { statusCode: 200, body: "" };
  }

  if (routeKey === "$disconnect") {
    await ddb().send(new DeleteCommand({ TableName: table, Key: keys.connection(connectionId) }));
    return { statusCode: 200, body: "" };
  }

  return { statusCode: 200, body: JSON.stringify({ type: "pong" }) };
}
