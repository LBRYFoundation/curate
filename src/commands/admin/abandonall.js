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
    if (args.length) {
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
          `Are you sure you want to abandon **all supports** from that account? *(${
            supportsCount.toLocaleString()} support[s])*`
      })) return;
      await Util.LBRY.abandonAllClaims(this.client, account.accountID);
      return message.channel.createMessage(`Abandoned ${supportsCount.toLocaleString()} claim(s).`);
    } else {
      if (!await this.client.messageAwaiter.confirm(message, {
        header: 'Are you sure you want to abandon **all supports** from **all accounts**?'
      })) return;
      await this.client.startTyping(message.channel);
      const pairs = await this.client.sqlite.getAll();
      let count = 0;
      for (let i = 0, len = pairs.length; i < len; i++) {
        const pair = pairs[i];
        const result = await Util.LBRY.abandonAllClaims(this.client, pair.lbryID);
        count += result.count;
      }
      this.client.stopTyping(message.channel);
      return message.channel.createMessage(`Abandoned ${count.toLocaleString()} claim(s).`);
    }
  }

  get metadata() { return {
    category: 'Admin',
    description: 'Abandons all supports of the bot or of a given account.',
    usage: '[id|@mention]'
  }; }
};
