import { Function } from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { Topic } from "aws-cdk-lib/aws-sns";
import { SqsSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

export interface SNSSQSConstructProps {
    GLOBAL_TOPIC_SNS: string;
    ACCOUNT_TOPIC_SNS: string;
    RESTAURANT_TOPIC_SNS: string;
    REVIEW_TOPIC_SNS: string;
    ACCOUNT_QUEUE: string;
    RESTAURANT_QUEUE: string;
    REVIEW_QUEUE: string;
}

export class SNSSQSConstruct extends Construct {
    private readonly appName: string;
    private _globalSNSTopic: Topic;
    public get globalTopic ():Topic{
        return this._globalSNSTopic;
    }
    private _accountSNSTopic: Topic;
    public get acountTopic ():Topic{
        return this._accountSNSTopic;
    }
    private _restaurantSNSTopic: Topic;
    public get restaurantTopic ():Topic{
        return this._restaurantSNSTopic;
    }
    private _reviewSNSTopic: Topic;
    public get reviewTopic ():Topic{
        return this._reviewSNSTopic;
    }
    private _accountSqsQueue: Queue;
    public get accountQueue ():Queue{
        return this._accountSqsQueue;
    }
    private _restaurantSqsQueue: Queue;
    public get restaurantQueue ():Queue{
        return this._restaurantSqsQueue;
    }
    private _reviewSqsQueue: Queue;
    public get reviewQueue ():Queue{
        return this._reviewSqsQueue;
    }

    constructor(
        private readonly scope: Construct,
        private readonly id: string,
        {GLOBAL_TOPIC_SNS, ACCOUNT_TOPIC_SNS, RESTAURANT_TOPIC_SNS, REVIEW_TOPIC_SNS, ACCOUNT_QUEUE, RESTAURANT_QUEUE, REVIEW_QUEUE}: SNSSQSConstructProps
    ){
        super(scope, id);
        this.initSNS(GLOBAL_TOPIC_SNS, ACCOUNT_TOPIC_SNS, RESTAURANT_TOPIC_SNS, REVIEW_TOPIC_SNS);
        this.initSQS(ACCOUNT_QUEUE, RESTAURANT_QUEUE, REVIEW_QUEUE);
    }

    private initSNS(GLOBAL_TOPIC_SNS: string, ACCOUNT_TOPIC_SNS: string, RESTAURANT_TOPIC_SNS: string, REVIEW_TOPIC_SNS: string){
        this._globalSNSTopic = new Topic(this, GLOBAL_TOPIC_SNS, {
            displayName: GLOBAL_TOPIC_SNS,
        });
        this._accountSNSTopic = new Topic(this, ACCOUNT_TOPIC_SNS, {
            displayName: ACCOUNT_TOPIC_SNS
        });
        this._restaurantSNSTopic = new Topic(this, RESTAURANT_TOPIC_SNS, {
            displayName: RESTAURANT_TOPIC_SNS
        });
        this._reviewSNSTopic = new Topic(this, REVIEW_TOPIC_SNS, {
            displayName: REVIEW_TOPIC_SNS
        });
    }
    private initSQS(ACCOUNT_QUEUE: string, RESTAURANT_QUEUE: string, REVIEW_QUEUE: string) {
        this._accountSqsQueue = new Queue(this, ACCOUNT_QUEUE);
        this._globalSNSTopic.addSubscription(new SqsSubscription(this._accountSqsQueue));
        this._accountSNSTopic.addSubscription(new SqsSubscription(this._accountSqsQueue));
        this._restaurantSqsQueue = new Queue(this, RESTAURANT_QUEUE);
        this._restaurantSNSTopic.addSubscription(new SqsSubscription(this._restaurantSqsQueue));
        this._reviewSqsQueue = new Queue(this, REVIEW_QUEUE);
        this._reviewSNSTopic.addSubscription(new SqsSubscription(this._reviewSqsQueue));
    }

    public subscriptionAccountQueue(lambda: Function) {
        const eventSource = new SqsEventSource(this._accountSqsQueue);
        lambda.addEventSource(eventSource);
    }

    public subscriptionRestaurantQueue(lambda: Function) {
        const eventSource = new SqsEventSource(this._restaurantSqsQueue);
        lambda.addEventSource(eventSource);
    }

    public subscriptionReviewQueue(lambda: Function) {
        const eventSource = new SqsEventSource(this._restaurantSqsQueue);
        lambda.addEventSource(eventSource);
    }
}