const _ = require('underscore');
const { isLikelyEmail } = require('@mixmaxhq/toolbox').string;

/**
 */
module.exports = (text) => {
  const transformed = {};
  if (_.isString(text) && text.charAt(0) === '<' && text.charAt(text.length - 1) === '>') {
    text = text.substring(1, text.length - 1);
  }
  if (isLikelyEmail(text)) {
    transformed.key = 'to',
    transformed.value = text;
  }
  return transformed;
};
