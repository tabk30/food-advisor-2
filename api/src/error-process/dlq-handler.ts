// lambda.ts
import { Handler, Context } from 'aws-lambda';

export const handler: Handler = async (event: any, context: Context, callback: any) => {
    // console.log('event 👉', JSON.stringify(event, null, 2));

    const messages = event.Records.map(record => {
        const body = JSON.parse(record.body) as { Subject: string; Message: string };

        return { subject: body.Subject, message: body.Message };
    });

    console.log('messages 👉', JSON.stringify(messages, null, 2));

    return {
        body: JSON.stringify({ messages }),
        statusCode: 2000,
    };
}