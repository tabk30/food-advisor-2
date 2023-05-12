import { Injectable } from '@nestjs/common';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

@Injectable()
export class DynamodbService {
    public db: DynamoDBClient;

    constructor() {
        this.db = process.env.dynamodb_end_point ? new DynamoDBClient({
            endpoint: process.env.dynamodb_end_point
        }) : new DynamoDBClient({ region: process.env.dynamodb_region });
    }
}