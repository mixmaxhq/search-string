const { isDomain } = require('@mixmaxhq/toolbox').string;

/**
 * Given a string which is a valid domain (e.g. 'mixmax.com'), transforms it to
 * `{ key: 'to', value: <domain> }` (e.g. `{ key: 'to', value: 'mixmax.com' }`).
 * @param {String} text - the text to transform.
 * @returns {Object} the transformed object (in the form `{ key: …, value: …  }`). Returns an empty
 * object if the string is not a domain.
 */
module.exports = (text) => {
  const transformed = {};
  if (isDomain(text)) {
    transformed.key = 'to';
    transformed.value = text;
  }
  return transformed;
};
