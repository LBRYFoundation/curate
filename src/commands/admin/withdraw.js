const Command = require('../../structures/Command');
const Util = require('../../util');

module.exports = class Withdraw extends Command {
  get name() { return 'withdraw'; }

  get _options() { return {
    aliases: ['wd'],
    permissions: ['admin'],
    minimumArgs: 2
  }; }

  async exec(message, { args }) {
    const amount = Util.LBRY.ensureDecimal(args[0]);
    if (!amount)
      return message.channel.createMessage('The first argument must be a numeric amount of LBC to send!');

    // Check if the balance is more than requested
    const balance = await this.client.lbry.walletBalance();
    if (await this.handleResponse(message, balance)) return;
    const availableBalance = parseFloat((await balance.json()).result.available);
    if (parseFloat(amount) > availableBalance)
      return message.channel.createMessage(
        'There is not enough available LBC in the wallet to send that amount!');

    // Send to wallet
    const response = await this.client.lbry.sendToWallet({ amount, to: args[1] });
    if (await this.handleResponse(message, response)) return;
    const txid = (await response.json()).result.inputs[0].txid;
    return message.channel.createMessage(`Sent ${parseFloat(amount)} LBC to ${args[1]}.\n` +
      `https://explorer.lbry.com/tx/${txid}`);
  }

  get metadata() { return {
    category: 'Admin',
    description: 'Sends funds to an address from the master wallet.',
    usage: '<amount> <address>'
  }; }
};
