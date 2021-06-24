export type decimal = string;

/* #region interfaces */
export interface Balance {
  available: decimal;
  reserved: decimal;
  reserved_subtotals: {
    claims: decimal;
    supports: decimal;
    tips: decimal;
  };
  total: decimal;
}

export interface Account {
  address_generator?: {
    change: {
      gap: number;
      maximum_uses_per_address: number;
    };
    name: number;
    receiving: {
      gap: number;
      maximum_uses_per_address: number;
    };
  };
  encrypted: boolean;
  id: string;
  is_default: boolean;
  ledger: string;
  modified_on: number;
  name: string;
  private_key?: string;
  public_key: string;
  seed: string;
}

export interface TransactionMeta {
  activation_height: number;
  claims_in_channel: number;
  creation_height: number;
  creation_timestamp: number;
  effective_amount: decimal;
  expiration_height: number;
  is_controlling: boolean;
  reposted: number;
  support_amount: decimal;
  take_over_height: number;
  trending_global: number;
  trending_group: number;
  trending_local: number;
  trending_mixed: number;
}

export interface Payment {
  address: string;
  amount: decimal;
  confirmations: number;
  height: number;
  nout: number;
  timestamp: number;
  txid: string;
  type: 'payment';
}

export interface Stream extends Omit<Payment, 'type'> {
  canonical_url: string;
  claim_id: string;
  claim_op: 'update' | 'create';
  is_channel_signature_valid: boolean;
  name: string;
  normalized_name: string;
  permanent_url: string;
  short_url: string;
  meta: TransactionMeta;
  signing_channel?: Channel;
  value: {
    source: {
      hash: string;
      media_type: string;
      name: string;
      sd_hash: string;
      size: string;
    };
    stream_type: string;
  };
  value_type: 'stream';
  type: 'claim';
}

export interface Channel extends Omit<Stream, 'value_type' | 'value' | 'signing_channel'> {
  value: {
    public_key: string;
    public_key_id: string;
    title: string;
  };
  value_type: 'channel';
}

export interface Support extends Omit<Payment, 'type'> {
  name: string;
  claim_id: string;
  permanent_url: string;
  value: any;
  value_type: 'channel' | 'stream';
  type: 'support';
}

export type SearchableClaim = Channel | Stream;

export interface Transaction {
  height: number;
  hex: string;
  inputs: Payment[];
  outputs: Payment[];
  total_fee: decimal;
  total_input: decimal;
  total_output: decimal;
  txid: string;
}

export interface Address {
  account: string;
  address: string;
  pubkey: string;
  used_times: number;
}
/* #endregion */

/* #region arguments */
export interface PaginatingArguments {
  page?: number;
  page_size?: number;
}

export interface NoTotalsPaginatingArguments extends PaginatingArguments {
  no_totals?: boolean;
}

export interface BlockingArguments {
  preview?: boolean;
  blocking?: boolean;
}

export interface AccountBalanceArguments {
  account_id?: string;
  wallet_id?: string;
  confirmations?: number;
}

export interface AccountCreateArguments {
  account_name: string;
  single_key?: boolean;
  wallet_id?: string;
}

export interface AccountFundArguments {
  to_account?: string;
  from_account?: string;
  amount: decimal;
  everything?: boolean;
  outputs?: number;
  wallet_id?: string;
  broadcast?: boolean;
}

export interface AccountListArguments extends PaginatingArguments {
  account_id?: string;
  wallet_id?: string;
  confirmations?: number;
  include_claims?: boolean;
  show_seed?: boolean;
}

export interface AccountRemoveArguments {
  account_id: string;
  wallet_id?: string;
}

export interface AddressListArguments extends PaginatingArguments {
  address?: string;
  account_id?: string;
  wallet_id?: string;
}

export interface SupportAbandonArguments extends BlockingArguments {
  claim_id?: string;
  txid?: string;
  nout?: number;
  keep?: decimal;
  account_id?: string;
  wallet_id?: string;
}

export interface SupportCreateArguments extends BlockingArguments {
  claim_id: string;
  amount: decimal;
  tip?: boolean;
  channel_id?: string;
  channel_name?: string;
  channel_account_id?: string;
  account_id?: string;
  wallet_id?: string;
  funding_account_ids?: string[];
}

export interface SupportListArguments extends NoTotalsPaginatingArguments {
  name?: string | string[];
  claim_id?: string | string[];
  recieved?: boolean;
  sent?: boolean;
  staked?: boolean;
  is_spent?: boolean;
  account_id?: string;
  wallet_id?: string;
}

export interface WalletBalanceArguments {
  wallet_id?: string;
  confirmations?: number;
}

export interface WalletSendArguments extends BlockingArguments {
  // undocumented
  amount: decimal;
  addresses: string | string[];

  wallet_id?: string;
  change_account_id?: string;
  funding_account_ids?: string;
}

export interface ClaimSearchArguments extends NoTotalsPaginatingArguments {
  name?: string;
  text?: string;
  claim_id?: string;
  claim_ids?: string[];
  txid?: string;
  nout?: string;
  channel?: string;
  channel_ids?: string[];
  not_channel_ids?: string[];
  has_channel_signature?: boolean;
  valid_channel_signature?: boolean;
  invalid_channel_signature?: boolean;
  limit_claims_per_channel?: number;
  is_controlling?: boolean;
  public_key_id?: string;
  height?: number | string;
  timestamp?: number | string;
  creation_height?: number | string;
  creation_timestamp?: number | string;
  activation_height?: number | string;
  expiration_height?: number | string;
  release_time?: number | string;
  amount?: number | string;
  support_amount?: number | string;
  effective_amount?: number | string;
  trending_group?: number | string;
  trending_mixed?: number | string;
  trending_local?: number | string;
  trending_global?: number | string;
  reposted_claim_id?: string;
  reposted?: number | string;
  claim_type?: 'channel' | 'stream' | 'repost' | 'collection';
  stream_types?: string[];
  media_types?: string[];
  fee_currency?: string;
  fee_amount?: string;
  duration?: number | string;
  any_tags?: string[];
  all_tags?: string[];
  not_tags?: string[];
  any_languages?: string[];
  all_languages?: string[];
  not_languages?: string[];
  any_locations?: string[];
  all_locations?: string[];
  not_locations?: string[];
  order_by?: string[];
  wallet_id?: string;
  include_purchase_receipt?: boolean;
  include_is_my_output?: boolean;
  remove_duplicates?: boolean;
  has_source?: boolean;
  has_no_source?: boolean;
  new_sdk_server?: string;
}
/* #endregion */

/* #region responses */
export interface LBRYErrorResponse {
  message: string;
  code: number;
  error: any;
}

export interface JSONRPCResponse<T> {
  jsonrpc: '2.0';
  result: T;
}

export interface PaginatingResult<T> {
  items: T;
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface SearchPaginatingResult<T> extends PaginatingResult<T> {
  blocked: {
    channels: any[];
    count: number;
  };
}
/* #endregion */
