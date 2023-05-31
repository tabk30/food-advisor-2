// lambda.ts
import { DynamoDBClient, PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { Handler, Context } from 'aws-lambda';
import {v4} from "uuid";

const {WORLD_TABLE_ARN, WORLD_TABLE_NAME, REGION } = process.env;
// const db: DynamoDBClient = new DynamoDBClient({ region: REGION });

export const handler: Handler = async (event: any, context: Context, callback: any) => {
    console.log('World step event 👉', JSON.stringify(event, null, 2));
    console.log('World step context 👉', JSON.stringify(context, null, 2));
    if(Math.floor(Math.random() * 11) <= 5) {
        function RandomError(message) {
            this.name = 'RandomError';
            this.message = message;
        }
        RandomError.prototype = new Error();
    
        throw new RandomError('This is a custom error!');
    }
    let payload = event.Payload.body;
    return {
        body: [...payload, {
            step: "WORLD_STEP",
            message: "WORLD"
        }],
        statusCode: 200,
    };
    
    // const data = {
    //     id: v4(),
    //     content: JSON.stringify(event, null, 2)
    // };
    // let param: PutItemCommandInput = {
    //     TableName: WORLD_TABLE_NAME,
    //     Item: marshall(data)
    // }
    // try {
    //     const res = await db.send(new PutItemCommand(param));    
    //     return {
    //         body: [...event, {
    //             step: "WORLD_STEP",
    //             data: data
    //         }],
    //         statusCode: 200,
    //     };
    // } catch (error) {
    //     function CustomError(message) {
    //         this.name = 'WORLD_STEP_ERROR';
    //         this.step = 'WORLD_STEP';
    //         this.message = message;
    //     }
    //     CustomError.prototype = new Error();
    
    //     throw new CustomError(error.message);
    // }
    return event
}