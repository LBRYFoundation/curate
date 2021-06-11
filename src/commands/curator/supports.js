const Command = require('../../structures/Command');
const GenericPager = require('../../structures/GenericPager');
const Util = require('../../util');

module.exports = class Supports extends Command {
  get name() { return 'supports'; }
  get _options() { return {
    aliases: ['sups'],
    permissions: ['curatorOrAdmin'],
    minimumArgs: 0
  }; }
  async exec(message, { args }) {
    let account, givenClaim, discordID;
    if (args.length === 2) {
      // Check for if claim ID and discord user is given
      givenClaim = args[1];
      if (!/^[a-f0-9]{40}$/.test(givenClaim))
        return message.channel.createMessage('That Claim ID isn\'t valid.');

      discordID = Util.resolveToUserID(args[0]);
      if (!discordID)
        return message.channel.createMessage('That Discord user isn\'t valid.');
      account = await Util.LBRY.findOrCreateAccount(this.client, discordID, false);
    } else if (args.length === 1) {
      // Check for only if a discord user is given
      discordID = Util.resolveToUserID(args[0]);
      if (!discordID)
        return message.channel.createMessage('That Discord user isn\'t valid.');
      account = await Util.LBRY.findOrCreateAccount(this.client, discordID, false);
    } else {
      // Default to message author
      account = await Util.LBRY.findOrCreateAccount(this.client, message.author.id);
    }

    if (!account.accountID)
      return message.channel.createMessage('That Discord user does not have an account.');

    const supportsCount = await Util.LBRY.getSupportsCount(this.client, account.accountID);
    if (supportsCount <= 0)
      return message.channel.createMessage('No supports found.');

    const supportsResponse = await this.client.lbry.listSupports({
      accountID: account.accountID, page_size: supportsCount, claimID: givenClaim });
    console.debug(
      `Displaying supports for ${
        account.accountID}${givenClaim ? ` and claimID ${givenClaim}` : ''}, (${supportsCount})`);
    const supports = (await supportsResponse.json()).result.items;
    const paginator = new GenericPager(this.client, message, {
      items: supports,
      header: `All supports for <@${discordID || message.author.id}>${
        givenClaim ? ` on claim \`${givenClaim}\`` : ''}`, itemTitle: 'Supports',itemsPerPage: 5,
      display: item => `> ${item.name} \`${item.claim_id}\`\n> ${item.amount} LBC\n`
    });
    return paginator.start(message.channel.id, message.author.id);
  }
  get metadata() { return {
    category: 'Curator',
    description: 'Shows the user\'s list of supports.',
    usage: '[id/@mention] [claimID]'
  }; }
};
