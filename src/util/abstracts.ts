import { oneLine, stripIndents } from 'common-tags';
import { ClientEvent, CommandContext, DexareCommand, PermissionNames } from 'dexare';
import Eris from 'eris';
import LBRYModule from '../modules/lbry';
import * as LBRY from '../modules/lbry/types';
import LBRYXModule from '../modules/lbryx';
import WalletModule from '../modules/wallet';

export abstract class GeneralCommand extends DexareCommand {
  get lbry() {
    return this.client.modules.get('lbry')! as LBRYModule<any>;
  }

  get lbryx() {
    return this.client.modules.get('lbryx')! as LBRYXModule<any>;
  }

  get wallet() {
    return this.client.modules.get('wallet')! as WalletModule<any>;
  }

  get embedColor(): number {
    return this.client.config.embedColor;
  }

  log(level: 'info' | 'debug', ...args: any[]) {
    return this.client.events.emit('logger', level, 'lbrybot', args);
  }

  displayWallet(
    wallet: LBRY.Balance,
    title = 'Balance',
    { newAccount = false, thumbnail = '' } = {}
  ): Eris.MessageContent {
    return {
      embed: {
        color: this.embedColor,
        title,
        ...(thumbnail
          ? {
              thumbnail: { url: thumbnail }
            }
          : {}),
        description: stripIndents`
          **Available:** ${wallet.available} LBC

          Reserved in Supports: ${wallet.reserved_subtotals.supports} LBC
          Total: ${wallet.total} LBC


          ${
            newAccount
              ? stripIndents`
                :warning: This account was just created.
                'Please wait a few seconds, and run the command again to get an accurate balance.
              `
              : ''
          }
        `
      }
    };
  }

  hasPermission(ctx: CommandContext, event?: ClientEvent): boolean | string {
    if (this.userPermissions) {
      let permissionMap = event && event.has('dexare/permissionMap') ? event.get('dexare/permissionMap') : {};
      permissionMap = this.client.permissions.map(
        this.client.permissions.toObject(ctx.message),
        this.userPermissions,
        permissionMap,
        event
      );
      if (event) event.set('dexare/permissionMap', permissionMap);
      const missing = this.userPermissions.filter((perm: string) => !permissionMap[perm]);

      if (missing.length > 0) {
        if (missing.includes('dexare.elevated'))
          return `The \`${this.name}\` command can only be used by the bot developers or elevated users.`;
        else if (missing.includes('lbry.curator') || missing.includes('lbry.curatorOrAdmin'))
          return `The \`${this.name}\` command can only be ran by LBRY curators.`;
        else if (missing.includes('lbry.trusted') || missing.includes('lbry.trustedOrAdmin'))
          return `The \`${this.name}\` command can only be ran by LBRY trusteds.`;
        else if (missing.includes('lbry.admin'))
          return `The \`${this.name}\` command can only be ran by LBRY admins.`;
        else if (missing.includes('dexare.nsfwchannel'))
          return `The \`${this.name}\` command can only be ran in NSFW channels.`;
        else if (missing.includes('dexare.inguild'))
          return `The \`${this.name}\` command can only be ran in guilds.`;
        else if (missing.length === 1) {
          return `The \`${this.name}\` command requires you to have the "${
            PermissionNames[missing[0]] || missing[0]
          }" permission.`;
        }
        return oneLine`
          The \`${this.name}\` command requires you to have the following permissions:
          ${missing.map((perm) => PermissionNames[perm] || perm).join(', ')}
        `;
      }
    }

    return true;
  }

  finalize(response: any, ctx: CommandContext) {
    if (
      typeof response === 'string' ||
      (response && response.constructor && response.constructor.name === 'Object')
    )
      return ctx.reply(response);
  }
}
