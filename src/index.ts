import {HttpFunction} from '@google-cloud/functions-framework';
import {rebalanceCoins} from './services/cryptoBalancer/cryptoBalancer.service';

// export const helloWorld: HttpFunction = (request, response) => {
//   response.send('Hello from Firebase!');
// };

export const rebalance: HttpFunction = async (request, response) => {
  const result = await rebalanceCoins();
  response.send(result);
  return;
};
