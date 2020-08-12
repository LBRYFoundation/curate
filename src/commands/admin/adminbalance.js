const Command = require('../../structures/Command');

module.exports = class AdminBalance extends Command {
  get name() { return 'adminbalance'; }

  get _options() { return {
    aliases: ['abal', 'adminbal'],
    permissions: ['admin']
  }; }

  async exec(message) {
    const response = await this.client.lbry.walletBalance();
    if (await this.handleResponse(message, response)) return;
    const wallet = await response.json();
    return message.channel.createMessage({ embed: {
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
