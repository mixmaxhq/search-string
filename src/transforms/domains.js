const { isDomain } = require('@mixmaxhq/toolbox').string;

/**
 */
module.exports = (text) => {
  const transformed = {};
  if (isDomain(text)) {
    transformed.key = 'to';
    transformed.value = text;
  }
  return transformed;
};
