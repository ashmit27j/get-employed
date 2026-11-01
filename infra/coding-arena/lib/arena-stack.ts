import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  Tags,
  type StackProps,
  aws_apigatewayv2 as apigw,
  aws_apigatewayv2_authorizers as authorizers,
  aws_apigatewayv2_integrations as integrations,
  aws_budgets as budgets,
  aws_cloudwatch as cw,
  aws_cloudwatch_actions as cwActions,
  aws_dynamodb as dynamodb,
  aws_ec2 as ec2,
  aws_ecr_assets as ecrAssets,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_lambda_event_sources as sources,
  aws_lambda_nodejs as nodejs,
  aws_logs as logs,
  aws_s3 as s3,
  aws_sns as sns,
  aws_sns_subscriptions as subs,
  aws_sqs as sqs,
  aws_ssm as ssm,
  aws_stepfunctions as sfn,
  aws_stepfunctions_tasks as tasks,
} from "aws-cdk-lib";
import type { Construct } from "constructs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const REPO = path.resolve(ROOT, "../..");

export interface CodingArenaProps extends StackProps {
  /** Browser origins allowed by CORS (GetEmployed production + local dev). */
  allowedOrigins: string[];
  /** Budget and alarm notifications go here. Empty = no email subscriptions. */
  alertEmail?: string;
  /** Reserved concurrency for the sandbox; 0 skips it (accounts whose quota is 10). */
  sandboxReservedConcurrency: number;
  /** SSM SecureString holding ARENA_TOKEN_SECRET (created outside CloudFormation). */
  tokenSecretParam: string;
}

export class CodingArenaStack extends Stack {
  constructor(scope: Construct, id: string, props: CodingArenaProps) {
    super(scope, id, props);
    Tags.of(this).add("project", "coding-arena");

    // ── storage ─────────────────────────────────────────────────────────────────────
    // Provisioned 5/5 on the table and each GSI: 15 of the 25 always-free RCU/WCU.
    const table = new dynamodb.Table(this, "Table", {
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
      timeToLiveAttribute: "ttl",
      removalPolicy: RemovalPolicy.RETAIN,
    });
    for (const name of ["GSI1", "GSI2"]) {
      table.addGlobalSecondaryIndex({
        indexName: name,
        partitionKey: { name: `${name}PK`, type: dynamodb.AttributeType.STRING },
        sortKey: { name: `${name}SK`, type: dynamodb.AttributeType.STRING },
        readCapacity: 5,
        writeCapacity: 5,
      });
    }

    const bucket = new s3.Bucket(this, "Tests", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      removalPolicy: RemovalPolicy.RETAIN,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT],
          allowedOrigins: props.allowedOrigins,
          allowedHeaders: ["content-type"],
          maxAge: 3600,
        },
      ],
    });

    // ── sandbox: isolated subnets, no NAT, no endpoints, no egress ──────────────────
    const vpc = new ec2.Vpc(this, "SandboxVpc", {
      ipAddresses: ec2.IpAddresses.cidr("10.42.0.0/16"),
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        { name: "sandbox", subnetType: ec2.SubnetType.PRIVATE_ISOLATED, cidrMask: 24 },
      ],
      restrictDefaultSecurityGroup: false,
    });
    const sandboxSg = new ec2.SecurityGroup(this, "SandboxSg", {
      vpc,
      description: "Coding Arena sandbox: no inbound, no outbound",
      allowAllOutbound: false,
    });

    // Only log writing and the ENI permissions Lambda needs to attach to the VPC.
    const sandboxRole = new iam.Role(this, "SandboxRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      description: "Coding Arena sandbox: no AWS access beyond logs and VPC attachment",
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole"),
      ],
    });

    const sandbox = new lambda.DockerImageFunction(this, "Sandbox", {
      description: "Coding Arena: compiles and runs untrusted code (no network, no AWS access)",
      code: lambda.DockerImageCode.fromImageAsset(path.join(ROOT, "sandbox"), {
        platform: ecrAssets.Platform.LINUX_AMD64,
      }),
      architecture: lambda.Architecture.X86_64,
      memorySize: 1024,
      timeout: Duration.seconds(120),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [sandboxSg],
      role: sandboxRole,
      ...(props.sandboxReservedConcurrency > 0
        ? { reservedConcurrentExecutions: props.sandboxReservedConcurrency }
        : {}),
      logGroup: this.logGroup("Sandbox"),
    });

    // ── Node functions ──────────────────────────────────────────────────────────────
    const fn = (
      name: string,
      file: string,
      handler: string,
      opts: Partial<nodejs.NodejsFunctionProps> = {},
    ) =>
      new nodejs.NodejsFunction(this, name, {
        entry: path.join(ROOT, "lambdas", file),
        handler,
        runtime: lambda.Runtime.NODEJS_22_X,
        architecture: lambda.Architecture.ARM_64,
        memorySize: 256,
        timeout: Duration.seconds(15),
        projectRoot: REPO,
        depsLockFilePath: path.join(REPO, "pnpm-lock.yaml"),
        // Bundle the SDK too, so behaviour never depends on the runtime's preinstalled version.
        bundling: { minify: true, target: "node22", sourceMap: false, externalModules: [] },
        logGroup: this.logGroup(name),
        ...opts,
        environment: { TABLE_NAME: table.tableName, ...opts.environment },
      });

    const tokenParam = ssm.StringParameter.fromSecureStringParameterAttributes(
      this,
      "TokenSecret",
      {
        parameterName: props.tokenSecretParam,
      },
    );
    const authEnv = { TOKEN_SECRET_PARAM: props.tokenSecretParam };
    const httpAuthFn = fn("HttpAuthorizer", "authorizer.ts", "http", {
      memorySize: 128,
      environment: authEnv,
    });
    const wsAuthFn = fn("WsAuthorizer", "authorizer.ts", "ws", {
      memorySize: 128,
      environment: authEnv,
    });
    tokenParam.grantRead(httpAuthFn);
    tokenParam.grantRead(wsAuthFn);

    // ── WebSocket API (live verdicts) ───────────────────────────────────────────────
    const wsFn = fn("WsRoutes", "ws.ts", "handler", { memorySize: 128 });
    table.grantReadWriteData(wsFn);
    const wsApi = new apigw.WebSocketApi(this, "Live", {
      apiName: "coding-arena-live",
      connectRouteOptions: {
        integration: new integrations.WebSocketLambdaIntegration("Connect", wsFn),
        authorizer: new authorizers.WebSocketLambdaAuthorizer("WsAuth", wsAuthFn, {
          identitySource: ["route.request.querystring.ticket"],
        }),
      },
      disconnectRouteOptions: {
        integration: new integrations.WebSocketLambdaIntegration("Disconnect", wsFn),
      },
      defaultRouteOptions: {
        integration: new integrations.WebSocketLambdaIntegration("Message", wsFn), // "Default" is dropped from logical ids and collides with the route
      },
    });
    const wsStage = new apigw.WebSocketStage(this, "LiveStage", {
      webSocketApi: wsApi,
      stageName: "live",
      autoDeploy: true,
      throttle: { rateLimit: 20, burstLimit: 40 },
    });

    // ── judge pipeline ──────────────────────────────────────────────────────────────
    const executor = fn("Executor", "executor.ts", "handler", {
      timeout: Duration.seconds(150),
      environment: {
        TESTS_BUCKET: bucket.bucketName,
        SANDBOX_FUNCTION: sandbox.functionName,
        WS_CALLBACK_URL: wsStage.callbackUrl,
      },
    });
    table.grantReadWriteData(executor);
    bucket.grantRead(executor, "problems/*");
    sandbox.grantInvoke(executor);
    wsStage.grantManagementApiAccess(executor);

    const finalize = fn("Finalize", "finalize.ts", "handler", {
      timeout: Duration.seconds(30),
      environment: { WS_CALLBACK_URL: wsStage.callbackUrl },
    });
    table.grantReadWriteData(finalize);
    wsStage.grantManagementApiAccess(finalize);

    const compileStep = new tasks.LambdaInvoke(this, "CompileCheck", {
      lambdaFunction: executor,
      payload: sfn.TaskInput.fromObject({
        mode: "compile",
        submissionId: sfn.JsonPath.stringAt("$.submissionId"),
      }),
      payloadResponseOnly: true,
      resultPath: "$.compile",
      taskTimeout: sfn.Timeout.duration(Duration.seconds(160)),
    });
    const batchStep = new tasks.LambdaInvoke(this, "RunBatch", {
      lambdaFunction: executor,
      payload: sfn.TaskInput.fromObject({
        mode: "batch",
        submissionId: sfn.JsonPath.stringAt("$.submissionId"),
        batchId: sfn.JsonPath.numberAt("$.batchId"),
      }),
      payloadResponseOnly: true,
      taskTimeout: sfn.Timeout.duration(Duration.seconds(160)),
    });
    // The sandbox's reserved concurrency throttles bursts; wait and retry instead of failing.
    batchStep.addRetry({
      errors: ["TooManyRequestsException", "Lambda.TooManyRequestsException"],
      interval: Duration.seconds(2),
      maxAttempts: 5,
      backoffRate: 2,
    });
    compileStep.addRetry({
      errors: ["TooManyRequestsException", "Lambda.TooManyRequestsException"],
      interval: Duration.seconds(2),
      maxAttempts: 5,
      backoffRate: 2,
    });
    // "Finalize" is already the Lambda's construct id; keep it as the state's name only.
    const finalizeStep = new tasks.LambdaInvoke(this, "FinalizeStep", {
      stateName: "Finalize",
      lambdaFunction: finalize,
      payload: sfn.TaskInput.fromJsonPathAt("$"),
      payloadResponseOnly: true,
    });
    const runBatches = new sfn.Map(this, "RunBatches", {
      itemsPath: "$.compile.batchIds",
      maxConcurrency: 3,
      itemSelector: {
        submissionId: sfn.JsonPath.stringAt("$.submissionId"),
        batchId: sfn.JsonPath.numberAt("$$.Map.Item.Value"),
      },
      resultPath: "$.batches",
    }).itemProcessor(batchStep);
    compileStep.addCatch(finalizeStep, { resultPath: "$.error" });
    runBatches.addCatch(finalizeStep, { resultPath: "$.error" });

    const definition = compileStep.next(
      new sfn.Choice(this, "Compiled?")
        .when(sfn.Condition.booleanEquals("$.compile.ok", false), finalizeStep)
        .otherwise(runBatches.next(finalizeStep)),
    );
    const stateMachine = new sfn.StateMachine(this, "Judge", {
      stateMachineType: sfn.StateMachineType.STANDARD,
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
      timeout: Duration.minutes(15),
    });

    const dlq = new sqs.Queue(this, "SubmissionsDlq", {
      retentionPeriod: Duration.days(14),
      enforceSSL: true,
    });
    const queue = new sqs.Queue(this, "Submissions", {
      visibilityTimeout: Duration.seconds(180),
      enforceSSL: true,
      deadLetterQueue: { queue: dlq, maxReceiveCount: 3 },
    });
    const starter = fn("Starter", "starter.ts", "handler", {
      memorySize: 128,
      timeout: Duration.seconds(30),
      environment: { STATE_MACHINE_ARN: stateMachine.stateMachineArn },
    });
    stateMachine.grantStartExecution(starter);
    starter.addEventSource(
      new sources.SqsEventSource(queue, {
        batchSize: 5,
        maxConcurrency: 2,
        reportBatchItemFailures: true,
      }),
    );

    // ── HTTP API ────────────────────────────────────────────────────────────────────
    const api = fn("Api", "api.ts", "handler", {
      timeout: Duration.seconds(20),
      environment: { QUEUE_URL: queue.queueUrl, TESTS_BUCKET: bucket.bucketName },
    });
    table.grantReadWriteData(api);
    queue.grantSendMessages(api);
    bucket.grantReadWrite(api, "problems/*");
    bucket.grantDelete(api, "problems/*");

    const httpApi = new apigw.HttpApi(this, "Http", {
      apiName: "coding-arena",
      createDefaultStage: false,
      corsPreflight: {
        allowOrigins: props.allowedOrigins,
        allowMethods: [
          apigw.CorsHttpMethod.GET,
          apigw.CorsHttpMethod.POST,
          apigw.CorsHttpMethod.PUT,
        ],
        allowHeaders: ["authorization", "content-type"],
        exposeHeaders: ["retry-after"],
        maxAge: Duration.hours(1),
      },
    });
    new apigw.HttpStage(this, "HttpStage", {
      httpApi,
      stageName: "$default",
      autoDeploy: true,
      throttle: { rateLimit: 20, burstLimit: 40 },
    });
    httpApi.addRoutes({
      path: "/{proxy+}",
      methods: [apigw.HttpMethod.GET, apigw.HttpMethod.POST, apigw.HttpMethod.PUT],
      integration: new integrations.HttpLambdaIntegration("ApiIntegration", api),
      authorizer: new authorizers.HttpLambdaAuthorizer("TokenAuthorizer", httpAuthFn, {
        responseTypes: [authorizers.HttpLambdaResponseType.SIMPLE],
        identitySource: ["$request.header.Authorization"],
        resultsCacheTtl: Duration.seconds(60),
      }),
    });

    // ── alarms and budget ───────────────────────────────────────────────────────────
    const topic = new sns.Topic(this, "Alerts", { displayName: "Coding Arena alerts" });
    if (props.alertEmail) topic.addSubscription(new subs.EmailSubscription(props.alertEmail));
    const alarm = (name: string, metric: cw.IMetric, description: string) => {
      const a = new cw.Alarm(this, name, {
        metric,
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator: cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cw.TreatMissingData.NOT_BREACHING,
        alarmDescription: description,
      });
      a.addAlarmAction(new cwActions.SnsAction(topic));
    };
    const fiveMin = { period: Duration.minutes(5), statistic: cw.Stats.SUM };
    alarm("SandboxErrors", sandbox.metricErrors(fiveMin), "The sandbox function returned errors.");
    alarm("SandboxThrottles", sandbox.metricThrottles(fiveMin), "The sandbox was throttled.");
    alarm(
      "ExecutorErrors",
      executor.metricErrors(fiveMin),
      "The executor function returned errors.",
    );
    alarm(
      "DlqNotEmpty",
      dlq.metricApproximateNumberOfMessagesVisible({
        period: Duration.minutes(5),
        statistic: cw.Stats.MAXIMUM,
      }),
      "Submissions landed in the dead-letter queue.",
    );
    alarm("JudgeFailed", stateMachine.metricFailed(fiveMin), "A judge execution failed.");

    if (props.alertEmail) {
      new budgets.CfnBudget(this, "Budget", {
        budget: {
          budgetName: "coding-arena-account-1usd",
          budgetType: "COST",
          timeUnit: "MONTHLY",
          budgetLimit: { amount: 1, unit: "USD" },
        },
        // Any spend at all (1% = $0.01), then the $1 line itself, then a forecast past $1.
        notificationsWithSubscribers: (
          [
            ["ACTUAL", 1],
            ["ACTUAL", 100],
            ["FORECASTED", 100],
          ] as const
        ).map(([notificationType, threshold]) => ({
          notification: {
            notificationType,
            comparisonOperator: "GREATER_THAN",
            threshold,
            thresholdType: "PERCENTAGE",
          },
          subscribers: [{ subscriptionType: "EMAIL", address: props.alertEmail! }],
        })),
      });
    }

    // ── outputs ─────────────────────────────────────────────────────────────────────
    new CfnOutput(this, "HttpApiUrl", { value: httpApi.apiEndpoint, description: "ARENA_API_URL" });
    new CfnOutput(this, "WebSocketUrl", { value: wsStage.url, description: "ARENA_WS_URL" });
    new CfnOutput(this, "TableName", { value: table.tableName });
    new CfnOutput(this, "TestsBucket", { value: bucket.bucketName });
    new CfnOutput(this, "SandboxFunction", { value: sandbox.functionName });
    new CfnOutput(this, "StateMachineArn", { value: stateMachine.stateMachineArn });
    new CfnOutput(this, "DlqUrl", { value: dlq.queueUrl });
  }

  private logGroup(name: string): logs.LogGroup {
    return new logs.LogGroup(this, `${name}Logs`, {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
