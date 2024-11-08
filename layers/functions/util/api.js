const axios = require("axios");
const http = require('http');
const https = require("https");
const ssm = require("/opt/util/ssm");

const REQUEST_TIMEOUT = 15000;
let cachedParams;

const API_KEY = process.env.CROWDER_APIKEY;
const API_HOST = process.env.CROWDER_HOST;

const axiosInstance = axios.create({
  httpAgent: new http.Agent({
    keepAlive: true,
    maxSockets: Infinity,
    maxFreeSockets: Infinity,
  }),
  httpsAgent: new https.Agent({
    keepAlive: true,
    maxSockets: Infinity,
    maxFreeSockets: Infinity,
  }),
  timeout: REQUEST_TIMEOUT,
  headers: {
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
  },
});


const init = async () => {

  //if (cachedParams) return cachedParams;

  const ssmParams = [API_KEY, API_HOST];
  const params = await ssm.retrieveParams(ssmParams);

  cachedParams = {
    apiKey: params.Parameters.find((ssm) => ssm.Name === API_KEY).Value,
    host: params.Parameters.find((ssm) => ssm.Name === API_HOST).Value,
  };

  return cachedParams;
};

exports.request = async (lastUpdate, movimentId) => {

  try {
    const { apiKey, host } = await init();

    const response = await axiosInstance.get(`${host}?lastUpdate=${lastUpdate}&lastMovementId=${movimentId}`, {
      headers: { apiKey },
    });

    return response.data;

  } catch (ex) {
    console.error("Error in API request");
    throw ex;
  }
};