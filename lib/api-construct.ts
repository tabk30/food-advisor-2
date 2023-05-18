import { CfnOutput, Duration } from "aws-cdk-lib";
import { AuthorizationType, CfnAuthorizer, CfnMethod, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { IUserPool } from "aws-cdk-lib/aws-cognito";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Code, LayerVersion, Runtime, Function, StartingPosition } from "aws-cdk-lib/aws-lambda";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { Topic } from "aws-cdk-lib/aws-sns";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { resolve } from "path";

export interface ApiConstructProps {
    // userPool: IUserPool,
    commandAccountTable: Table,
    queryAccountTable: Table,
    queryRestaurantTable: Table,
    queryReviewTable: Table,
    reviewQuene: Queue,
    restaurantTopic: Topic
}

export class ApiConstruct extends Construct {
    private readonly appName: string;
    private _sourceLayer: LayerVersion;
    private _accountLambdaHandler: Function;
    public get accountLambda(): Function {
        return this._accountLambdaHandler
    }
    private _restaurantLambdaHandler: Function;
    public get restaurantLambda(): Function {
        return this._restaurantLambdaHandler
    }
    private _reviewLambdaHandler: Function;
    public get reviewLambda(): Function {
        return this._reviewLambdaHandler
    }

    private _api: RestApi;
    public get api(): RestApi {
        return this._api
    }

    constructor(
        private readonly scope: Construct,
        private readonly id: string,
        { commandAccountTable, queryAccountTable, queryRestaurantTable, queryReviewTable, reviewQuene, restaurantTopic }: ApiConstructProps
    ) {
        super(scope, id);
        this.appName = scope.node.tryGetContext('appName') || "Bank-CQRS";

        this.createAccountLambdaHandler(commandAccountTable, queryAccountTable);
        this.createRestaurantLambdaHandler(queryRestaurantTable);
        this.createReviewLambdaHandler(queryReviewTable, reviewQuene, restaurantTopic);
        this.createApiGateWay();

        // add api key to enable monitoring
        // const apiKey = api.addApiKey('ApiKey');
        // const usagePlan = api.addUsagePlan('UsagePlan', {
        //     apiKey,
        //     name: 'Standard',
        // });

        // usagePlan.addApiStage({
        //     stage: api.deploymentStage,
        // });

        // add cognito authorizer
        // const anyMethod = apiResource.anyMethod?.node.defaultChild as CfnMethod;
        // const authorizer = new CfnAuthorizer(this, 'CognitoAuthorizer', {
        //     name: 'Test_Cognito_Authorizer',
        //     identitySource: 'method.request.header.Authorization',
        //     providerArns: [userPool.userPoolArn],
        //     restApiId: api.restApiId,
        //     type: 'COGNITO_USER_POOLS',
        // });
        // anyMethod.node.addDependency(authorizer);
        // anyMethod.addOverride('Properties.AuthorizerId', authorizer.ref);
    }

    private createAccountLambdaHandler(commandAccountTable: Table, queryAccountTable: Table) {
        // pack all external deps in layer
        this._sourceLayer = new LayerVersion(this, `${this.appName}-HandlerLayer`, {
            code: Code.fromAsset(resolve(__dirname, '../lambda-layer-1/nodejs/node_modules')),
            compatibleRuntimes: [Runtime.NODEJS_16_X, Runtime.NODEJS_18_X],
            description: 'Api Handler Dependencies',
        });

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
                QUERY_ACCOUNT_TABLE: queryAccountTable.tableName
            },
        });
        this._accountLambdaHandler.addEventSource(new DynamoEventSource(commandAccountTable, {
            startingPosition: StartingPosition.LATEST,
        }));
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
        // new CfnOutput(this, 'reviewToRestaurant', {
        //     value: restaurantTopic.topicArn,
        //     description: "Review lambda to restaurant topic"
        // });
        let snsPolicy = new PolicyStatement({
            actions: ['sns:publish'],
            resources: [restaurantTopic.topicArn]
        });
        this._reviewLambdaHandler.addToRolePolicy(snsPolicy);
    }

    private createApiGateWay() {
        // add api resource to handle all http traffic and pass it to our handler
        this._api = new RestApi(this, `${this.appName}-api-gateway`, {
            deploy: true
        });
        new CfnOutput(this, 'apiUrl', { value: this._api.url });

        // add proxy resource to handle all api requests
        // this._api.root.addProxy({
        //     defaultIntegration: new LambdaIntegration(this._accountLambdaHandler),
        //     defaultMethodOptions: {
        //         authorizationType: AuthorizationType.COGNITO,
        //     },
        // });
        const accountResource = this.api.root.addResource('account');
        accountResource.addMethod('ANY', new LambdaIntegration(this._accountLambdaHandler));
        const restaurantResource = this.api.root.addResource('restaurant');
        restaurantResource.addMethod('ANY', new LambdaIntegration(this._restaurantLambdaHandler));
        const reviewResource = this.api.root.addResource('review');
        reviewResource.addMethod('ANY', new LambdaIntegration(this._reviewLambdaHandler));


        // const apiResource = this.api.root.addProxy({
        //     defaultIntegration: new LambdaIntegration(this._accountLambdaHandler),
        //     // defaultMethodOptions: {
        //     //     authorizationType: AuthorizationType.COGNITO,
        //     // },
        // });
    }
}