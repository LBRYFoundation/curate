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

/** trending groups of the content */
export enum TrendingGroup {
  /** not trending globally or locally */
  NONE = 1,
  /** trending globally but not independently */
  GLOBALLY,
  /** not trending globally but is trending independently (locally) */
  INDEPENDENTLY,
  /** trending globally and independently */
  BOTH
}

type SearchOrderBy =
  | 'name'
  | 'height'
  | 'release_time'
  | 'publish_time'
  | 'amount'
  | 'effective_amount'
  | 'support_amount'
  | 'trending_group'
  | 'trending_mixed'
  | 'trending_local'
  | 'trending_global'
  | 'activation_height'
  | '^name'
  | '^height'
  | '^release_time'
  | '^publish_time'
  | '^amount'
  | '^effective_amount'
  | '^support_amount'
  | '^trending_group'
  | '^trending_mixed'
  | '^trending_local'
  | '^trending_global'
  | '^activation_height';
/* #endregion */

/* #region arguments */
export interface PaginatingArguments {
  /** page to return during paginating */
  page?: number;
  /** number of items on page during pagination */
  page_size?: number;
}

export interface NoTotalsPaginatingArguments extends PaginatingArguments {
  /** do not calculate the total number of pages and items in result set (significant performance boost) */
  no_totals?: boolean;
}

export interface BlockingArguments {
  /** do not broadcast the transaction */
  preview?: boolean;
  /** wait until transaction is in mempool */
  blocking?: boolean;
}

/** @see https://lbry.tech/api/sdk#account_balance */
export interface AccountBalanceArguments {
  /** If provided only the balance for this account will be given. Otherwise default account. */
  account_id?: string;
  /** balance for specific wallet */
  wallet_id?: string;
  /** Only include transactions with this many confirmed blocks. */
  confirmations?: number;
}

/** @see https://lbry.tech/api/sdk#account_create */
export interface AccountCreateArguments {
  /** name of the account to create */
  account_name: string;
  /** create single key account, default is multi-key */
  single_key?: boolean;
  /** restrict operation to specific wallet */
  wallet_id?: string;
}

/** @see https://lbry.tech/api/sdk#account_fund */
export interface AccountFundArguments {
  /** send to this account */
  to_account?: string;
  /** spend from this account */
  from_account?: string;
  /** the amount to transfer lbc */
  amount: decimal;
  /** transfer everything (excluding claims)
   * @default false */
  everything?: boolean;
  /** split payment across many outputs
   * @default 1 */
  outputs?: number;
  /** limit operation to specific wallet */
  wallet_id?: string;
  /** actually broadcast the transaction
   * @default false */
  broadcast?: boolean;
}

/** @see https://lbry.tech/api/sdk#account_list */
export interface AccountListArguments extends PaginatingArguments {
  /** If provided only the balance for this account will be given */
  account_id?: string;
  /** accounts in specific wallet */
  wallet_id?: string;
  /** required confirmations
   * @default 0 */
  confirmations?: number;
  /** include claims, requires than a LBC account is specified
   * @default false */
  include_claims?: boolean;
  /** show the seed for the account */
  show_seed?: boolean;
}

/** @see https://lbry.tech/api/sdk#account_remove */
export interface AccountRemoveArguments {
  /** id of the account to remove */
  account_id: string;
  /** restrict operation to specific wallet */
  wallet_id?: string;
}

/** @see https://lbry.tech/api/sdk#address_list */
export interface AddressListArguments extends PaginatingArguments {
  /** just show details for single address */
  address?: string;
  /** id of the account to use */
  account_id?: string;
  /** restrict operation to specific wallet */
  wallet_id?: string;
}

/** @see https://lbry.tech/api/sdk#support_abandon */
export interface SupportAbandonArguments extends BlockingArguments {
  /** claim_id of the support to abandon */
  claim_id?: string;
  /** txid of the claim to abandon */
  txid?: string;
  /** nout of the claim to abandon */
  nout?: number;
  /** amount of lbc to keep as support */
  keep?: decimal;
  /** amount of lbc to keep as support */
  account_id?: string;
  /** restrict operation to specific wallet */
  wallet_id?: string;
}

/** @see https://lbry.tech/api/sdk#support_create */
export interface SupportCreateArguments extends BlockingArguments {
  /** claim_id of the claim to support */
  claim_id: string;
  /** amount of support */
  amount: decimal;
  /** send support to claim owner
   * @default false */
  tip?: boolean;
  /** claim id of the supporters identity channel */
  channel_id?: string;
  /** name of the supporters identity channel */
  channel_name?: string;
  /** one or more account ids for accounts to look in for channel certificates, defaults to all accounts */
  channel_account_id?: string;
  /** account to use for holding the transaction */
  account_id?: string;
  /** restrict operation to specific wallet */
  wallet_id?: string;
  /** ids of accounts to fund this transaction */
  funding_account_ids?: string[];
}

/** @see https://lbry.tech/api/sdk#support_list */
export interface SupportListArguments extends NoTotalsPaginatingArguments {
  /** claim name */
  name?: string | string[];
  /** claim id */
  claim_id?: string | string[];
  /** only show received (tips) */
  recieved?: boolean;
  /** only show sent (tips) */
  sent?: boolean;
  /** only show my staked supports */
  staked?: boolean;
  /** show abandoned supports */
  is_spent?: boolean;
  /** id of the account to query */
  account_id?: string;
  /** restrict results to specific wallet */
  wallet_id?: string;
}

/** @see https://lbry.tech/api/sdk#wallet_balance */
export interface WalletBalanceArguments {
  /** balance for specific wallet */
  wallet_id?: string;
  /** Only include transactions with this many confirmed blocks. */
  confirmations?: number;
}

/** @see https://lbry.tech/api/sdk#wallet_send */
export interface WalletSendArguments extends BlockingArguments {
  // undocumented
  amount: decimal;
  addresses: string | string[];

  /** restrict operation to specific wallet */
  wallet_id?: string;
  /** account where change will go */
  change_account_id?: string;
  /** accounts to fund the transaction */
  funding_account_ids?: string;
}

/** @see https://lbry.tech/api/sdk#claim_search */
export interface ClaimSearchArguments extends NoTotalsPaginatingArguments {
  /** claim name (normalized) */
  name?: string;
  /** full text search */
  text?: string;
  /** full or partial claim id */
  claim_id?: string;
  /** list of full claim ids */
  claim_ids?: string[];
  /** transaction id */
  txid?: string;
  /** position in the transaction */
  nout?: string;
  /** claims signed by this channel (argument is a URL which automatically gets resolved) */
  channel?: string;
  /** claims signed by any of these channels (arguments must be claim ids of the channels) */
  channel_ids?: string[];
  /** exclude claims signed by any of these channels (arguments must be claim ids of the channels) */
  not_channel_ids?: string[];
  /** claims with a channel signature (valid or invalid) */
  has_channel_signature?: boolean;
  /** claims with a valid channel signature or no signature */
  valid_channel_signature?: boolean;
  /** claims with invalid channel signature or no signature */
  invalid_channel_signature?: boolean;
  /** only return up to the specified number of claims per channel */
  limit_claims_per_channel?: number;
  /** winning claims of their respective name */
  is_controlling?: boolean;
  /** only return channels having this public key id */
  public_key_id?: string;
  /** last updated block height (supports equality constraints) */
  height?: number | string;
  /** last updated timestamp (supports equality constraints) */
  timestamp?: number | string;
  /** created at block height (supports equality constraints) */
  creation_height?: number | string;
  /** created at timestamp (supports equality constraints) */
  creation_timestamp?: number | string;
  /** height at which claim starts competing for name (supports equality constraints) */
  activation_height?: number | string;
  /** height at which claim will expire (supports equality constraints) */
  expiration_height?: number | string;
  /** limit to claims self-described as having been released to the public on or after this UTC timestamp,
   * when claim does not provide a release time the publish time is used instead (supports equality constraints) */
  release_time?: number | string;
  /** limit by claim value (supports equality constraints) */
  amount?: number | string;
  /** limit by supports and tips received (supports equality constraints) */
  support_amount?: number | string;
  /** limit by total value (initial claim value plus all tips and supports received),
   * this amount is blank until claim has reached activation height (supports equality constraints) */
  effective_amount?: number | string;
  /** trending groups of the content (supports equality constraints) */
  trending_group?: TrendingGroup | string;
  /** trending amount taken from the global or local value depending on the trending group:
   * 4 - global value, 3 - local value, 2 - global value, 1 - local value (supports equality constraints) */
  trending_mixed?: number | string;
  /** trending value calculated relative only to the individual contents past history (supports equality constraints) */
  trending_local?: number | string;
  /** trending value calculated relative to all trending content globally (supports equality constraints) */
  trending_global?: number | string;
  /** all reposts of the specified original claim id */
  reposted_claim_id?: string;
  /** claims reposted this many times (supports equality constraints) */
  reposted?: number | string;
  /** the type of claims to filter */
  claim_type?: 'channel' | 'stream' | 'repost' | 'collection';
  /** the type of stream types to filter */
  stream_types?: string[];
  /** the media type to filter */
  media_types?: string[];
  /** specify fee currency */
  fee_currency?: string;
  /** content download fee (supports equality constraints) */
  fee_amount?: decimal;
  /** duration of video or audio in seconds (supports equality constraints) */
  duration?: number | string;
  /** find claims containing any of the tags */
  any_tags?: string[];
  /** find claims containing every tag */
  all_tags?: string[];
  /** find claims not containing any of these tags */
  not_tags?: string[];
  /** find claims containing any of the languages */
  any_languages?: string[];
  /** find claims containing every language */
  all_languages?: string[];
  /** find claims not containing any of these languages */
  not_languages?: string[];
  /** find claims containing any of the locations */
  any_locations?: string[];
  /** find claims containing every location */
  all_locations?: string[];
  /** find claims not containing any of these locations */
  not_locations?: string[];
  /** field to order by, default is descending order, to do an ascending order prepend ^ to the field name */
  order_by?: SearchOrderBy[];
  /** wallet to check for claim purchase receipts */
  wallet_id?: string;
  /** lookup and include a receipt if this wallet has purchased the claim */
  include_purchase_receipt?: boolean;
  /** lookup and include a boolean indicating if claim being resolved is yours */
  include_is_my_output?: boolean;
  /** removes duplicated content from search by picking either the original claim or the oldest matching repost */
  remove_duplicates?: boolean;
  /** find claims containing a source field */
  has_source?: boolean;
  /** find claims not containing a source field */
  has_no_source?: boolean;
  /** URL of the new SDK server (EXPERIMENTAL) */
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
  items: T[];
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
