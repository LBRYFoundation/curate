const Command = require('../../structures/Command');
const Util = require('../../util');

module.exports = class Supports extends Command {
  get name() { return 'supports'; }
  get _options() { return {
    aliases: ['sups'],
    permissions: ['curatorOrAdmin'],
    minimumArgs: 0
  }; }
  async exec(message, { args }) {
    let account, givenClaim;
    if (args.length === 2) {
      // Check for if claim ID and discord user is given
      givenClaim = args[0];
      if (!/^[a-f0-9]{40}$/.test(givenClaim))
        return message.channel.createMessage('That Claim ID isn\'t valid.');

      const discordID = Util.resolveToUserID(args[1]);
      if (!discordID)
        return message.channel.createMessage('That Discord user isn\'t valid.');
      account = await Util.LBRY.findOrCreateAccount(this.client, discordID, false);
    } else if (args.length === 1) {
      // Check for only if a discord user is given
      const discordID = Util.resolveToUserID(args[0]);
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
    if (!givenClaim) {
      const supportsResponse = await this.client.lbry.listSupports({
        accountID: account.accountID, page_size: supportsCount });
      console.debug(`Displaying supports for ${account.accountID} (${supportsCount})`);
      const supports = (await supportsResponse.json()).result.items;
      // @TODO use pagination
      for (let i = 0, len = supports.length; i < len; i++) {
        const support = supports[i];
        message.channel.createMessage(`ClaimID: \`${support.claim_id}\`\nClaim Name: \`${support.name}\`\n
            Claim URL: \`${support.permanent_url}\`\nSupport Ammount: \`${support.amount}\`\n`);
      } 
    } else {
      const supportsResponse = await this.client.lbry.listSupports({
        accountID: account.accountID, page_size: supportsCount, claim_id: givenClaim });
      console.debug(
        `Displaying supports for ${account.accountID} and claimID ${givenClaim}, (${supportsCount})`);
      const supports = (await supportsResponse.json()).result.items;
      // @TODO use pagination
      for (let i = 0, len = supports.length; i < len; i++) {
        const support = supports[i];
        message.channel.createMessage(`ClaimID: \`${support.claim_id}\`\nClaim Name: \`${support.name}\`\n
          Claim URL: \`${support.permanent_url}\`\nSupport Ammount: \`${support.amount}\`\n`);
      }
    }
  }
  get metadata() { return {
    category: 'Curator',
    description: 'Shows the user\'s list of supports.',
    usage: '[claimID] [mention/discordID]'
  }; }
};
