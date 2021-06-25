import { stripIndents } from 'common-tags';
import { CommandContext, DexareClient } from 'dexare';
import { confirm } from '../../util';
import { GeneralCommand } from '../../util/abstracts';

export default class DeleteAllCommand extends GeneralCommand {
  constructor(client: DexareClient<any>) {
    super(client, {
      name: 'deleteall',
      description: 'Deletes all accounts in the database.',
      category: 'Admin',
      aliases: ['delall'],
      userPermissions: ['lbry.admin'],
      metadata: {
        examples: ['delall']
      }
    });

    this.filePath = __filename;
  }

  async run(ctx: CommandContext) {
    await this.lbryx.sync();
    const pairs = this.lbryx.getIDs();

    if (pairs.length <= 0) return 'No pairs in the database.';
    if (
      !(await confirm(
        ctx,
        `Are you sure you want to delete **all** ${pairs.length.toLocaleString()} accounts?`
      ))
    )
      return;

    for (const [discordID, lbryID] of pairs) {
      try {
        await this.lbryx.deleteAccount(discordID, lbryID);
      } catch (e) {
        return stripIndents`
          Failed to delete an account. An error most likely occured while backing up the wallet.
          \`\`\`\n${e.toString()}\`\`\`
        `;
      }
    }
    return 'Deleted all accounts.';
  }
}
