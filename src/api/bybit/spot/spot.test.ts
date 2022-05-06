import {OrderSide, OrderType} from '../types';
import {getSpotWalletBalance, getSymbols, placeOrder} from './spot';

it('fetches spot wallet balance', async () => {
  const data = await getSpotWalletBalance('ETH');
  console.log(data);
});

it('places order', async () => {
  const res = await placeOrder({
    symbol: 'BITUSDT',
    side: OrderSide.buy,
    // orderLinkId: "test02",
    qty: 100,
    type: OrderType.market,
  });
  console.log(res);
});

it('gets symbol data', async () => {
  const res = await getSymbols();
  console.log(res);
});
