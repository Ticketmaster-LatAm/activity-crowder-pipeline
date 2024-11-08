
const api = require("/opt/util/api");
const util = require("/opt/util/util");
const ssm = require("/opt/util/ssm");
const s3 = require("/opt/util/s3");
const kinesis = require("/opt/util/kinesis");
const ddb = require("/opt/database/ddb");
const { defaultResponse } = require("/opt/util/default");

let responsePayload = defaultResponse;

const MAX_STEPS = 20;
const MAX_CHUNK_SIZE = 200;
const MAX_BATCH_SIZE = 20;

const processChunk = async (chunk, batch, lastUpdate, lastMovementId) => {

    try {

        const chunkMD5Hash = util.hash(JSON.stringify(chunk));
        const chunkCompressed = util.compress(JSON.stringify(chunk));

        const recordId = await ddb.put({
            hash: chunkMD5Hash,
            lastUpdate,
            lastMovementId,
        });

        const kinesisRecord = {
            PartitionKey: `${chunkMD5Hash}`,
            Data: JSON.stringify({
                recordId: recordId,
                hash: chunkMD5Hash,
                size: chunk.length,
                page: batch.length,
                lastUpdate: lastUpdate,
                lastMovementId: lastMovementId,
                payload: chunkCompressed,
                timestamp: new Date().toISOString()
            }),
        };

        const pathFile = await s3.put({ 
            filename: recordId,
            payload: chunk,
        });
        
        await ddb.updatePath({ key: recordId, path: pathFile });
        await batch.push(kinesisRecord);

        console.log("batch size:", batch.length)
        console.log("record:", recordId);
        console.log("hash: ",chunkMD5Hash);

        if (batch.length >= MAX_BATCH_SIZE) {
            await kinesis.put(batch);
            batch.length = 0;
        }
    }

    catch (ex) {
        throw ex;
    }
}

exports.handler = async (event) => {

    let response = responsePayload;
    let hasMoreData = true;

    let chunk = [];
    let batch = [];

    try {

        let currentLastUpdate = await ssm.getLastUpdate();
        let currentMovementId = await ssm.getLastMovementId();

        for (let i = 0; i < MAX_STEPS; i++) {

            if (!hasMoreData) break;
            console.log("\n");
            console.log("REQUEST STEP: ", i);

            const { movements, hasMore, lastUpdate, lastMovementId } = await api.request(currentLastUpdate, currentMovementId);
            console.log(`lastMovementId: ${currentMovementId}`);
            console.log(`lastUpdate: ${currentLastUpdate}`);
            console.log("totalMovements:", movements.length);

            if (!movements.length) break;

            for (const item of movements) {

                chunk.push({
                    ...item,
                    lastUpdateSearch: currentLastUpdate,
                    lastUpdateSearchNext: lastUpdate,
                    lastMovementIdSearch: currentMovementId,
                    lastMovementIdNext: lastMovementId,
                });

                if (chunk.length === MAX_CHUNK_SIZE) {
                    await processChunk(chunk, batch, currentLastUpdate, currentMovementId);
                    chunk.length = 0;
                }
            }

            // process chunk
            if (chunk.length > 0) {
                await processChunk(chunk, batch, currentLastUpdate, currentMovementId);
                chunk.length = 0;
            }

            await ssm.updateLastUpdate(lastUpdate)
            await ssm.updateLastMovementId(lastMovementId)

            currentLastUpdate = lastUpdate;
            currentMovementId = lastMovementId;

            hasMoreData = hasMore;

        }

    } catch (ex) {
        console.error("Error in fetch handler:", ex);
        throw ex;

    } finally {
        if (batch.length > 0) {
            await kinesis.put(batch);
            batch.length = 0;
        }
    }

    console.log("Fetched at:", new Date().toISOString());
    return response;

}
