import { Context, Handler } from "aws-lambda";

export const handler: Handler = async (event: any, context: Context) => {
    console.log("dynamo event hander", event);
    return "handler";
}