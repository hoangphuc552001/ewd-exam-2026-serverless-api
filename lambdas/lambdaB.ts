import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
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
    const cookies: CookieMap = parseCookies(event);
    if (!cookies?.token) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          message: "authentication required",
        }),
      };
    }
    const verifiedJwt: JwtToken = await verifyToken(
      cookies.token,
      process.env.USER_POOL_ID,
      process.env.REGION!
    );
    const username = verifiedJwt?.["cognito:username"];
    if (!verifiedJwt || username !== "admin") {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: "only admin can add schedules",
        }),
      };
    }
    const schedule = event.body ? (JSON.parse(event.body) as Schedule) : undefined;
    if (!schedule) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "body should required",
        }),
      };
    }

    const existedSchedule = await client.send(
      new QueryCommand({
        TableName: process.env.TABLE_NAME,
        IndexName: "screenIx",
        KeyConditionExpression: "pk = :pk and screenNo = :screenNo",
        ExpressionAttributeValues: {
          ":pk": `s#${schedule.cinemaId}`,
          ":screenNo": schedule.screenNo,
        },
      })
    );
    if ((existedSchedule.Items ?? []).length > 0) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          message: "a schedule already exists",
        }),
      };
    }
    const dbSchedule: DBSchedule = {
      pk: `s#${schedule.cinemaId}`,
      sk: `s#${schedule.movieId}`,
      screenNo: schedule.screenNo,
    };
    await client.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: {
          ...dbSchedule,
        },
        ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)",
      })
    );
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "schedule added",
        schedule,
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
