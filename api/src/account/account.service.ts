import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BatchWriteItemCommand, BatchWriteItemCommandInput, DynamoDBClient, GetItemCommand, GetItemCommandInput, PutItemCommand, PutItemCommandInput, QueryCommand, QueryCommandInput, ScanCommand, ScanCommandInput } from '@aws-sdk/client-dynamodb';
import { Account, EventType } from './entities/account.entity';
import moment from 'moment';
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import * as _ from "lodash";
import { AggregateAccount } from './entities/aggregate-account.entity';
import { SFNClient, CreateActivityCommand, CreateActivityCommandInput, StartExecutionCommand, StartExecutionCommandInput } from "@aws-sdk/client-sfn";

const { COMMAND_ACCOUNT_TABLE, QUERY_ACCOUNT_TABLE, STEP_FUNCTION_URL, STEP_FUNCTION_ARN, region } = process.env

@Injectable()
export class AccountService {
  private _db: DynamoDBClient;
  private _stepFunction: SFNClient;
  constructor() {
    this._db = process.env.dynamodb_end_point ? new DynamoDBClient({
      endpoint: process.env.dynamodb_end_point
    }) : new DynamoDBClient({ region: process.env.dynamodb_region });

    this._stepFunction = STEP_FUNCTION_URL ? new SFNClient({ endpoint: STEP_FUNCTION_URL, region: region }) : new SFNClient({region});
  }
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

    await this._db.send(new BatchWriteItemCommand(params));

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
    const res = await this._db.send(new QueryCommand(query));
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
            timestamp: moment().valueOf()
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
            timestamp: moment().valueOf()
          })
        }
      });
    }

    let params: BatchWriteItemCommandInput = {
      RequestItems: {
        [COMMAND_ACCOUNT_TABLE]: items
      }
    }
    await this._db.send(new BatchWriteItemCommand(params));
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
    await this._db.send( new PutItemCommand(param));
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
    const item = await this._db.send(new GetItemCommand(getItemParam));
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
    await this._db.send( new PutItemCommand(param));
  }

  public async findAll(query: {id?: string, balance_lt?: number, balance_gt?: number, name?: string}): Promise<Account[]> {
    let filterExpression: string;
    let expressionAtribute: {};
    let param: ScanCommandInput = {
      TableName: QUERY_ACCOUNT_TABLE
    };
    console.log("findAll", query);
    if (query.id || query.balance_lt || query.balance_gt || query.name) {
      filterExpression = "";
      expressionAtribute = {};
      if (query.id) {
        filterExpression = "id = :id ";
        expressionAtribute[":id"] = query.id;
      }
      if (query.balance_gt) {
        filterExpression = filterExpression + "balance >= :balance_gt ";
        expressionAtribute[":balance_gt"] = query.balance_gt;
      }

      if (query.balance_lt) {
        filterExpression = filterExpression + "balance <= :balance_lt ";
        expressionAtribute[":balance_lt"] = query.balance_lt;
      }

      if (query.name) {
        filterExpression = filterExpression + "contains (account_name, :account_name)";
        expressionAtribute[":account_name"] = query.name;
      }
      param.FilterExpression = filterExpression;
      param.ExpressionAttributeValues = marshall(expressionAtribute);
    }
    console.log("findAll", param);

    let res = await this._db.send(new ScanCommand(param));
    if (res.Count == 0) return [];
    return res.Items.map(_item => {
      let data = unmarshall(_item);
      return new Account(data.id, data.name, data.balance);
    });
  }

  public async syncToDynamoDB(input): Promise<void> {
    const params: StartExecutionCommandInput = {
      stateMachineArn: STEP_FUNCTION_ARN,
      input: JSON.stringify(input)
    };
    console.log("dynamoStreamEvent send to stepfunction", params);
    try {
      let res = await this._stepFunction.send(new StartExecutionCommand(params));
      console.log("dynamoStreamEvent step run result", res);
    } catch (error) {
      console.log("Send to step error", error);
    }
  }

  async findOne(id: string): Promise<Account> {
    return await this.getQueryAccout(id);
  }

  remove(id: number) {
    return `This action removes a #${id} account`;
  }
}
