const Command = require('../../structures/Command');

module.exports = class Deposit extends Command {
  get name() { return 'deposit'; }

  get _options() { return {
    aliases: ['dp'],
    permissions: ['admin']
  }; }

  async exec(message) {
    const response = await this.client.lbry.listAddresses();
    const address = await response.json();
    if (await this.handleResponse(message, response, address)) return;
    return message.channel.createMessage(`Address: ${address.result.items[0].address}`);
  }

  get metadata() { return {
    category: 'Admin',
    description: 'Gets the address of the master wallet.'
  }; }
};
