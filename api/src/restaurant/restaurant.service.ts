import { Injectable } from '@nestjs/common';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { DynamodbService } from './../services/dynamodb/dynamodb.service';
import { Restaurant } from './entities/restaurant.entity';
import { v4 } from 'uuid';
import * as moment from 'moment';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

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
        name: { S: tmpData.name },
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
    const input = {
      TableName: this._tableName,
      Key: {
        restaurant_id: { S: hash },
        created_at_ts: { N: range }
      }
    };

    try {
      let res = await this._ddbCLient.send(new GetItemCommand(input))
      if (!res.Item) throw Error(`Restaurant ${hash} not found!`);
      return {
        restaurant_id: res.Item["restaurant_id"].S,
        name: res.Item["name"].S,
        created_at_ts: parseInt(res.Item["created_at_ts"].N)
      };
    } catch (error) {
      throw error
    }
  }

  update(id: number, updateRestaurantDto: UpdateRestaurantDto) {
    return `This action updates a #${id} restaurant`;
  }

  remove(id: number) {
    return `This action removes a #${id} restaurant`;
  }
}
