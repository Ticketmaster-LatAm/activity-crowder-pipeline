module.exports = {
  STATUS_PENDING: "PENDING",
  STATUS_AVAILABLE: "AVAILABLE",
  STATUS_PROCESSED: "PROCESSED",
  STATUS_FAILED: "FAILED",
  SCAN_LIMIT: 250,
  defaultResponse: {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "*",
      "Content-Type": "application/json",
    },
  }
};