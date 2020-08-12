const fetch = require('node-fetch');
const config = require('config');

/**
 * Represents the utilities for the bot
 * @typedef {Object} Util
 */
const Util = module.exports = {};

/**
 * Iterates through each key of an object
 * @memberof Util.
 */
Util.keyValueForEach = (obj, func) => Object.keys(obj).map(key => func(key, obj[key]));

/**
 * Randomness generator
 * @memberof Util.
 */
Util.Random = {
  int(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  bool() {
    return Util.Random.int(0, 1) === 1;
  },
  array(array) {
    return array[Util.Random.int(0, array.length - 1)];
  },
  shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
  },
};

/**
 * Prefix-related functions
 * @memberof Util.
 */
Util.Prefix = {
  regex(client, prefixes = null) {
    if (!prefixes)
      prefixes = [config.prefix];
    return new RegExp(`^((?:<@!?${client.user.id}>|${
      prefixes.map(prefix => Util.Prefix.escapeRegex(prefix)).join('|')})\\s?)(\\n|.)`, 'i');
  },
  strip(message, client, prefixes) {
    return message.content.replace(
      Util.Prefix.regex(client, prefixes), '$2').replace(/\s\s+/g, ' ').trim();
  },
  escapeRegex(s) {
    return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  }
};

/**
 * Command permission parsers
 * @memberof Util.
 */
Util.CommandPermissions = {
  attach: (client, message) => message.channel.type === 1 ||
    message.channel.permissionsOf(client.user.id).has('attachFiles'),
  embed: (client, message) => message.channel.type === 1 ||
    message.channel.permissionsOf(client.user.id).has('embedLinks'),
  emoji: (client, message) => message.channel.type === 1 ||
    message.channel.permissionsOf(client.user.id).has('externalEmojis'),
  guild: (_, message) => !!message.guildID,
  elevated: (_, message) => config.elevated.includes(message.author.id),
  curator: (client, message) => {
    const member = message.guildID ? message.member :
      client.guilds.get(config.guildID).members.get(message.author.id);
    if (!member) return false;
    if (Util.CommandPermissions.elevated(client, message)) return true;
    return member.roles.includes(config.curatorRoleID);
  },
  admin: (client, message) => {
    const member = message.guildID ? message.member :
      client.guilds.get(config.guildID).members.get(message.author.id);
    if (!member) return false;
    if (Util.CommandPermissions.elevated(client, message)) return true;
    return member.roles.includes(config.adminRoleID);
  },
  curatorOrAdmin: (client, message) => {
    const member = message.guildID ? message.member :
      client.guilds.get(config.guildID).members.get(message.author.id);
    if (!member) return false;
    if (Util.CommandPermissions.elevated(client, message)) return true;
    return member.roles.includes(config.curatorRoleID) ||
      member.roles.includes(config.adminRoleID);
  },
};

/**
 * Creates a module that makes emoji fallbacks
 * @memberof Util.
 */
Util.emojiFallback = ({ message, client }) => {
  return (id, fallback, animated = false) => {
    if (Util.CommandPermissions.emoji(client, message)) 
      return `<${animated ? 'a' : ''}:_:${id}>`;
    else return fallback;
  };
};

/**
 * Cuts off text to a limit
 * @memberof Util.
 * @param {string} text
 * @param {number} limit
 */
Util.cutoffText = (text, limit = 2000) => {
  return text.length > limit ? text.slice(0, limit - 1) + '…' : text;
};

/**
 * Cuts off an array of text to a limit
 * @memberof Util.
 * @param {Array<string>} texts
 * @param {number} limit
 * @param {number} rollbackAmount Amount of items to roll back when the limit has been hit
 */
Util.cutoffArray = (texts, limit = 2000, rollbackAmount = 1, paddingAmount = 1) => {
  let currLength = 0;
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    currLength += text.length + paddingAmount;
    if (currLength > limit) {
      const clampedRollback = rollbackAmount > i ? i : rollbackAmount;
      return texts.slice(0, (i + 1) - clampedRollback);
    }
  }
  return texts;
};

/**
 * Hastebin-related functions
 * @memberof Util.
 */
Util.Hastebin = {
  async autosend(content, message) {
    if (content.length > 2000) {
      const haste = await Util.Hastebin.post(content);
      if (haste.ok)
        return message.channel.createMessage(`<https://hastebin.com/${haste.key}.md>`);
      else
        return message.channel.createMessage({}, {
          name: 'output.txt',
          file: new Buffer(content)
        });
    } else return message.channel.createMessage(content);
  },
  /**
   * Post text to hastebin
   * @param {string} content - The content to upload
   */
  async post(content) {
    const haste = await fetch('https://hastebin.com/documents', {
      method: 'POST',
      body: content
    });
    if (haste.status >= 400)
      return {
        ok: false,
        status: haste.status
      };
    else {
      const hasteInfo = await haste.json();
      return {
        ok: true,
        key: hasteInfo.key
      };
    }
  }
};

/**
 * LBRY-related utility
 * @memberof Util.
 */
Util.LBRY = {
  async findOrCreateAccount(client, discordID) {
    // Check SQLite
    const pair = await client.sqlite.get(discordID);
    if (pair)
      return { accountID: pair.lbryID };

    // Check accounts via SDK
    const response = await client.lbry.listAccounts({ page_size: Util.LBRY.getAccountCount(client) });
    const accounts = await response.json();
    const foundAccount = accounts.result.items.find(account => account.name === discordID);
    if (foundAccount)
      return { accountID: foundAccount.id };

    // Create account if not found
    const newAccount = await Util.LBRY.createAccount(client, discordID);
    return {
      accountID: newAccount.result.id,
      newAccount: true
    };
  },
  async getAccountCount(client) {
    const response = await client.lbry.listAccounts({ page_size: 1 }).then(r => r.json());
    return response.result.total_items;
  },
  async createAccount(client, discordID) {
    console.info('Creating account for user', discordID);
    const account = await client.lbry.createAccount(discordID).then(r => r.json());
    await client.sqlite.pair(discordID, account.result.id);
    console.info('Created pair', discordID, account.result.id);
    await client.lbry.fundAccount({ to: account.result.id, amount: config.startingBalance });
    return account;
  },
  ensureDecimal(str) {
    const num = parseFloat(str);
    if (isNaN(num)) return null;
    return Number.isInteger(num) ? `${num}.0` : num.toString();
  }
};