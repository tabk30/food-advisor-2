import { Injectable } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { DynamoDBClient, PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { Review } from './entities/review.entity';
import { marshall } from '@aws-sdk/util-dynamodb';
import { SQS } from '@aws-sdk/client-sqs';
import moment from 'moment';
import { SNS } from '@aws-sdk/client-sns';

const { QUERY_REVIEW_TABLE, REVIEW_QUENE, sns_end_point, region, dynamodb_end_point, RESTAURANT_TOPIC_ARN } = process.env;

@Injectable()
export class ReviewService {
  private _db: DynamoDBClient;
  private _sns: SNS;
  constructor() {
    this._db = dynamodb_end_point ? new DynamoDBClient({
      endpoint: dynamodb_end_point,
      region: region
    }) : new DynamoDBClient({ region: region });
    console.log("init sns", sns_end_point, region);
    this._sns = sns_end_point ? new SNS({
      region: region,
      endpoint: sns_end_point
    }) : new SNS({
      region: region,
    });
  }
  async create(createReviewDto: CreateReviewDto): Promise<string> {
    let review = new Review(createReviewDto.restaurant_id, createReviewDto.account_id, createReviewDto.content);
    const params: PutItemCommandInput = {
      TableName: QUERY_REVIEW_TABLE,
      Item: marshall({...review})
    };
    await this._db.send(new PutItemCommand(params));
    console.log("sns arn", RESTAURANT_TOPIC_ARN);
    let sqsRes = await this._sns.publish({
      Message: JSON.stringify({
        type: 'create_review',
        restaurant_id: createReviewDto.restaurant_id,
        review_account_id: createReviewDto.account_id,
        timestamp: moment().valueOf(),
        default: createReviewDto.restaurant_id
      }),
      MessageStructure: 'json',
      TopicArn: RESTAURANT_TOPIC_ARN
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
