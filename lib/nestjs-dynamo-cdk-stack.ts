import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiConstruct } from './api-construct';
import { DynamoDBConstruct } from './dynamodb-construct';
import { StepFunctionContruct } from './step-function-construct';
import { SNSSQSConstruct } from './sns-sqs-construct';
import { CognitoConstruct } from './congnito-construct';
import { DynamoSyncConstruct } from './dynamo-sync-function-construct';
import { ApiGatewayConstruct } from './api-gateway-construct';
import { ErrorHandlerConstruct } from './error-handler-construct';
import { LambdaLayerConstruct } from './lambda-layer';
import { DeadLetterQueueConstruct } from './dead-letter-queue-construct';
import { DynamoStreamErrorHandlerConstruct } from './dynamo-stream-handler-construct';

export class NestjsDynamoCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const table = new DynamoDBConstruct(this, 'DynamoDBConstruct');
    const sns = new SNSSQSConstruct(this, 'SNS-SQS', {
      GLOBAL_TOPIC_SNS: 'global_topic_sns',
      ACCOUNT_TOPIC_SNS: 'account_topic_sns',
      ACCOUNT_QUEUE: 'account_queue',
      RESTAURANT_TOPIC_SNS: 'restaurant_topic_sns',
      RESTAURANT_QUEUE: 'restaurant_queue',
      REVIEW_TOPIC_SNS: 'review_topic_sns',
      REVIEW_QUEUE: 'review_queue'
    });
    const cognitoConstruct = new CognitoConstruct(this, 'Cognito-Construct');
    const dynmoSyncConstruct = new DynamoSyncConstruct(this, 'Dynmo-Sync-Function');

    const sourceLayer = new LambdaLayerConstruct(this, 'Lambda-Layer-Construct');
    const stepFunction = new StepFunctionContruct(this, 'Step-Function-Construct', {
      sourceLayer: sourceLayer.layder1,
      helloTable: table.helloTable,
      worldTable: table.worldTable,
      foodTable: table.foodTable
    });
    const api = new ApiConstruct(
      this, 'LambdaHandler',
      {
        commandAccountTable: table.commandAccountTable,
        queryAccountTable: table.queryAccountTable,
        queryRestaurantTable: table.queryRestaurantTable,
        queryReviewTable: table.queryReviewTable,
        restaurantTopic: sns.restaurantTopic,
        reviewQuene: sns.reviewQueue,
        userPoolId: cognitoConstruct.usetPool.userPoolId,
        userPoolArn: cognitoConstruct.usetPool.userPoolArn,
        userPool: cognitoConstruct.usetPool,
        userPoolClient: cognitoConstruct.usetPollClient,
        stateMachine: stepFunction.stateMachine,
        layer: sourceLayer.layder1
      }
    );

    const apiGW = new ApiGatewayConstruct(this, 'api-gateway-construct');
    apiGW.addResource(api.loginLambda, 'login', 'POST');
    apiGW.addResource(api.signupLambda, 'signup', 'POST');
    apiGW.addResource(api.accountLambda, 'account', 'ANY', cognitoConstruct.usetPool);
    apiGW.addResource(api.restaurantLambda, 'restaurant', 'ANY');
    apiGW.addResource(api.reviewLambda, 'review', 'ANY');

    //demo log trigger
    const logTrigger = new ErrorHandlerConstruct(this, 'error-handler-costruct', {sourceLayer: sourceLayer.layder1});
    const lambda = logTrigger.demoErrorFire(sourceLayer.layder1);
    apiGW.addResource(lambda, 'logFire', 'ANY');
    const dlqConstruct = new DeadLetterQueueConstruct(this, 'dead-leter-queue-construct', {sourceLayer: sourceLayer.layder1});
    const dbStreamErrorHandler = new DynamoStreamErrorHandlerConstruct(this, 'dynamo-stream-error-handler', {sourceLayer: sourceLayer.layder1, commandAccountTable: table.commandAccountTable});
    

    table.grantAccountConnect(api.accountLambda);
    table.grantRestaurantConnect(api.restaurantLambda);
    table.grantReviewConnect(api.reviewLambda);
    
    
    sns.subscriptionAccountQueue(api.accountLambda);
    sns.subscriptionRestaurantQueue(api.restaurantLambda);
    sns.subscriptionReviewQueue(api.reviewLambda);
  };


}
