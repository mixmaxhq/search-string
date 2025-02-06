## Release History

  * 4.1.0 Dual-publish both CJS and ESM builds
  
  
  * 4.0.0 feat: add typescript
  
  
* 3.1.0 Added `removeEntry` method.
	
* 3.0.0 API tidying
  * Removal of `conditionMap` data structure which was already deprecated.
  * Removal of helper `getNumUniqueConditionKeys` which hasn't been needed.
  * Caching `toString` result for quick follow-up retrieval.

* 2.0.4 `npm version` mixup

* 2.0.3 Fix input string concat negative conditions

* 2.0.2 `toString` should handle `"` by converting to `\"`

* 2.0.1 Babel es2015 preset for client side use.

* 2.0.0 Deprecate `SearchString.getConditionMap`, add `toString`, `clone`, `addEntry`, `removeKeyword` to `SearchString`.

* 1.2.2 Persist unpaired quotes e.g. `her's` should be persisted as `her\'s`

* 1.2.1 Handle `null` argument for `SearchString.parse`

* 1.2.0 Do not preserve \\

* 1.1.1 package.json should list files

* 1.1.0 Add functional `SearchString` class

* 1.0.0 Placeholder for `search-string`
