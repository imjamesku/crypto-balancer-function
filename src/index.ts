import {HttpFunction} from '@google-cloud/functions-framework';
import {tryRebalanceCoins} from './services/cryptoBalancer/cryptoBalancer.service';

// export const helloWorld: HttpFunction = (request, response) => {
//   response.send('Hello from Firebase!');
// };

export const rebalance: HttpFunction = async (request, response) => {
  const result = await tryRebalanceCoins();
  response.send(result);
  return;
};
