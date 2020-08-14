const Command = require('../../structures/Command');
const Util = require('../../util');

module.exports = class AbaondonAll extends Command {
  get name() { return 'abandonall'; }

  get _options() { return {
    aliases: ['abanall', 'dropall'],
    permissions: ['Admin'],
    minimumArgs: 0
  }; }
//@TODO: Refactor this command for all abandons.
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
    // Create support
    const response = await this.client.lbry.abandonSupport({
      accountID: account.accountID, claimID: givenClaim});
    const transaction = await response.json();
    if (await this.handleResponse(message, response, transaction)) return;
    const txid = transaction.result.txid;
    message.channel.createMessage(`Abandon successful! https://explorer.lbry.com/tx/${txid}`);
  }

  get metadata() { return {
    category: 'Curator',
    description: 'Abandons all supports of the bot or of a given account.',
    usage: '[id|@mention]'
  }; }
};
