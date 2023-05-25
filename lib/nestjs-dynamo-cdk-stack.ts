import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiConstruct } from './api-construct';
import { DynamoDBConstruct } from './dynamodb-construct';
import { StepFunctionContruct } from './step-function-construct';
import { SNSSQSConstruct } from './sns-sqs-construct';
import { CognitoConstruct } from './congnito-construct';

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
        userPoolClient: cognitoConstruct.usetPollClient
      }
    );

    table.grantAccountConnect(api.accountLambda);
    table.grantRestaurantConnect(api.restaurantLambda);
    table.grantReviewConnect(api.reviewLambda);
    const stepFunction = new StepFunctionContruct(this, 'StepFunction', api.accountLambda);
    
    sns.subscriptionAccountQueue(api.accountLambda);
    sns.subscriptionRestaurantQueue(api.restaurantLambda);
    sns.subscriptionReviewQueue(api.reviewLambda);
  };


}
