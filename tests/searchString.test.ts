import SearchString from '../src/searchString';

function getConditionMap(searchString: SearchString) {
  const map: Record<string, { value: string; negated: boolean }[]> = {};
  searchString.getConditionArray().forEach(({ keyword, value, negated }) => {
    const mapValue = { value, negated };
    if (map[keyword]) {
      map[keyword].push(mapValue);
    } else {
      map[keyword] = [mapValue];
    }
  });
  return map;
}

function getNumKeywords(searchString) {
  return Object.keys(getConditionMap(searchString)).length;
}

describe('searchString', () => {
  test('empty', () => {
    // @ts-expect-error - TS doesn't like that we're not passing a string
    expect(SearchString.parse().getConditionArray()).toEqual([]);
    expect(SearchString.parse('').getConditionArray()).toEqual([]);
    expect(SearchString.parse('   ').getConditionArray()).toEqual([]);
    // @ts-expect-error - TS doesn't like that we're passing null
    expect(SearchString.parse(null).getConditionArray()).toEqual([]);
    // @ts-expect-error - TS doesn't like that we're passing null
    expect(SearchString.parse(null).getParsedQuery()).toEqual({
      exclude: {},
    });
  });

  test('bad input', () => {
    expect(SearchString.parse('to:').getConditionArray()).toEqual([
      { keyword: 'to', value: '', negated: false },
    ]);
    expect(SearchString.parse('quoted text"').getTextSegments()[0]).toEqual({
      text: 'quoted',
      negated: false,
    });
    expect(SearchString.parse('quoted text"').getTextSegments()[1]).toEqual({
      text: 'text"',
      negated: false,
    });
  });

  test('basic', () => {
    const str = 'to:me -from:joe@acme.com foobar';
    const parsed = SearchString.parse(str);
    expect(parsed.getTextSegments()).toEqual([{ text: 'foobar', negated: false }]);
    expect(getNumKeywords(parsed)).toEqual(2);
    expect(getConditionMap(parsed).to).toEqual([
      {
        value: 'me',
        negated: false,
      },
    ]);
    expect(getConditionMap(parsed).from).toEqual([
      {
        value: 'joe@acme.com',
        negated: true,
      },
    ]);
  });

  test('multiple getText() segments', () => {
    const str = 'to:me foobar zoobar';
    const parsed = SearchString.parse(str);
    expect(parsed.getTextSegments()).toEqual([
      { text: 'foobar', negated: false },
      { text: 'zoobar', negated: false },
    ]);
    expect(getNumKeywords(parsed)).toEqual(1);
    expect(getConditionMap(parsed).to).toEqual([
      {
        value: 'me',
        negated: false,
      },
    ]);
  });

  test('quoted value with space', () => {
    const str = 'to:"Marcus Ericsson" foobar';
    const parsed = SearchString.parse(str);
    expect(parsed.getTextSegments()).toEqual([{ text: 'foobar', negated: false }]);
    expect(getNumKeywords(parsed)).toEqual(1);
    expect(getConditionMap(parsed).to).toEqual([
      {
        value: 'Marcus Ericsson',
        negated: false,
      },
    ]);
  });

  test('date example', () => {
    const str =
      'from:hi@mericsson.com,foo@gmail.com to:me subject:vacations date:1/10/2013-15/04/2014 photos';
    const parsed = SearchString.parse(str);
    const conditionMap = getConditionMap(parsed);
    expect(getNumKeywords(parsed)).toEqual(4);
    expect(conditionMap.from).toEqual([
      { value: 'hi@mericsson.com', negated: false },
      { value: 'foo@gmail.com', negated: false },
    ]);
    expect(conditionMap.date).toEqual([
      {
        value: '1/10/2013-15/04/2014',
        negated: false,
      },
    ]);
  });

  test('negated getText()', () => {
    const str = 'hello -big -fat is:condition world';
    const parsed = SearchString.parse(str);
    expect(parsed.getTextSegments()).toEqual([
      {
        text: 'hello',
        negated: false,
      },
      { text: 'big', negated: true },
      { text: 'fat', negated: true },
      { text: 'world', negated: false },
    ]);
    expect(getNumKeywords(parsed)).toEqual(1);
  });

  test('complex use case', () => {
    const str = 'op1:value op1:value2 op2:"multi, \'word\', value" sometext -op3:value more text';
    const parsed = SearchString.parse(str);
    const conditionMap = getConditionMap(parsed);
    const conditionArray = parsed.getConditionArray();
    expect(parsed.getTextSegments()).toEqual([
      { text: 'sometext', negated: false },
      { text: 'more', negated: false },
      { text: 'text', negated: false },
    ]);
    expect(getNumKeywords(parsed)).toEqual(3);
    expect(conditionMap.op1).toEqual([
      {
        value: 'value',
        negated: false,
      },
      {
        value: 'value2',
        negated: false,
      },
    ]);
    expect(conditionMap.op2).toEqual([
      {
        value: "multi, 'word', value",
        negated: false,
      },
    ]);
    expect(conditionMap.op3).toEqual([
      {
        value: 'value',
        negated: true,
      },
    ]);
    expect(conditionArray.length).toEqual(4);
    expect(conditionArray).toEqual([
      { keyword: 'op1', value: 'value', negated: false },
      { keyword: 'op1', value: 'value2', negated: false },
      { keyword: 'op2', value: "multi, 'word', value", negated: false },
      { keyword: 'op3', value: 'value', negated: true },
    ]);
    expect(parsed.toString()).toEqual(
      'op1:value,value2 op2:"multi, \'word\', value" -op3:value sometext more text'
    );
    parsed.removeKeyword('op1', false);
    expect(parsed.toString()).toEqual('op2:"multi, \'word\', value" -op3:value sometext more text');
    // Check once more to see if cached copy returns correctly.
    expect(parsed.toString()).toEqual('op2:"multi, \'word\', value" -op3:value sometext more text');
    parsed.removeKeyword('op3', false);
    expect(parsed.toString()).toEqual('op2:"multi, \'word\', value" -op3:value sometext more text');
    parsed.removeKeyword('op3', true);
    expect(parsed.toString()).toEqual('op2:"multi, \'word\', value" sometext more text');
  });

  test('several quoted strings', () => {
    const str = '"string one" "string two"';
    const parsed = SearchString.parse(str);
    expect(parsed.getTextSegments()).toEqual([
      {
        text: 'string one',
        negated: false,
      },
      { text: 'string two', negated: false },
    ]);
    expect(getNumKeywords(parsed)).toEqual(0);
  });

  test('dash in text', () => {
    const str = 'my-string op1:val';
    const parsed = SearchString.parse(str);
    const conditionMap = getConditionMap(parsed);
    expect(parsed.getTextSegments()[0]).toEqual({
      text: 'my-string',
      negated: false,
    });
    expect(conditionMap.op1).toEqual([
      {
        value: 'val',
        negated: false,
      },
    ]);
  });

  test('quoted semicolon string', () => {
    const str = 'op1:value "semi:string"';
    const parsed = SearchString.parse(str);
    expect(parsed.getTextSegments()).toEqual([{ text: 'semi:string', negated: false }]);
    expect(getNumKeywords(parsed)).toEqual(1);
    expect(getConditionMap(parsed).op1).toEqual([
      {
        value: 'value',
        negated: false,
      },
    ]);
  });

  test('comma in condition value', () => {
    const str = 'from:hello@mixmax.com template:"recruiting: reject email, inexperience"';
    const parsed = SearchString.parse(str);
    expect(parsed.getTextSegments()).toEqual([]);
    expect(getNumKeywords(parsed)).toEqual(2);
    expect(getConditionMap(parsed).template).toEqual([
      {
        value: 'recruiting: reject email, inexperience',
        negated: false,
      },
    ]);
  });

  test('intentional quote in text', () => {
    const str = "foo'bar from:aes";
    const parsed = SearchString.parse(str);
    expect(parsed.getTextSegments()).toEqual([{ text: "foo'bar", negated: false }]);
    expect(getNumKeywords(parsed)).toEqual(1);
    expect(getConditionMap(parsed).from).toEqual([
      {
        value: 'aes',
        negated: false,
      },
    ]);
  });

  test('intentional quote in operand', () => {
    const str = "foobar from:ae's";
    const parsed = SearchString.parse(str);
    expect(parsed.getTextSegments()).toEqual([{ text: 'foobar', negated: false }]);
    expect(getNumKeywords(parsed)).toEqual(1);
    expect(getConditionMap(parsed).from).toEqual([
      {
        value: "ae's",
        negated: false,
      },
    ]);
    expect(parsed.toString()).toEqual("from:ae's foobar");
  });

  test('quote in condition value', () => {
    const str = 'foobar template:" hello \'there\': other"';
    const parsed = SearchString.parse(str);
    expect(parsed.getTextSegments()).toEqual([{ text: 'foobar', negated: false }]);
    expect(getNumKeywords(parsed)).toEqual(1);
    expect(getConditionMap(parsed).template).toEqual([
      {
        value: " hello 'there': other",
        negated: false,
      },
    ]);
    expect(parsed.toString()).toEqual('template:" hello \'there\': other" foobar');
  });

  test('double quote in double quote condition value', () => {
    const str = 'foobar template:" hello \\"there\\": other"';
    const parsed = SearchString.parse(str);
    expect(parsed.getTextSegments()).toEqual([{ text: 'foobar', negated: false }]);
    expect(getNumKeywords(parsed)).toEqual(1);
    expect(getConditionMap(parsed).template).toEqual([
      {
        value: ' hello "there": other',
        negated: false,
      },
    ]);
    expect(parsed.toString()).toEqual('template:" hello \\"there\\": other" foobar');
  });

  test('two negative conditions concat toString', () => {
    const str = '-to:foo@foo.com,foo2@foo.com text';
    const parsed = SearchString.parse(str);
    expect(parsed.getParsedQuery().exclude.to).toEqual(['foo@foo.com', 'foo2@foo.com']);
    expect(parsed.toString()).toEqual('-to:foo@foo.com,foo2@foo.com text');
  });

  test('two negative conditions separate toString', () => {
    const str = '-to:foo@foo.com -to:foo2@foo.com text';
    const parsed = SearchString.parse(str);
    expect(parsed.getParsedQuery().exclude.to).toEqual(['foo@foo.com', 'foo2@foo.com']);
    expect(parsed.toString()).toEqual('-to:foo@foo.com,foo2@foo.com text');
  });

  test('transformTextToCondition', () => {
    const str = '<a@b.com> to:c@d.com';
    const transform = (text: string) =>
      text === '<a@b.com>' ? { key: 'to', value: 'a@b.com' } : null;
    // @ts-expect-error - TS doesn't like that we're passing a function that does return null
    const parsed = SearchString.parse(str, [transform]);
    expect(parsed.getTextSegments()).toEqual([]);
    expect(getNumKeywords(parsed)).toEqual(1);
    expect(parsed.getParsedQuery().to).toEqual(['a@b.com', 'c@d.com']);
  });

  test('removeEntry simple case', () => {
    const str = 'foo:bar,baz';
    const parsed = SearchString.parse(str);
    expect(parsed.getParsedQuery().foo).toEqual(['bar', 'baz']);

    parsed.removeEntry('foo', 'baz', false);

    expect(parsed.getParsedQuery().foo).toEqual(['bar']);
  });

  test('removeEntry should remove only one case', () => {
    const str = '-foo:bar,baz,bar,bar,bar';
    const parsed = SearchString.parse(str);
    expect(parsed.getParsedQuery().exclude.foo).toEqual(['bar', 'baz', 'bar', 'bar', 'bar']);

    parsed.removeEntry('foo', 'bar', true);

    expect(parsed.getParsedQuery().exclude.foo).toEqual(['baz', 'bar', 'bar', 'bar']);
  });

  test('removeEntry should be noop if entry is not found', () => {
    const str = 'foo:bar';
    const parsed = SearchString.parse(str);
    expect(parsed.getParsedQuery().foo).toEqual(['bar']);
    expect(parsed.toString()).toEqual('foo:bar');
    // @ts-expect-error - TS doesn't like that we're accessing a private property
    expect(parsed.isStringDirty).toEqual(false);

    parsed.removeEntry('foo', 'qux', false);

    expect(parsed.getParsedQuery().foo).toEqual(['bar']);
    // @ts-expect-error - TS doesn't like that we're accessing a private property
    expect(parsed.isStringDirty).toEqual(false);
  });
});
