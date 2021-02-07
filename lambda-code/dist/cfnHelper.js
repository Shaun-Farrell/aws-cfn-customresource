"use strict";
// Original cfn-response does not allow sending an error back that can be read in CloudFormation
function sendResponse(event, context, responseStatus, responseData, physicalResourceId, noEcho, error) {
    return new Promise((resolve, reject) => {
        var responseBody = JSON.stringify({
            Status: responseStatus,
            Reason: `${error ? error + ". " : ""}See more details in CloudWatch Log Stream: ${context.logStreamName}`,
            PhysicalResourceId: physicalResourceId || context.logStreamName,
            StackId: event.StackId,
            RequestId: event.RequestId,
            LogicalResourceId: event.LogicalResourceId,
            NoEcho: noEcho || false,
            Data: responseData,
        });
        console.log("Response body:\n", responseBody);
        var https = require("https");
        var url = require("url");
        var parsedUrl = url.parse(event.ResponseURL);
        var options = {
            hostname: parsedUrl.hostname,
            port: 443,
            path: parsedUrl.path,
            method: "PUT",
            headers: {
                "content-type": "",
                "content-length": responseBody.length,
            },
        };
        var request = https.request(options, function (response) {
            console.log("Status code: " + response.statusCode);
            console.log("Status message: " + response.statusMessage);
            resolve(context.done());
        });
        request.on("error", function (error) {
            console.log("send(..) failed executing https.request(..): " + error);
            reject(context.done());
        });
        request.write(responseBody);
        request.end();
    });
}
module.exports = sendResponse;
