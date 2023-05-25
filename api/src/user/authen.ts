import { APIGatewayAuthorizerResult, Context, Handler } from "aws-lambda";
import { PolicyDocument } from 'aws-lambda';
import {v4} from 'uuid';

export const handler: Handler = async (event: any, context: Context, callback: any) => {
    try {
        // After the token is verified we can do Authorization check here if needed.
        // If the request doesn't meet authorization conditions then we should return a Deny policy.
        const policyDocument: PolicyDocument = {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: 'Allow', // return Deny if you want to reject the request
                    Resource: event['methodArn'],
                },
            ],
        };

        const response: APIGatewayAuthorizerResult = {
            principalId: v4(),
            policyDocument
        };
        console.log(`response => ${JSON.stringify(response)}`);

        return response;
    } catch (err) {
        console.error('Invalid auth token. err => ', err);
        throw new Error('Unauthorized');
    }

}