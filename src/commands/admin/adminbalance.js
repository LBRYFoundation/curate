const Command = require('../../structures/Command');
const config = require('config');

module.exports = class AdminBalance extends Command {
  get name() { return 'adminbalance'; }

  get _options() { return {
    aliases: ['abal', 'adminbal'],
    permissions: ['admin']
  }; }

  async exec(message) {
    const response = await this.client.lbry.walletBalance();
    const wallet = await response.json();
    if (await this.handleResponse(message, response, wallet)) return;
    return message.channel.createMessage({ embed: {
      color: config.embedColor,
      description: `**Available:** ${wallet.result.available} LBC\n\n` +
        `Reserved in Supports: ${wallet.result.reserved_subtotals.supports} LBC\n` +
        `Total: ${wallet.result.total} LBC`
    } });
  }

  get metadata() { return {
    category: 'Admin',
    description: 'Shows the master wallet balance.'
  }; }
};
