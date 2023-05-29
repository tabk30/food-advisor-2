import { CfnOutput } from "aws-cdk-lib";
import { AuthorizationType, CognitoUserPoolsAuthorizer, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import { Function } from "aws-cdk-lib/aws-lambda";


export interface ApiGatewayConstructProp { }
export class ApiGatewayConstruct extends Construct {
    private _api: RestApi;
    constructor(
        scope: Construct,
        id: string
    ) {
        super(scope, id);
        this.initApiGW();
    }

    private initApiGW() {
        this._api = new RestApi(this, 'app-api-gateway', {
            deploy: true
        });
        new CfnOutput(this, 'apiUrl', { value: this._api.url });
    }

    public addResource(lambda: Function, path: string, method: string, userPool?: UserPool) {
        if (userPool) {
            const auth = new CognitoUserPoolsAuthorizer(this, 'cognito-api-request-authorizer', {
                cognitoUserPools: [userPool]
            });
            const accountResource = this._api.root.addResource(path, {
                defaultMethodOptions: {
                    authorizationType: AuthorizationType.COGNITO
                }
            });
            accountResource.addMethod(method, new LambdaIntegration(lambda), {
                methodResponses: [{
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Content-Type': true,
                        'method.response.header.Access-Control-Allow-Origin': true,
                    },
                }],
                authorizer: auth,
                authorizationType: AuthorizationType.COGNITO,
            },);
        } else {
            const resource = this._api.root.addResource(path);
            resource.addMethod(method, new LambdaIntegration(lambda));
        }
    }
}