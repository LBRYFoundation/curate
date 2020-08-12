const Command = require('../../structures/Command');

module.exports = class Deposit extends Command {
  get name() { return 'deposit'; }

  get _options() { return {
    aliases: ['dp'],
    permissions: ['admin']
  }; }

  async exec(message) {
    const response = await this.client.lbry.listAddresses();
    if (response.status !== 200) {
      console.error('SDK error in deposit', response, await response.text());
      return message.channel.createMessage(`LBRY-SDK returned ${response.status}, check console.`);
    }
    const address = await response.json();
    return message.channel.createMessage(`Address: ${address.result.items[0].address}`);
  }

  get metadata() { return {
    category: 'Admin',
    description: 'Gets the address of the master wallet.'
  }; }
};
