import { Duration } from "aws-cdk-lib";
import { Alarm, ComparisonOperator } from "aws-cdk-lib/aws-cloudwatch";
import { Construct } from "constructs";
import { Code, Function, LayerVersion, Runtime } from "aws-cdk-lib/aws-lambda";
import { resolve } from "path";
import { FilterPattern, LogGroup, RetentionDays, SubscriptionFilter } from "aws-cdk-lib/aws-logs";
import { LambdaDestination } from "aws-cdk-lib/aws-logs-destinations";

export interface ErrorHandlerConstructProp {
    sourceLayer: LayerVersion
}

export class ErrorHandlerConstruct extends Construct {
    private _alarm: Alarm;
    public get alarm (): Alarm {
        return this._alarm
    }
    private _logProcess: Function;
    constructor(
        scope: Construct,
        id: string,
        { sourceLayer }: ErrorHandlerConstructProp
    ) {
        super(scope, id);

        this._logProcess = new Function(this, 'LogProcessingLambda', {
            handler: 'error-process/error-handler.handler',
            code: Code.fromAsset(resolve(__dirname, '../api/dist'), {
                exclude: ['node_modules'],
            }),
            layers: [sourceLayer],
            runtime: Runtime.NODEJS_16_X,
            memorySize: 128,
        });
        
    }

    public demoErrorFire(layder: LayerVersion):Function {
        const myFunction = new Function(this, 'demo-error-fire-function', {
            runtime: Runtime.NODEJS_16_X,
            memorySize: 1024,
            timeout: Duration.seconds(5),
            handler: 'error-process/error-throw-example.handler',
            code: Code.fromAsset(resolve(__dirname, '../api/dist'), {
                exclude: ['node_modules'],
            }),
            layers: [layder],
        });
        this.addAlarmTrigger(myFunction);
        return myFunction;
    }

    public addAlarmTrigger(lambda: Function) {
        
        // 👇 define a metric for lambda errors
        const functionErrors = lambda.metricErrors({
            period: Duration.minutes(1),
        });
        // 👇 define a metric for lambda invocations
        const functionInvocation = lambda.metricInvocations({
            period: Duration.minutes(1),
        });
        new Alarm(this, 'lambda-errors-alarm', {
            metric: functionErrors,
            threshold: 1,
            comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            evaluationPeriods: 1,
            alarmDescription: 'Alarm if the SUM of Errors is greater than or equal to the threshold (1) for 1 evaluation period',
        });

        // 👇 create an Alarm directly on the Metric
        functionInvocation.createAlarm(this, 'lambda-invocation-alarm', {
            threshold: 1,
            evaluationPeriods: 1,
            alarmDescription: 'Alarm if the SUM of Lambda invocations is greater than or equal to the  threshold (1) for 1 evaluation period',
        });
        lambda.logGroup.addSubscriptionFilter(`app-log-application`, {
            destination: new LambdaDestination(this._logProcess),
            filterPattern: FilterPattern.anyTerm('ERROR', 'Error', 'error', 'timed out', '404', '502')
            // filterPattern: FilterPattern.allEvents()
        });
    }

}