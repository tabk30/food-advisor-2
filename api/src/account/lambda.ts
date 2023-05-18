// lambda.ts
import { Handler, Context } from 'aws-lambda';

import serverlessExpress from '@vendia/serverless-express';

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AccountModule } from './account.module';
import {v4} from 'uuid';
import { ContextCreator } from '@nestjs/core/helpers/context-creator';

const express = require('express');

// NOTE: If you get ERR_CONTENT_DECODING_FAILED in your browser, this is likely
// due to a compressed response (e.g. gzip) which has not been handled correctly
// by aws-serverless-express and/or API Gateway. Add the necessary MIME types to
// binaryMimeTypes below

let cachedServer: Handler;

async function bootstrap() {
    if (!cachedServer) {
        const expressApp = express();
        const nestApp = await NestFactory.create(
            AccountModule,
            new ExpressAdapter(expressApp),
        );
        await nestApp.init();
        cachedServer = serverlessExpress({
            app: expressApp,
            eventSourceRoutes: {
                AWS_DYNAMODB: '/account/events/dynamodb'
            }
        });
    }
    return cachedServer;
}

export const handler = async (event: any, context: Context, callback: any) => {
    console.log("Account event", event);
    const server = await bootstrap();
    if (event.type == "step-function") {
        event = {
            "path": "/account/events/stepfunction",
            "httpMethod": "POST",
            "headers": {
                "Accept": "*/*",
                "Content-Type": "application/json"
            },
            "requestContext": {
                "resourceId": v4(),
                "resourcePath": "/{proxy+}",
                "httpMethod": "POST",
            },
            "body": JSON.stringify(event),
            "isBase64Encoded": false
        }
    }
    return server(event, context, callback);
};