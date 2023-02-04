const Command = require('../../structures/Command');
const Util = require('../../util');
const config = require('config');

module.exports = class Balance extends Command {
  get name() { return 'balance'; }

  get _options() { return {
    aliases: ['bal'],
    permissions: ['curatorOrAdmin']
  }; }

  async exec(message, { args }) {
    if (args.length) {
      if (!Util.CommandPermissions.admin(this.client, message)) {
        const admins = (Array.isArray(config.adminRoleID) ? config.adminRoleID : [config.adminRoleID])
          .map(id => `"${this.client.guilds.get(config.guildID).roles.get(id).name}"`);
        return message.channel.createMessage(
          `You need to have the ${admins.join('/')} role(s) to see others balances!`);
      }

      const discordID = Util.resolveToUserID(args[0]);
      if (!discordID)
        return message.channel.createMessage('That Discord user isn\'t valid.');

      const account = await Util.LBRY.findOrCreateAccount(this.client, discordID, false);
      if (!account.accountID)
        return message.channel.createMessage('That Discord user does not have an account.');

      const response = await this.client.lbry.accountBalance(account.accountID);
      const wallet = await response.json();
      if (await this.handleResponse(message, response, wallet)) return;
      return message.channel.createMessage({ embeds: [{
        color: config.embedColor,
        description: `<@${discordID}> has **${wallet.result.available}** LBC available.\n\n` +
          `Reserved in Supports: ${wallet.result.reserved_subtotals.supports} LBC\n` +
          `Total: ${wallet.result.total} LBC`
      }] });
    } else {
      const account = await Util.LBRY.findOrCreateAccount(this.client, message.author.id);
      const response = await this.client.lbry.accountBalance(account.accountID);
      const wallet = await response.json();
      if (await this.handleResponse(message, response, wallet)) return;
      return message.channel.createMessage({ embeds: [{
        color: config.embedColor,
        description: `You have **${wallet.result.available}** LBC available.\n\n` +
          `Reserved in Supports: ${wallet.result.reserved_subtotals.supports} LBC\n` +
          `Total: ${wallet.result.total} LBC` +
          (account.newAccount ? '\n\n:warning: This account was just created. ' + 
            'Please wait a few seconds, and run the command again to get an accurate balance.' : '')
      }] });
    }
  }

  get metadata() { return {
    category: 'Curator',
    description: 'Shows the user\'s account balance.'
  }; }
};
