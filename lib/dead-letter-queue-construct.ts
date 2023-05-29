import { CfnOutput, Duration } from "aws-cdk-lib";
import { Code, Function, LayerVersion, Runtime } from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { Topic } from "aws-cdk-lib/aws-sns";
import { SqsSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { resolve } from "path";

export interface DeadLetterQueueConstructProps {
    sourceLayer: LayerVersion
}
export class DeadLetterQueueConstruct extends Construct {
    constructor(
        scope: Construct,
        id: string,
        {sourceLayer}: DeadLetterQueueConstructProps
    ) {
        super(scope, id);
        // 👇 create DLQ lambda function
        const dlqLambda = new Function(this, `Lambda-DLQ-Handler`, {
            code: Code.fromAsset(resolve(__dirname, '../api/dist'), {
                exclude: ['node_modules'],
            }),
            handler: 'error-process/dlq-handler.handler',
            memorySize: 1024,
            timeout: Duration.seconds(5),
            runtime: Runtime.NODEJS_16_X,
            layers: [sourceLayer],
            environment: {
                NODE_PATH: '$NODE_PATH:/opt',
            },
        });
        // 👇 create dead letter queue
        const deadLetterQueue = new Queue(this, 'dead-letter-queue', {
            retentionPeriod: Duration.minutes(30),
        });
        // 👇 add dead letter queue as event source for dlq lambda function
        dlqLambda.addEventSource(new SqsEventSource(deadLetterQueue));

        // 👇 create queue
        const queue = new Queue(this, 'sqs-queue', {
            // 👇 set up DLQ
            deadLetterQueue: {
                queue: deadLetterQueue,
                maxReceiveCount: 1,
            },
        });

        // 👇 create sns topic
        const topic = new Topic(this, 'sns-topic');
        // 👇 subscribe queue to topic
        topic.addSubscription(new SqsSubscription(queue));

        // 👇 create lambda function
        const myLambda = new Function(this, `Lambda-DLQ-Throw`, {
            code: Code.fromAsset(resolve(__dirname, '../api/dist'), {
                exclude: ['node_modules'],
            }),
            handler: 'error-process/error-throw-example.dlqThrow',
            memorySize: 1024,
            timeout: Duration.seconds(5),
            runtime: Runtime.NODEJS_16_X,
            layers: [sourceLayer],
            environment: {
                NODE_PATH: '$NODE_PATH:/opt',
            },
        });

        // 👇 add sqs queue as event source for Lambda
        myLambda.addEventSource(
            new SqsEventSource(queue, {
                batchSize: 10,
            }),
        );
        new CfnOutput(this, 'snsTopicArn', {
            value: topic.topicArn,
            description: 'The arn of the SNS topic',
        });
    }
}