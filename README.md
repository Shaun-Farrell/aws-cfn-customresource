# Example using AWS CFN CustomResource to deploy API / Web (SPA)

## Preparation for Custom Resource Script

Install all the dependencies for this project:

```sh
npm run installAll
```

Create a Bucket for storing code assets. Use this bucket name in upcoming parameters.

```sh
aws s3 mb s3://tmp-store-assets
```

The lambda-code directory has the code for the CFN Cutom Resource.

Build, archive and copy the lambda-code to S3 in preparation to be referenced by CloudFormation:

```sh
npm run updateLambda --bucket=tmp-store-assets
```

Build and copy the spa-code to S3 bucket:

```sh
npm run updateSpa --bucket=tmp-store-assets
```

Setup the API Gateway API with the first command and get the API ID with the second:

```sh
aws cloudformation deploy --stack-name APIWeather --template-file ./api-setup/APITemplate.yaml --capabilities CAPABILITY_IAM
aws cloudformation describe-stacks --stack-name APIWeather | grep OutputValue
```

## Main Custom Resource Script

When calling the main CloudFormation (with Custom Resource), we pass in 3 parameters.
This deploys a new API stage and creates a bucket for the new website (Web URL returned as an output).

1. StageName. This is the name of the deployment for API GW, e.g dev
2. SourceBucket. The source of the files we prepared, e.g tmp-source-assets
3. APIID. The existing ID for the API GW, e.g t1abq2acpd

```sh
aws cloudformation deploy --stack-name CRDeployStack --template-file ./CRTemplate.yaml --capabilities CAPABILITY_IAM --parameter-overrides StageName=dev SourceBucket=tmp-store-assets APIID=1539pj949l
```

Get output as below:

```sh
aws cloudformation describe-stacks --stack-name CRDeployStack | grep OutputValue
```

Cleanup, delete the Stacks as below:

```sh
aws cloudformation delete-stack --stack-name APIWeather
aws cloudformation delete-stack --stack-name CRDeployStack
```

If you have purely web (SPA) code changes and want to trigger an Update.
Re-run the updateSpa command and then re-run the deploy with a different BuildId paramater.

```sh
npm run updateSpa --bucket=tmp-store-assets
aws cloudformation deploy --stack-name CRDeployStack --template-file ./CRTemplate.yaml --capabilities CAPABILITY_IAM --parameter-overrides StageName=v2 SourceBucket=tmp-store-assets APIID=1539pj949l BuildId=2
```
