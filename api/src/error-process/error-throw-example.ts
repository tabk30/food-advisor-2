// lambda.ts
import { Handler, Context } from 'aws-lambda';
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const handler: Handler = async (event: any, context: Context, callback: any) => {
    console.log("this is log");
    console.debug("this is debug log");
    console.error("this is error log");
    
    for(let i = 0; i<100000; i++) await timeout(3000);

    throw new Error('An unexpected error occurred');
};