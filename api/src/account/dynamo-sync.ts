// lambda.ts
import { Handler, Context } from 'aws-lambda';

export const handler:Handler = async (event: any, context: Context, callback: any) => {
    console.log("Dynamo handler event", event);
};