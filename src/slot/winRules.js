export function evaluateWin(visibleSymbolsByReel, rule) {
  const evaluator = ruleEvaluators.get(rule.type);

  if (!evaluator) {
    throw new Error(`Unsupported win rule type: ${rule.type}`);
  }

  return evaluator(visibleSymbolsByReel, rule);
}

export function registerWinRule(type, evaluator) {
  ruleEvaluators.set(type, evaluator);
}

const ruleEvaluators = new Map([
  ['matchingRow', evaluateMatchingRow],
]);

function evaluateMatchingRow(visibleSymbolsByReel, rule) {
  const rowSymbols = visibleSymbolsByReel.map((reelSymbols) => reelSymbols[rule.rowIndex]);
  const firstSymbol = rowSymbols[0];
  const matches = rowSymbols.filter((symbolId) => symbolId === firstSymbol).length;

  return {
    win: matches >= rule.minimumMatches,
    symbolId: firstSymbol,
  };
}
