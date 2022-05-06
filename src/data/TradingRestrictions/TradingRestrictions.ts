import {getSymbols} from '../../api/bybit/spot/spot';
import {SymbolData} from '../../api/bybit/spot/types';
import {fallBackTradingRestrictions} from './bybitFallbackTradingRestrictions';

export class TradingRestrictions {
  tradingRestrictions: Record<string, TradingRestrictionForCoin>;
  fallBackTradingRestrictions: Record<string, TradingRestrictionForCoin>;

  constructor(tradingRestrictions: Array<SymbolData>) {
    this.tradingRestrictions = Object.fromEntries(
      tradingRestrictions.map(
        ({
          name,
          minTradeQuantity,
          minTradeAmount,
          minPricePrecision,
          basePrecision,
          maxTradeQuantity,
          maxTradeAmount,
        }) => [
          name,
          {
            pair: name,
            minTradeQuantity,
            minTradeAmount,
            minPricePrecision,
            basePrecision,
            maxTradeQuantity,
            maxTradeAmount,
          },
        ]
      )
    );
    this.fallBackTradingRestrictions = Object.fromEntries(
      fallBackTradingRestrictions.map(
        ({
          pair,
          minTradeQuantity,
          minTradeAmount,
          minPricePrecision,
          maxTradeQuantity,
          maxTradeAmount,
        }) => [
          pair,
          {
            pair,
            minTradeQuantity: minTradeQuantity.replace(',', ''),
            minTradeAmount: minTradeAmount.replace(',', ''),
            minPricePrecision,
            maxTradeQuantity: maxTradeQuantity.replace(',', ''),
            maxTradeAmount: maxTradeAmount.replace(',', ''),
          },
        ]
      )
    );
  }

  public hasRestrictionData(pair: string) {
    if (
      pair in this.tradingRestrictions ||
      pair in this.fallBackTradingRestrictions
    ) {
      return true;
    }
    return false;
  }

  public getRestrictionData(pair: string) {
    if (pair in this.tradingRestrictions) {
      return this.tradingRestrictions[pair];
    }
    if (pair in this.fallBackTradingRestrictions) {
      console.log('Using fallback restrictions for ', pair);
      return this.fallBackTradingRestrictions[pair];
    }
    throw new Error('No restriction data');
  }

  static async getTradingRestrictions(): Promise<TradingRestrictions> {
    const symbolData = await getSymbols();
    return new TradingRestrictions(symbolData.result);
  }
}

export interface TradingRestrictionForCoin {
  pair: string;
  minTradeQuantity: string;
  minTradeAmount: string;
  minPricePrecision: string; // equivalent to quotePrecision
  basePrecision?: string;
  maxTradeQuantity: string;
  maxTradeAmount: string;
}
