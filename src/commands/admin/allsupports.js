const Command = require('../../structures/Command');
const Util = require('../../util');
const GenericPager = require('../../structures/GenericPager');

module.exports = class AllSupports extends Command {
  get name() { return 'allsupports'; }

  get _options() { return {
    aliases: ['asups', 'allsups'],
    permissions: ['admin'],
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

    await Util.LBRY.syncPairs(this.client);
    const pairs = await this.client.sqlite.getAll();
    if (pairs.length <= 0)
      return message.channel.createMessage('No users found in the database.');

    const allSupports = [];

    for (const pair of pairs) {
      const supportsCount = await Util.LBRY.getSupportsCount(this.client, pair.lbryID);
      if (supportsCount <= 0) continue;
      const supportsResponse = await this.client.lbry.listSupports({
        accountID: pair.lbryID, page_size: supportsCount, claimID: givenClaim });
      const supports = (await supportsResponse.json()).result.items;
      for (const support of supports)
        allSupports.push({
          ...support,
          pair
        });
    }

    if (allSupports.length <= 0)
      return message.channel.createMessage('No supports found.');

    const paginator = new GenericPager(this.client, message, {
      items: allSupports,
      header: `All supports${
        givenClaim ? ` on claim \`${givenClaim}\`` : ''}`, itemTitle: 'Supports',itemsPerPage: 5,
      display: item => `> ${item.name} \`${item.claim_id}\`\n> <@${item.pair.discordID}> ${item.amount} LBC\n`
    });
    return paginator.start(message.channel.id, message.author.id);
  }

  get metadata() { return {
    category: 'Admin',
    description: 'List all supports from all users.',
    usage: '[claimID]'
  }; }
};
