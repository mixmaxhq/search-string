type QuotePairMap = {
  single: Record<number, boolean>;
  double: Record<number, boolean>;
};

function getQuotePairMap(str?: string | undefined | null): QuotePairMap {
  if (!str) str = '';
  const quotePairMap: QuotePairMap = { single: {}, double: {} };

  const prevQuote = { single: -1, double: -1 };
  let prevChar = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (prevChar !== '\\') {
      if (char === '"') {
        if (prevQuote.double >= 0) {
          quotePairMap.double[prevQuote.double] = true;
          quotePairMap.double[i] = true;
          prevQuote.double = -1;
        } else {
          prevQuote.double = i;
        }
      } else if (char === "'") {
        if (prevQuote.single >= 0) {
          quotePairMap.single[prevQuote.single] = true;
          quotePairMap.single[i] = true;
          prevQuote.single = -1;
        } else {
          prevQuote.single = i;
        }
      }
    }
    prevChar = char ?? '';
  }

  return quotePairMap;
}

export { getQuotePairMap };
