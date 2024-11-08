const AWS = require('aws-sdk');
const cloudwatchevents = new AWS.CloudWatchEvents();

const RULE_NAME = process.env.RULE_NAME

exports.disable = async (expression) => {   

    console.log("expression: ", expression)

    const params = {
        Name: `${RULE_NAME}`,
        State: 'DISABLED',
        ScheduleExpression: expression ? expression : "rate(1 minute)",
    };

    console.log("params: ", params)

    try {
        await cloudwatchevents.putRule(params).promise();
        console.log(`Schedule rule disabled successfully ${RULE_NAME}`);
    } catch (ex) {
        console.error(`Error disabling schedule rule ${RULE_NAME}`);
        throw ex;
    }
};

exports.enable = async (expression) => {

    console.log("expression: ", expression)

    const params = {
        Name: `${RULE_NAME}`,
        State: 'ENABLED',
        ScheduleExpression: expression ? expression : "rate(1 minute)",
    };

    console.log("params: ", params)

    try {
        await cloudwatchevents.putRule(params).promise();
        console.log(`Schedule rule enabled successfully ${RULE_NAME}`);
    } catch (ex) {
        console.error(`Error enabling schedule rule ${RULE_NAME}`);
        throw ex;
    }
};