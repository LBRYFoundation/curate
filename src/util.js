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
 * @memberof Util.
 * @deprecated
 */
Util.sliceKeys = (obj, f) => {
  const newObject = {};
  Util.keyValueForEach(obj, (k, v) => {
    if (f(k, v)) newObject[k] = v;
  });
  return newObject;
};

/**
 * Converts a number into a 00:00:00 format
 * @memberof Util.
 */
Util.toHHMMSS = string => {
  const sec_num = parseInt(string, 10);
  let hours = Math.floor(sec_num / 3600);
  let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
  let seconds = sec_num - (hours * 3600) - (minutes * 60);

  if (hours < 10) {hours = '0' + hours;}
  if (minutes < 10) {minutes = '0' + minutes;}
  if (seconds < 10) {seconds = '0' + seconds;}
  const time = hours + ':' + minutes + ':' + seconds;
  return time;
};

/**
 * @memberof Util.
 * @deprecated
 */
Util.formatNumber = num => num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');

/**
 * Flattens a JSON object
 * @memberof Util.
 * @see https://stackoverflow.com/a/19101235/6467130
 */
Util.flattenObject = (data) => {
  const result = {};
  function recurse (cur, prop) {
    if (Object(cur) !== cur) {
      result[prop] = cur;
    } else if (Array.isArray(cur)) {
      const l = cur.length;
      for (let i = 0; i < l; i++)
        recurse(cur[i], prop + '[' + i + ']');
      if (l == 0)
        result[prop] = [];
    } else {
      let isEmpty = true;
      for (const p in cur) {
        isEmpty = false;
        recurse(cur[p], prop ? prop + '.' + p : p);
      }
      if (isEmpty && prop)
        result[prop] = {};
    }
  }
  recurse(data, '');
  return result;
};

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
      prefixes = [client.config.prefix];
    return new RegExp(`^((?:<@!?${client.user.id}>|${
      prefixes.map(prefix => Util.Escape.regex(prefix)).join('|')})\\s?)(\\n|.)`, 'i');
  },
  strip(message, client, prefixes) {
    return message.content.replace(
      Util.Prefix.regex(client, prefixes), '$2').replace(/\s\s+/g, ' ').trim();
  },
};

/**
 * Commonly used regex patterns
 * @memberof Util.
 * @deprecated
 */
Util.Regex = {
  escape: /[-/\\^$*+?.()|[\]{}]/g,
  url: /https?:\/\/(-\.)?([^\s/?.#-]+\.?)+(\/[^\s]*)?/gi,
  userMention: /<@!?(\d+)>/gi,
  webhookURL:
    /(?:https?:\/\/)(?:canary\.|ptb\.|)discord(?:app)?\.com\/api\/webhooks\/(\d{17,18})\/([\w-]{68})/
};
  
/**
 * Discord.JS's method of escaping characters
 * @memberof Util.
 */
Util.Escape = {
  regex(s) {
    return s.replace(Util.Regex.escape, '\\$&');
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
  elevated: (client, message) => client.config.elevated.includes(message.author.id),
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