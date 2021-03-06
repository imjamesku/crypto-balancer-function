import {
  getLatestMarketData,
  getSpotWalletBalance,
  placeOrder,
} from '../../api/bybit/spot/spot';
import {getLatestMarketCapList} from '../../api/coinmarketcap/listings';
import {sleep} from '../../utils/sleep';
import {OrderOptions, OrderSide, OrderType} from '../../api/bybit/types';
import {TradingRestrictions} from '../../data/TradingRestrictions/TradingRestrictions';
import {CONFIG, TELEGRAM_CHAT_ID} from '../../config';
import {sendMessage} from '../../api/telegram/bot';
import axios from 'axios';
import {round, roundDown} from '../../utils/rounding';

interface WalletBalance {
  coinBalances: {
    symbol: string;
    total: string;
    usdValue: number;
  }[];
  totalUsdValue: number;
}

interface CoinBalance {
  symbol: string;
  ratio: number;
  marketCap: number;
}

type PriceMap = Record<string, number>;

async function getWalletBalance(
  usdPriceMap: Record<string, number>
): Promise<WalletBalance> {
  const spotWalletBalanceRes = await getSpotWalletBalance();
  const coinBalances = spotWalletBalanceRes.result.balances.map(coinBalance => {
    const value =
      coinBalance.coinId in usdPriceMap
        ? parseFloat(coinBalance.total) * usdPriceMap[coinBalance.coinId]
        : 0;
    return {
      symbol: coinBalance.coinId,
      total: coinBalance.total,
      usdValue: value,
    };
  });
  const totalUsdValue = coinBalances.reduce(
    (partialSum, current) => partialSum + current.usdValue,
    0
  );
  return {coinBalances, totalUsdValue};
}

export async function calculateDesiredCoinBalance(
  stableRatio: number,
  includeCoins: Set<string>,
  excludeCoins: Set<string>,
  stableCoinSymbol: string
): Promise<CoinBalance[]> {
  const res = await getLatestMarketCapList({limit: 50}).then(res => res.data);
  const stableCoinData = res.find(coin => coin.symbol === stableCoinSymbol);
  if (!stableCoinData) {
    throw new Error('Invalid stablecoin');
  }
  const coinsToInclude = res.filter(
    coin =>
      !excludeCoins.has(coin.symbol) &&
      coin.symbol != stableCoinSymbol &&
      includeCoins.has(coin.symbol)
  );
  const includedMarketCapSum = coinsToInclude.reduce(
    (partialSum, current) => partialSum + current.quote.USD.market_cap,
    0
  );
  const balanceOfIncludedCoins = coinsToInclude.map(coin => ({
    symbol: coin.symbol,
    ratio:
      (coin.quote.USD.market_cap / includedMarketCapSum) * (1 - stableRatio),
    marketCap: coin.quote.USD.market_cap,
  }));
  balanceOfIncludedCoins.push({
    symbol: stableCoinSymbol,
    ratio: stableRatio,
    marketCap: stableCoinData.quote.USD.market_cap,
  });
  return balanceOfIncludedCoins;
}

async function getAvailableCoinPrices(
  stableCoinSymbol: string
): Promise<PriceMap> {
  const availableCoins = await getCoinsAvailableForTrading(stableCoinSymbol);
  const priceMap = Object.fromEntries(
    availableCoins.map(coin => [coin.symbol, parseFloat(coin.lastPrice)]) // lastPrice may be undefined
  );
  priceMap[stableCoinSymbol] = 1;
  return priceMap;
}

export async function calculateCoinsToTrade(
  stableCoinSymbol: string,
  walletBalance: WalletBalance,
  desiredBalance: CoinBalance[],
  availableCoinPriceMap: PriceMap
) {
  // price map with stable coin as base

  const desiredRatios = Object.fromEntries(
    desiredBalance.map(balance => [balance.symbol, balance.ratio])
  );

  const currentBalances = Object.fromEntries(
    walletBalance.coinBalances.map(balance => [balance.symbol, balance])
  );

  const allCoins = new Set(
    desiredBalance
      .map(balance => balance.symbol)
      .concat(walletBalance.coinBalances.map(balance => balance.symbol))
  );

  // Don't including the stable coin when trading because it is used as cash
  allCoins.delete(stableCoinSymbol);

  return Array.from(allCoins).map(symbol => {
    const desiredAmount =
      symbol in desiredRatios
        ? walletBalance.totalUsdValue * desiredRatios[symbol]
        : 0;
    const currentAmount =
      symbol in currentBalances ? currentBalances[symbol].usdValue : 0;
    return {
      symbol,
      pair: symbol + stableCoinSymbol,
      baseAmount:
        availableCoinPriceMap[symbol] === 0
          ? undefined
          : (desiredAmount - currentAmount) / availableCoinPriceMap[symbol],
      quoteAmount: desiredAmount - currentAmount,
    };
  });
}

// async function getTradingRestrictionsForCoins() {
//   const symbolInfo = await getSymbols();
//   const rules = symbolInfo.result;
//   return Object.fromEntries(
//     rules.map((coinTradingInfo) => [coinTradingInfo.name, coinTradingInfo])
//   );
// }

async function placeOrders(orders: Array<OrderOptions>) {
  const orderResArr = [];
  for (const {symbol, side, qty} of orders) {
    const res = await placeOrder({
      symbol,
      side,
      qty,
      type: OrderType.market,
    });
    orderResArr.push({symbol, side, qty, ...res});
    if (res.ret_code == 0) {
      console.log('Succesfully place order: ', res);
      console.log('order info: ', {symbol, side, qty});
    }
    if (res.ret_code != 0) {
      console.error('Failed to place order: ', res);
      console.error('order info: ', {symbol, side, qty});
    }
    await sleep(100);
  }
  return orderResArr;
}

export async function calculateActualOrdersToMake(
  TradingInfoArr: Array<{
    symbol: string;
    pair: string;
    baseAmount: number | undefined; // see getAvailableCoinPrices to learn why it may be undefined
    quoteAmount: number;
  }>,
  walletCoinBalancesMap: Record<string, number>
) {
  const ordersToMake: Array<OrderOptions> = [];
  const tradingRestrictions =
    await TradingRestrictions.getTradingRestrictions();
  for (const {pair, baseAmount, quoteAmount, symbol} of TradingInfoArr) {
    if (quoteAmount === 0) {
      continue;
    }
    if (!tradingRestrictions.hasRestrictionData(pair)) {
      console.log(`No trading restrictions data for ${pair}. Skip`);
      continue;
    }
    const tradingConstraintsForCoin =
      tradingRestrictions.getRestrictionData(pair);
    let side: OrderSide;
    let qty: number;

    if (quoteAmount > 0) {
      // buying
      const toFixedDigits =
        tradingConstraintsForCoin.minPricePrecision.length - 2;
      side = OrderSide.buy;
      qty = round(quoteAmount, Math.min(toFixedDigits, 20));
      const [minTradeAmount, maxTradeAmount] = [
        parseFloat(tradingConstraintsForCoin.minTradeAmount),
        parseFloat(tradingConstraintsForCoin.maxTradeAmount),
      ];
      if (qty < minTradeAmount) {
        console.log('qty less than minTradeAmount. Skip', {
          pair,
          'qty(quote)': qty,
          minTradeAmount,
          side,
        });
        // lower than min amount. Skip the orders for this coin
        continue;
      }
      if (qty > maxTradeAmount) {
        const quotient = Math.floor(qty / maxTradeAmount);
        ordersToMake.concat(
          Array(quotient).fill({
            symbol: pair,
            side,
            qty: maxTradeAmount,
            type: OrderType.market,
          })
        );
        const remainingQty = round(
          qty - quoteAmount * maxTradeAmount,
          Math.min(toFixedDigits, 20)
        );
        if (remainingQty >= minTradeAmount) {
          ordersToMake.push({
            symbol: pair,
            side,
            qty: remainingQty,
            type: OrderType.market,
          });
        }
        continue;
      }
    } else {
      // selling
      if (baseAmount === undefined) {
        // Cannot place order due to no baseAmount. Skip
        console.log('Base amount undefined. Skip', pair);
        continue;
      }
      if (tradingConstraintsForCoin.basePrecision == undefined) {
        console.error('no base precision. cannot sell', pair);
        continue;
      }
      const toFixedDigits = tradingConstraintsForCoin.basePrecision.length - 2;

      const walletAmount =
        symbol in walletCoinBalancesMap ? walletCoinBalancesMap[symbol] : 0;
      // if selling more than the amount in wallet, only sell the amount in wallet
      qty = -baseAmount > walletAmount ? walletAmount : -baseAmount;
      qty = roundDown(qty, Math.min(toFixedDigits, 20)); // if round up, qty may exceed holding
      side = OrderSide.sell;
      const [minTradeQuantity, maxTradeQuantity] = [
        parseFloat(tradingConstraintsForCoin.minTradeQuantity),
        parseFloat(tradingConstraintsForCoin.maxTradeQuantity),
      ];
      if (qty < minTradeQuantity) {
        console.log('qty less than minTradeQuantity. Skip', {
          pair,
          'qty(base)': qty,
          minTradeQuantity,
          side,
        });
        continue;
      }
      if (qty > maxTradeQuantity) {
        // ????????????orders
        // qty = maxTradeQuantity;
        const quotient = Math.floor(qty / maxTradeQuantity);
        ordersToMake.concat(
          Array(quotient).fill({
            symbol: pair,
            side,
            qty: maxTradeQuantity,
            type: OrderType.market,
          })
        );

        const remainingQty = round(
          qty - quoteAmount * maxTradeQuantity,
          Math.min(toFixedDigits, 20)
        );
        if (remainingQty >= minTradeQuantity) {
          ordersToMake.push({
            symbol: pair,
            side,
            qty: remainingQty,
            type: OrderType.market,
          });
        }
        continue;
      }
    }
    ordersToMake.push({
      symbol: pair,
      side,
      qty,
      type: OrderType.market,
    });
  }
  return ordersToMake;
}

export async function getCoinsAvailableForTrading(stableCoinSymbol: string) {
  const marketData = await getLatestMarketData();
  const tradingPairsWithStableBase = marketData.result.filter(coinData => {
    return coinData.symbol.endsWith(stableCoinSymbol);
  });
  return tradingPairsWithStableBase.map(e => ({
    symbol: e.symbol.substring(0, e.symbol.length - 4),
    pair: e.symbol,
    lastPrice: e.lastPrice,
    bestAskPrice: e.bestAskPrice,
    bestBidPrice: e.bestBidPrice,
  }));
}

export async function sendNotification(markdownContent: string) {
  return await sendMessage({
    chat_id: TELEGRAM_CHAT_ID,
    text: markdownContent,
  }).catch(err => {
    console.error(err);
    throw err;
  });
}

export async function rebalanceCoins() {
  const {
    EXCLUDE_COINS,
    STABLE_COIN,
    STABLE_RATIO,
    TRADE_THRESHOLD_RATIO,
    TEST_RUN,
  } = CONFIG;

  const priceMap = await getAvailableCoinPrices(STABLE_COIN); //1. ???????????????????????????????????????
  const walletBalance = await getWalletBalance(priceMap); //2. ?????????????????????????????????????????????????????????
  const desiredBalance = await calculateDesiredCoinBalance(
    //3. ????????????coinmarketcap???????????????????????????????????????????????????
    STABLE_RATIO,
    new Set(Object.keys(priceMap)),
    EXCLUDE_COINS,
    STABLE_COIN
  );
  const coinsToTrade = await calculateCoinsToTrade(
    //4. ??????????????????????????????????????????????????????????????????????????????
    STABLE_COIN,
    walletBalance,
    desiredBalance,
    priceMap
  );
  coinsToTrade.sort((a, b) => a.quoteAmount - b.quoteAmount);
  console.log('coins to trade: ', coinsToTrade);

  const totalAbsTradeAmount = coinsToTrade.reduce(
    // 5. ??????????????????
    (partial, current) => partial + Math.abs(current.quoteAmount),
    0
  );

  const absTradeAmountRatio = totalAbsTradeAmount / walletBalance.totalUsdValue;
  if (absTradeAmountRatio < TRADE_THRESHOLD_RATIO) {
    // ????????????????????????????????????????????????????????????
    console.log('Total trading ratio too small. Return');
    return;
  }

  const coinBalanceMap = Object.fromEntries(
    walletBalance.coinBalances.map(coin => [
      coin.symbol,
      parseFloat(coin.total.replace(',', '')),
    ])
  );
  const ordersToMake = await calculateActualOrdersToMake(
    //6. ??????bybit?????????????????????????????????????????????????????????????????????????????????
    coinsToTrade,
    coinBalanceMap
  );
  console.log('orders to make: ', ordersToMake);

  if (TEST_RUN) {
    return {
      priceMap,
      desiredBalance,
      coinsToTrade,
      tradeAmountRatio: absTradeAmountRatio,
      ordersToMake,
    };
  }
  const orderResArr = await placeOrders(ordersToMake); //??????????????????
  console.log(orderResArr);

  return {
    priceMap,
    walletBalance,
    desiredBalance,
    coinsToTrade,
    tradeAmountRatio: absTradeAmountRatio,
    ordersToMake,
    orderResArr,
  };
}

export async function tryRebalanceCoins() {
  try {
    const res = await rebalanceCoins();
    console.log('Rebalacing done. results: ', res);
    await sendNotification('Rebalancing done\\.');
    await sendNotification(
      `Orders made: \`\`\`json\n${JSON.stringify(
        res?.orderResArr ?? []
      ).substring(0, 3900)}\`\`\``
    );
    return res;
    // await sendNotification(`test message`);
  } catch (error) {
    console.error(error);
    sendNotification('An error occurred\\!'); //! and . must be escaped
    if (axios.isAxiosError(error)) {
      await sendNotification(
        `error occurred\\. error: ${error.message}. response message: ${error.response?.data} `
      );
    } else {
      await sendNotification(
        `error occurred\\. ${JSON.stringify(error).substring(0, 3900)}`
      );
    }
    throw error;
  }
}
