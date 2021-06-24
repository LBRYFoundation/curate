import { CommandContext } from 'dexare';
import Eris from 'eris';

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

export enum ConfirmEmoji {
  YES = '✔️',
  NO = '❌'
}

/**
 * Create a confirmation prompt.
 * @param ctx The context to use
 * @param content The content to send
 * @param file The file(s)
 */
export async function confirm(
  ctx: CommandContext,
  content: Eris.MessageContent,
  file?: Eris.MessageFile | Eris.MessageFile[]
): Promise<boolean> {
  const botUser = ctx.client.bot.user.id;
  const message = await ctx.reply(content, file);
  const group = `confirm:${message.id}`;

  return new Promise((resolve) => {
    const timeout = setTimeout(() => cb(false), 30000);
    const cb = (result: boolean, destroyed = false) => {
      clearTimeout(timeout);
      if (!destroyed) message.delete().catch(() => {});
      ctx.client.events.unregisterGroup(group);
      resolve(result);
    };

    /* #region events */
    ctx.client.events.register(group, 'messageReactionAdd', (_, { id }, emoji, member) => {
      if (message.id === id && member.id === ctx.author.id) {
        if (emoji.name === ConfirmEmoji.YES) cb(true);
        if (emoji.name === ConfirmEmoji.NO) cb(false);
      }
    });

    ctx.client.events.register(
      group,
      'messageCreate',
      (event, reply) => {
        if (reply.channel.id === message.channel.id && reply.author.id === ctx.author.id) {
          if (reply.content.toLowerCase() === 'yes') {
            event.skip('commands');
            cb(true);
          } else if (reply.content.toLowerCase() === 'no') {
            event.skip('commands');
            cb(false);
          }
        }
      },
      { before: ['commands'] }
    );

    ctx.client.events.register(group, 'messageDelete', (_, { id }) => {
      if (message.id === id) cb(false, true);
    });

    ctx.client.events.register(group, 'messageDeleteBulk', (_, messages) => {
      for (const { id } of messages) if (message.id === id) return cb(false, true);
    });

    ctx.client.events.register(group, 'channelDelete', (_, channel) => {
      if (message.channel.id === channel.id) return cb(false, true);
    });

    if (message.guildID) {
      ctx.client.events.register(group, 'guildDelete', (_, guild) => {
        if (message.guildID === guild.id) return cb(false, true);
      });

      ctx.client.events.register(group, 'guildMemberRemove', (_, guild, member) => {
        if (message.guildID === guild.id && member.id === ctx.author.id) return cb(false);
      });

      ctx.client.events.register(group, 'guildBanAdd', (_, guild, user) => {
        if (message.guildID === guild.id && user.id === ctx.author.id) return cb(false);
      });
    }
    /* #endregion */

    if ('permissionsOf' in ctx.channel ? ctx.channel.permissionsOf(botUser).has('addReactions') : true)
      Promise.all([ConfirmEmoji.YES, ConfirmEmoji.NO].map(message.addReaction)).catch(() => {});
  });
}
