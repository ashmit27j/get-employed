// Push messages to a user's open WebSocket connections through the @connections API.
import {
  ApiGatewayManagementApiClient,
  GoneException,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import { DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, env } from "./aws";
import { keys } from "./keys";

let client: ApiGatewayManagementApiClient | undefined;

export type PushMessage =
  | { type: "progress"; submissionId: string; done: number; total: number; label: string }
  | { type: "verdict"; submissionId: string; submission: Record<string, unknown> };

export async function pushToUser(userId: string, message: PushMessage): Promise<number> {
  const endpoint = process.env.WS_CALLBACK_URL;
  if (!endpoint) return 0;
  client ??= new ApiGatewayManagementApiClient({ endpoint });
  const table = env("TABLE_NAME");
  const { Items = [] } = await ddb().send(
    new QueryCommand({
      TableName: table,
      IndexName: "GSI2",
      KeyConditionExpression: "GSI2PK = :u",
      ExpressionAttributeValues: { ":u": keys.user(userId) },
      ProjectionExpression: "connectionId",
    }),
  );
  const data = Buffer.from(JSON.stringify(message));
  let sent = 0;
  await Promise.all(
    Items.map(async (item) => {
      const connectionId = item.connectionId as string;
      try {
        await client!.send(new PostToConnectionCommand({ ConnectionId: connectionId, Data: data }));
        sent++;
      } catch (err) {
        if (err instanceof GoneException || (err as Error).name === "GoneException") {
          await ddb().send(
            new DeleteCommand({ TableName: table, Key: keys.connection(connectionId) }),
          );
        } else {
          console.warn("push failed", connectionId, (err as Error).name);
        }
      }
    }),
  );
  return sent;
}
