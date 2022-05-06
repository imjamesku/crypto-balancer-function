import axios from 'axios';
import {COINMARKETCAP_API_KEY, COINMARKETCAP_BASE_URL} from '../../config';

const ins = axios.create({
  baseURL: COINMARKETCAP_BASE_URL,
  //   baseURL: "https://sandbox-api.coinmarketcap.com",
  headers: {
    'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY,
  },
});

export default ins;
