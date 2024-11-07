const AWS = require('aws-sdk');

const ssmClient = new AWS.SSM({
    region: process.env.AWS_REGION || "us-east-1",
});

const LAST_UPDATE = process.env.CROWDER_LASTUPDATE;
const MOVEMENT_ID = process.env.CROWDER_MOVEMENTID;

exports.retrieveParams = async (paramName) => {

    try {
        return await ssmClient.getParameters({
            Names: paramName,
            WithDecryption: true,
        }).promise();
    } catch (ex) {
        console.error("Error retrieving SSM parameters:", ex.message);
        throw ex;
    }
};

const updateParams = async (params) => {
    try {
        return await ssmClient.putParameter(params).promise();
    } catch (ex) {
        console.error("Error updating SSM parameters:", ex.message);
        throw ex;
    }

};

exports.updateLastUpdate = async (lastUpdate) => {
    try {
        await updateParams({
            Name: LAST_UPDATE,
            Value: `${lastUpdate}`,
            Overwrite: true,
            Type: 'String'
        });
    } catch (ex) {
        console.error(`Error updating ${LAST_UPDATE} SSM parameters:`, ex.message);
        throw ex;
    }
};

exports.updateLastMovementId = async (lastMovementId) => {
    try {
        await updateParams({
            Name: MOVEMENT_ID,
            Value: `${lastMovementId}`,
            Overwrite: true,
            Type: 'String'
        });
    } catch (ex) {
        console.error(`Error updating ${MOVEMENT_ID} SSM parameters:`, ex.message);
        throw ex;
    }
};

exports.getLastUpdate = async () => {
    try {
        const params = await ssmClient.getParameters({
            Names: [LAST_UPDATE]
        }).promise();
        return params.Parameters.find((ssm) => ssm.Name === LAST_UPDATE).Value;

    } catch (ex) {
        console.error(`Error getting ${LAST_UPDATE} SSM parameters:`, ex.message);
        throw ex;
    }
}

exports.getLastMovementId = async () => {
    try {
        const params = await ssmClient.getParameters({
            Names: [MOVEMENT_ID]
        }).promise();
        return params.Parameters.find((ssm) => ssm.Name === MOVEMENT_ID).Value;

    } catch (ex) {
        console.error(`Error getting ${MOVEMENT_ID} SSM parameters:`, ex.message);
        throw ex;
    }
}