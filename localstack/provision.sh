#!/bin/sh

ENDPOINT=http://localhost:4566
REGION=eu-west-2
LAMBDA_ROLE_ARN="arn:aws:iam::000000000000:role/lambda-execution-role"

echo "Creating Sining Key..."
aws --endpoint-url=${ENDPOINT} kms create-key \
    --region ${REGION} \
    --key-usage SIGN_VERIFY \
    --key-spec ECC_NIST_P256 \
    --tags '[{"TagKey":"_custom_key_material_","TagValue":"MHcCAQEEIKexbdPE2TDYzOuasfwN4QWNqHF1wNsV30ERMPPaRYnWoAoGCCqGSM49AwEHoUQDQgAE+NKi4QpYV/avqTFFoldRIYEZaRgKF/qv+xJsek63Eh2cKn922zlJHj2KglzSlLm439BfFYGDYVet6W7pkvIYfg=="},{"TagKey":"_custom_id_","TagValue":"fe960654-cdc9-4580-9368-8c58c3865a46"}]'

echo "Creating Key Alias..."
aws --endpoint-url=${ENDPOINT} kms create-alias \
    --region ${REGION} \
    --alias-name alias/localSigningKeyAlias \
    --target-key-id fe960654-cdc9-4580-9368-8c58c3865a46

echo "Creating JWKS Bucket..."
aws --endpoint-url=${ENDPOINT} s3api create-bucket --bucket jwks --create-bucket-configuration LocationConstraint=${REGION} --region ${REGION}

echo "Creating Status List Bucket..."
aws --endpoint-url=${ENDPOINT} s3api create-bucket --bucket status-list --create-bucket-configuration LocationConstraint=${REGION} --region ${REGION}

echo "Creating Issue Function..."
cd /tmp/lambda-code/functions
zip -r /tmp/function.zip issueHandler.js
cd -
aws --endpoint-url=${ENDPOINT} lambda create-function \
  --function-name IssueFunction \
  --runtime nodejs22.x \
  --zip-file fileb:///tmp/function.zip \
  --handler issueHandler.handler \
  --role ${LAMBDA_ROLE_ARN}
LAMBDA_ARN=$(aws --endpoint-url=${ENDPOINT} lambda list-functions --query "Functions[?FunctionName==\`IssueFunction\`].FunctionArn" --output text --region $REGION)

aws --endpoint-url=${ENDPOINT} lambda create-function-url-config \
    --function-name IssueFunction \
    --auth-type NONE

echo "Creating API Gateway..."
API_ID=$(aws --endpoint-url=${ENDPOINT} apigateway create-rest-api \
    --name "Local API" \
    --query "id" \
    --output text)

ROOT_ID=$(aws --endpoint-url=${ENDPOINT} apigateway get-resources \
    --rest-api-id $API_ID \
    --query "items[0].id" \
    --output text)

RESOURCE_ID=$(aws --endpoint-url=${ENDPOINT} apigateway get-resources --rest-api-id $API_ID --query 'items[?path==`/`].id' --output text --region $REGION)

aws --endpoint-url=${ENDPOINT} apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method POST \
    --authorization-type "NONE" \
    --region $REGION

aws --endpoint-url=${ENDPOINT} apigateway put-integration \
    --region $REGION \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations \
    --passthrough-behavior WHEN_NO_MATCH \
    --region $REGION

aws --endpoint-url=${ENDPOINT}  apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name local \
    --region $REGION

echo "API available at: ${ENDPOINT}/restapis/$API_ID/local/_user_request_/"