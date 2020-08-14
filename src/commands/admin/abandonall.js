const Command = require('../../structures/Command');
const Util = require('../../util');

module.exports = class AbaondonAll extends Command {
  get name() { return 'abandonall'; }

  get _options() { return {
    aliases: ['abanall', 'dropall'],
    permissions: ['admin'],
    minimumArgs: 0
  }; }

  // @TODO: Refactor this command to be able to abandon all supports on the bot.
  async exec(message, { args }) {
    const discordID = Util.resolveToUserID(args[0]);
    if (!discordID)
      return message.channel.createMessage('That Discord user isn\'t valid.');
    const account = await Util.LBRY.findOrCreateAccount(this.client, discordID, false);
    if (!account.accountID)
      return message.channel.createMessage('That user does not have an account.');

    const supportsCount = await Util.LBRY.getSupportsCount(this.client, account.accountID);
    if (supportsCount <= 0)
      return message.channel.createMessage('That user does not have any supports.');

    if (!await this.client.messageAwaiter.confirm(message, {
      header:
        `Are you sure you want to abandon all supports from that account? *(${
          supportsCount.toLocaleString()} support[s])*`
    })) return;
    const response = await Util.LBRY.abandonAllClaims(this.client, account.accountID);
    if (await this.handleResponse(message, response)) return;
    return message.channel.createMessage('Abandoned all claims.');
  }

  get metadata() { return {
    category: 'Curator',
    description: 'Abandons all supports of the bot or of a given account.',
    usage: '[id|@mention]'
  }; }
};
