import { AdminCreateUserCommandInput, CognitoIdentityProvider } from "@aws-sdk/client-cognito-identity-provider";
import { Context, Handler } from "aws-lambda";

const { COGNITO_USER_POOL, COGNITO_ARN, region} = process.env;

export const handler: Handler = async (event: any, context: Context, callback: any) => {
    console.log("signup", event.body, COGNITO_USER_POOL);
    const client = COGNITO_ARN ? new CognitoIdentityProvider({
        endpoint: COGNITO_ARN,
        region: region
    }) : new CognitoIdentityProvider({ region: region });

    const {
        email,
        password,
        given_name,
        family_name,
        country,
        city,
        is_admin
    } = JSON.parse(event.body);

    let params:AdminCreateUserCommandInput = {
        UserPoolId: COGNITO_USER_POOL,
        Username: email,
        UserAttributes: [{
            Name: 'email',
            Value: email
        },{
            Name: 'email_verified',
            Value: 'true'
        },{
            Name: 'given_name',
            Value: given_name
        },{
            Name: 'family_name',
            Value: family_name
        },{
            Name: 'custom:city',
            Value: city
        },{
            Name: 'custom:country',
            Value: country
        },{
            Name: 'custom:isAdmin',
            Value: is_admin ? is_admin : 'false'
        }],
        MessageAction: 'SUPPRESS'
    }
    try {
        let res = await client.adminCreateUser(params);
        console.log("sign up", res.User);
        if (res.User) {
            const paramsForSetPass = {
                Password: password,
                UserPoolId: COGNITO_USER_POOL,
                Username: email,
                Permanent: true
            };
            let resUpdatePass = await client.adminSetUserPassword(paramsForSetPass)
            console.log("resUpdatePass", resUpdatePass);
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'User registration successful'
                }),
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true
                }
            }
        }
    } catch (error:any) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: error.message
            }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true
            }
        }
    }    
}