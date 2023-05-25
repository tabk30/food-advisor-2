import { RemovalPolicy } from "aws-cdk-lib";
import { AccountRecovery, ClientAttributes, OAuthScope, StringAttribute, UserPool, UserPoolClient, UserPoolClientIdentityProvider, UserPoolDomain } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";


export interface CognitoProps {
}

export class CognitoConstruct extends Construct {
    private readonly _userPool: UserPool;
    public get usetPool ():UserPool {
        return this._userPool;
    }

    private readonly _userPoolClient: UserPoolClient;
    public get usetPollClient ():UserPoolClient {
        return this._userPoolClient;
    }
    constructor(
        scope: Construct,
        id: string
    ) {
        super(scope, id);
        this._userPool = new UserPool(this, 'userpool-bank-user', {
            userPoolName: 'my-user-pool-01',
            selfSignUpEnabled: true,
            signInAliases: {
                email: true,
            },
            autoVerify: {
                email: true,
            },
            standardAttributes: {
                givenName: {
                    required: true,
                    mutable: true,
                },
                familyName: {
                    required: true,
                    mutable: true,
                },
            },
            customAttributes: {
                country: new StringAttribute({mutable: true}),
                city: new StringAttribute({mutable: true}),
                isAdmin: new StringAttribute({mutable: true}),
            },
            passwordPolicy: {
                minLength: 6,
                requireLowercase: true,
                requireDigits: true,
                requireUppercase: false,
                requireSymbols: false,
            },
            accountRecovery: AccountRecovery.EMAIL_ONLY,
            removalPolicy: RemovalPolicy.RETAIN
        });
        const standardCognitoAttributes = {
            givenName: true,
            familyName: true,
            email: true
          };
        const clientReadAttributes = new ClientAttributes()
            .withStandardAttributes(standardCognitoAttributes)
            .withCustomAttributes(...['country', 'city', 'isAdmin']);

        const clientWriteAttributes = new ClientAttributes()
            .withStandardAttributes({
                ...standardCognitoAttributes
            })
            .withCustomAttributes(...['country', 'city']);

        this._userPoolClient = new UserPoolClient(this, 'userpool-client', {
            userPool: this._userPool,
            authFlows: {
                adminUserPassword: true,
                // userPassword: true,
                custom: true,
                userSrp: true,
            },
            supportedIdentityProviders: [
                UserPoolClientIdentityProvider.COGNITO,
            ],
            readAttributes: clientReadAttributes,
            writeAttributes: clientWriteAttributes,
        });
        
    }
}