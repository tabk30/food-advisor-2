#!/bin/sh
trap "exit 1" INT

AWS_ENDPOINT_URL=${AWS_ENDPOINT_URL:-http://localhost:9229}

USER_POOL="MyUserPool";
aws configure
echo "Creating user pool $USER_POOL"
aws --endpoint-url ${AWS_ENDPOINT_URL} cognito-idp create-user-pool \
    --pool-name ${USER_POOL} \
    > /dev/null 2> /dev/null

USER_POOL_CLIENT="MyUserPoolClient";
echo "Creating user pool client $USER_POOL_CLIENT"
aws --endpoint-url ${AWS_ENDPOINT_URL} cognito-idp create-user-pool-client \
    --user-pool-id ${USER_POOL} \
    --client-name ${USER_POOL_CLIENT}
    > /dev/null 2> /dev/null

wait

trap - INT