import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Code, LayerVersion, Runtime, StartingPosition } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { Function } from "aws-cdk-lib/aws-lambda";
import { resolve } from "path";
import { Duration } from "aws-cdk-lib";
import { DynamoEventSource, SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { SnsDlq } from "aws-cdk-lib/aws-lambda-event-sources";
import { Topic } from "aws-cdk-lib/aws-sns";
import { SqsSubscription } from "aws-cdk-lib/aws-sns-subscriptions";

export interface DynamoStreamHandlerConstructProps {
    sourceLayer: LayerVersion,
    commandAccountTable: Table,
}

export class DynamoStreamErrorHandlerConstruct extends Construct {
    private _accountStreamLambdaHandler: Function;
    public get accountStreamLambda(): Function {
        return this._accountStreamLambdaHandler;
    }
    constructor(
        scope: Construct,
        id: string,
        { sourceLayer, commandAccountTable }: DynamoStreamHandlerConstructProps
    ) {
        super(scope, id);
        this._accountStreamLambdaHandler = new Function(this, `Account-Dynamo-Stream-Handler`, {
            code: Code.fromAsset(resolve(__dirname, '../api/dist'), {
                exclude: ['node_modules'],
            }),
            handler: 'error-process/error-throw-example.dlqThrow',
            memorySize: 1024,
            timeout: Duration.seconds(5),
            runtime: Runtime.NODEJS_16_X,
            layers: [sourceLayer],
            environment: {
                NODE_PATH: '$NODE_PATH:/opt'
            },
        });

        const streamErrorHandler = new Function(this, `Account-Dynamo-Stream-Error-Handler`, {
            code: Code.fromAsset(resolve(__dirname, '../api/dist'), {
                exclude: ['node_modules'],
            }),
            handler: 'error-process/ds-error-handler.handler',
            memorySize: 1024,
            timeout: Duration.seconds(5),
            runtime: Runtime.NODEJS_16_X,
            layers: [sourceLayer],
            environment: {
                NODE_PATH: '$NODE_PATH:/opt'
            },
        });

        // 👇 create dead letter queue
        const dynamoErrorQueue = new Queue(this, 'dynamo-db-error-queue', {
            retentionPeriod: Duration.minutes(30),
        });
        // 👇 add dead letter queue as event source for dlq lambda function
        streamErrorHandler.addEventSource(new SqsEventSource(dynamoErrorQueue));

        // 👇 create sns topic
        const topic = new Topic(this, 'sns-topic');
        const snsDeadQueue = new SnsDlq(topic);
        topic.addSubscription(new SqsSubscription(dynamoErrorQueue));

        const dynamoStream = new DynamoEventSource(commandAccountTable, {
            startingPosition: StartingPosition.LATEST,
            bisectBatchOnError: true,
            retryAttempts: 2,
            maxRecordAge: Duration.seconds(60),
            onFailure: snsDeadQueue
        });

        this._accountStreamLambdaHandler.addEventSource(dynamoStream);
    }
}