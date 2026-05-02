import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { Schedule, DBSchedule } from "../shared/types";
import {
  CookieMap,
  JwtToken,
  parseCookies,
  verifyToken,
} from "./utils";

const client = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (
  event: any,
  context
) => {
  try {
    console.log("Event: ", JSON.stringify(event));

    const dbSchedule: DBSchedule = {
      pk: `s#1001`,
      sk: `s#5`,
      screenNo: 's4',
    };
    await client.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: {
          ...dbSchedule,
        },
      })
    );
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Saved to database",
      }),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
