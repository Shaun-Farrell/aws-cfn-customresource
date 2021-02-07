"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWebBucket = exports.deleteAPIStage = exports.configTemplate = exports.createDeployment = exports.popultateWebFiles = exports.createBucketForWeb = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const region = process.env.AWS_REGION;
const BASE_WEB_DIR = "base";
const apigateway = new aws_sdk_1.default.APIGateway({
    region,
});
const s3 = new aws_sdk_1.default.S3({
    region,
});
const createBucketForWeb = async (stageName) => {
    try {
        await s3.createBucket({ Bucket: `spa-project-${stageName}` }).promise();
    }
    catch (err) {
        console.log("bucket exists already, we can just update, info: ", err);
    }
    var webParams = {
        Bucket: `spa-project-${stageName}`,
        ContentMD5: "",
        WebsiteConfiguration: {
            ErrorDocument: {
                Key: "index.html",
            },
            IndexDocument: {
                Suffix: "index.html",
            },
        },
    };
    await s3.putBucketWebsite(webParams).promise();
};
exports.createBucketForWeb = createBucketForWeb;
const copyFileToBucket = async (stageName, sourceBucket, key) => {
    var params = {
        Bucket: `spa-project-${stageName}`,
        CopySource: `${sourceBucket}/${key}`,
        Key: key.replace(`${BASE_WEB_DIR}/`, ""),
        ACL: "public-read",
    };
    await s3.copyObject(params).promise();
};
const writeFileToBucket = async (stageName, key, restApiId) => {
    const url = `https://${restApiId}.execute-api.${region}.amazonaws.com/${stageName}`;
    var params = {
        Bucket: `spa-project-${stageName}`,
        Body: exports.configTemplate(url),
        Key: key.replace(`${BASE_WEB_DIR}/`, ""),
        ACL: "public-read",
    };
    await s3.putObject(params).promise();
};
const popultateWebFiles = async (stageName, sourceBucket, restApiId) => {
    const resp = await s3.listObjects({ Bucket: sourceBucket }).promise();
    for (let file of resp.Contents) {
        if (file.Key === `${BASE_WEB_DIR}/config.js`) {
            await writeFileToBucket(stageName, file.Key, restApiId); // Updating apiUrl
        }
        else if (file.Key.startsWith(BASE_WEB_DIR)) {
            await copyFileToBucket(stageName, sourceBucket, file.Key);
        }
    }
};
exports.popultateWebFiles = popultateWebFiles;
const createDeployment = async (restApiId, stageName) => {
    await apigateway.createDeployment({ restApiId, stageName }).promise();
    return `https://${restApiId}.execute-api.${region}.amazonaws.com/${stageName}/`;
};
exports.createDeployment = createDeployment;
const configTemplate = (url) => `
var apiUrl = "${url}";
`;
exports.configTemplate = configTemplate;
const deleteAPIStage = async (stageName, restApiId) => {
    await apigateway.deleteStage({ restApiId, stageName }).promise();
};
exports.deleteAPIStage = deleteAPIStage;
const deleteWebBucket = async (stageName) => {
    const Bucket = `spa-project-${stageName}`;
    const resp = await s3.listObjects({ Bucket }).promise();
    const items = resp.Contents.map((obj) => ({ Key: obj.Key }));
    const params = { Bucket, Delete: { Objects: items } };
    await s3.deleteObjects(params).promise();
    await s3.deleteBucket({ Bucket }).promise();
};
exports.deleteWebBucket = deleteWebBucket;
