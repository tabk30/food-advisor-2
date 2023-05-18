import { Injectable } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { DynamoDBClient, PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { Review } from './entities/review.entity';
import { marshall } from '@aws-sdk/util-dynamodb';
import { SQS } from '@aws-sdk/client-sqs';
import moment from 'moment';

const { QUERY_REVIEW_TABLE, REVIEW_QUENE } = process.env;

@Injectable()
export class ReviewService {
  private _db: DynamoDBClient;
  private _sqs: SQS;
  constructor() {
    this._db = process.env.dynamodb_end_point ? new DynamoDBClient({
      endpoint: process.env.dynamodb_end_point
    }) : new DynamoDBClient({ region: process.env.dynamodb_region });

    this._sqs = process.env.sqs_end_point ? new SQS({
      region: 'ap-southeast-1',
      endpoint: process.env.sqs_end_point
    }) : new SQS({
      region: 'ap-southeast-1'
    });
  }
  async create(createReviewDto: CreateReviewDto): Promise<string> {
    let review = new Review(createReviewDto.restaurant_id, createReviewDto.account_id, createReviewDto.content);
    const params: PutItemCommandInput = {
      TableName: QUERY_REVIEW_TABLE,
      Item: marshall({...review})
    };
    await this._db.send(new PutItemCommand(params));
    
    let sqsRes = await this._sqs.sendMessage({
      QueueUrl: `${process.env.sqs_end_point}/quene/${REVIEW_QUENE}`,
      MessageBody: 'NEW_REVIEW',
      MessageAttributes: {
        restaurant_id: {DataType: 'String', StringValue: createReviewDto.restaurant_id},
        review_account_id: {DataType: 'String', StringValue: createReviewDto.account_id},
        timestamp: {DataType: 'Number', StringValue: `${moment().valueOf()}`}
      }
    });
    console.log("send to sqs", sqsRes);
    return review.id;
  }

  findAll() {
    return `This action returns all review`;
  }

  findOne(id: number) {
    return `This action returns a #${id} review`;
  }

  update(id: number, updateReviewDto: UpdateReviewDto) {
    return `This action updates a #${id} review`;
  }

  remove(id: number) {
    return `This action removes a #${id} review`;
  }
}
