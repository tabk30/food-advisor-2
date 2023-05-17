import { Function } from "aws-cdk-lib/aws-lambda";
import { StateMachine, Succeed } from "aws-cdk-lib/aws-stepfunctions";
import { LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Construct } from "constructs";

export interface DynamoDBInterface {
    lambdaConnect: Function;
}

export class StepFunctionContruct extends Construct {
    private readonly appName: string;
    constructor(
        private readonly scope: Construct,
        private readonly id: string,
        lambda: Function
    ) {
        super(scope, id);
        this.appName = scope.node.tryGetContext('appName') || "Bank-CQRS";
        this.createStepFunction(lambda);
    }

    private createStepFunction (lambdaFunction: Function) {
        const stateMachine = new StateMachine(this, 'step-function-exam', {
            definition: new LambdaInvoke(this, 'first-step', {
                lambdaFunction: lambdaFunction
            }).next(new Succeed(this, 'step-function-done'))
        });
    }
}