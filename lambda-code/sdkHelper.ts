import AWS from "aws-sdk";
const region = process.env.AWS_REGION;
const BASE_WEB_DIR = "base";
const apigateway = new AWS.APIGateway({
  region,
});
const s3 = new AWS.S3({
  region,
});

export const createBucketForWeb = async (stageName: string) => {
  try {
    await s3.createBucket({ Bucket: `spa-project-${stageName}` }).promise();
  } catch (err) {
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

const copyFileToBucket = async (
  stageName: string,
  sourceBucket: string,
  key: string
) => {
  var params = {
    Bucket: `spa-project-${stageName}`, //Destination
    CopySource: `${sourceBucket}/${key}`,
    Key: key.replace(`${BASE_WEB_DIR}/`, ""),
    ACL: "public-read",
  };
  await s3.copyObject(params).promise();
};

const writeFileToBucket = async (
  stageName: string,
  key: string,
  restApiId: string
) => {
  const url = `https://${restApiId}.execute-api.${region}.amazonaws.com/${stageName}`;
  var params = {
    Bucket: `spa-project-${stageName}`, //Destination
    Body: configTemplate(url),
    Key: key.replace(`${BASE_WEB_DIR}/`, ""),
    ACL: "public-read",
  };
  await s3.putObject(params).promise();
};

export const popultateWebFiles = async (
  stageName: string,
  sourceBucket: string,
  restApiId: string
) => {
  const resp: any = await s3.listObjects({ Bucket: sourceBucket }).promise();
  for (let file of resp.Contents) {
    if (file.Key === `${BASE_WEB_DIR}/config.js`) {
      await writeFileToBucket(stageName, file.Key, restApiId); // Updating apiUrl
    } else if (file.Key.startsWith(BASE_WEB_DIR)) {
      await copyFileToBucket(stageName, sourceBucket, file.Key);
    }
  }
};

export const createDeployment = async (
  restApiId: string,
  stageName: string
) => {
  await apigateway.createDeployment({ restApiId, stageName }).promise();
  return `https://${restApiId}.execute-api.${region}.amazonaws.com/${stageName}/`;
};

export const configTemplate = (url: string) => `
var apiUrl = "${url}";
`;

export const deleteAPIStage = async (stageName: string, restApiId: string) => {
  await apigateway.deleteStage({ restApiId, stageName }).promise();
};

export const deleteWebBucket = async (stageName: string) => {
  const Bucket = `spa-project-${stageName}`;
  const resp: any = await s3.listObjects({ Bucket }).promise();
  const items = resp.Contents.map((obj: { Key: string }) => ({ Key: obj.Key }));
  const params: any = { Bucket, Delete: { Objects: items } };
  await s3.deleteObjects(params).promise();
  await s3.deleteBucket({ Bucket }).promise();
};
