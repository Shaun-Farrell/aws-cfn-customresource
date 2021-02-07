"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const cfnHelper_1 = __importDefault(require("./cfnHelper"));
const sdkHelper_1 = require("./sdkHelper");
/*
1. Create S3 bucket with website settings
2. Copy files to S3 from other bucket using copyObject - publicACL
3. Deploy APIG new stage
4. Adjust S3 config file to read correct APIGW
5. Return website URL to CFN for use as output
*/
const SUCCESS = "SUCCESS";
const FAILED = "FAILED";
const handler = async function (event, context) {
    const { StageName, SourceBucket, APIID } = event.ResourceProperties;
    const stageName = StageName.toLowerCase();
    if (event.RequestType === "Delete") {
        try {
            await sdkHelper_1.deleteWebBucket(stageName);
            await sdkHelper_1.deleteAPIStage(stageName, APIID);
            return await cfnHelper_1.default(event, context, SUCCESS);
        }
        catch (e) {
            const Error = e.message;
            return await cfnHelper_1.default(event, context, FAILED, { Error }, null, null, Error // Reason
            );
        }
    }
    const responseData = {};
    if (!StageName || !SourceBucket || !APIID) {
        responseData.Error = "Missing Params into the Lambda Callout";
        return await cfnHelper_1.default(event, context, FAILED, responseData, null, null, responseData.Error // Reason
        );
    }
    else {
        try {
            await sdkHelper_1.createBucketForWeb(stageName);
            await sdkHelper_1.popultateWebFiles(stageName, SourceBucket, APIID);
            const url = await sdkHelper_1.createDeployment(APIID, stageName);
            responseData.output = `http://spa-project-${stageName}.s3-website.${process.env.AWS_REGION}.amazonaws.com/`;
            return await cfnHelper_1.default(event, context, SUCCESS, responseData);
        }
        catch (e) {
            responseData.Error = e.message;
            return await cfnHelper_1.default(event, context, FAILED, responseData, null, null, responseData.Error // Reason
            );
        }
    }
};
exports.handler = handler;
