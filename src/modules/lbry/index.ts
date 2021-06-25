import { DexareModule, DexareClient, BaseConfig } from 'dexare';
import needle, { NeedleResponse } from 'needle';
import * as LBRY from './types';
import { CurateConfig } from '../../bot';

export interface LBRYConfig extends BaseConfig {
  lbry?: LBRYModuleOptions;
}

export interface LBRYModuleOptions {
  sdkURL: string;
}

export class LBRYError extends Error {
  body: LBRY.LBRYErrorResponse;
  response: NeedleResponse;

  constructor(response: NeedleResponse) {
    super(response.body.message);
    this.response = response;
    this.body = response.body;
  }
}

export default class LBRYModule<T extends DexareClient<CurateConfig>> extends DexareModule<T> {
  constructor(client: T) {
    super(client, {
      name: 'lbry',
      description: 'Interacts with the LBRY SDK'
    });

    this.filePath = __filename;
  }

  get config() {
    return this.client.config.lbry;
  }

  private async post(method: string, params: Record<string, any> = {}) {
    const payload: any = { method };
    if (params && Object.keys(params).length) payload.params = params;
    const response = await needle('post', this.config.sdkURL, payload);

    const body: LBRY.JSONRPCResponse<any> | LBRY.LBRYErrorResponse = response.body;
    if ('code' in body && 'message' in body) throw new LBRYError(response);

    return body.result;
  }

  /* #region account */
  /**
   * Return the balance of an account
   */
  accountBalance(options?: LBRY.AccountBalanceArguments): Promise<LBRY.Balance> {
    return this.post('account_balance', options);
  }

  /**
   * Create a new account.
   * Specify --single_key if you want to use the same address for all transactions (not recommended).
   */
  accountCreate(options: LBRY.AccountCreateArguments): Promise<LBRY.Account> {
    return this.post('account_create', options);
  }

  /**
   * Transfer some amount (or --everything) to an account from another account (can be the same account).
   * Amounts are interpreted as LBC.
   * You can also spread the transfer across a number of --outputs (cannot be used together with --everything).
   */
  accountFund(options: LBRY.AccountFundArguments): Promise<LBRY.Transaction> {
    return this.post('account_fund', options);
  }

  /**
   * List details of all of the accounts or a specific account.
   */
  accountList(options?: LBRY.AccountListArguments): Promise<LBRY.PaginatingResult<LBRY.Account>> {
    return this.post('account_list', options);
  }

  /**
   * Remove an existing account.
   */
  accountRemove(options: LBRY.AccountRemoveArguments): Promise<LBRY.Account> {
    return this.post('account_remove', options);
  }
  /* #endregion */

  /* #region address */
  /**
   * List account addresses or details of single address.
   */
  addressList(options?: LBRY.AddressListArguments): Promise<LBRY.PaginatingResult<LBRY.Address>> {
    return this.post('address_list', options);
  }
  /* #endregion */

  /* #region support */
  /**
   * Abandon supports, including tips, of a specific claim, optionally keeping some amount as supports.
   */
  supportAbandon(options: LBRY.SupportAbandonArguments): Promise<LBRY.Transaction> {
    return this.post('support_abandon', options);
  }

  /**
   * Create a support or a tip for name claim.
   */
  supportCreate(options: LBRY.SupportCreateArguments): Promise<LBRY.Transaction> {
    return this.post('support_create', options);
  }

  /**
   * List staked supports and sent/received tips.
   */
  supportList(options?: LBRY.SupportListArguments): Promise<LBRY.PaginatingResult<LBRY.Support>> {
    return this.post('support_list', options);
  }
  /* #endregion */

  /* #region wallet */
  /**
   * Return the balance of a wallet.
   */
  walletBalance(options?: LBRY.WalletBalanceArguments): Promise<LBRY.Balance> {
    return this.post('wallet_balance', options);
  }

  /**
   * Send the same number of credits to multiple addresses using all accounts
   * in wallet to fund the transaction and the default account to receive any change.
   */
  walletSend(options: LBRY.WalletSendArguments): Promise<LBRY.Transaction> {
    return this.post('wallet_send', options);
  }
  /* #endregion */

  /* #region claim */
  /**
   * Search for stream and channel claims on the blockchain.
   * Arguments marked with "supports equality constraints" allow prepending the value with an equality constraint such as '>', '>=', '<' and '<='
   * would limit results to only claims above 400k block height.
   */
  claimSearch(
    options: LBRY.ClaimSearchArguments
  ): Promise<LBRY.SearchPaginatingResult<LBRY.SearchableClaim>> {
    return this.post('claim_search', options);
  }
  /* #endregion */
}
