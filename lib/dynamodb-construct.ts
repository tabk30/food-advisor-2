import { RemovalPolicy } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Function } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export interface DynamoDBInterface {
    lambdaConnect: Function;
}

export class DynamoDBConstruct extends Construct {
    private readonly appName: string;
    private _queryAccountTable: Table;
    public get queryAccountTable(): Table {
        return this._queryAccountTable;
    }
    private _commandAccountTable: Table;
    public get commandAccountTable(): Table {
        return this._commandAccountTable;
    }
    constructor(
        private readonly scope: Construct,
        private readonly id: string
    ) {
        super(scope, id);
        this.appName = scope.node.tryGetContext('appName') || "Bank-CQRS";
        this.createTable();
    }

    private createTable() {
        this._commandAccountTable = new Table(this, `commandAccount`, {
            billingMode: BillingMode.PAY_PER_REQUEST,
            removalPolicy: RemovalPolicy.DESTROY,
            partitionKey: { name: 'id', type: AttributeType.STRING },
            sortKey: { name: 'version', type: AttributeType.NUMBER },
        });
        this._queryAccountTable = new Table(this, 'queryAccount', {
            billingMode: BillingMode.PAY_PER_REQUEST,
            removalPolicy: RemovalPolicy.DESTROY,
            partitionKey: { name: 'id', type: AttributeType.STRING }
        });
    }
    public grantConnect(lambdaConnect: Function) {
        this._commandAccountTable.grantReadWriteData(lambdaConnect);
        this._queryAccountTable.grantReadData(lambdaConnect);
    }
}