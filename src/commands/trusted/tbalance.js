const Command = require('../../structures/Command');
const Util = require('../../util');
const config = require('config');

module.exports = class TBalance extends Command {
  get name() { return 'tbalance'; }

  get _options() { return {
    aliases: ['tbal', 'trustedbal', 'trustedbalance'],
    permissions: ['trustedOrAdmin']
  }; }

  async exec(message) {
    const account = await Util.LBRY.findSDKAccount(this.client, account => account.is_default);
    const response = await this.client.lbry.accountBalance(account.id);
    const wallet = await response.json();
    if (await this.handleResponse(message, response, wallet)) return;
    return message.channel.createMessage({ embeds: [{
      color: config.embedColor,
      description: `**${wallet.result.available}** LBC is available in the trusted account.\n\n` +
        `Reserved in Supports: ${wallet.result.reserved_subtotals.supports} LBC\n` +
        `Total: ${wallet.result.total} LBC`
    }] });
  }

  get metadata() { return {
    category: 'Trusted',
    description: 'Shows the trusted wallet balance.'
  }; }
};
