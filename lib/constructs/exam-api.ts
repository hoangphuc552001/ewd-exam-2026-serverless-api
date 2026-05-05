import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { generateSeedData } from "../../shared/utils";
import * as apig from "aws-cdk-lib/aws-apigateway";

type AppApiProps = {
  userPoolId: string;
  userPoolClientId: string;
};

export class AppApi extends Construct {
  constructor(scope: Construct, id: string, props: AppApiProps) {
    super(scope, id);

    const table = new dynamodb.Table(this, "CinemasTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Exam",
    });

    table.addLocalSecondaryIndex({
      indexName: "screenIx",
      sortKey: { name: "screenNo", type: dynamodb.AttributeType.STRING },
    });

    new custom.AwsCustomResource(this, "itemsddbInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [table.tableName]: generateSeedData(),
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of("itemsddbInitData"),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [table.tableArn],
      }),
    });

    // Lambdas
    const appCommonFnProps = {
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "handler",
    };

    const lambdaAFn = new lambdanode.NodejsFunction(this, "lambdaA", {
      ...appCommonFnProps,
      entry: `${__dirname}/../../lambdas/lambdaA.ts`,
      environment: {
        TABLE_NAME: table.tableName,
        REGION: "eu-west-1",
      },
    });

    const lambdaBFn = new lambdanode.NodejsFunction(this, "lambdaB", {
      ...appCommonFnProps,
      entry: `${__dirname}/../../lambdas/lambdaB.ts`,
      environment: {
        TABLE_NAME: table.tableName,
        USER_POOL_ID: props.userPoolId,
        REGION: "eu-west-1",
      },
    });

    const authorizerFn = new lambdanode.NodejsFunction(this, "AuthorizerFn", {
      ...appCommonFnProps,
      environment: {
        USER_POOL_ID: props.userPoolId,
        CLIENT_ID: props.userPoolClientId,
        REGION: cdk.Aws.REGION,
      },
      entry: `${__dirname}/../../lambdas/auth/authorizer.ts`,
    });

    // Permissions
    table.grantReadData(lambdaAFn);
    table.grantReadWriteData(lambdaBFn);

    // REST App API
    const api = new apig.RestApi(this, "AppAPI", {
      description: "Exam api",
      deployOptions: {
        stageName: "dev",
      },
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type", "X-Amz-Date"],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowCredentials: true,
        allowOrigins: ["*"],
      },
    });

    const requestAuthorizer = new apig.RequestAuthorizer(
      this,
      "RequestAuthorizer",
      {
        identitySources: [apig.IdentitySource.header("cookie")],
        handler: authorizerFn,
        resultsCacheTtl: cdk.Duration.minutes(0),
      }
    );

    const schedules = api.root.addResource("schedules");
    schedules.addMethod("POST", new apig.LambdaIntegration(lambdaBFn), {
      authorizer: requestAuthorizer,
      authorizationType: apig.AuthorizationType.CUSTOM,
    });
    const scheduleByCinema = schedules.addResource("{cinemaId}");
    scheduleByCinema.addMethod("GET", new apig.LambdaIntegration(lambdaAFn));
  }
}
