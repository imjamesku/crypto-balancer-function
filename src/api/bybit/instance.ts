import axios from 'axios';
import {BYBIT_BASE_URL, COINMARKETCAP_API_KEY} from '../../config';

const instance = axios.create({
  baseURL: BYBIT_BASE_URL,
  //   baseURL: "https://sandbox-api.coinmarketcap.com",
  headers: {
    'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY,
  },
});

export default instance;
