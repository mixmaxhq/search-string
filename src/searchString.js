
class SearchString {
  constructor(conditionArray, conditionMap, textSegments) {
    this.conditionArray = conditionArray;
    this.conditionMap = conditionMap;
    this.textSegments = textSegments;
  }

  /**
   * 
   * @param {String} String to parse
   * @param {Object} options
   *    @param {Array} rangeKeywords - keywords should look out for to construct time ranges
   */
  static parse(str, options = {}) {
    const rangeKeywords = options.rangeKeywords || [];
    const conditionArray = [];
    const conditionMap = {};
    const textSegments = [];

    const addEntry = (key, value, negated) => {
      const mapValue = { value, negated };
      if (conditionMap[key]) {
        const mapValues = [conditionMap[key]];
        mapValues.push(mapValue);
        conditionMap[key] = mapValues;
      } else {
        conditionMap[key] = mapValue;
      }
      const arrayEntry = { key, value, negated };
      conditionArray.push(arrayEntry);
    };

    // get a list of search terms respecting single and double quotes
    const regex = /(\S+:'(?:[^'\\]|\\.)*')|(\S+:"(?:[^"\\]|\\.)*")|'[^']+'|"[^"]+"|\S+|\S+:\S+/g;
    let match;

    while ((match = regex.exec(str)) !== null) {
      const term = match[0];
      const sepIndex = term.indexOf(':');
      if (sepIndex > 0 && term.indexOf('"') !== 0 && term.indexOf("'") !== 0) {
        let key = term.slice(0, sepIndex);
        let negated = false;
        if (key[0] === '-') {
          key = key.slice(1);
          negated = true;
        }
        let value = term.slice(sepIndex + 1);

        // Strip surrounding quotes
        const valueLengthWithQuotes = value.length;
        value = value.replace(/^\"|\"$|^\'|\'$/g, '');
        if (value.length === valueLengthWithQuotes) {
          // Make value array if applicable
          if (value.indexOf(',') > 0) {
            value = value.split(',').map((v) => v.trim());
          }
        }

        if (rangeKeywords.includes(key)) {
          // Only add condition if it is well-formed
          const rangeSeperator = value.indexOf('-');
          if (rangeSeperator > 0) {
            const from = value.slice(0, rangeSeperator);
            const to = value.slice(rangeSeperator + 1);
            value = { from, to };
            addEntry(key, value, negated);
          }
        } else {
          addEntry(key, value, negated);
        }
      } else {
        const negated = term.indexOf('-') === 0;
        let text = term;
        if (negated) {
          text = text.slice(1);
        }
        // Strip surrounding quotes
        text = text.replace(/^\"|\"$|^\'|\'$/g, '');

        textSegments.push({
          text,
          negated
        });
      }
    }
    return new SearchString(conditionArray, conditionMap, textSegments);
  }

  getNumUniqueConditionKeys() {
    return Object.keys(this.conditionMap).length;
  }

  /**
   * @return {Object} map of conditions, if multiple conditions for a particular key exists,
   *                  collapses them into one entry in the map
   */
  getConditionMap() {
    return this.conditionMap;
  }

  /**
   * @return {Array} conditions, may contain multiple conditions for a particular key
   */
  getConditionArray() {
    return this.conditionArray;
  }

  getParsedQuery() {
    const parsedQuery = { exclude: {} };
    this.conditionArray.forEach((condition) => {
      if (condition.negated) {
        if (parsedQuery.exclude[condition.key]) {
          parsedQuery.exclude[condition.key].push(condition.value);
        } else {
          parsedQuery.exclude[condition.key] = [condition.value];
        }
      } else {
        if (parsedQuery[condition.key]) {
          parsedQuery[condition.key].push(condition.value);
        } else {
          parsedQuery[condition.key] = [condition.value];
        }
      }
    });
    return parsedQuery;
  }

  getText() {
    return this.textSegments
      .filter((textSegment) => !textSegment.negated)
      .map((textSegment) => textSegment.text)
      .join(' ');
  }

  getTextSegments() {
    return this.textSegments;
  }

  getNegatedWords() {
    return this.textSegments
      .filter((textSegment) => textSegment.negated)
      .map((textSegment) => textSegment.text);
  }
}

module.exports = SearchString;
