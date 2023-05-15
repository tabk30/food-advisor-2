import { Account, EventType } from "./account.entity";
import {v4} from "uuid";
import moment from 'moment';
import { marshall } from "@aws-sdk/util-dynamodb";

export class AggregateAccount {
    id: string;
    version: number;
    timestamp: number;
    type: string;
    payload: Account;
    amount: number;

    constructor();
    constructor(type?: string, id?: string, version?: number, timestamp?: number, payload?: any){
        this.id = id || v4();
        this.version = version || 1;
        this.type = type || EventType.CREATED;
        this.timestamp = timestamp || moment().valueOf();

        if(payload) this.payload = new Account(payload.id, payload.name, payload.balance);
    }

    public createAccount(accountName: string) {
        this.payload = new Account(this.id, accountName, 0);
    }

    public getPutItem() {
        return {
            Item: marshall({
                id: this.id,
                version: this.version,
                type: this.type,
                timestamp: this.timestamp,
                amount: this.amount,
                payload: {
                    id: this.payload.id,
                    name: this.payload.name,
                    balance: this.payload.balance
                }
            })
        }
    }

    
}