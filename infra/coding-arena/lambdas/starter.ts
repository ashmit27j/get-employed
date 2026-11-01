// SQS → Step Functions. The queue absorbs bursts (contest-style spikes) so the judge runs at
// a steady rate the account's Lambda concurrency can handle. The execution is named after
// the submission, so a redelivered message can't start a second run.
import { ExecutionAlreadyExists, SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import type { SQSBatchResponse, SQSEvent } from "aws-lambda";
import { env } from "../shared/aws";

const sfn = new SFNClient({});

export async function handler(event: SQSEvent): Promise<SQSBatchResponse> {
  const failures: SQSBatchResponse["batchItemFailures"] = [];
  for (const record of event.Records) {
    try {
      const { submissionId } = JSON.parse(record.body) as { submissionId?: string };
      if (!submissionId || !/^[a-zA-Z0-9-]{8,64}$/.test(submissionId)) {
        console.error("dropping malformed message", record.messageId);
        continue;
      }
      await sfn.send(
        new StartExecutionCommand({
          stateMachineArn: env("STATE_MACHINE_ARN"),
          name: submissionId,
          input: JSON.stringify({ submissionId }),
        }),
      );
    } catch (err) {
      if (err instanceof ExecutionAlreadyExists || (err as Error).name === "ExecutionAlreadyExists")
        continue;
      console.error("start failed", record.messageId, err);
      failures.push({ itemIdentifier: record.messageId });
    }
  }
  return { batchItemFailures: failures };
}
