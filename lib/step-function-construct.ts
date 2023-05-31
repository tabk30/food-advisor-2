import { Duration } from "aws-cdk-lib";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Code, Function, LayerVersion, Runtime } from "aws-cdk-lib/aws-lambda";
import { Chain, Choice, Fail, InputType, IntegrationPattern, JsonPath, StateMachine, Succeed, TaskInput } from "aws-cdk-lib/aws-stepfunctions";
import { LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Construct } from "constructs";
import { resolve } from "path";

export interface StepFunctionsConstructProps {
    sourceLayer: LayerVersion;
    helloTable: Table;
    worldTable: Table;
    foodTable: Table;
}

export class StepFunctionContruct extends Construct {
    private readonly appName: string;
    private _stateMachine: StateMachine;
    public get stateMachine():StateMachine {
        return this._stateMachine;
    }
    constructor(
        private readonly scope: Construct,
        private readonly id: string,
        {sourceLayer, helloTable, worldTable, foodTable}: StepFunctionsConstructProps
    ) {
        super(scope, id);
        this.appName = scope.node.tryGetContext('appName') || "Bank-CQRS";
        const helloStep = new Function(this, `helloStep-Handler`, {
            code: Code.fromAsset(resolve(__dirname, '../api/dist'), {
                exclude: ['node_modules'],
            }),
            handler: 'steps-function/hello.handler',
            memorySize: 1024,
            timeout: Duration.seconds(5),
            runtime: Runtime.NODEJS_16_X,
            layers: [sourceLayer],
            environment: {
                NODE_PATH: '$NODE_PATH:/opt',
                HELLO_TABLE_ARN: helloTable.tableArn,
                HELLO_TABLE_NAME: helloTable.tableName,
                REGION: 'ap-southeast-1' 
            },
        });
        helloTable.grantReadWriteData(helloStep);
        //Lambda invocation for print hello
        const helloStepInvocation = new LambdaInvoke(this, 'Print hello step', {
            lambdaFunction: helloStep,
            inputPath: '$',
            outputPath: '$',
        });
        const worldStep = new Function(this, `worldStep-Handler`, {
            code: Code.fromAsset(resolve(__dirname, '../api/dist'), {
                exclude: ['node_modules'],
            }),
            handler: 'steps-function/world.handler',
            memorySize: 1024,
            timeout: Duration.seconds(5),
            runtime: Runtime.NODEJS_16_X,
            layers: [sourceLayer],
            environment: {
                NODE_PATH: '$NODE_PATH:/opt',
                WORLD_TABLE_ARN: worldTable.tableArn,
                WORKD_TABLE_NAME: worldTable.tableName,
                REGION: 'ap-southeast-1'
            },
        });
        worldTable.grantReadWriteData(worldStep);
        //Lambda invocation for print world
        const worldStepInvocation = new LambdaInvoke(this, 'Print world step', {
            lambdaFunction: worldStep,
            inputPath: '$',
            outputPath: '$',
        });
          
        const foodStep = new Function(this, `foodStep-Handler`, {
            code: Code.fromAsset(resolve(__dirname, '../api/dist'), {
                exclude: ['node_modules'],
            }),
            handler: 'steps-function/food.handler',
            memorySize: 1024,
            timeout: Duration.seconds(5),
            runtime: Runtime.NODEJS_16_X,
            layers: [sourceLayer],
            environment: {
                NODE_PATH: '$NODE_PATH:/opt',
                FOOD_TABLE_ARN: foodTable.tableArn,
                FOOD_TABLE_NAME: foodTable.tableName,
                REGION: 'ap-southeast-1'
            },
        });
        const foodStepInvocation = new LambdaInvoke(this, 'Print food step', {
            lambdaFunction: foodStep,
            inputPath: '$',
            outputPath: '$'
        });

        const defaultErrorStep = new Function(this, `defaultErrorStep-Handler`, {
            code: Code.fromAsset(resolve(__dirname, '../api/dist'), {
                exclude: ['node_modules'],
            }),
            handler: 'steps-function/default-error.handler',
            memorySize: 1024,
            timeout: Duration.seconds(5),
            runtime: Runtime.NODEJS_16_X,
            layers: [sourceLayer],
            environment: {
                NODE_PATH: '$NODE_PATH:/opt'
            },
        });
        
        const defaultErrorStepStepInvocation = new LambdaInvoke(this, 'Default error step', {
            lambdaFunction: defaultErrorStep,

            // payload: {
            //     type: InputType.OBJECT,
            //     value: {
            //         "Input.$": "$",
            //         "Context.$": "$$"
            //     }
            // }
            payload: TaskInput.fromObject({
                token: JsonPath.taskToken,
                request: JsonPath.entirePayload,
                "Input.$": "$",
                "Context.$": "$$"
            }),
            // integrationPattern: IntegrationPattern.WAIT_FOR_TASK_TOKEN,
            // timeout: Duration.minutes(TIMEOUT_WAIT_REPLY_SECONDS),
            resultPath: '$.lambda',
        });
        // defaultErrorStepStepInvocation.next(worldStepInvocation);

        // worldStepInvocation.addCatch(defaultErrorStepStepInvocation, {errors: ['States.ALL']});
        // helloStepInvocation.addCatch(defaultErrorStepStepInvocation, {errors: ['States.ALL']});
        // foodStepInvocation.addCatch(defaultErrorStepStepInvocation, {errors: ['States.ALL']});

        this._stateMachine = new StateMachine(this, 'step-function-exam', {
            definition: helloStepInvocation.next(worldStepInvocation).next(foodStepInvocation).next(new Succeed(this, 'step function done'))
        });
    }
}