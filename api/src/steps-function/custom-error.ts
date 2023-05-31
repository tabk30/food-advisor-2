// lambda.ts
import { Handler, Context } from 'aws-lambda';

export const handler: Handler = async (event: any, context: Context, callback: any) => {
    console.log('Custom Error step event 👉', JSON.stringify(event, null, 2));
    console.log('Custom Error step context 👉', JSON.stringify(context, null, 2));

    return {
        body: event,
        statusCode: 200,
    };
}