import { Injectable } from '@nestjs/common';
import { BatchWriteItemCommand, BatchWriteItemCommandInput, DynamoDBClient, PutItemCommand, ReturnConsumedCapacity, WriteRequest } from "@aws-sdk/client-dynamodb";
import { EventDescriptor } from '@src/src/core/event-descriptor';
import { objecToItem } from './utillities/object-to-item';

@Injectable()
export class DynamodbService {
    public db: DynamoDBClient;

    constructor() {
        this.db = process.env.dynamodb_end_point ? new DynamoDBClient({
            endpoint: process.env.dynamodb_end_point
        }) : new DynamoDBClient({ region: process.env.dynamodb_region });
    }

    public async saveEvents(tableName: string, events: EventDescriptor[]){
        for(let _event of events) {
            const params = {
                TableName: tableName,
                Item: {
                    guid: {S: _event.aggregateGuid},
                    version: {N: `${_event.version}`},
                    aggregateName: {S: _event.aggregateName},
                    eventName: {S: _event.eventName},
                    payload: {M: objecToItem( _event.payload)},
                }
            };
            await this.db.send(new PutItemCommand(params));

        }
        return events.length;
    }
}