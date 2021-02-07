import sendResponse from "./cfnHelper";
import {
  createDeployment,
  createBucketForWeb,
  popultateWebFiles,
  deleteAPIStage,
  deleteWebBucket,
} from "./sdkHelper";

/* 
1. Create S3 bucket with website settings
2. Copy files to S3 from other bucket using copyObject - publicACL
3. Deploy APIG new stage
4. Adjust S3 config file to read correct APIGW
5. Return website URL to CFN for use as output
*/

const SUCCESS = "SUCCESS";
const FAILED = "FAILED";

export const handler = async function (event: any, context: any) {
  const { StageName, SourceBucket, APIID } = event.ResourceProperties;
  const stageName = StageName.toLowerCase();
  if (event.RequestType === "Delete") {
    try {
      await deleteWebBucket(stageName);
      await deleteAPIStage(stageName, APIID);
      return await sendResponse(event, context, SUCCESS);
    } catch (e) {
      const Error = e.message;
      return await sendResponse(
        event,
        context,
        FAILED,
        { Error },
        null,
        null,
        Error // Reason
      );
    }
  }

  const responseData: any = {};
  if (!StageName || !SourceBucket || !APIID) {
    responseData.Error = "Missing Params into the Lambda Callout";
    return await sendResponse(
      event,
      context,
      FAILED,
      responseData,
      null,
      null,
      responseData.Error // Reason
    );
  } else {
    try {
      await createBucketForWeb(stageName);
      await popultateWebFiles(stageName, SourceBucket, APIID);
      const url = await createDeployment(APIID, stageName);
      responseData.output = `http://spa-project-${stageName}.s3-website.${process.env.AWS_REGION}.amazonaws.com/`;
      return await sendResponse(event, context, SUCCESS, responseData);
    } catch (e) {
      responseData.Error = e.message;
      return await sendResponse(
        event,
        context,
        FAILED,
        responseData,
        null,
        null,
        responseData.Error // Reason
      );
    }
  }
};
