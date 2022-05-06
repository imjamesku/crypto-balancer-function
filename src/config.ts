export const ENV = process.env.ENV ?? 'DEV';
export const IS_DEV_ENV = ENV === 'DEV';

// coinmarketcap
export const COINMARKETCAP_API_KEY = process.env
  .COINMARKETCAP_API_KEY as string;
export const COINMARKETCAP_BASE_URL = IS_DEV_ENV
  ? 'https://sandbox-api.coinmarketcap.com'
  : 'https://pro-api.coinmarketcap.com';

// bybit
export const BYBIT_BASE_URL = IS_DEV_ENV
  ? 'https://api-testnet.bybit.com'
  : 'https://api.bybit.com';

export const BYBIT_API_KEY = process.env.BYBIT_API_KEY as string;
export const BYBIT_SECRET_KEY = process.env.BYBIT_SECRET_KEY as string;

export const CONFIG = {
  EXCLUDE_COINS: new Set(['USDC', 'BUSD']), // Do not put the stable coin to use in EXCLUDE_COINS
  STABLE_COIN: 'USDT', // which stable coin to use
  STABLE_RATIO: 0.1, // ratio of asset to allocate in stable coin
  TRADE_THRESHOLD_RATIO: 0.05,
  TEST_RUN: false, // if true, only calculates orders to make but does not place orders
};
