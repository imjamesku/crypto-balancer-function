import axios from 'axios';
import {TELEGRAM_BASE_URL} from '../../config';

const instance = axios.create({
  baseURL: TELEGRAM_BASE_URL,
});

export default instance;
