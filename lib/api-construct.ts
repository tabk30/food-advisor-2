import { CfnOutput, Duration } from "aws-cdk-lib";
import { AuthorizationType, CfnAuthorizer, CfnMethod, CognitoUserPoolsAuthorizer, IdentitySource, LambdaIntegration, RequestAuthorizer, RestApi } from "aws-cdk-lib/aws-apigateway";
import { IUserPool, UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Effect, Grant, Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Code, LayerVersion, Runtime, Function, StartingPosition } from "aws-cdk-lib/aws-lambda";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { Topic } from "aws-cdk-lib/aws-sns";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { StateMachine } from "aws-cdk-lib/aws-stepfunctions";
import { Construct } from "constructs";
import { resolve } from "path";

export interface ApiConstructProps {
    // userPool: IUserPool,
    commandAccountTable: Table,
    queryAccountTable: Table,
    queryRestaurantTable: Table,
    queryReviewTable: Table,
    reviewQuene: Queue,
    restaurantTopic: Topic,
    userPoolId: string,
    userPoolArn: string,
    userPool: UserPool,
    userPoolClient: UserPoolClient,
    stateMachine: StateMachine,
    layer: LayerVersion
}

export class ApiConstruct extends Construct {
    private readonly appName: string;
    private _sourceLayer: LayerVersion;
    private _accountLambdaHandler: Function;
    public get accountLambda(): Function {
        return this._accountLambdaHandler;
    }
    private _restaurantLambdaHandler: Function;
    public get restaurantLambda(): Function {
        return this._restaurantLambdaHandler;
    }
    private _reviewLambdaHandler: Function;
    public get reviewLambda(): Function {
        return this._reviewLambdaHandler;
    }
    private _authenLambdaHandler: Function;
    public get authenLambda(): Function {
        return this._authenLambdaHandler;
    }
    private _loginLambdaHandler: Function;
    public get loginLambda(): Function {
        return this._loginLambdaHandler;
    }
    private _signupLambdaHandler: Function;
    public get signupLambda(): Function {
        return this._signupLambdaHandler;
    }

    private _api: RestApi;
    public get api(): RestApi {
        return this._api
    }

    constructor(
        private readonly scope: Construct,
        private readonly id: string,
        { commandAccountTable, queryAccountTable, queryRestaurantTable, queryReviewTable, reviewQuene, restaurantTopic, userPoolId, userPoolArn, userPool, userPoolClient, stateMachine, layer }: ApiConstructProps
    ) {
        super(scope, id);
        this.appName = scope.node.tryGetContext('appName') || "Bank-CQRS";

        // pack all external deps in layer
        this._sourceLayer = layer

        this.createAuthenLambdaHandler(userPoolId, userPoolArn, userPoolClient.userPoolClientId);
        this.createLoginLambdaHandler(userPoolId, userPoolArn, userPoolClient.userPoolClientId);
        this.createSignupLambdaHandler(userPoolId, userPoolArn);
        this.createAccountLambdaHandler(commandAccountTable, queryAccountTable, stateMachine);
        this.createRestaurantLambdaHandler(queryRestaurantTable);
        this.createReviewLambdaHandler(queryReviewTable, reviewQuene, restaurantTopic);
        // this.createApiGateWay(userPool);
    }

    private createAuthenLambdaHandler(userPoolId: string, userPoolArn: string, userPoolClientId: string,){
        // add handler to respond to all our api requests
        this._authenLambdaHandler = new Function(this, `${this.appName}-Authen-Handler`, {
            code: Code.fromAsset(resolve(__dirname, '../api/dist'), {
                exclude: ['node_modules'],
            }),
            handler: 'user/authen.handler',
            memorySize: 1024,
            timeout: Duration.seconds(5),
            runtime: Runtime.NODEJS_16_X,
            layers: [this._sourceLayer],
            environment: {
                NODE_PATH: '$NODE_PATH:/opt',
                COGNITO_USER_POOL: userPoolId,
                COGNITO_USERPOOL_ARN: userPoolArn,
                COGNITO_USER_CLIENT_ID: userPoolClientId,
                NODE_OPTIONS: '--enable-source-maps',
            },
        });
    }

    private createLoginLambdaHandler(userPoolId: string, userPoolArn: string, userPoolClientId: string){
        this._loginLambdaHandler = new Function(this, `${this.appName}-Login-Handler`, {
            code: Code.fromAsset(resolve(__dirname, '../api/dist'), {
                exclude: ['node_modules'],
            }),
            handler: 'user/login.handler',
            memorySize: 1024,
            timeout: Duration.seconds(5),
            runtime: Runtime.NODEJS_16_X,
            layers: [this._sourceLayer],
            environment: {
                NODE_PATH: '$NODE_PATH:/opt',
                COGNITO_USER_POOL: userPoolId,
                COGNITO_USERPOOL_ARN: userPoolArn,
                COGNITO_USER_CLIENT_ID: userPoolClientId,
                NODE_OPTIONS: '--enable-source-maps',
            },
        });
        const userPoolPolicy: PolicyStatement = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                'cognito-idp:AdminGetUser',
                'cognito-idp:GetUser',
                'cognito-idp:AdminInitiateAuth',
                'cognito-idp:InitiateAuth'
                // etc
            ],
            resources: [
                userPoolArn
            ],
        });
        this._loginLambdaHandler.role?.attachInlinePolicy(
            new Policy(this, 'User-Pool-Login-Policy', { statements: [userPoolPolicy] })
        );
    }

    private createSignupLambdaHandler(userPoolId: string, userPoolArn: string){
        this._signupLambdaHandler = new Function(this, `${this.appName}-Signup-Handler`, {
            code: Code.fromAsset(resolve(__dirname, '../api/dist'), {
                exclude: ['node_modules'],
            }),
            handler: 'user/signup.handler',
            memorySize: 1024,
            timeout: Duration.seconds(5),
            runtime: Runtime.NODEJS_16_X,
            layers: [this._sourceLayer],
            environment: {
                NODE_PATH: '$NODE_PATH:/opt',
                COGNITO_USER_POOL: userPoolId,
                COGNITO_USERPOOL_ARN: userPoolArn,
                NODE_OPTIONS: '--enable-source-maps',
            },
        });
        const userPoolPolicy: PolicyStatement = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                'cognito-idp:AdminGetUser',
                'cognito-idp:AdminEnableUser',
                'cognito-idp:AdminCreateUser',
                'cognito-idp:AdminDisableUser',
                'cognito-idp:AdminSetUserPassword'
                // etc
            ],
            resources: [
                userPoolArn
            ],
        });
        this._signupLambdaHandler.role?.attachInlinePolicy(
            new Policy(this, 'User-Pool-Signup-Policy', { statements: [userPoolPolicy] })
        );
    }

    private createAccountLambdaHandler(commandAccountTable: Table, queryAccountTable: Table, dynamoSync: StateMachine) {
        // add handler to respond to all our api requests
        this._accountLambdaHandler = new Function(this, `${this.appName}-Account-Handler`, {
            code: Code.fromAsset(resolve(__dirname, '../api/dist'), {
                exclude: ['node_modules'],
            }),
            handler: 'account/lambda.handler',
            memorySize: 1024,
            timeout: Duration.seconds(5),
            runtime: Runtime.NODEJS_16_X,
            layers: [this._sourceLayer],
            environment: {
                NODE_PATH: '$NODE_PATH:/opt',
                COMMAND_ACCOUNT_TABLE: commandAccountTable.tableName,
                QUERY_ACCOUNT_TABLE: queryAccountTable.tableName,
                STEP_FUNCTION_ARN: dynamoSync.stateMachineArn
            },
        });
        this._accountLambdaHandler.addEventSource(new DynamoEventSource(commandAccountTable, {
            startingPosition: StartingPosition.LATEST,
        }));
        dynamoSync.grantStartExecution(this._accountLambdaHandler);
    }

    private createRestaurantLambdaHandler(queryRestaurantTable: Table) {
        // add handler to respond to all our api requests
        this._restaurantLambdaHandler = new Function(this, `${this.appName}-Restaurant-Handler`, {
            code: Code.fromAsset(resolve(__dirname, '../api/dist'), {
                exclude: ['node_modules'],
            }),
            handler: 'restaurant/lambda.handler',
            memorySize: 1024,
            timeout: Duration.seconds(5),
            runtime: Runtime.NODEJS_16_X,
            layers: [this._sourceLayer],
            environment: {
                NODE_PATH: '$NODE_PATH:/opt',
                QUERY_RESTAURANT_TABLE: queryRestaurantTable.tableName
            },
        });
    }

    private createReviewLambdaHandler(queryReviewTable: Table, reviewQuene: Queue, restaurantTopic: Topic) {
        // add handler to respond to all our api requests
        this._reviewLambdaHandler = new Function(this, `${this.appName}-Review-Handler`, {
            code: Code.fromAsset(resolve(__dirname, '../api/dist'), {
                exclude: ['node_modules'],
            }),
            handler: 'review/lambda.handler',
            memorySize: 1024,
            timeout: Duration.seconds(5),
            runtime: Runtime.NODEJS_16_X,
            layers: [this._sourceLayer],
            environment: {
                NODE_PATH: '$NODE_PATH:/opt',
                QUERY_REVIEW_TABLE: queryReviewTable.tableName,
                REVIEW_QUENE: reviewQuene.queueName,
                RESTAURANT_TOPIC_ARN: restaurantTopic.topicArn
            },
        });
        
        let snsPolicy = new PolicyStatement({
            actions: ['sns:publish'],
            resources: [restaurantTopic.topicArn]
        });
        this._reviewLambdaHandler.addToRolePolicy(snsPolicy);
    }

    // private createApiGateWay(userPool: UserPool) {
    //     // add api resource to handle all http traffic and pass it to our handler
    //     this._api = new RestApi(this, `${this.appName}-api-gateway`, {
    //         deploy: true
    //     });
    //     new CfnOutput(this, 'apiUrl', { value: this._api.url });

    //     // Lambda Authorizer with 'REQUEST' type
    //     // const authorizer = new RequestAuthorizer(this, 'cognito-api-request-authorizer', {
    //     //     handler: this._authenLambdaHandler,
    //     //     identitySources: [IdentitySource.header('authorization')],
    //     //     resultsCacheTtl: Duration.seconds(0),
    //     // });
    //     const auth = new CognitoUserPoolsAuthorizer(this, 'cognito-api-request-authorizer', {
    //         cognitoUserPools: [userPool]
    //     });

    //     const loginResource = this.api.root.addResource('login');
    //     loginResource.addMethod('POST', new LambdaIntegration(this._loginLambdaHandler));
    //     const signupResource = this.api.root.addResource('signup');
    //     signupResource.addMethod('POST', new LambdaIntegration(this._signupLambdaHandler));

    //     const accountResource = this.api.root.addResource('account', {defaultMethodOptions: {
    //         authorizationType: AuthorizationType.COGNITO
    //     }});
    //     accountResource.addMethod('ANY', new LambdaIntegration(this._accountLambdaHandler), {
    //         methodResponses: [{
    //           statusCode: '200',
    //           responseParameters: {
    //             'method.response.header.Content-Type': true,
    //             'method.response.header.Access-Control-Allow-Origin': true,
    //           },
    //         }],
    //         authorizer: auth,
    //         authorizationType: AuthorizationType.COGNITO,
    //       },);
    //     const restaurantResource = this.api.root.addResource('restaurant');
    //     restaurantResource.addMethod('ANY', new LambdaIntegration(this._restaurantLambdaHandler));
    //     const reviewResource = this.api.root.addResource('review');
    //     reviewResource.addMethod('ANY', new LambdaIntegration(this._reviewLambdaHandler));
    // }
}