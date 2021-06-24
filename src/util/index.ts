/**
 * Make a promise that resolves after some time
 * @param ms The time to resolve at
 */
export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Resolves a Discord users ID.
 * @param arg The value to resolve
 */
export function resolveUser(arg: string) {
  if (/^\d{17,18}$/.test(arg)) return arg;
  else if (/^<@!?\d{17,18}>$/.test(arg)) return arg.replace(/^<@!?(\d{17,18})>$/, '$1');
  else return null;
}

/**
 * Makes sure a value is a decimal usable for the LBRY SDK.
 * @param arg The value to ensure
 */
export function ensureDecimal(arg: string | number) {
  const num = parseFloat(arg as any);
  if (isNaN(num)) return null;
  return Number.isInteger(num) ? `${num}.0` : num.toString();
}

export interface SplitOptions {
  maxLength?: number;
  char?: string;
  prepend?: string;
  append?: string;
}

/**
 * Splits a string into multiple chunks at a designated character that do not exceed a specific length.
 * @param text Content to split
 * @param options Options controlling the behavior of the split
 */
export function splitMessage(
  text: string,
  { maxLength = 2000, char = '\n', prepend = '', append = '' }: SplitOptions = {}
) {
  if (text.length <= maxLength) return [text];
  let splitText = [text];
  if (Array.isArray(char)) {
    while (char.length > 0 && splitText.some((elem) => elem.length > maxLength)) {
      const currentChar = char.shift();
      if (currentChar instanceof RegExp) {
        // @ts-ignore
        splitText = splitText.map((chunk) => chunk.match(currentChar));
      } else {
        // @ts-ignore
        splitText = splitText.map((chunk) => chunk.split(currentChar));
      }
    }
  } else {
    splitText = text.split(char);
  }
  if (splitText.some((elem) => elem.length > maxLength)) throw new RangeError('SPLIT_MAX_LEN');
  const messages = [];
  let msg = '';
  for (const chunk of splitText) {
    if (msg && (msg + char + chunk + append).length > maxLength) {
      messages.push(msg + append);
      msg = prepend;
    }
    msg += (msg && msg !== prepend ? char : '') + chunk;
  }
  return messages.concat(msg).filter((m) => m);
}
