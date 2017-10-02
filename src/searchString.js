class SearchString {
  constructor(conditionArray, conditionMap, textSegments, negatedWords = []) {
    this.conditionArray = conditionArray;
    this.conditionMap = conditionMap;
    this.textSegments = textSegments;
    this.negatedWords = negatedWords;
  }

  static parse(str, rangeKeywords = []) {
    const conditionArray = [];
    const conditionMap = {};
    const textSegments = [];
    const negatedWords = [];

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
        value = value.replace(/^\"|\"$|^\'|\'$/g, '');

        // Make value array if applicable
        if (value.indexOf(',') > 0) {
          value = value.split(',').map((v) => v.trim());
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
      } else if (term.indexOf('-') === 0) {
        negatedWords.push(term.slice(1));
      } else {
        // Strip surrounding quotes
        const textSegment = term.replace(/^\"|\"$|^\'|\'$/g, '');

        textSegments.push(textSegment);
      }
    }
    return new SearchString(conditionArray, conditionMap, textSegments, negatedWords);
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

  getText() {
    return this.textSegments.join(' ');
  }

  getTextSegments() {
    return this.textSegments;
  }

  getNegatedWords() {
    return this.negatedWords;
  }

  toString() {
    return JSON.stringify({
      conditions: this.conditions,
      text: this.text
    });
  }
}

module.exports = SearchString;
