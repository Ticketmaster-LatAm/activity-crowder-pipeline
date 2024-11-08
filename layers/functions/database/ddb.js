const AWS = require("aws-sdk");
const https = require("https");
const { customAlphabet } = require("nanoid");
const exp = require("/opt/util/dynamodbExp");

const {
  STATUS_PENDING,
  STATUS_PROCESSED,
  STATUS_FAILED,
  SCAN_LIMIT
} = require("/opt/util/default");

function calculateTTL(dateStr) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + 7);
  return Math.floor(date.getTime() / 1000);
}

const agent = new https.Agent({
  keepAlive: true,
  maxSockets: Infinity,
});
AWS.config.update({
  httpOptions: {
    agent,
  },
});

const TABLE_NAME = process.env.TRACKING_TABLE;

const dynamoDb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || "us-east-1",
  convertEmptyValues: true,
});

exports.put = async (item) => {

  const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", 15);
  const recordId = nanoid();
  const dateNow = new Date().toISOString();

  const localParams = {
    TableName: TABLE_NAME,
    Item: {
      recordId,
      statusCode: STATUS_PENDING,
      lastUpdate: parseInt(item.lastUpdate),
      lastMovementId: parseInt(item.lastMovementId),
      path: item.path,
      hash: item.hash,
      createAt: dateNow,
      expireAt: calculateTTL(dateNow)
    },
  };

  try {
    await dynamoDb.put(localParams).promise();
    return recordId;

  } catch (ex) {
    console.error("Error creating item in DynamoDB");
    throw ex;
  }
};

exports.list = async (params) => {
  let { limit = SCAN_LIMIT, next, statusCode, lastUpdate, lastMovementId } = params || {};
  let limitData = [];
  let lastEvaluatedKey;

  let localParams = {
    TableName: TABLE_NAME,
    Limit: limit,
  };

  let filterExpressions = [];
  let expressionAttributeValues = {};

  if (typeof statusCode !== "undefined") {

    filterExpressions.push("statusCode = :statusCode");
    expressionAttributeValues[":statusCode"] = statusCode;
  }

  if (typeof lastUpdate !== "undefined") {

    filterExpressions.push("lastUpdate = :lastUpdate");
    expressionAttributeValues[":lastUpdate"] = parseInt(lastUpdate);
  }

  if (typeof lastMovementId !== "undefined") {

    filterExpressions.push("lastMovementId = :lastMovementId");
    expressionAttributeValues[":lastMovementId"] = parseInt(lastMovementId);
  }

  if (filterExpressions.length > 0) {
    localParams.FilterExpression = filterExpressions.join(' AND ');
    localParams.ExpressionAttributeValues = expressionAttributeValues;
  }

  if (next) {
    localParams.ExclusiveStartKey = {
      recordId: next,
    };
  }

  do {
    try {
      const data = await dynamoDb.scan(localParams).promise();
      limitData.push(...data.Items)

      lastEvaluatedKey = data.LastEvaluatedKey;
      localParams.ExclusiveStartKey = lastEvaluatedKey;

      if (limitData.length >= limit) {
        limitData = limitData.slice(0, limit); // Trim to the exact limit if we exceeded it
        break;
      }

    } catch (ex) {
      throw ex;
    }

  }

  while (lastEvaluatedKey);

  const nextLimit = limit - 1;
  let nextToken = parseInt(limitData.length) === parseInt(limit) ? limitData[nextLimit]['recordId'] : null

  return {
    total: limitData.length,
    next: nextToken == null ? undefined : nextToken,
    records: limitData,
  };
};

exports.get = async (key) => {
  const localParams = {
    TableName: TABLE_NAME,
    Key: {
      recordId: key,
    },
  };

  try {
    const data = await dynamoDb.get(localParams).promise();
    return data.Item;
  } catch (ex) {
    throw ex;
  }
};

exports.batchGet = async (keys) => {

  const batchKeys = [];

  for (const key of keys) {

    batchKeys.push({
      recordId: key
    })
  }

  const localParams = {
    RequestItems: {
      [TABLE_NAME]: {
        Keys: batchKeys
      }
    }
  };

  try {
    const data = await dynamoDb.batchGet(localParams).promise();
    return data.Responses[TABLE_NAME];
  } catch (ex) {
    throw ex;
  }
};

exports.updatePath = async (data) => {

  const { key, path } = data;

  const dateNow = new Date().toISOString();
  const updatedObjects = {
    path: path,
    updatedAt: dateNow,
  }

  try {

    const filterExp = await exp.updateExpression(updatedObjects);
    let localParams = {
      TableName: TABLE_NAME,
      Key: { recordId: key },
      ...filterExp,
    };
    return await dynamoDb.update(localParams).promise();

  } catch (ex) {
    console.error(`Error updating status to ${STATUS_PROCESSED} for recordId ${key}:`, ex);
    throw ex;
  }
};

exports.updateOK = async (key) => {

  const dateNow = new Date().toISOString();
  const updatedObjects = {
    statusCode: STATUS_PROCESSED,
    error: null,
    updatedAt: dateNow,
  }

  try {

    const filterExp = await exp.updateExpression(updatedObjects);
    let localParams = {
      TableName: TABLE_NAME,
      Key: { recordId: key },
      ...filterExp,
    };

    await dynamoDb.update(localParams).promise();
    return { status: STATUS_PROCESSED }

  } catch (ex) {
    console.error(`Error updating status to ${STATUS_PROCESSED} for recordId ${key}:`, ex);
    throw ex;
  }
};

exports.updateNOK = async (key, error = {}) => {

  const dateNow = new Date().toISOString();
  const updatedObjects = {
    statusCode: STATUS_FAILED,
    error: error,
    updatedAt: dateNow,
  }

  try {

    const filterExp = await exp.updateExpression(updatedObjects);
    let localParams = {
      TableName: TABLE_NAME,
      Key: { recordId: key },
      ...filterExp,
    };

    await dynamoDb.update(localParams).promise();
    return { status: STATUS_FAILED }

  } catch (ex) {
    console.error(`Error updating status to FAILED for recordId ${key}:`, ex);
    throw ex;
  }
};