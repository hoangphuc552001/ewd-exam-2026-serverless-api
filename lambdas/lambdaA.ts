import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { Schedule, DBSchedule } from "../shared/types";

const client = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", JSON.stringify(event));

    const cinemaId = event?.pathParameters?.cinemaId;
    const movieId = event?.queryStringParameters?.movieId;
    if (!cinemaId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "missing cinema id" }),
      };
    }
    const queryInput: QueryCommandInput = {
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: {
        ":pk": `s#${cinemaId}`,
      },
    };
    const result = await client.send(new QueryCommand(queryInput));
    const items = (result.Items ?? []) as DBSchedule[];
    if (movieId) {
      let schedule;
      for (let item of items) {
        if (item.sk === `s#${movieId}`) {
          schedule = item;
          break;
        }
      }
      if (!schedule) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            message: "cannot find schedule for cinema",
          }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ screenNo: schedule.screenNo }),
      };
    }
    const schedules: Schedule[] = items.map((item) => ({
      cinemaId: item.pk.replace("s#", ""),
      movieId: item.sk.replace("s#", ""),
      screenNo: item.screenNo,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(schedules),
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
