import { RemovalPolicy } from "aws-cdk-lib";
import { AttributeType, BillingMode, StreamViewType, Table } from "aws-cdk-lib/aws-dynamodb";
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

    private _queryRestaurantTable: Table;
    public get queryRestaurantTable(): Table {
        return this._queryRestaurantTable;
    }

    private _queryReviewTable: Table;
    public get queryReviewTable(): Table {
        return this._queryReviewTable;
    }

    private _helloTable: Table;
    public get helloTable(): Table {
        return this._helloTable;
    }

    private _worldTable: Table;
    public get worldTable(): Table {
        return this._worldTable;
    }

    private _foodTable: Table;
    public get foodTable(): Table {
        return this._foodTable;
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
            stream: StreamViewType.NEW_AND_OLD_IMAGES,
        });
        this._queryAccountTable = new Table(this, 'queryAccount', {
            billingMode: BillingMode.PAY_PER_REQUEST,
            removalPolicy: RemovalPolicy.DESTROY,
            partitionKey: { name: 'id', type: AttributeType.STRING }
        });
        this._queryRestaurantTable = new Table(this, 'queryRestaurant', {
            billingMode: BillingMode.PAY_PER_REQUEST,
            removalPolicy: RemovalPolicy.DESTROY,
            partitionKey: { name: 'id', type: AttributeType.STRING }
        });
        this._queryReviewTable = new Table(this, 'queryReview', {
            billingMode: BillingMode.PAY_PER_REQUEST,
            removalPolicy: RemovalPolicy.DESTROY,
            partitionKey: { name: 'id', type: AttributeType.STRING },
            sortKey: { name: 'sort', type: AttributeType.NUMBER }
        });
        this._helloTable = new Table(this, 'helloTable', {
            billingMode: BillingMode.PAY_PER_REQUEST,
            removalPolicy: RemovalPolicy.DESTROY,
            partitionKey: { name: 'id', type: AttributeType.STRING },
        });
        this._worldTable = new Table(this, 'worldTable', {
            billingMode: BillingMode.PAY_PER_REQUEST,
            removalPolicy: RemovalPolicy.DESTROY,
            partitionKey: { name: 'id', type: AttributeType.STRING },
        });
        this._foodTable = new Table(this, 'foodTable', {
            billingMode: BillingMode.PAY_PER_REQUEST,
            removalPolicy: RemovalPolicy.DESTROY,
            partitionKey: { name: 'id', type: AttributeType.STRING },
        });
    }
    public grantAccountConnect(lambdaConnect: Function) {
        this._commandAccountTable.grantReadWriteData(lambdaConnect);
        this._queryAccountTable.grantReadWriteData(lambdaConnect);
    }

    public grantRestaurantConnect(lambda: Function) {
        this._queryRestaurantTable.grantReadWriteData(lambda);
    }

    public grantReviewConnect(lambda: Function) {
        this._queryReviewTable.grantReadWriteData(lambda);
    }
}