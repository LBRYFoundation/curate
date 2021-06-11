const Command = require('../../structures/Command');
const Util = require('../../util');

module.exports = class TAbandon extends Command {
  get name() { return 'tabandon'; }

  get _options() { return {
    aliases: ['taban', 'tdrop'],
    permissions: ['trustedOrAdmin'],
    minimumArgs: 1
  }; }

  async exec(message, { args }) {
    const givenClaim = Util.resolveToClaimID(args[0]);
    if (!givenClaim)
      // @TODO use claim_search for invalid claim ids
      return message.channel.createMessage('That Claim ID isn\'t valid.');

    if (!await this.client.messageAwaiter.confirm(message, {
      header:
        'Are you sure you want to abandon a claim from a **trusted** account?'
    })) return;
  
    const account = await Util.LBRY.findSDKAccount(this.client, account => account.is_default);

    // Drop support
    const response = await this.client.lbry.abandonSupport({
      accountID: account.id, claimID: givenClaim });
    const transaction = await response.json();
    if (await this.handleResponse(message, response, transaction)) return;
    const txid = transaction.result.txid;
    return message.channel.createMessage(`Abandon successful! https://explorer.lbry.com/tx/${txid}`);
  }

  get metadata() { return {
    category: 'Trusted',
    description: 'Abandons a support on a given claim from the trusted account.',
    usage: '<claim>'
  }; }
};
