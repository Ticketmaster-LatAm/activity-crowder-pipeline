const crypto = require("crypto");
const zlib = require('zlib');

exports.hash = (data) => {
    try {
        return crypto.createHash("md5").update(data).digest("hex");
    } catch (ex) {
        console.error("Error when hashing data");
        throw ex;
    }
}

exports.compress = (data) => {
    try {
        return zlib.gzipSync(data).toString('base64');
    } catch (ex) {
        console.error("Error when compress data");
        throw ex;
    }
}

exports.decompress = (data) => {
    try {
        return zlib.gunzipSync(data).toString();
    } catch(ex){
        console.error("Error when decompress data");
        throw ex;
    }
}