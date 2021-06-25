import { DexareClient, BaseConfig, PermissionObject } from 'dexare';
import config from 'config';
import path from 'path';
import chalk from 'chalk';
import LoggerModule, { LoggerModuleOptions } from '@dexare/logger';
import CronModule, { CronModuleOptions } from '@dexare/cron';
import WalletModule, { WalletModuleOptions } from './modules/wallet';
import LBRYModule, { LBRYModuleOptions } from './modules/lbry';
import LBRYXModule, { LBRYXModuleOptions } from './modules/lbryx';

export const PRODUCTION = process.env.NODE_ENV === 'production';

export interface CurateConfig extends BaseConfig {
  prefix: string | string[];
  mentionPrefix: boolean;
  guildID: string;
  embedColor: number;

  trustedRoles: string | string[];
  curatorRoles: string | string[];
  adminRoles: string | string[];

  logger: LoggerModuleOptions;
  wallet: WalletModuleOptions;
  lbry: LBRYModuleOptions;
  lbryx: LBRYXModuleOptions;
  cron?: CronModuleOptions;
}

export const client = new DexareClient(config.get('dexare') as CurateConfig);

client.loadModules(LoggerModule, WalletModule, LBRYModule, LBRYXModule, CronModule);
client.commands.registerDefaults(['eval', 'kill', 'exec', 'load', 'unload', 'reload', 'help']);
client.commands.registerFromFolder(path.join(config.get('commandsPath' as string)));

/* #region perms */
export function rolePermissionCheck(...roles: (string | string[])[]) {
  return (object: PermissionObject) => {
    if (!object.member) return false;
    const roleIDs: string[] = [];
    roles.map((role) => roleIDs.concat(Array.isArray(role) ? role : [role]));
    const member = client.bot.guilds.get(client.config.guildID)!.members.get(object.user.id)!;

    // elevated user bypass
    if (client.config.elevated) {
      if (Array.isArray(client.config.elevated)) return client.config.elevated.includes(object.user.id);
      else if (client.config.elevated === object.user.id) return true;
    }

    return roleIDs.map((r) => member.roles.includes(r)).includes(true);
  };
}

client.permissions.register('lbry.admin', rolePermissionCheck(client.config.adminRoles));
client.permissions.register(
  'lbry.curator',
  rolePermissionCheck(client.config.curatorRoles, client.config.adminRoles)
);
client.permissions.register(
  'lbry.trusted',
  rolePermissionCheck(client.config.trustedRoles, client.config.adminRoles)
);
/* #endregion */

const logger = client.modules.get('logger') as any as LoggerModule<any>;
logger.moduleColors.lbry = chalk.black.bgCyan;
logger.moduleColors.lbryx = chalk.red.bgCyan;
logger.moduleColors.lbrybot = chalk.cyan.bgBlack;
logger.moduleColors.wallet = chalk.black.bgKeyword('brown');

process.once('SIGINT', async () => {
  client.emit('logger', 'warn', 'sys', ['Caught SIGINT']);
  await client.disconnect();
  process.exit(0);
});

process.once('beforeExit', async () => {
  client.emit('logger', 'warn', 'sys', ['Exiting....']);
  await client.disconnect();
  process.exit(0);
});

export async function connect() {
  await client.connect();
  client.bot.shards.forEach((shard) =>
    shard.editStatus(
      'online',
      PRODUCTION ? { name: 'the blockchain | c!help', type: 5 } : { name: 'logs | c!help', type: 3 }
    )
  );
}

export async function disconnect() {
  await client.disconnect();
}
