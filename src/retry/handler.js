const error = require("/opt/util/error");
const prepare = require("/opt/util/prepare");
const ddb = require("/opt/database/ddb");
const sql = require("/opt/database/mssql");
const s3 = require("/opt/util/s3");
const util = require("/opt/util/util");
const { defaultResponse } = require("/opt/util/default")

const {
  STATUS_PENDING,
  STATUS_PROCESSED,
  STATUS_FAILED,
  SCAN_LIMIT
} = require("/opt/util/default");

let responsePayload = defaultResponse;

exports.handler = async (event) => {

  let response = responsePayload;
  let dataOK = [];
  let dataNOK = [];
  let result = [];

  if (event.requestContext.httpMethod === "OPTIONS") {
    return response;
  }

  const { records } = JSON.parse(event.body) || {};

  try {

    if (!records.length) return error.badRequest("records");

    const returnedItems = await ddb.batchGet(records)
    const returnedKeys = new Set(returnedItems.map(item => item.recordId));


    for (const record of records) {

      if (!returnedKeys.has(record)) {
        return error.notFound(`Record '${record}'`);
      }
      if (!record.statusCode !== STATUS_PROCESSED) {
        return error.notAuthorized(`Record '${record}'`);
      }
    }

    for (const record of returnedItems) {

      console.log("\n");

      const path = record.path.split("/")
      const movements = await s3.get(`${path[1]}/${path[2]}`);

      console.log("timestamp:", movements.timestamp);

      const payload = movements.payload
      const MD5Hash = util.hash(JSON.stringify(payload))
      console.log("movements received: ", payload.length);
      console.log(`recordId: ${movements.recordId}`);

      try {

        if (MD5Hash !== movements.hash) {
          console.error("data not reliable")
          throw new Error(JSON.stringify({
            error: "data not reliable",
            data: {
              recordId: movements.recordId,
              orignalHash: movements.recordId,
              calucatedHash: MD5Hash,
              lastUpdate: lastUpdate,
              lastMovementId: lastMovementId
            }
          }));
        }

        console.log(`hash message:${movements.hash}`);
        console.log(`hash received: ${MD5Hash}`);

        const data = await prepare.data(payload);
        console.log("movements prepared: ", data.length);

        await sql.insertBatch(data);
        await ddb.updateOK(movements.recordId);

        console.log("Processed at:", new Date().toISOString())

        dataOK.push({
          recordid: movements.recordId,
          hash: MD5Hash,
          status: STATUS_PROCESSED,
        });

      } catch (ex) {

        await ddb.updateNOK(movements.recordId, JSON.stringify(ex));
        console.log("Failed at:", new Date().toISOString())

        dataNOK.push({
          recordid: movements.recordId,
          hash: MD5Hash,
          status: STATUS_FAILED,
        });
      }
    }

    if (dataNOK.length) result.push({
      failed: dataNOK.length,
      data: dataNOK
    });

    if (dataOK.length) result.push({
      processed: dataOK.length,
      data: dataOK
    });

    response.body = JSON.stringify({ result: result });

    return response;

  } catch (ex) {
    console.error("Error in retry handler:", ex);
    return error.responseError(ex);
  }
};
