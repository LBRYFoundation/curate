import { ClientEvent, CommandContext } from 'dexare';
import Eris from 'eris';
import chunk from 'lodash.chunk';
import { splitMessage } from '.';

export enum PagerEmoji {
  STOP = '🛑',
  NEXT = '➡️',
  PREVIOUS = '⬅️',
  FIRST = '⏮️',
  LAST = '⏭️'
}

export interface PagerOptions {
  items: string[];
  itemsPerPage?: number | 'auto';
  itemSeparator?: string;
  characterLimit?: number;
  idleTime?: number;
  startPage?: number;
  title?: string;
}

export interface InternalPagerStopOptions {
  destroy?: boolean;
  destroyed?: boolean;
}

export interface InternalPagerTurnOptions {
  emoji?: Eris.Emoji;
  event?: ClientEvent;
  reply?: Eris.Message;
}

/**
 * Create a pagination.
 */
export async function paginate(
  ctx: CommandContext,
  {
    items,
    itemsPerPage = 'auto',
    itemSeparator = '\n',
    characterLimit = 2048,
    idleTime = 30000,
    startPage = 1,
    title = 'Items'
  }: PagerOptions,
  embed?: Eris.EmbedOptions
) {
  /* #region pages */
  const pages: string[] =
    itemsPerPage === 'auto'
      ? splitMessage(items.join(itemSeparator), { maxLength: characterLimit })
      : chunk(items, itemsPerPage).map((page) => page.join(itemSeparator));
  if (isNaN(startPage) || startPage <= 1) startPage = 1;
  else if (startPage > pages.length) startPage = pages.length;
  let page = startPage;

  const render = (page: number): Eris.MessageContent => ({
    embed: {
      ...(embed || {}),
      title: `${title} [${page}/${pages.length}]`,
      description: pages[page + 1]
    }
  });
  /* #endregion */

  const botUser = ctx.client.bot.user.id;
  const canReact =
    'permissionsOf' in ctx.channel ? ctx.channel.permissionsOf(botUser).has('addReactions') : true;
  const canManage =
    'permissionsOf' in ctx.channel ? ctx.channel.permissionsOf(botUser).has('manageMessages') : false;
  const message = await ctx.reply(render(page));
  const group = `pager:${message.id}`;
  let reacted: string[] = [];

  /* #region page functions  */
  let idleTimeout = setTimeout(() => stop(), idleTime);
  const stop = ({ destroy = false, destroyed = false }: InternalPagerStopOptions = {}) => {
    clearTimeout(idleTimeout);
    if (!destroyed && destroy) message.delete().catch(() => {});
    // Remove reactions
    if (!destroyed && !destroy) {
      if (canManage) message.removeReactions().catch(() => {});
      else Promise.all(reacted.map((emoji) => message.removeReaction(emoji))).catch(() => {});
    }
    ctx.client.events.unregisterGroup(group);
  };
  const turn = (toPage: number, { emoji, event, reply }: InternalPagerTurnOptions) => {
    if (emoji && canManage) message.removeReaction(emoji.name, ctx.author.id).catch(() => {});
    if (event) event.skip('commands');
    if (reply && canManage) reply.delete().catch(() => {});
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => stop(), idleTime);
    page = toPage;
    message.edit(render(page)).catch(() => {});
  };
  /* #endregion */

  /* #region events */
  ctx.client.events.register(group, 'messageReactionAdd', (_, { id }, emoji, member) => {
    if (message.id === id && member.id === ctx.author.id) {
      if (emoji.name === PagerEmoji.FIRST && page !== 1) turn(1, { emoji });
      if (emoji.name === PagerEmoji.LAST && page !== pages.length) turn(pages.length, { emoji });
      if (emoji.name === PagerEmoji.NEXT && page > pages.length) turn(page + 1, { emoji });
      if (emoji.name === PagerEmoji.PREVIOUS && page <= 1) turn(page - 1, { emoji });
      if (emoji.name === PagerEmoji.STOP) stop({ destroy: true });
    }
  });

  ctx.client.events.register(
    group,
    'messageCreate',
    (event, reply) => {
      if (reply.channel.id === message.channel.id && reply.author.id === ctx.author.id) {
        if (['>>', 'first'].includes(reply.content.toLowerCase()) && page !== 1) turn(1, { event, reply });
        if (['<<', 'last'].includes(reply.content.toLowerCase()) && page !== pages.length)
          turn(pages.length, { event, reply });
        if (['>', 'next', 'forward'].includes(reply.content.toLowerCase()) && page > pages.length)
          turn(page + 1, { event, reply });
        if (['<', 'previous', 'prev', 'back'].includes(reply.content.toLowerCase()) && page <= 1)
          turn(page - 1, { event, reply });

        if (reply.content.toLowerCase().startsWith('page ') && reply.content.length > 5) {
          let newPage = parseInt(reply.content.slice(4).trim());
          if (isNaN(startPage)) return;
          if (newPage <= 1) newPage = 1;
          else if (startPage > pages.length) startPage = pages.length;
          if (page !== newPage) {
            page = newPage;
            turn(newPage, { event, reply });
          }
        }
      }
    },
    { before: ['commands'] }
  );

  ctx.client.events.register(group, 'messageDelete', (_, { id }) => {
    if (message.id === id) stop({ destroyed: true });
  });

  ctx.client.events.register(group, 'messageDeleteBulk', (_, messages) => {
    for (const { id } of messages) if (message.id === id) stop({ destroyed: true });
  });

  ctx.client.events.register(group, 'channelDelete', (_, channel) => {
    if (message.channel.id === channel.id) stop({ destroyed: true });
  });

  if (message.guildID) {
    ctx.client.events.register(group, 'guildDelete', (_, guild) => {
      if (message.guildID === guild.id) stop({ destroyed: true });
    });

    ctx.client.events.register(group, 'guildMemberRemove', (_, guild, member) => {
      if (message.guildID === guild.id && member.id === ctx.author.id) stop({ destroy: true });
    });

    ctx.client.events.register(group, 'guildBanAdd', (_, guild, user) => {
      if (message.guildID === guild.id && user.id === ctx.author.id) stop({ destroy: true });
    });
  }
  /* #endregion */

  if (canReact && pages.length > 1) {
    reacted =
      pages.length === 2
        ? [PagerEmoji.PREVIOUS, PagerEmoji.STOP, PagerEmoji.NEXT]
        : [PagerEmoji.FIRST, PagerEmoji.PREVIOUS, PagerEmoji.STOP, PagerEmoji.NEXT, PagerEmoji.LAST];
    Promise.all(reacted.map(message.addReaction)).catch(() => {});
  }
}
