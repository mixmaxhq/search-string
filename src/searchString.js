// state tokens
const RESET = 'RESET';
const IN_OPERAND = 'IN_OPERAND';
const IN_TEXT = 'IN_TEXT';
const SINGLE_QUOTE = 'SINGLE_QUOTE';
const DOUBLE_QUOTE = 'DOUBLE_QUOTE';

class SearchString {
  constructor(conditionArray, conditionMap, textSegments) {
    this.conditionArray = conditionArray;
    this.conditionMap = conditionMap;
    this.textSegments = textSegments;
  }

  /**
   * @param {String} String to parse
   */
  static parse(str = '') {
    const conditionArray = [];
    const conditionMap = {};
    const textSegments = [];

    const addCondition = (key, value, negated) => {
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

    const addTextSegment = (text, negated) => {
      textSegments.push({ text, negated });
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
    // - IN_TEXT (could be raw text or an operator)
    // - IN_OPERAND
    // - RESET (in no other state)
    const inText = () => state === IN_TEXT;
    const inOperand = () => state === IN_OPERAND;
    const inSingleQuote = () => quoteState === SINGLE_QUOTE;
    const inDoubleQuote = () => quoteState === DOUBLE_QUOTE;
    const inQuote = () => inSingleQuote() || inDoubleQuote();

    performReset();

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
        isNegated = false;
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
        } else {
          quoteState = DOUBLE_QUOTE;
        }
      } else if (char === "'" && prevChar !== '\\' && !inDoubleQuote()) {
        if (inSingleQuote()) {
          quoteState = RESET;
        } else {
          quoteState = SINGLE_QUOTE;
        }
      } else {
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
