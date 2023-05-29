import { Code, LayerVersion, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { resolve } from "path";

export class LambdaLayerConstruct extends Construct {
    private _sourceLayer: LayerVersion;
    public get layder1 ():LayerVersion {
        return this._sourceLayer;
    }
    constructor(
        scope: Construct,
        id: string
    ) {
        super(scope, id);
        this._sourceLayer = new LayerVersion(this, `application-lamdal-layer-1`, {
            code: Code.fromAsset(resolve(__dirname, '../lambda-layer-1/nodejs/node_modules')),
            compatibleRuntimes: [Runtime.NODEJS_16_X, Runtime.NODEJS_18_X],
            description: 'Api Handler Dependencies',
        });
    }   
    
}