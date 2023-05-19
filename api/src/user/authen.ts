import { CognitoIdentityProviderClient, ListUsersCommand, ListUsersCommandInput } from "@aws-sdk/client-cognito-identity-provider";
import { Context, Handler } from "aws-lambda";

const { COGNITO_USER_POOL, COGNITO_ARN, region, COGNITO_USER_CLIENT_ID } = process.env;

function generateAuthResponse(principalId, effect, methodArn) {
    const policyDocument = generatePolicyDocument(effect, methodArn);

    return {
        principalId,
        policyDocument
    };
}

function generatePolicyDocument(effect, methodArn) {
    if (!effect || !methodArn) return null;

    const policyDocument = {
        Version: "2012-10-17",
        Statement: [
            {
                Action: "execute-api:Invoke",
                Effect: effect,
                Resource: methodArn
            }
        ]
    };

    return policyDocument;
}


export const handler: Handler = async (event: any, context: Context, callback: any) => {
    console.log("event", event);
    console.log("context", context);
    // const {
    //     is_local,
    //     authorizationToken
    // } = JSON.parse(event.body);
    const methodArn = event.methodArn;
    console.log("token", event.authorizationToken);

    if (event.authorizationToken) {
        return callback(null, generateAuthResponse("1234", "Allow", methodArn));
    } else {
        return callback(null, generateAuthResponse("1234", "Deny", methodArn));
    }

}