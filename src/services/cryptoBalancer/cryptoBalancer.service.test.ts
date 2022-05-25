import {
  calculateDesiredCoinBalance,
  getCoinsAvailableForTrading,
  sendNotification,
} from './cryptoBalancer.service';

describe('cryptoBalancer', () => {
  it('has sum of ratios = 1', async () => {
    const availableCoins = await getCoinsAvailableForTrading('USDT');
    //   console.log("available coins", availableCoins);
    const balance = await calculateDesiredCoinBalance(
      0.1,
      new Set(availableCoins.map(coin => coin.symbol)),
      new Set(),
      'USDT'
    );
    //   console.log(balance);
    const ratioSum = balance.reduce((partialSum, current) => {
      return partialSum + current.ratio;
    }, 0);
    //   const marketCapSum = balance.reduce((partialSum, current) => {
    //       return partialSum + current.marketCap
    //   }, 0)
    //   console.log(ratioSum);
    expect(ratioSum).toBeCloseTo(1);
  });

  it('sendMessage', async () => {
    await sendNotification('Rebalancing done\\.').catch((err: any) => {
      console.error(err.response.data);
    });
    await sendNotification('An error occurred \\!').catch((err: any) => {
      console.error(err.response.data);
    });
  });
});

// it("calculate orders to make", async () => {
//   const res = await calculateActualOrdersToMake([
//     {
//       symbol: "BTC",
//       pair: "BTCUSDT",
//       baseAmount: -0.20542865359977472,
//       quoteAmount: -3878.4929799637466,
//     },
//   ]);
//   console.log(res);
// });
