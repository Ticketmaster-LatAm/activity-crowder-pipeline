const AWS = require('aws-sdk');
const util = require("/opt/util/util");
const s3 = new AWS.S3();

const BUCKET_NAME = process.env.BUCKET_NAME;

exports.put = async (data) => {

    const { filename, payload, contentEnconding, contentType } = data;

    const compress = util.compress(JSON.stringify(payload));

    const params = {
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: compress,
        ContentType: contentEnconding,
        ContentEncoding: contentType,
    };

    try {

        await s3.putObject(params).promise();
        return `${BUCKET_NAME}/${filename}`

    } catch (ex) {
        console.error("Error uploading file to S3");
        throw ex;
    }

}

exports.get = async (file) => {

    const params = {
        Bucket: BUCKET_NAME,
        Key: file,
    };

    try {
        const data = await s3.getObject(params).promise();
        return JSON.parse(util.decompress(Buffer.from(data.Body.toString('utf-8'), 'base64')))

    } catch (ex) {
        console.error("Error getting S3 file:");
        throw ex;
    }
}