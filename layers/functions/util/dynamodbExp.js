exports.updateExpression = async (object) => {
  try {
    let exp = {
      UpdateExpression: "set",
      ExpressionAttributeNames: {},
      ExpressionAttributeValues: {},
      ReturnValues: "UPDATED_NEW",
    };

    for (const [key, value] of Object.entries(object)) {
      exp.UpdateExpression += ` #${key} = :${key},`;
      exp.ExpressionAttributeNames[`#${key}`] = key;
      exp.ExpressionAttributeValues[`:${key}`] = value;
    }
    
    // Remove trailing comma
    exp.UpdateExpression = exp.UpdateExpression.slice(0, -1);

    return exp;
    
  } catch (ex) {
    throw ex;
  }
};
