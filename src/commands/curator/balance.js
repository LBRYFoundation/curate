const Command = require('../../structures/Command');
const Util = require('../../util');

module.exports = class Balance extends Command {
  get name() { return 'balance'; }

  get _options() { return {
    aliases: ['bal'],
    permissions: ['curatorOrAdmin']
  }; }

  async exec(message) {
    const account = await Util.LBRY.findOrCreateAccount(this.client, message.author.id);
    const response = await this.client.lbry.accountBalance(account.accountID);
    const wallet = await response.json();
    if (await this.handleResponse(message, response, wallet)) return;
    return message.channel.createMessage({ embed: {
      description: `You have **${wallet.result.available}** LBC available.\n\n` +
        `Reserved in Supports: ${wallet.result.reserved_subtotals.supports} LBC\n` +
        `Total: ${wallet.result.total} LBC`
    } });
  }

  get metadata() { return {
    category: 'Curator',
    description: 'Shows the user\'s account balance.'
  }; }
};
