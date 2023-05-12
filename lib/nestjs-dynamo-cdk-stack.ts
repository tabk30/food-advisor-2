import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import { Cognito } from './congnito-construct';
import { ApiConstruct } from './api-construct';
import { DynamoDBConstruct } from './dynamodb-construct';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class NestjsDynamoCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'NestjsDynamoCdkQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    // const cognitoResource = new Cognito(this, 'cognito', {
    //   hostedAuthDomainPrefix: "test"
    // });
    const table = new DynamoDBConstruct(this, 'DynamoDBConstruct');
    const api = new ApiConstruct(
      this, 'LambdaHandler',
      {
        commandAccountTable: table.commandAccountTable,
        queryAccountTable: table.queryAccountTable
      }
    );
    table.grantConnect(api.lambda);
  }
}
