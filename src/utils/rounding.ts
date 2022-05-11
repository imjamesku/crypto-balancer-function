//e.g.: roundDown(3.37662, 2) === 3.37
export function roundDown(n: number, precision: number) {
  const exp = 10 ** precision;
  return Math.floor(n * exp) / exp;
}

export function round(n: number, precision: number) {
  return parseFloat(n.toFixed(precision));
}
