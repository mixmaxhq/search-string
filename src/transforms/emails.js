const _ = require('underscore');
const { isLikelyEmail } = require('@mixmaxhq/toolbox').string;

/**
 * Given a string which is a valid email address (e.g. 'foo@mixmax.com'), transforms it to
 * `{ key: 'to', value: <email> }` (e.g. `{ key: 'to', value: 'foo@mixmax.com' }`). Also handles
 * email addresses surrounded by '<>' for pasted RFC addresses.
 * @param {String} text - the text to transform.
 * @returns {Object} the transformed object (in the form `{ key: …, value: …  }`). Returns an empty
 * object if the string is not an email address.
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
