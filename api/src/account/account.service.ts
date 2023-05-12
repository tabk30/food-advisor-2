import { Injectable } from '@nestjs/common';
import { UpdateAccountDto } from './dto/update-account.dto';
import { DynamodbService } from '../services/dynamodb/dynamodb.service';
import { BatchWriteItemCommand, BatchWriteItemCommandInput, QueryCommand, QueryCommandInput } from '@aws-sdk/client-dynamodb';
import { Account, EventType } from './entities/account.entity';
import * as moment from 'moment';
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
    const events = res.Items.map(item => unmarshall(item));
    
    const snapshotIndex = events.findIndex(event => event.type == EventType.SNAPSHOT);
    const snapshot = events[snapshotIndex];
    const eventsSinceSnapshot = _.reverse(_.range(0, snapshotIndex).map(idx => events[idx]))
    console.log("getAccount eventsSinceSnapshot", eventsSinceSnapshot.length);
    const currentState = _.reduce(eventsSinceSnapshot, (state, event) => {
      console.log("getAccount", event, state);
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

  public async addEvent (
    id: string, 
    event: {type: string, amount: number, balance: number},
    snapshot: any,
    eventsSinceSnapshot: any[]
  ) {
    const lastVersion = _.maxBy([ snapshot, ...eventsSinceSnapshot], 'version').version
    let items: any[] = [
      {
        PutRequest: {
          Item: {
            id: { S: id },
            version: { N:  lastVersion + 1},
            type: { S: event.type },
            amount: {N: event.amount},
            timestamp: { N: `${moment().valueOf()}` }
          },
        }
      }
    ]
    if(eventsSinceSnapshot.length >= 3) {
      items.push({
        PutRequest: {
          Item: {
            id: { S: id },
            version: { N:  lastVersion + 2},
            type: { S: EventType.SNAPSHOT },
            payload: {M: marshall({id: id, balance: event.balance, name: snapshot.payload.name})},
            timestamp: { N: `${moment().valueOf()}` }
          },
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
