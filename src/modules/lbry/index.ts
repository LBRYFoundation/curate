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

    const body = response.body;
    if ('code' in body && 'message' in body) throw new LBRYError(response);

    return body.result;
  }

  /* #region account */
  accountBalance(options?: LBRY.AccountBalanceArguments): Promise<LBRY.Balance> {
    return this.post('account_balance', options);
  }

  accountCreate(options: LBRY.AccountCreateArguments): Promise<LBRY.Account> {
    return this.post('account_create', options);
  }

  accountFund(options: LBRY.AccountFundArguments): Promise<LBRY.Transaction> {
    return this.post('account_fund', options);
  }

  accountList(options?: LBRY.AccountListArguments): Promise<LBRY.PaginatingResult<LBRY.Account>> {
    return this.post('account_list', options);
  }

  accountRemove(options: LBRY.AccountRemoveArguments): Promise<LBRY.Account> {
    return this.post('account_remove', options);
  }
  /* #endregion */

  /* #region address */
  addressList(options?: LBRY.AddressListArguments): Promise<LBRY.PaginatingResult<LBRY.Address>> {
    return this.post('address_list', options);
  }
  /* #endregion */

  /* #region support */
  supportAbandon(options: LBRY.SupportAbandonArguments): Promise<LBRY.Transaction> {
    return this.post('support_abandon', options);
  }

  supportCreate(options: LBRY.SupportCreateArguments): Promise<LBRY.Transaction> {
    return this.post('support_create', options);
  }

  supportList(options?: LBRY.SupportListArguments): Promise<LBRY.PaginatingResult<LBRY.Support>> {
    return this.post('support_list', options);
  }
  /* #endregion */

  /* #region wallet */
  walletBalance(options?: LBRY.WalletBalanceArguments): Promise<LBRY.Balance> {
    return this.post('wallet_balance', options);
  }

  walletSend(options: LBRY.WalletSendArguments): Promise<LBRY.Transaction> {
    return this.post('wallet_send', options);
  }
  /* #endregion */

  /* #region claim */
  claimSearch(
    options: LBRY.ClaimSearchArguments
  ): Promise<LBRY.SearchPaginatingResult<LBRY.SearchableClaim>> {
    return this.post('claim_search', options);
  }
  /* #endregion */
}
