import {BYBIT_API_KEY, BYBIT_SECRET_KEY} from '../../../config';
import instance from '../instance';
import {MarketDataRes, PlaceOrderRes, SpotWalletRes, SymbolsRes} from './types';
import {getSignature} from '../utils';
import {OrderOptions} from '../types';

export async function getSpotWalletBalance(
  coin?: string
): Promise<SpotWalletRes> {
  const params: Record<string, unknown> = {
    api_key: BYBIT_API_KEY,
    timestamp: Date.now(),
  };
  if (coin) {
    params.coin = coin;
  }
  const withSign = {...params, sign: getSignature(params, BYBIT_SECRET_KEY)};
  console.log(withSign);
  const res = await instance.get<SpotWalletRes>('/spot/v1/account', {
    params: withSign,
  });
  if (res.data.ret_code != 0) {
    throw new Error(`ret_code not 0, ${JSON.stringify(res.data)}`);
  }
  // console.log('walllet!!!!!!!!!');
  // console.log(res.data);
  return res.data;
}

export async function getLatestMarketData(): Promise<MarketDataRes> {
  const res = await instance.get<MarketDataRes>('/spot/quote/v1/ticker/24hr');
  return res.data;
}

export async function placeOrder({
  symbol,
  qty /* Order quantity (for market orders: when side is Buy, this is in the quote currency.     Otherwise, qty is in the base currency. For example, on BTCUSDT a Buy order is in USDT, otherwise it's in BTC. For limit orders, the qty is always in the base currency.) */,
  side,
  type,
  orderLinkId,
}: OrderOptions): Promise<PlaceOrderRes> {
  const body: Record<string, unknown> = {
    symbol,
    qty,
    side,
    type,
    api_key: BYBIT_API_KEY,
    timestamp: Date.now(),
  };
  if (orderLinkId) {
    body.orderLinkId = orderLinkId;
  }
  const withSign = {...body, sign: getSignature(body, BYBIT_SECRET_KEY)};
  console.log(withSign);
  // const res = await instance.post<PlaceOrderRes>("/spot/v1/order", withSign);
  const res = await instance.request<PlaceOrderRes>({
    url: '/spot/v1/order',
    method: 'POST',
    // data: withSign,
    params: withSign,
  });
  return res.data;
}

export async function getSymbols() {
  const res = await instance.request<SymbolsRes>({
    method: 'GET',
    url: '/spot/v1/symbols',
  });
  return res.data;
}
