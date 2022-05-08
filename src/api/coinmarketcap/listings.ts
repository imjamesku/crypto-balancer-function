import ins from './instance';
import {ListingResponse} from './types';

//https://coinmarketcap.com/api/documentation/v1/#operation/getV1CryptocurrencyListingsLatest
export async function getLatestMarketCapList({
  limit, // number of currencies to query
}: {
  limit: number;
}): Promise<ListingResponse> {
  const res = await ins.request<ListingResponse>({
    method: 'GET',
    url: 'v1/cryptocurrency/listings/latest',
    params: {sort_dir: 'desc', limit, start: 1},
  });
  return res.data;
}
