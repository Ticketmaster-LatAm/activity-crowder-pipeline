const prepare = require("/opt/util/prepare");
const util = require("/opt/util/util");
const sql = require("/opt/database/mssql");
const ddb = require("/opt/database/ddb");
const { defaultResponse } = require("/opt/util/default")

let responsePayload = defaultResponse;

exports.handler = async (event) => {

  let response = responsePayload;
  let movements;

  try {


    console.log(event.Records.length)

    for (const record of event.Records) {

      console.log("\n");

      movements = JSON.parse(Buffer.from(record.kinesis.data, 'base64').toString());
      console.log("timestamp:", movements.timestamp);

      const payload = JSON.parse(util.decompress(Buffer.from(movements.payload, 'base64')));
      const MD5Hash = util.hash(JSON.stringify(payload))
      console.log("movements received: ", payload.length);

      console.log(`recordId: ${movements.recordId}`);

      if (MD5Hash !== movements.hash) {
        console.error("No integrity")
        throw new Error(JSON.stringify({
          error: "No Data Integrity",
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

    }

    return response;

  } catch (ex) {
    await ddb.updateNOK(movements.recordId, JSON.stringify(ex));
    console.error("Error in process handler:", ex);
    throw ex;
  }
};
