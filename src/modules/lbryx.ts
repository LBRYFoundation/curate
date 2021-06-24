import { DexareModule, DexareClient, BaseConfig } from 'dexare';
import type { table as QuickDBTable } from 'quick.db';
import * as LBRY from './lbry/types';
import { CurateConfig } from '../bot';
import LBRYModule from './lbry';
import WalletModule from './wallet';
import { wait } from '../util';

export interface LBRYXConfig extends BaseConfig {
  lbry?: LBRYXModuleOptions;
}

export interface LBRYXModuleOptions {
  startingBalance?: string;
  databasePath: string;
}

export interface EnsureAccountResult {
  id: string;
  txid?: string;
  new?: boolean;
}

export default class LBRYXModule<T extends DexareClient<CurateConfig>> extends DexareModule<T> {
  db: QuickDBTable;
  defaultAccount?: string;

  constructor(client: T) {
    super(client, {
      name: 'lbry',
      description: 'Helper module and database for the LBRY Curate bot'
    });

    this.filePath = __filename;

    const qdb = require('quick.db')(this.config.databasePath || 'data/lbry.sqlite');
    this.db = qdb.table('pairs');
  }

  /* #region aliases */
  get config() {
    return this.client.config.lbryx;
  }

  get lbry() {
    return this.client.modules.get('lbry')! as LBRYModule<any>;
  }

  get wallet() {
    return this.client.modules.get('wallet')! as WalletModule<any>;
  }
  /* #endregion */

  /* #region database */
  /**
   * Get a LBRY account ID from a Discord ID.
   * @param id The Discord ID to use
   */
  getID(id: string) {
    return this.db.get(id) as string | null;
  }

  /**
   * Link a LBRY account ID to a Discord ID.
   * @param id The Discord ID to use
   * @param accountID The LBRY account ID to use
   */
  setID(id: string, accountID: string) {
    return this.db.set(id, accountID) as string | null;
  }

  /**
   * Remove an ID association.
   * @param id The Discord ID to use
   */
  removeID(id: string) {
    return this.db.delete(id);
  }

  /**
   * Get all ID pairs in the database.
   */
  getIDs() {
    return this.db.all().map((row) => [row.ID, row.data]) as [string, string][];
  }

  /**
   * Sync ID associations to the database.
   */
  async sync() {
    const accounts = await this.lbry.accountList({ page_size: await this.getAccountCount() });

    let syncedAccounts = 0;
    for (const account of accounts.items) {
      if (/\d{17,19}/.test(account.name)) {
        if (this.getID(account.name)) continue;
        this.setID(account.name, account.id);
        syncedAccounts++;
      }
    }

    return syncedAccounts;
  }
  /* #endregion */

  /* #region count */
  /**
   * Get the amount of accounts in the SDK.
   */
  async getAccountCount() {
    const response = await this.lbry.accountList({ page_size: 1 });
    return response.total_items;
  }

  /**
   * Get the amount of supports from an account.
   * @param accountID The account ID to use
   */
  async getSupportsCount(accountID: string) {
    const response = await this.lbry.supportList({ account_id: accountID, page_size: 1 });
    return response.total_items;
  }
  /* #endregion */

  /* #region account */
  /**
   * Find an SDK account.
   * @param fn The function to iterate with
   */
  async findAccount(fn: (account: LBRY.Account) => boolean) {
    const accounts = await this.lbry.accountList({ page_size: await this.getAccountCount() });
    return accounts.items.find(fn);
  }

  /**
   * Creates an SDK account for a Discord user.
   * @param id The Discord ID to use
   */
  async createAccount(id: string) {
    this.logger.info('Creating account for user', id);
    const account = await this.lbry.accountCreate({ account_name: id, single_key: true });
    this.setID(id, account.id);
    this.logger.info('Created pair', id, account.id);
    let transaction: LBRY.Transaction | null = null;
    if (this.config.startingBalance) {
      transaction = await this.lbry.accountFund({
        to_account: account.id,
        amount: this.config.startingBalance,
        broadcast: true
      });
      this.logger.info('Funded account', account.id, transaction.txid);
    }
    return { account, transaction };
  }

  /**
   * Get the account ID of the default account.
   * For trusted member use.
   */
  async getDefaultAccount() {
    if (this.defaultAccount) return this.defaultAccount;
    const account = await this.findAccount((account) => account.is_default);
    this.defaultAccount = account!.id;
    return account!.id;
  }

  /**
   * Finds an account ID or creates one.
   * @param discordID The Discord ID to use
   * @param create Whether to create the account if not created already
   */
  async ensureAccount(discordID: string, create = true): Promise<EnsureAccountResult> {
    // Check SQLite
    const id = this.getID(discordID);
    if (id) return { id };

    // Check accounts via SDK
    const foundAccount = await this.findAccount((account) => account.name === discordID);
    if (foundAccount) {
      this.setID(discordID, foundAccount.id);
      return { id: foundAccount.id };
    }

    // Create account if not found
    if (create) {
      const account = await this.createAccount(discordID);
      return {
        id: account.account.id,
        txid: account.transaction?.txid,
        new: true
      };
    } else return { id: '' };
  }

  /**
   * Deletes an account from the SDK and database.
   * @param discordID The Discord ID to use
   * @param id The LBRY account ID to use
   */
  async deleteAccount(discordID: string, id: string) {
    // Backup the wallet before doing any delete function
    try {
      this.wallet.backup();
    } catch (err) {
      this.logger.error('Error occurred while backing up wallet file!', err);
      throw err;
    }

    // Abandon supports
    await this.abandonAllClaims(id);

    // Take out funds from account
    const balance = await this.lbry.accountBalance({ account_id: id });
    let amount = balance.total;
    while (parseFloat(amount) >= 2) {
      await this.lbry.accountFund({ from_account: id, everything: true, amount });
      const newBalance = await this.lbry.accountBalance({ account_id: id });
      amount = newBalance.total;
      await wait(3000);
    }

    // Remove account from SDK & SQLite
    await this.lbry.accountRemove({ account_id: id });
    this.removeID(discordID);
  }
  /* #endregion */

  /* #region claim */
  /**
   * Abandon all claims from a LBRY account.
   * @param accountID The LBRY account ID to use
   */
  async abandonAllClaims(accountID: string) {
    const supportsCount = await this.getSupportsCount(accountID);
    if (supportsCount <= 0) return;

    const supports = await this.lbry.supportList({
      account_id: accountID,
      page_size: supportsCount,
      no_totals: true
    });
    this.logger.info(`Abandoning claims for ${accountID} (${supportsCount})`);
    for (const support of supports.items) {
      await this.lbry.supportAbandon({ claim_id: support.claim_id, account_id: accountID });
      await wait(3000);
    }
    return { count: supports.items.length };
  }

  /**
   * Resolve a query into a claim ID.
   * @param query The query to resolve
   */
  async resolveClaim(query: string) {
    // Regular claim ID
    if (/^[a-f0-9]{40}$/.test(query)) return query;

    // Canonical URL
    const CANONICAL_URL = /^lbry:\/\/([a-f0-9]{40})$/;
    if (CANONICAL_URL.test(query)) return query.replace(CANONICAL_URL, '$1');

    // Short URL: https://regex101.com/r/IQR6Xu/1
    const SHORT_URL =
      /^<?(?:https?:\/\/(?:odysee\.com|lbry\.tv)\/|lbry:\/\/)?(?<channel>@[\w-]+)[#:](?<channelID>[a-f0-9])(?:\/(?<video>[\w-]+)[#:](?<videoID>[a-f0-9]))>?$/;
    if (SHORT_URL.test(query)) {
      const groups = query.match(SHORT_URL)!.groups!;
      const options: LBRY.ClaimSearchArguments = {
        channel: groups.channel,
        page_size: 1000
      };
      if (groups.video) options.text = groups.video;

      const search = await this.lbry.claimSearch(options);
      for (const claim of search.items) {
        if (
          (groups.video && claim.claim_id.startsWith(groups.videoID) && claim.value_type === 'stream') ||
          (!groups.video && claim.claim_id.startsWith(groups.channelID) && claim.value_type === 'channel')
        )
          return claim.claim_id;
      }
    }

    return null;
  }
  /* #endregion */
}
