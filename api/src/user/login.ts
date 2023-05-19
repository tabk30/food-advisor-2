import { AdminInitiateAuthCommandInput, CognitoIdentityProvider } from "@aws-sdk/client-cognito-identity-provider";
import { Context, Handler } from "aws-lambda";

const { COGNITO_USER_POOL, COGNITO_ARN, region, COGNITO_USER_CLIENT_ID } = process.env;

const validateInput = (data) => {
    const body = JSON.parse(data);
    const { email, password } = body
    if (!email || !password || password.length < 6)
        return false
    return true
}

const sendResponse = (statusCode, body) => {
    const response = {
        statusCode: statusCode,
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
        }
    }
    return response
}

export const handler: Handler = async (event: any, context: Context, callback: any) => {
    console.log("login", event);
    console.log("login", COGNITO_USER_CLIENT_ID);
    const client = COGNITO_ARN ? new CognitoIdentityProvider({
        endpoint: COGNITO_ARN,
        region: region
    }) : new CognitoIdentityProvider({ region: region });

    try {
        const isValid = validateInput(event.body);
        if (!isValid)
            return sendResponse(400, { message: 'Invalid input' });
        const { email, password } = JSON.parse(event.body);
        const params: AdminInitiateAuthCommandInput = {
            AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
            UserPoolId: COGNITO_USER_POOL,
            ClientId: COGNITO_USER_CLIENT_ID,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password
            }
        };
        const res = await client.adminInitiateAuth(params);
        console.log("login", res);
        return sendResponse(200, { message: 'Success', token: res.AuthenticationResult.IdToken });
    } catch (error) {
        const message = error.message ? error.message : 'Internal server error'
        return sendResponse(500, { message })
    }
}