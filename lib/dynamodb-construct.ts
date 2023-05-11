import { RemovalPolicy } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Function } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export interface DynamoDBInterface {
    lambdaConnect: Function;
}

export class DynamoDBConstruct extends Construct {
    private readonly appName: string;
    private _restaurantTable: Table;
    public get restaurant(): Table {
        return this._restaurantTable;
    }
    constructor(
        private readonly scope: Construct,
        private readonly id: string
    ) {
        super(scope, id);
        this.appName = scope.node.tryGetContext('appName') || "Food-Advisor";
        this.createTable();
    }

    private createTable() {
        this._restaurantTable = new Table(this, `restaurants`, {
            billingMode: BillingMode.PAY_PER_REQUEST,
            removalPolicy: RemovalPolicy.DESTROY,
            partitionKey: { name: 'guid', type: AttributeType.STRING },
            sortKey: { name: 'version', type: AttributeType.NUMBER },
        });
    }
    public grantConnect(lambdaConnect: Function) {
        this._restaurantTable.grantReadWriteData(lambdaConnect);
    }
}