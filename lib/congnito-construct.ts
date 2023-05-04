import { OAuthScope, UserPool, UserPoolClient, UserPoolClientIdentityProvider, UserPoolDomain } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";


export interface CognitoProps {
    hostedAuthDomainPrefix: string;
}

export class Cognito extends Construct {
    readonly userPoll: UserPool;
    constructor(
        scope: Construct,
        id: string,
        props: CognitoProps
    ) {
        super(scope, id);
        this.userPoll = new UserPool(this, 'userpool', {
            autoVerify: {
                email: true
            },
            standardAttributes: {
                email: {
                    required: true
                }
            },
            signInAliases: {
                email: true,
                username: true,
                preferredUsername: true
            },
            selfSignUpEnabled: true
        });
        const userPoolClient = new UserPoolClient(this, 'UserPollCLient', {
            userPool: this.userPoll,
            authFlows: {
                userSrp: true,
                // refreshToken: true
            },
            oAuth: {
                flows: {
                    // it is recommended to not use implicitCodeGrant flow in general
                    // see more https://oauth.net/2/grant-types/implicit/#:~:text=It%20is%20not%20recommended%20to,been%20received%20by%20the%20client.
                    implicitCodeGrant: true,
                },
                scopes: [OAuthScope.PROFILE, OAuthScope.COGNITO_ADMIN],
                callbackUrls: ['https://www.google.com']
            },
            supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO],
            preventUserExistenceErrors: true
        });
        const userPoolDomain = new UserPoolDomain(this, 'UserPoolDomain', {
            userPool: this.userPoll,
            cognitoDomain: {
                // this will be used to create unique auth domain hosted on `auth.ap-southeast-2.amazoncognito.com`,
                domainPrefix: props.hostedAuthDomainPrefix,
            },
        });
    }
}