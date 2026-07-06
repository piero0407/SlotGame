export function distanceForward(from, to, stripLength) {
  return wrapIndex(to - from, stripLength);
}

export function distanceBackward(from, to, stripLength) {
  return wrapIndex(from - to, stripLength);
}

export function getVisibleSymbols(strip, stop, rows) {
  return Array.from({ length: rows }, (_, rowIndex) => strip[wrapIndex(stop + rowIndex, strip.length)]);
}

export function getBackwardStepWindowSymbols(strip, stop, rows) {
  const previousStop = wrapIndex(stop - 1, strip.length);

  return [
    strip[previousStop],
    ...getVisibleSymbols(strip, stop, rows),
  ];
}

export function alignStepCountToStop(minimumSteps, stopDistance, stripLength) {
  return minimumSteps + wrapIndex(stopDistance - minimumSteps, stripLength);
}

export function wrapIndex(index, length) {
  return ((index % length) + length) % length;
}
