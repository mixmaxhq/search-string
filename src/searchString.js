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
  constructor(conditionArray, textSegments) {
    this.conditionArray = conditionArray;
    this.textSegments = textSegments;
    this.string = '';
    this.stringDirty = true;
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
   * @param {String} keywordToRemove 
   * @param {String} negatedToRemove 
   */
  removeKeyword(keywordToRemove, negatedToRemove) {
    this.conditionArray = this.conditionArray.filter(
      ({ keyword, negated }) => keywordToRemove !== keyword || negatedToRemove !== negated
    );
    this.stringDirty = true;
  }

  /**
   * 
   * @param {String} keyword 
   * @param {String} value 
   * @param {Boolean} negated 
   */
  addEntry(keyword, value, negated) {
    this.conditionArray.push({
      keyword,
      value,
      negated
    });
    this.stringDirty = true;
  }

  clone() {
    return new SearchString(this.conditionArray.slice(0), this.textSegments.slice(0));
  }

  toString() {
    if (this.stringDirty) {
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
      this.stringDirty = false;
    }
    return this.string;
  }
}

module.exports = SearchString;
