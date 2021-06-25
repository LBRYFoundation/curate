import { stripIndents } from 'common-tags';
import { CommandContext, DexareClient } from 'dexare';
import { confirm, resolveUser } from '../../util';
import { GeneralCommand } from '../../util/abstracts';

export default class DeleteAccountommand extends GeneralCommand {
  constructor(client: DexareClient<any>) {
    super(client, {
      name: 'deleteaccount',
      description: "Delete a user's Curation account.",
      category: 'Admin',
      aliases: ['del', 'delacc'],
      userPermissions: ['lbry.admin'],
      metadata: {
        examples: ['deleteaccount @user'],
        usage: '<user>'
      }
    });

    this.filePath = __filename;
  }

  async run(ctx: CommandContext) {
    const discordID = resolveUser(ctx.args[0]);
    if (!discordID) return "That Discord user isn't valid.";
    const account = await this.lbryx.ensureAccount(discordID, false);
    if (!account.id) return 'That user does not have an account.';

    const supportsCount = await this.lbryx.getSupportsCount(account.id);
    if (
      !(await confirm(
        ctx,
        `Are you sure you want to delete that account? *(${supportsCount.toLocaleString()} support[s])*`
      ))
    )
      return;

    try {
      await this.lbryx.deleteAccount(discordID, account.id);
      return 'Deleted account.';
    } catch (e) {
      return stripIndents`
        Failed to delete the account. An error most likely occured while backing up the wallet.
        \`\`\`\n${e.toString()}\`\`\`
      `;
    }
  }
}
