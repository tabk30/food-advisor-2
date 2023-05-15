// lambda.ts
import { Handler, Context } from 'aws-lambda';
// import { eventContext } from 'aws-serverless-express/middleware';

import serverlessExpress from '@vendia/serverless-express';

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';

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
            AppModule,
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
    const server = await bootstrap();
    return server(event, context, callback);
};