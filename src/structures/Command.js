const Util = require('../util');
const config = require('config');

/**
 * A command in the bot.
 */
class Command {
  /**
   * @param {TrelloBot} client
   */
  constructor(client) {
    this.client = client;
    this.subCommands = {};
  }

  /**
   * @private
   */
  _preload() {
    if (!this.preload() && config.debug)
      this.client.cmds.logger.info('Preloading command', this.name);
  }

  /**
   * The function executed while loading the command into the command handler.
   */
  preload() {
    return true;
  }

  /**
   * @private
   * @param {Message} message
   * @param {Object} opts
   */
  async _exec(message, opts) {
    // Check minimum arguments
    if (this.options.minimumArgs > 0 && opts.args.length < this.options.minimumArgs)
      return message.channel.createMessage(
        `${this.options.minimumArgsMessage}\nUsage: ${config.prefix}${this.name}${
          this.metadata.usage ?
            ` \`${this.metadata.usage}\`` : ''}`);

    // Check commmand permissions
    if (this.options.permissions.length)
      for (const i in this.options.permissions) {
        const perm = this.options.permissions[i];
        if (!Util.CommandPermissions[perm])
          throw new Error(`Invalid command permission "${perm}"`);
        if (!Util.CommandPermissions[perm](this.client, message, opts))
          return message.channel.createMessage({
            attach: 'I need the permission `Attach Files` to use this command!',
            embed: 'I need the permission `Embed Links` to use this command!',
            emoji: 'I need the permission `Use External Emojis` to use this command!',
            elevated: 'Only the elevated users of the bot can use this command!',
            curator: `This command requires you to have the "${
              message.guild.roles.get(config.curatorRoleID).name}" role!`,
            admin: `This command requires you to have the "${
              message.guild.roles.get(config.adminRoleID).name}" role!`,
            curatorOrAdmin: `This command requires you to have the "${
              message.guild.roles.get(config.curatorRoleID).name}" or "${
              message.guild.roles.get(config.adminRoleID).name}" roles!`,
            guild: 'This command must be ran in a guild!',
          }[perm]);
      }

    // Process cooldown
    if (!this.cooldownAbs || await this.client.cmds.processCooldown(message, this)) {
      await this.exec(message, opts);
    } else {
      const cd = await this.client.db.hget(`cooldowns:${message.author.id}`, this.name);
      return message.channel.createMessage(
        `:watch: This command is on cooldown! Wait ${
          Math.ceil(this.cooldownAbs - (Date.now() - cd))} second(s) before doing this again!`);
    }
  }

  // eslint-disable-next-line no-empty-function, no-unused-vars
  exec(Message, opts) { }

  /**
   * @private
   */
  async handleResponse(message, response, json) {
    if (!json) json = await response.json();
    if (response.status !== 200 || json.error) {
      const error = response.status === 500 ?
        { message: 'Internal server error' } : json.error;
      console.error(`SDK error in ${this.name}:${message.author.id}`, response, error);
      await message.channel.createMessage(
        `LBRY-SDK returned ${response.status} witn an error: \`${error.message}\``);
      return true;
    }
    return false;
  }

  /**
   * The options for the command
   * @type {Object}
   */
  get options() {
    const options = {
      aliases: [],
      cooldown: 2,
      listed: true,
      minimumArgs: 0,
      permissions: [],

      minimumArgsMessage: 'Not enough arguments!',
    };
    Object.assign(options, this._options);
    return options;
  }

  /**
   * @private
   */
  _options() { return {}; }

  /**
   * The cooldown in milliseconnds
   * @returns {number}
   */
  get cooldownAbs() { return this.options.cooldown * 1000; }

  /**
   * The metadata for the command
   * @return {Object}
   */
  get metadata() {
    return {
      category: 'Misc.',
    };
  }
}

module.exports = Command;