import { CfnOutput, Duration } from "aws-cdk-lib";
import { AuthorizationType, CfnAuthorizer, CfnMethod, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { IUserPool } from "aws-cdk-lib/aws-cognito";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Code, LayerVersion, Runtime, Function, StartingPosition } from "aws-cdk-lib/aws-lambda";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { Construct } from "constructs";
import { resolve } from "path";

export interface ApiConstructProps {
    // userPool: IUserPool,
    commandAccountTable: Table,
    queryAccountTable: Table
}

export class ApiConstruct extends Construct {
    private readonly appName: string;
    private _lambdaHandler: Function;
    public get lambda(): Function {
        return this._lambdaHandler
    }

    private _api: RestApi;
    public get api(): RestApi {
        return this._api
    }

    constructor(
        private readonly scope: Construct,
        private readonly id: string,
        { commandAccountTable, queryAccountTable }: ApiConstructProps
    ) {
        super(scope, id);
        this.appName = scope.node.tryGetContext('appName') || "Bank-CQRS";

        this.createLambdaHandler(commandAccountTable, queryAccountTable);
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

    private createLambdaHandler(commandAccountTable: Table, queryAccountTable: Table) {
        // pack all external deps in layer
        const lambdaLayer1 = new LayerVersion(this, `${this.appName}-HandlerLayer`, {
            code: Code.fromAsset(resolve(__dirname, '../lambda-layer-1/nodejs/node_modules')),
            compatibleRuntimes: [Runtime.NODEJS_16_X, Runtime.NODEJS_18_X],
            description: 'Api Handler Dependencies',
        });

        // add handler to respond to all our api requests
        this._lambdaHandler = new Function(this, `${this.appName}-Handler`, {
            code: Code.fromAsset(resolve(__dirname, '../api/dist'), {
                exclude: ['node_modules'],
            }),
            handler: 'account/lambda.handler',
            memorySize: 1024,
            timeout: Duration.seconds(5),
            runtime: Runtime.NODEJS_16_X,
            layers: [lambdaLayer1],
            environment: {
                NODE_PATH: '$NODE_PATH:/opt',
                COMMAND_ACCOUNT_TABLE: commandAccountTable.tableName,
                QUERY_ACCOUNT_TABLE: queryAccountTable.tableName
            },
        });
        this._lambdaHandler.addEventSource(new DynamoEventSource(commandAccountTable, {
            startingPosition: StartingPosition.LATEST,
        }));
    }

    private createApiGateWay() {
        // add api resource to handle all http traffic and pass it to our handler
        this._api = new RestApi(this, `${this.appName}-api-gateway`, {
            deploy: true,
            defaultMethodOptions: {
                // apiKeyRequired: true,
            },
            // deployOptions: {
            //     stageName: 'v1',
            // },
        });
        new CfnOutput(this, 'apiUrl', { value: this._api.url });

        // add proxy resource to handle all api requests
        this._api.root.addProxy({
            defaultIntegration: new LambdaIntegration(this._lambdaHandler),
            // defaultMethodOptions: {
            //     authorizationType: AuthorizationType.COGNITO,
            // },
        });

        // const apiResource = this.api.root.addProxy({
        //     defaultIntegration: new LambdaIntegration(this._lambdaHandler),
        //     // defaultMethodOptions: {
        //     //     authorizationType: AuthorizationType.COGNITO,
        //     // },
        // });
    }
}