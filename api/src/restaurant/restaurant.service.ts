import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { DynamodbService } from './../services/dynamodb/dynamodb.service';
import { Restaurant } from './entities/restaurant.entity';
import { v4 } from 'uuid';
import * as moment from 'moment';
import { DeleteItemCommand, DeleteItemCommandInput, DynamoDBClient, GetItemCommand, GetItemCommandInput, PutItemCommand, UpdateItemCommand, UpdateItemCommandInput } from '@aws-sdk/client-dynamodb';
import { promises } from 'dns';

@Injectable()
export class RestaurantService {
  private readonly _tableName: string = process.env.RETAURANT_TABLE_NAME ? process.env.RETAURANT_TABLE_NAME : 'restaurants';
  private readonly _ddbCLient: DynamoDBClient;
  constructor(dynamoDB: DynamodbService) {
    this._ddbCLient = dynamoDB.db;
  }
  async create(createRestaurantDto: CreateRestaurantDto): Promise<Restaurant> {
    let tmpData: Restaurant = {
      restaurant_id: v4(),
      name: createRestaurantDto.name,
      created_at_ts: moment().valueOf()
    };

    const params = {
      TableName: this._tableName,
      Item: {
        restaurant_id: { S: tmpData.restaurant_id },
        restaurant_name: { S: tmpData.name },
        created_at_ts: { N: `${tmpData.created_at_ts}` }
      },
    };
    await this._ddbCLient.send(new PutItemCommand(params));
    return tmpData;
  }

  async findAll(): Promise<Restaurant[]> {

    return []
  }

  async findOne(hash: string, range: string): Promise<Restaurant> {
    const input:GetItemCommandInput = {
      TableName: this._tableName,
      Key: {
        restaurant_id: { S: hash },
        created_at_ts: { N: range }
      },
      
    };

    
    let res = await this._ddbCLient.send(new GetItemCommand(input))
    if (!res.Item) throw new HttpException({
      status: HttpStatus.NOT_FOUND,
      error: `Restaurant ${hash} not found!`
    }, HttpStatus.NOT_FOUND);
    return {
      restaurant_id: res.Item["restaurant_id"].S,
      name: res.Item["restaurant_name"].S,
      created_at_ts: parseInt(res.Item["created_at_ts"].N)
    };
  }

  async update(hash: string, range: string, updateRestaurantDto: UpdateRestaurantDto): Promise<Restaurant> {
    const input: UpdateItemCommandInput = {
      TableName: this._tableName,
      Key: {
        restaurant_id: { S: hash },
        created_at_ts: { N: range }
      },
      UpdateExpression: "set restaurant_name = :t",
      ExpressionAttributeValues: {
        ":t": { S: updateRestaurantDto.name }
      },
      ReturnValues: "ALL_NEW"
    };
    
    const res = await this._ddbCLient.send(new UpdateItemCommand(input));
    
    return {
      restaurant_id: res.Attributes["restaurant_id"].S,
      name: res.Attributes["restaurant_name"].S,
      created_at_ts: parseInt(res.Attributes["created_at_ts"].N)
    };
  }

  async remove(hash: string, range: string) {
    const input: DeleteItemCommandInput = {
      TableName: this._tableName,
      Key: {
        restaurant_id: {S: hash},
        created_at_ts: {N: range}
      }
    };
    const res = await this._ddbCLient.send(new DeleteItemCommand(input));

    return {
      restaurant_id: hash,
    };
  }
}
