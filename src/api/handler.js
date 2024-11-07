const error = require("/opt/util/error");
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
        moviments: movements.payload.length, 
        data: movements.payload
      });
      
      return response;

  } catch (ex) {
      return error.responseError(ex);
  }
};

exports.list = async (event) => {

  let response = responsePayload;

  if (event.requestContext.httpMethod === "OPTIONS") {
    return response;
  }

  const { limit, next, statusCode } = event.queryStringParameters || {};
  const search = {
    limit: limit,
    next: next,
    statusCode: statusCode
  };

  try {

    const records = await ddb.list(search);
    response.body = JSON.stringify(records);
    return response;

  } catch (ex) {
      console.error("Error in retry handler:", ex);
      return error.responseError(ex);
  }
};
