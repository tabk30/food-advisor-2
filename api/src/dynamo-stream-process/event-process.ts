import { Handler, Context } from 'aws-lambda';

export const handler: Handler = async (event: any, context: Context, callback: any) => {
    throw new Error('throwing an Error 💥');
}