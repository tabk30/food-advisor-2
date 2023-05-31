// lambda.ts
import { DynamoDBClient, PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { Handler, Context } from 'aws-lambda';
import {v4} from "uuid";

// const {HELLO_TABLE_ARN, HELLO_TABLE_NAME, REGION } = process.env;
// const db: DynamoDBClient = new DynamoDBClient({ region: REGION });;

export const handler: Handler = async (event: any, context: Context, callback: any) => {
    console.log('Hello step event 👉', JSON.stringify(event, null, 2));
    console.log('Hello step context 👉', JSON.stringify(context, null, 2));

    return {
        body: [{
            step: "HELLO_STEP",
            message: "HELLO"
        }],
        statusCode: 200,
    };

    // const data = {
    //     id: v4(),
    //     content: JSON.stringify(event, null, 2)
    // };
    // let param: PutItemCommandInput = {
    //     TableName: HELLO_TABLE_NAME,
    //     Item: marshall(data)
    // }
    // try {
    //     const res = await db.send(new PutItemCommand(param));    
    //     return {
    //         body: [{
    //             step: "HELLO_STEP",
    //             data: data
    //         }],
    //         statusCode: 200,
    //     };
    // } catch (error) {
    //     function CustomError(message) {
    //         this.name = 'HELLO_STEP_ERROR';
    //         this.step = 'HELLO_STEP';
    //         this.message = message;
    //     }
    //     CustomError.prototype = new Error();
    
    //     throw new CustomError(error.message);
    // }
}