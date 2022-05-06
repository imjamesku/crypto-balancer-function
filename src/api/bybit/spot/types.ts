export interface SpotWalletRes {
  ret_code: number;
  ret_msg: string;
  ext_code: null;
  ext_info: null;
  result: SpotWaletBalances;
}

export interface SpotWaletBalances {
  balances: Balance[];
}

export interface Balance {
  coin: string;
  coinId: string;
  coinName: string;
  total: string;
  free: string;
  locked: string;
}

export interface MarketDataRes {
  ret_code: number;
  ret_msg: null;
  result: MarketData[];
  ext_code: null;
  ext_info: null;
}

export interface MarketData {
  time: number;
  symbol: string;
  bestBidPrice: string;
  bestAskPrice: string;
  volume: string;
  quoteVolume: string;
  lastPrice: string;
  highPrice: string;
  lowPrice: string;
  openPrice: string;
}

export interface PlaceOrderRes {
  ret_code: number;
  ret_msg: string;
  ext_code: null;
  ext_info: null;
  result: PlaceOrderResult;
}

export interface PlaceOrderResult {
  accountId: string;
  symbol: string;
  symbolName: string;
  orderLinkId: string;
  orderId: string;
  transactTime: string;
  price: string;
  origQty: string;
  executedQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
}

export interface SymbolsRes {
  ret_code: number;
  ret_msg: string;
  ext_code: null;
  ext_info: null;
  result: SymbolData[];
}

export interface SymbolData {
  name: string;
  alias: string;
  baseCurrency: string;
  quoteCurrency: string;
  basePrecision: string;
  quotePrecision: string;
  minTradeQuantity: string;
  minTradeAmount: string;
  minPricePrecision: string;
  maxTradeQuantity: string;
  maxTradeAmount: string;
  category: number;
}
