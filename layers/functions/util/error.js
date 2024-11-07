const { defaultResponse } = require("./default.js")

const headers = defaultResponse.headers;

exports.responseError = (ex) => {
  console.error("Error", ex);

  return {
    statusCode: ex.statusCode ? ex.statusCode : 500,
    headers: headers,
    body: JSON.stringify({
      error: ex.name ? ex.name : "Exception",
      message: ex.message ? ex.message : "Unknown error",
      stack: ex.stack ? ex.stack : "Unknown stack",
    }),
  };
};

exports.badRequest = (property) => {
  let response = {};
  response.statusCode = 400;
  response.headers = headers;
  response.body = JSON.stringify({
    message: `property \'${property}\' is required.`,
  });

  console.error("Error", response);
  return response;
};

exports.notFound = (object) => {
  let response = {};
  response.statusCode = 404;
  response.headers = headers;
  response.body = JSON.stringify({
    code: "NOT_FOUND",
    message: `${object} not found`,
    errorCode: 404,
  });

  console.error("Error", response);
  return response;
};

exports.notAuthorized = (object) => {
  let response = {};
  response.statusCode = 403;
  response.headers = headers;
  response.body = JSON.stringify({
    code: "FORBIDDEN",
    message: `${object} not authorized`,
    errorCode: 404,
  });

  console.error("Error", response);
  return response;
};