# Search String

> Another simple parser for advanced search query syntax. Inspired by [search-query-parser](https://github.com/nepsilon/search-query-parser).

[![Build Status](https://travis-ci.org/mixmaxhq/search-string.svg?branch=master)](https://travis-ci.org/mixmaxhq/search-string)

## Installation

```shell
$ npm install search-string
```

## Current Uses

### data

```
SearchString.parse
searchString.getParsedQuery
searchString.getTextSegments
```

### app

```
SearchString.parse
searchString.getConditionArray
searchString.getAllText
searchString.clone
searchString.removeKeyword
searchString.addEntry
searchString.toString
searchString.getParsedQuery
```

## Usage

```javascript
const SearchString = require('search-string');

// Perform parsing
const str = 'to:me -from:joe@acme.com foobar1 -foobar2';
const searchString = SearchString.parse(str);

/* Get text */

// [ { text: 'foorbar1', negated: false }, { text: 'foobar2', negated: true } ]
searchString.getTextSegments();


/* Get conditions in different formats */

// { to: ['me'], excludes: { from: ['joe@acme.com'] }}
searchString.getParsedQuery(); 

// [ { key: 'to', value: 'me', negated: false }, { key: 'from', value: 'joe@acme.com', negated: true } ]
searchString.getConditionArray(); 

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
