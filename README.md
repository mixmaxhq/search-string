# Search String

> Another simple parser for advanced search query syntax. Inspired by [search-query-parser](https://github.com/nepsilon/search-query-parser).

[![Build Status](https://travis-ci.org/mixmaxhq/search-string.svg?branch=master)](https://travis-ci.org/mixmaxhq/search-string)

It parses typical Gmail-style search strings like:

```
to:me -from@joe@mixmax.com foobar1 -foobar2
```

And returns an instance of `SearchString` which can be mutated, return different data structures, or return the gmail-style search string again.


## Installation

```shell
$ npm install search-string
```

## Usage

```javascript
const SearchString = require('search-string');

// Perform parsing
const str = 'to:me -from:joe@mixmax.com foobar1 -foobar2';
const searchString = SearchString.parse(str);

/* Get text in different formats. */

// [ { text: 'foorbar1', negated: false }, { text: 'foobar2', negated: true } ]
searchString.getTextSegments();

// `foobar1 -foobar2`
searchString.getAllText();


/* Get conditions in different formats. */

// Standard format: Condition Array
// [ { key: 'to', value: 'me', negated: false }, { key: 'from', value: 'joe@mixmax.com', negated: true } ]
searchString.getConditionArray(); 

// Alternate format: Parsed Query
// { to: ['me'], excludes: { from: ['joe@mixmax.com'] }}
searchString.getParsedQuery(); 

/* Or get text and conditions back in string format. */

// `to:me -from:joe@mixmax.com foobar1 -foobar2`
searchString.toString();


/* Mutations exist as well for modifying an existing SearchString structure. */

// `to:me foobar -foobar2`
searchString.removeKeyword('from', true).toString()

// `to:me from:jane@mixmax.com foobar1 -foobar2`
searchString.addEntry('from', 'jane@mixmax.com', false).toString();


/* clone operation instantiates a new version by copying over data. */

// `to:me from:jane@mixmax.com foobar1 -foobar2`
searchString.clone().toString();


```

## Testing

Run tests with `npm test`

or run tests on any changes with `npm run testWatch`

## Building

Build ES5 compatible code with `npm run babel`

or continually build and watch for changes with `npm run babelWatch`

## License

The MIT License (MIT)

Copyright (c) 2017 Mixmax <marcus@mixmax.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
