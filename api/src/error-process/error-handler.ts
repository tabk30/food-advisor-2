// lambda.ts
import { Handler, Context } from 'aws-lambda';
import * as zlib from 'zlib';

function decodeData (data: string) {
    const compressedPayload = Buffer.from(data, 'base64');
    const jsonPayload = zlib.gunzipSync(compressedPayload).toString('utf8');
    return JSON.parse(jsonPayload);
}

export const handler:Handler = async (event: any, context: Context, callback: any) => {
    console.log('Event: ' + JSON.stringify(event, null, 2));
    
    console.log("Payload", decodeData(event.awslogs.data));
};