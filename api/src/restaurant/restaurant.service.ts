import { Injectable } from '@nestjs/common';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { DynamoDBClient, PutItemCommand, PutItemCommandInput, QueryCommand, QueryCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { Restaurant } from './entities/restaurant.entity';

const { QUERY_RESTAURANT_TABLE } = process.env;

@Injectable()
export class RestaurantService {
  private _db: DynamoDBClient;
  constructor() {
    this._db = process.env.dynamodb_end_point ? new DynamoDBClient({
      endpoint: process.env.dynamodb_end_point,
      region: process.env.region
    }) : new DynamoDBClient({ region: process.env.region });
  }
  async create(createRestaurantDto: CreateRestaurantDto): Promise<string> {
    let entity = new Restaurant(
      createRestaurantDto.name
    );
    const params: PutItemCommandInput = {
      TableName: QUERY_RESTAURANT_TABLE,
      Item: marshall({...entity})
    };
    const res = await this._db.send(new PutItemCommand(params));
    console.log("create", res);
    return entity.id;
  }

  async addReview(review: {restaurant_id: string, account_id: string}): Promise<void> {
    let param: QueryCommandInput = {
      TableName: QUERY_RESTAURANT_TABLE,
      KeyConditionExpression: "id = :id",
      ExpressionAttributeValues: marshall({
        ":id": review.restaurant_id
      })
    };
    let res = await this._db.send(new QueryCommand(param));
    console.log("addReview", res);
  }

  findAll() {
    return `This action returns all restaurant`;
  }

  findOne(id: number) {
    return `This action returns a #${id} restaurant`;
  }

  update(id: number, updateRestaurantDto: UpdateRestaurantDto) {
    return `This action updates a #${id} restaurant`;
  }

  remove(id: number) {
    return `This action removes a #${id} restaurant`;
  }
}
