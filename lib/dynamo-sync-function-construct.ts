import { Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Code, Runtime, Function, LayerVersion} from "aws-cdk-lib/aws-lambda";
import { resolve } from "path";

export interface DynamoSyncConstructProps {}
export class DynamoSyncConstruct extends Construct {
    private _dynamoLambdaHandler: Function;
    public get dynamoSyncLambda(): Function {
        return this._dynamoLambdaHandler;
    }
    constructor(
        private readonly scope: Construct,
        private readonly id: string) {
        super(scope, id);
        this.createDynmoSync();
    }
    private createDynmoSync():Function {
        this._dynamoLambdaHandler = new Function(this, 'Dynamo-Sync-Handler', {
            code: Code.fromAsset(resolve(__dirname, '../api/dist'), {
                exclude: ['node_modules'],
            }),
            handler: 'review/lambda.handler',
            memorySize: 1024,
            timeout: Duration.seconds(5),
            runtime: Runtime.NODEJS_16_X,
            environment: {
                NODE_PATH: '$NODE_PATH:/opt',
            },
        });
        return this._dynamoLambdaHandler
    }
}