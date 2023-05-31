// lambda.ts
import { DynamoDBClient, PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { Handler, Context } from 'aws-lambda';
import {v4} from "uuid";

const {WORLD_TABLE_ARN, FOOD_TABLE_NAME, REGION } = process.env;
const db: DynamoDBClient = new DynamoDBClient({ region: REGION });

export const handler: Handler = async (event: any, context: Context, callback: any) => {
    console.log('Food step event 👉', JSON.stringify(event, null, 2));
    console.log('Food step context 👉', JSON.stringify(context, null, 2));
    let payload = event.Payload.body;
    return {
        body: [...payload, {
            step: "FOOD_STEP",
            message: "FOOD"
        }],
        statusCode: 200,
    };
    
    // const data = {
    //     id: v4(),
    //     content: JSON.stringify(event, null, 2)
    // };
    // let param: PutItemCommandInput = {
    //     TableName: FOOD_TABLE_NAME,
    //     Item: marshall(data)
    // }
    // try {
    //     const res = await db.send(new PutItemCommand(param));    
    //     return {
    //         body: [...event, {
    //             step: "FOOD_STEP",
    //             data: data
    //         }],
    //         statusCode: 200,
    //     };
    // } catch (error) {
    //     function CustomError(message) {
    //         this.name = 'FOOD_STEP_ERROR';
    //         this.step = 'FOOD_STEP';
    //         this.message = message;
    //     }
    //     CustomError.prototype = new Error();
    
    //     throw new CustomError(error.message);
    // }
}