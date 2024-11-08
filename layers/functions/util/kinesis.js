const AWS = require('aws-sdk');

const kinesis = new AWS.Kinesis({
    region: process.env.AWS_REGION || "us-east-1",
});

const STREAM_NAME = process.env.STREAM_NAME;

exports.put = async (params) => {

    try {

        const dataSizeBytes = Buffer.byteLength(JSON.stringify(params), 'utf-8');
        const dataSizeKB = dataSizeBytes / 1024;
        console.log(`Data size: ${dataSizeBytes} bytes (${dataSizeKB.toFixed(2)} KB)`);

        const response = await kinesis.putRecords({
            StreamName: STREAM_NAME,
            Records: params,
        }).promise();

        if (response.FailedRecordCount) {
            const failedRecords = response.Records.filter(record => record.ErrorCode || record.ErrorMessage);
            throw new Error(JSON.stringify({
                message: failedRecords
            }))
        }

        console.log("Kinesis PutRecords: ", response.Records.length)
        return response;

    } catch (ex) {
        console.error("Error putting records to Kinesis:");
        throw ex;
    }
}