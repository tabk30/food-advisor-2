import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiConstruct } from './api-construct';
import { DynamoDBConstruct } from './dynamodb-construct';
import { StepFunctionContruct } from './step-function-construct';

export class NestjsDynamoCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const table = new DynamoDBConstruct(this, 'DynamoDBConstruct');
    const api = new ApiConstruct(
      this, 'LambdaHandler',
      {
        commandAccountTable: table.commandAccountTable,
        queryAccountTable: table.queryAccountTable
      }
    );
    table.grantConnect(api.lambda);
    const stepFunction = new StepFunctionContruct(this, 'StepFunction', api.lambda);
  }
}
