const Command = require('../../structures/Command');
const GenericPager = require('../../structures/GenericPager');
const Util = require('../../util');

module.exports = class TSupports extends Command {
  get name() { return 'tsupports'; }
  get _options() { return {
    aliases: ['tsups'],
    permissions: ['trustedOrAdmin'],
    minimumArgs: 0
  }; }
  async exec(message, { args }) {
    let givenClaim;
    if (args[0]) {
      givenClaim = Util.resolveToClaimID(args[0]);
      if (!givenClaim)
        // @TODO use claim_search for invalid claim ids
        return message.channel.createMessage('That Claim ID isn\'t valid.');
    }

    const account = await Util.LBRY.findSDKAccount(this.client, account => account.is_default);
    const supportsCount = await Util.LBRY.getSupportsCount(this.client, account.id);
    if (supportsCount <= 0)
      return message.channel.createMessage('No supports found.');

    const supportsResponse = await this.client.lbry.listSupports({
      accountID: account.id, page_size: supportsCount, claimID: givenClaim });
    const supports = (await supportsResponse.json()).result.items;
    const paginator = new GenericPager(this.client, message, {
      items: supports,
      header: `All supports for the trusted account${
        givenClaim ? ` on claim \`${givenClaim}\`` : ''}`, itemTitle: 'Supports', itemsPerPage: 5,
      display: item => `> ${item.name} \`${item.claim_id}\`\n> ${item.amount} LBC\n`
    });
    return paginator.start(message.channel.id, message.author.id);
  }
  get metadata() { return {
    category: 'Trusted',
    description: 'Shows the list of supports from the trusted account.',
    usage: '[claimID]'
  }; }
};
