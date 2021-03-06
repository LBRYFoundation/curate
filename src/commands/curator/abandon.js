const Command = require('../../structures/Command');
const Util = require('../../util');

module.exports = class Abandon extends Command {
  get name() { return 'abandon'; }

  get _options() { return {
    aliases: ['aban', 'drop'],
    permissions: ['curatorOrAdmin'],
    minimumArgs: 1
  }; }

  async exec(message, { args }) {
    const givenClaim = Util.resolveToClaimID(args[0]);
    if (!givenClaim)
      // @TODO use claim_search for invalid claim ids
      return message.channel.createMessage('That Claim ID isn\'t valid.');
  
    const account = await Util.LBRY.findOrCreateAccount(this.client, message.author.id);

    // Drop support
    const response = await this.client.lbry.abandonSupport({
      accountID: account.accountID, claimID: givenClaim });
    const transaction = await response.json();
    if (await this.handleResponse(message, response, transaction)) return;
    const txid = transaction.result.txid;
    return message.channel.createMessage(`Abandon successful! https://explorer.lbry.com/tx/${txid}`);
  }

  get metadata() { return {
    category: 'Curator',
    description: 'Abandons a support on a given claim.',
    usage: '<claim>'
  }; }
};
