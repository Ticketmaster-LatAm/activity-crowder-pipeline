const error = require("/opt/util/error");
const schedule = require("/opt/util/schedule");
const s3 = require("/opt/util/s3");
const { defaultResponse } = require("/opt/util/default")
const ddb = require("/opt/database/ddb");

let responsePayload = defaultResponse;

exports.get = async (event) => {

  let response = responsePayload;

  if (event.requestContext.httpMethod === "OPTIONS") {
    return response;
  }

  const { recordId } = event.pathParameters || {};

  try {
    const data = await ddb.get(recordId);

    if (typeof data === "undefined") return error.notFound("Record");
    response.body = JSON.stringify(data);
    return response;
  } catch (ex) {
    console.error("Error in get handler:", ex);
    return error.responseError(ex);
  }
};

exports.data = async (event) => {

  let response = responsePayload;

  if (event.requestContext.httpMethod === "OPTIONS") {
    return response;
  }

  const { recordId } = event.pathParameters || {};

  try {
    const data = await ddb.get(recordId);

    if (typeof data === "undefined") return error.notFound("Record");

    const path = data.path.split("/")
    const movements = await s3.get(`${path[1]}/${path[2]}`);

    response.body = JSON.stringify({
      moviments: movements.length,
      data: movements
    });

    return response;

  } catch (ex) {
    console.error("Error in data handler:", ex);
    return error.responseError(ex);
  }
};

exports.list = async (event) => {

  let response = responsePayload;

  if (event.requestContext.httpMethod === "OPTIONS") {
    return response;
  }

  const { limit, next, statusCode, lastUpdate, lastMovementId } = event.queryStringParameters || {};
  const search = {
    limit: limit,
    next: next,
    statusCode: statusCode,
    lastMovementId: lastMovementId,
    lastUpdate: lastUpdate

  };

  try {

    const records = await ddb.list(search);
    response.body = JSON.stringify(records);
    return response;

  } catch (ex) {
    console.error("Error in list handler:", ex);
    return error.responseError(ex);
  }
};

exports.schedule = async (event) => {

  let response = responsePayload;

  if (event.requestContext.httpMethod === "OPTIONS") {
    return response;
  }

  const { state, expression } = JSON.parse(event.body) || {};
  console.log("body:", { state: state, expression: expression })

  try {

    if (state === "ENABLED") {
      await schedule.enable(expression);
      response.body = JSON.stringify({
        message: "Schedule has been enabled"
      })
    }

    if (state === "DISABLED") {
      await schedule.disable(expression);
      response.body = JSON.stringify({
        message: "Schedule has been disabled"
      })
    }

    return response;

  } catch (ex) {
    console.error("Error in schedule handler:", ex);
    return error.responseError(ex);
  }
}