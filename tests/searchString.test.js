const SearchString = require("../searchString");

// why jest? https://blog.kentcdodds.com/migrating-to-jest-881f75366e7e

describe("searchString", () => {
  test("basic", () => {
    const str = "to:me -from:joe@acme.com foobar";
    const parsed = SearchString.parse(str);
    expect(parsed.text).toEqual("foobar");
    expect(parsed.operators.length).toEqual(2);
    expect(parsed.operators[0]).toEqual({
      key: "to",
      value: "me",
      negate: false
    });
    expect(parsed.operators[1]).toEqual({
      key: "from",
      value: "joe@acme.com",
      negate: true
    });
  });
  test("multiple text segments", () => {
    const str = "to:me foobar zoobar";
    const parsed = SearchString.parse(str);
    expect(parsed.text).toEqual("foobar zoobar");
    expect(parsed.operators.length).toEqual(1);
    expect(parsed.operators[0]).toEqual({
      key: "to",
      value: "me",
      negate: false
    });
  });
  test("quoted value with space", () => {
    const str = 'to:"Marcus Ericsson" foobar';
    const parsed = SearchString.parse(str);
    expect(parsed.text).toEqual("foobar");
    expect(parsed.operators.length).toEqual(1);
    expect(parsed.operators[0]).toEqual({
      key: "to",
      value: "Marcus Ericsson",
      negate: false
    });
  });
});
