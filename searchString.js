class SearchString {
  constructor(operators = [], text = "") {
    this.operators = operators;
    this.text = text;
  }

  static parse(str) {
    // const regex = /(\S+:'(?:[^'\\]|\\.)*')|(\S+:"(?:[^"\\]|\\.)*")|\S+|\S+:\S+/g;
    // let match;
    // while ((match = regex.exec(str)) !== null) {
    // const term = match[0];
    //
    //
    // }
    const segments = str.split(" ");
    const operators = [];
    const textSegments = [];
    segments.forEach(segment => {
      segment.trim();
      const colonIndex = segment.indexOf(":");
      if (colonIndex > 0) {
        const negIndex = segment.indexOf("-");
        operators.push({
          key: segment.substring(negIndex === 0 ? 1 : 0, colonIndex),
          value: segment.substring(colonIndex + 1),
          negate: negIndex === 0
        });
      } else {
        textSegments.push(segment);
      }
    });
    const text = textSegments.join(" ");
    return new SearchString(operators, text);
  }

  getOperators() {
    return this.operators;
  }

  getText() {
    return this.text;
  }

  toString() {
    return JSON.stringify({
      operators: this.operators,
      text: this.text
    });
  }
}

module.exports = SearchString;
