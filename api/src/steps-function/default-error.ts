// lambda.ts
import { Handler, Context } from 'aws-lambda';

export const handler: Handler = async (event: any, context: Context, callback: any) => {
    console.log('Default Error step event 👉', JSON.stringify(event, null, 2));
    console.log('Default Error step context 👉', JSON.stringify(context, null, 2));
    console.log('Dedault Error env', process.env);

    return {
        body: event,
        statusCode: 200,
    };
}