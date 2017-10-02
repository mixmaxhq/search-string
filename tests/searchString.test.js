const SearchString = require('../searchString');

describe('searchString', () => {
  test('basic', () => {
    const str = 'to:me -from:joe@acme.com foobar';
    const parsed = SearchString.parse(str);
    expect(parsed.getText()).toEqual('foobar');
    expect(parsed.getNumUniqueConditionKeys()).toEqual(2);
    expect(parsed.getConditionMap().to).toEqual({
      value: 'me',
      negated: false
    });
    expect(parsed.getConditionMap().from).toEqual({
      value: 'joe@acme.com',
      negated: true
    });
  });
  test('multiple getText() segments', () => {
    const str = 'to:me foobar zoobar';
    const parsed = SearchString.parse(str);
    expect(parsed.getText()).toEqual('foobar zoobar');
    expect(parsed.getNumUniqueConditionKeys()).toEqual(1);
    expect(parsed.getConditionMap().to).toEqual({
      value: 'me',
      negated: false
    });
  });
  test('quoted value with space', () => {
    const str = 'to:"Marcus Ericsson" foobar';
    const parsed = SearchString.parse(str);
    expect(parsed.getText()).toEqual('foobar');
    expect(parsed.getNumUniqueConditionKeys()).toEqual(1);
    expect(parsed.getConditionMap().to).toEqual({
      value: 'Marcus Ericsson',
      negated: false
    });
  });
  test('search-query-parser example', () => {
    const str =
      'from:hi@retrace.io,foo@gmail.com to:me subject:vacations date:1/10/2013-15/04/2014 photos';
    const parsed = SearchString.parse(str, ['date']);
    const conditionMap = parsed.getConditionMap();
    expect(parsed.getNumUniqueConditionKeys()).toEqual(4);
    expect(conditionMap.from).toEqual({
      value: ['hi@retrace.io', 'foo@gmail.com'],
      negated: false
    });
    expect(conditionMap.date).toEqual({
      value: {
        from: '1/10/2013',
        to: '15/04/2014'
      },
      negated: false
    });
  });
  test('negated getText()', () => {
    const str = 'hello -big -fat is:condition world';
    const parsed = SearchString.parse(str);
    expect(parsed.getText()).toEqual('hello world');
    expect(parsed.getNegatedWords()).toEqual(['big', 'fat']);
    expect(parsed.getNumUniqueConditionKeys()).toEqual(1);
  });
  test('complex use case', () => {
    const str =
      'op1:value op1:value2 op2:"multi, \'word\', value" sometext -op3:value more naked text';
    const parsed = SearchString.parse(str);
    const conditionMap = parsed.getConditionMap();
    const conditionArray = parsed.getConditionArray();
    expect(parsed.getText()).toEqual('sometext more naked text');
    expect(parsed.getNumUniqueConditionKeys()).toEqual(3);
    expect(conditionMap.op1).toEqual([
      {
        value: 'value',
        negated: false
      },
      {
        value: 'value2',
        negated: false
      }
    ]);
    expect(conditionMap.op2).toEqual({
      value: ['multi', "'word'", 'value'],
      negated: false
    });
    expect(conditionMap.op3).toEqual({
      value: 'value',
      negated: true
    });
    expect(conditionArray.length).toEqual(4);
    expect(conditionArray).toEqual([
      { key: 'op1', value: 'value', negated: false },
      { key: 'op1', value: 'value2', negated: false },
      { key: 'op2', value: ['multi', "'word'", 'value'], negated: false },
      { key: 'op3', value: 'value', negated: true }
    ]);
  });
  test('several quoted strings', () => {
    const str = '"string one" "string two"';
    const parsed = SearchString.parse(str);
    expect(parsed.getTextSegments()).toEqual(['string one', 'string two']);
    expect(parsed.getNumUniqueConditionKeys()).toEqual(0);
  });
  test('quoted semicolon string', () => {
    const str = 'op1:value "semi:string"';
    const parsed = SearchString.parse(str);
    const conditionMap = parsed.getConditionMap();
    expect(parsed.getText()).toEqual('semi:string');
    expect(parsed.getNumUniqueConditionKeys()).toEqual(1);
    expect(conditionMap.op1).toEqual({
      value: 'value',
      negated: false
    });
  });
});
