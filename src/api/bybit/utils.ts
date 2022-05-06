import * as crypto from 'crypto';
export function getSignature(
  parameters: Record<string, unknown>,
  secret: string
): string {
  let orderedParams = '';
  Object.keys(parameters)
    .sort()
    .forEach(key => {
      orderedParams += key + '=' + parameters[key] + '&';
    });
  orderedParams = orderedParams.substring(0, orderedParams.length - 1);

  return crypto
    .createHmac('sha256', secret)
    .update(orderedParams)
    .digest('hex');
}
