import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UpdateAccountDto } from './dto/update-account.dto';
import { DynamodbService } from '../services/dynamodb/dynamodb.service';
import { BatchWriteItemCommand, BatchWriteItemCommandInput, GetItemCommand, GetItemCommandInput, PutItemCommand, PutItemCommandInput, QueryCommand, QueryCommandInput } from '@aws-sdk/client-dynamodb';
import { Account, EventType } from './entities/account.entity';
import moment from 'moment';
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import * as _ from "lodash";
import { AggregateAccount } from './entities/aggregate-account.entity';

const { COMMAND_ACCOUNT_TABLE, QUERY_ACCOUNT_TABLE } = process.env

@Injectable()
export class AccountService {
  constructor(private readonly db: DynamodbService){}
  async create(account: AggregateAccount): Promise<string> {
    let params: BatchWriteItemCommandInput = {
      RequestItems: {
        [COMMAND_ACCOUNT_TABLE]: [
          {
            PutRequest: {
              Item: marshall({
                id: account.id,
                type: EventType.CREATED,
                version: 1,
                timestamp: moment().valueOf(),
                payload: {
                  id: account.payload.id,
                  name: account.payload.name,
                  balance: account.payload.balance
                }
              }),
            }
          },
          {
            PutRequest: {
              Item: marshall({
                id: account.id,
                type: EventType.SNAPSHOT,
                version: 2,
                timestamp: moment().valueOf(),
                payload: {
                  id: account.payload.id,
                  name: account.payload.name,
                  balance: account.payload.balance
                }
              }),
            }
          },
        ]
      }
    };

    await this.db.db.send(new BatchWriteItemCommand(params));

    return account.id;
  }

  public async getAccount(id: string) {
    let query: QueryCommandInput = {
      KeyConditionExpression: 'id = :s',
      ExpressionAttributeValues: {
        ':s': {S: id}
      },
      TableName: COMMAND_ACCOUNT_TABLE,
      Limit: 5,
      ConsistentRead: true,
      ScanIndexForward: false
    }
    const res = await this.db.db.send(new QueryCommand(query));
    if(res.Count == 0) throw new HttpException({status: HttpStatus.NOT_FOUND, error: "Account not found"}, HttpStatus.NOT_FOUND);
    const events = res.Items.map(item => unmarshall(item));
    
    const snapshotIndex = events.findIndex(event => event.type == EventType.SNAPSHOT);
    const snapshot = events[snapshotIndex];
    const eventsSinceSnapshot = _.reverse(_.range(0, snapshotIndex).map(idx => events[idx]))
    
    const currentState = _.reduce(eventsSinceSnapshot, (state, event) => {
      if (event.type === EventType.WITHDRAW) {
        state.balance -= event.amount
        return state
      } else if (event.type === EventType.CREDIT) {
        state.balance += event.amount
        return state
      } else {
        return state
      }
    }, { id: snapshot.payload.id, balance: snapshot.payload.balance, name: snapshot.payload.name })
    return {
      currentState,
      snapshot,
      eventsSinceSnapshot
    };
  }

  public async addEvent(
    id: string,
    event: { type: string, amount: number, balance: number },
    snapshot: any,
    eventsSinceSnapshot: any[]
  ) {
    const lastVersion = _.maxBy([snapshot, ...eventsSinceSnapshot], 'version').version
    let items: any[] = [
      {
        PutRequest: {
          Item: marshall({
            id: id,
            version: lastVersion + 1,
            type: event.type,
            amount: event.amount,
            timestamp: `${moment().valueOf()}`
          }),
        }
      }
    ]
    if (eventsSinceSnapshot.length >= 3) {
      items.push({
        PutRequest: {
          Item: marshall({
            id: id,
            version: lastVersion + 2,
            type: EventType.SNAPSHOT,
            payload: { id: id, balance: event.balance, name: snapshot.payload.name },
            timestamp: `${moment().valueOf()}`
          })
        }
      });
    }

    let params: BatchWriteItemCommandInput = {
      RequestItems: {
        [COMMAND_ACCOUNT_TABLE]: items
      }
    }
    await this.db.db.send(new BatchWriteItemCommand(params));
  }

  public async eventProcess (event: {id: string, version: number, type: string, amount?: number, payload?: {id: string, balance: number, name: string}}) {
    switch(event.type){
        case EventType.CREATED: 
            return await this.processCreateEvent(event.payload);
        case EventType.CREDIT: 
            return await this.processCreditEvent(event.id, event.amount);
        case EventType.WITHDRAW: 
            return await this.processWithdrawEvent(event.id, event.amount);
    }
}

  private async processCreateEvent(account: Account) {
    const param: PutItemCommandInput = {
      TableName: QUERY_ACCOUNT_TABLE,
      Item: marshall(account),
      ReturnConsumedCapacity: "TOTAL"
    }
    await this.db.db.send( new PutItemCommand(param));
  }

  private async processCreditEvent(id: string, amount: number) {
    let account = await this.getQueryAccout(id);
    account.balance = account.balance + amount;
    await this.updateQueryAccount(account);
  }

  private async processWithdrawEvent(id: string, amount: number) {
    let account = await this.getQueryAccout(id);
    account.balance = account.balance - amount;
    await this.updateQueryAccount(account);
  }

  private async getQueryAccout(id: string): Promise<Account> {
    const getItemParam: GetItemCommandInput = {
      TableName: QUERY_ACCOUNT_TABLE,
      Key: marshall({ id: id })
    }
    const item = await this.db.db.send(new GetItemCommand(getItemParam));
    if (!item.Item) throw new HttpException({
      status: HttpStatus.NOT_FOUND,
      error: 'Account not found!'
    }, HttpStatus.NOT_FOUND);
    let data = unmarshall(item.Item);
    return new Account(data.id, data.name, data.balance);
  }

  private async updateQueryAccount(account: Account): Promise<void> {
    const param: PutItemCommandInput = {
      TableName: QUERY_ACCOUNT_TABLE,
      Item: marshall({...account}),
      ReturnConsumedCapacity: "TOTAL"
    }
    await this.db.db.send( new PutItemCommand(param));
  }

  findAll() {
    return `This action returns all account`;
  }

  async findOne(id: string): Promise<Account> {
    let query: QueryCommandInput = {
      KeyConditionExpression: 'id = :s',
      ExpressionAttributeValues: {
        ':s': {S: id}
      },
      TableName: COMMAND_ACCOUNT_TABLE
    }
    let res = await this.db.db.send(new QueryCommand(query));
    let events = res.Items
    
    return;
  }

  update(id: number, updateAccountDto: UpdateAccountDto) {
    return `This action updates a #${id} account`;
  }

  remove(id: number) {
    return `This action removes a #${id} account`;
  }
}
