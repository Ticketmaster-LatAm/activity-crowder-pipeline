const crypto = require("crypto");
const zlib = require('zlib');

exports.hash = (data) => {
    return crypto.createHash("md5").update(data).digest("hex");
}

exports.compress = (data) => {
    return  zlib.gzipSync(data).toString('base64');
}

exports.decompress = (data) => {
    return zlib.gunzipSync(data).toString();
}