const { getQuotePairMap } = require('./utils');

// state tokens
const RESET = 'RESET';
const IN_OPERAND = 'IN_OPERAND';
const IN_TEXT = 'IN_TEXT';
const SINGLE_QUOTE = 'SINGLE_QUOTE';
const DOUBLE_QUOTE = 'DOUBLE_QUOTE';

/**
 * SearchString is a parsed search string which allows you to fetch conditions
 * and text being searched.
 */
class SearchString {
  /**
   * Not intended for public use. API could change.
   */
  constructor(conditionArray, textSegments) {
    this.conditionArray = conditionArray;
    this.textSegments = textSegments;
    this.string = '';
    this.isStringDirty = true;
  }

  /**
   * @param {String} str to parse e.g. 'to:me -from:joe@acme.com foobar'.
   * @param {Array} transformTextToConditions Array of functions to transform text into conditions
   * @returns {SearchString} An instance of this class SearchString.
   */
  static parse(str, transformTextToConditions = []) {
    if (!str) str = '';
    const conditionArray = [];
    const textSegments = [];

    const addCondition = (key, value, negated) => {
      const arrayEntry = { keyword: key, value, negated };
      conditionArray.push(arrayEntry);
    };

    const addTextSegment = (text, negated) => {
      let hasTransform = false;
      transformTextToConditions.forEach((transform) => {
        const { key, value } = transform(text);
        if (key && value) {
          addCondition(key, value, negated);
          hasTransform = true;
        }
      });
      if (!hasTransform) {
        textSegments.push({ text, negated });
      }
    };

    let state;
    let currentOperand;
    let isNegated;
    let currentText;
    let quoteState;
    let prevChar;

    const performReset = () => {
      state = RESET;
      quoteState = RESET;
      currentOperand = '';
      currentText = '';
      isNegated = false;
      prevChar = '';
    };

    // Terminology, in this example: 'to:joe@acme.com'
    // 'to' is the operator
    // 'joe@acme.com' is the operand
    // 'to:joe@acme.com' is the condition

    // Possible states:
    const inText = () => state === IN_TEXT; // could be inside raw text or operator
    const inOperand = () => state === IN_OPERAND;
    const inSingleQuote = () => quoteState === SINGLE_QUOTE;
    const inDoubleQuote = () => quoteState === DOUBLE_QUOTE;
    const inQuote = () => inSingleQuote() || inDoubleQuote();

    performReset();

    const quotePairMap = getQuotePairMap(str);

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === ' ') {
        if (inOperand()) {
          if (inQuote()) {
            currentOperand += char;
          } else {
            addCondition(currentText, currentOperand, isNegated);
            performReset();
          }
        } else if (inText()) {
          if (inQuote()) {
            currentText += char;
          } else {
            addTextSegment(currentText, isNegated);
            performReset();
          }
        }
      } else if (char === ',' && inOperand() && !inQuote()) {
        addCondition(currentText, currentOperand, isNegated);
        // No reset here because we are still evaluating operands for the same operator
        currentOperand = '';
      } else if (char === '-' && !inOperand() && !inText()) {
        isNegated = true;
      } else if (char === ':' && !inQuote()) {
        if (inOperand()) {
          // If we're in an operand, just push the string on.
          currentOperand += char;
        } else if (inText()) {
          // Skip this char, move states into IN_OPERAND,
          state = IN_OPERAND;
        }
      } else if (char === '"' && prevChar !== '\\' && !inSingleQuote()) {
        if (inDoubleQuote()) {
          quoteState = RESET;
        } else if (quotePairMap.double[i]) {
          quoteState = DOUBLE_QUOTE;
        } else if (inOperand()) {
          currentOperand += char;
        } else {
          currentText += char;
        }
      } else if (char === "'" && prevChar !== '\\' && !inDoubleQuote()) {
        if (inSingleQuote()) {
          quoteState = RESET;
        } else if (quotePairMap.single[i]) {
          quoteState = SINGLE_QUOTE;
        } else if (inOperand()) {
          currentOperand += char;
        } else {
          currentText += char;
        }
      } else if (char !== '\\') {
        // Regular character..
        if (inOperand()) {
          currentOperand += char;
        } else {
          currentText += char;
          state = IN_TEXT;
        }
      }
      prevChar = char;
    }
    // End of string, add any last entries
    if (inText()) {
      addTextSegment(currentText, isNegated);
    } else if (inOperand()) {
      addCondition(currentText, currentOperand, isNegated);
    }

    return new SearchString(conditionArray, textSegments);
  }

  /**
   * @return {Array} conditions, may contain multiple conditions for a particular key.
   */
  getConditionArray() {
    return this.conditionArray;
  }

  /**
   * @return {Object} map of conditions and includes a special key 'excludes'.
   *                  Excludes itself is a map of conditions which were negated.
   */
  getParsedQuery() {
    const parsedQuery = { exclude: {} };
    this.conditionArray.forEach((condition) => {
      if (condition.negated) {
        if (parsedQuery.exclude[condition.keyword]) {
          parsedQuery.exclude[condition.keyword].push(condition.value);
        } else {
          parsedQuery.exclude[condition.keyword] = [condition.value];
        }
      } else {
        if (parsedQuery[condition.keyword]) {
          parsedQuery[condition.keyword].push(condition.value);
        } else {
          parsedQuery[condition.keyword] = [condition.value];
        }
      }
    });
    return parsedQuery;
  }

  /**
   * @return {String} All text segments concateted together joined by a space.
   *                  If a text segment is negated, it is preceded by a `-`.
   */
  getAllText() {
    return this.textSegments
      ? this.textSegments.map(({ text, negated }) => (negated ? `-${text}` : text)).join(' ')
      : '';
  }

  /**
   * @return {Array} all text segment objects, negative or positive
   *                 e.g. { text: 'foobar', negated: false }
   */
  getTextSegments() {
    return this.textSegments;
  }

  /**
   * Removes keyword-negated pair that matches inputted.
   * Only removes if entry has same keyword/negated combo.
   * @param {String} keywordToRemove Keyword to remove.
   * @param {Boolean} negatedToRemove Whether or not the keyword removed is negated.
   */
  removeKeyword(keywordToRemove, negatedToRemove) {
    this.conditionArray = this.conditionArray.filter(
      ({ keyword, negated }) => keywordToRemove !== keyword || negatedToRemove !== negated
    );
    this.isStringDirty = true;
  }

  /**
   * Adds a new entry to search string. Does not dedupe against existing entries.
   * @param {String} keyword  Keyword to add.
   * @param {String} value    Value for respctitve keyword.
   * @param {Boolean} negated Whether or not keyword/value pair should be negated.
   */
  addEntry(keyword, value, negated) {
    this.conditionArray.push({
      keyword,
      value,
      negated
    });
    this.isStringDirty = true;
  }

  /**
   * Removes an entry from the search string. If more than one entry with the same settings is found,
   * it removes the first entry matched.
   *
   * @param {String} keyword  Keyword to remove.
   * @param {String} value    Value for respectitve keyword.
   * @param {Boolean} negated Whether or not keyword/value pair is be negated.
   */
  removeEntry(keyword, value, negated) {
    const index = this.conditionArray.findIndex((entry) => {
      return entry.keyword === keyword && entry.value === value && entry.negated === negated;
    });

    if (index === -1) return;

    this.conditionArray.splice(index, 1);
    this.isStringDirty = true;
  }

  /**
   * @return {SearchString} A new instance of this class based on current data. 
   */
  clone() {
    return new SearchString(this.conditionArray.slice(0), this.textSegments.slice(0));
  }

  /**
   * @return {String} Returns this instance synthesized to a string format.
   *                  Example string: `to:me -from:joe@acme.com foobar`
   */
  toString() {
    if (this.isStringDirty) {
      // Group keyword, negated pairs as keys
      const conditionGroups = {};
      this.conditionArray.forEach(({ keyword, value, negated }) => {
        const negatedStr = negated ? '-' : '';
        const conditionGroupKey = `${negatedStr}${keyword}`;
        if (conditionGroups[conditionGroupKey]) {
          conditionGroups[conditionGroupKey].push(value);
        } else {
          conditionGroups[conditionGroupKey] = [value];
        }
      });
      // Build conditionStr
      let conditionStr = '';
      Object.keys(conditionGroups).forEach((conditionGroupKey) => {
        const values = conditionGroups[conditionGroupKey];
        const safeValues = values.filter((v) => v).map((v) => {
          let newV = '';
          let shouldQuote = false;
          for (let i = 0; i < v.length; i++) {
            const char = v[i];
            if (char === '"') {
              newV += '\\"';
            } else {
              if (char === ' ' || char === ',') {
                shouldQuote = true;
              }
              newV += char;
            }
          }
          return shouldQuote ? `"${newV}"` : newV;
        });
        if (safeValues.length > 0) {
          conditionStr += ` ${conditionGroupKey}:${safeValues.join(',')}`;
        }
      });
      this.string = `${conditionStr} ${this.getAllText()}`.trim();
      this.isStringDirty = false;
    }
    return this.string;
  }
}

module.exports = SearchString;
