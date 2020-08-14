const Command = require('../../structures/Command');
const Util = require('../../util');

module.exports = class Abaondon extends Command {
  get name() { return 'abandon'; }

  get _options() { return {
    aliases: ['aban', 'drop'],
    permissions: ['curatorOrAdmin'],
    minimumArgs: 1
  }; }

  async exec(message, { args }) {
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

    // Drop support
    const response = await this.client.lbry.abandonSupport({
      accountID: account.accountID, claimID: givenClaim });
    const transaction = await response.json();
    if (await this.handleResponse(message, response, transaction)) return;
    const txid = transaction.result.txid;
    message.channel.createMessage(`Abandon successful! https://explorer.lbry.com/tx/${txid}`);
  }

  get metadata() { return {
    category: 'Curator',
    description: 'Abandons a support on a given claim.',
    usage: '<claim>'
  }; }
};
