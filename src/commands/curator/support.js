const Command = require('../../structures/Command');
const Util = require('../../util');

module.exports = class Support extends Command {
  get name() { return 'support'; }

  get _options() { return {
    aliases: ['sup'],
    permissions: ['curatorOrAdmin'],
    minimumArgs: 2
  }; }

  async exec(message, { args }) {
    const givenAmount = Util.LBRY.ensureDecimal(args[1]);
    if (!givenAmount)
      return message.channel.createMessage('The second argument must be a numeric amount of LBC to send!');

    const givenClaim = args[0];
    if (!/^[a-f0-9]{40}$/.test(givenClaim))
      // @TODO use claim_search for invalid claim ids
      return message.channel.createMessage('That Claim ID isn\'t valid.');
  
    const account = await Util.LBRY.findOrCreateAccount(this.client, message.author.id);
    if (account.newAccount) {
      // Wait for the blockchain to complete the funding
      await message.channel.sendTyping();
      await Util.halt(3000);
    }

    // Get and check balance
    const walletResponse = await this.client.lbry.accountBalance(account.accountID);
    const wallet = await walletResponse.json();
    if (await this.handleResponse(message, walletResponse, wallet)) return;
    const balance = wallet.result.available;
    if (parseFloat(givenAmount) > parseFloat(balance))
      return message.channel.createMessage('You don\'t have enough LBC to do this!');
 
    // Create support
    const response = await this.client.lbry.createSupport({
      accountID: account.accountID, claimID: givenClaim, amount: givenAmount });
    const transaction = await response.json();
    if (await this.handleResponse(message, response, transaction)) return;
    const txid = transaction.result.txid;
    message.channel.createMessage(`Support successful! https://explorer.lbry.com/tx/${txid}`);
  }

  get metadata() { return {
    category: 'Curator',
    description: 'Support a given claim.',
    usage: '<claim> <amount>'
  }; }
};
