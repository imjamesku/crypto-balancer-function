import instance from './instance';
import {SendMessageOptions, SendMessageRes} from './types';

export async function sendMessage(options: SendMessageOptions) {
  return await instance.request<SendMessageRes>({
    method: 'POST',
    url: '/sendMessage',
    data: {
      ...options,
      parse_mode: 'MarkdownV2',
    },
  });
}
