const Command = require('../../structures/Command');
const Util = require('../../util');

module.exports = class TSupport extends Command {
  get name() { return 'tsupport'; }

  get _options() { return {
    aliases: ['tsup'],
    permissions: ['trustedOrAdmin'],
    minimumArgs: 2
  }; }

  async exec(message, { args }) {
    const givenAmount = Util.LBRY.ensureDecimal(args[1]);
    if (!givenAmount)
      return message.channel.createMessage('The second argument must be a numeric amount of LBC to send!');

    const givenClaim = Util.resolveToClaimID(args[0]);
    if (!givenClaim)
      // @TODO use claim_search for invalid claim ids
      return message.channel.createMessage('That Claim ID isn\'t valid.');

    // Get and check balance
    const account = await Util.LBRY.findSDKAccount(this.client, account => account.is_default);
    const walletResponse = await this.client.lbry.accountBalance(account.id);
    const wallet = await walletResponse.json();
    if (await this.handleResponse(message, walletResponse, wallet)) return;
    const balance = wallet.result.available;
    if (parseFloat(givenAmount) > parseFloat(balance))
      return message.channel.createMessage('You don\'t have enough LBC to do this!');

    if (!await this.client.messageAwaiter.confirm(message, {
      header:
        'Are you sure you want to support a claim from a **trusted** account?'
    })) return;
 
    // Create support
    const response = await this.client.lbry.createSupport({
      accountID: account.id, claimID: givenClaim, amount: givenAmount });
    const transaction = await response.json();
    if (await this.handleResponse(message, response, transaction)) return;
    const txid = transaction.result.txid;
    return message.channel.createMessage(`Support successful! https://explorer.lbry.com/tx/${txid}`);
  }

  get metadata() { return {
    category: 'Trusted',
    description: 'Support a given claim from the trusted account.',
    usage: '<claim> <amount>'
  }; }
};
