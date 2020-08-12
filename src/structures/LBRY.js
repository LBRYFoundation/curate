const fetch = require('node-fetch');
const AbortController = require('abort-controller');
const config = require('config');

class LBRY {
  static _request(options = {}) {
    if (!options.url)
      throw new Error('No URL was provided!');

    if (!options.method)
      options.method = 'get';

    const url = new URL(options.noBase ? options.url : config.sdkURL + options.url);
    let body = options.body;

    // Query params
    if (options.query && Object.keys(options.query).length)
      Object.keys(options.query).map(key =>
        url.searchParams.append(key, options.query[key]));

    // Body Format
    if (body && options.bodyType === 'json')
      body = JSON.stringify(body);
    else if (body && options.bodyType === 'form') {
      body = new URLSearchParams();
      Object.keys(options.body).forEach(key =>
        body.append(key, options.body[key]));
    }

    // Hash
    if (options.hash)
      url.hash = options.hash;

    // User Agent
    const userAgent = `LBRYCurate (https://github.com/LBRYFoundation/curate ${this.client.pkg.version}) Node.js/${process.version}`;
    if (!options.headers)
      options.headers = {
        'User-Agent': userAgent
      };
    else
      options.headers['User-Agent'] = userAgent;

    // Abort Controller
    const controller = new AbortController();
    const controllerTimeout = setTimeout(controller.abort.bind(controller), 5000);

    return new Promise((resolve, reject) => {
      fetch(url.href, {
        body,
        headers: options.headers,
        method: options.method,
        signal: controller.signal
      }).then(r => {
        clearTimeout(controllerTimeout);
        resolve(r);
      }).catch(e => {
        clearTimeout(controllerTimeout);
        if (e && e.type === 'aborted')
          resolve(e); else reject(e);
      });
    });
  }

  static _sdkRequest(method, params = {}) {
    const payload = { method };
    if (params && Object.keys(params).length)
      payload.params = params;

    return this._request({
      url: '',
      method: 'post',
      bodyType: 'json',
      body: payload
    });
  }

  // #region Account Methods
  /**
   * List details of all of the accounts or a specific account.
   */
  static listAccounts(params) {
    return this._sdkRequest('account_list', params);
  }

  /**
   * Create a new account.
   * @param {string} accountName The account's name
   */
  static createAccount(accountName) {
    return this._sdkRequest('account_create', { account_name: accountName, single_key: true });
  }

  /**
   * Return the balance of an account
   * @param {string} accountID The account's ID
   */
  static accountBalance(accountID) {
    return this._sdkRequest('account_balance', { account_id: accountID });
  }

  /**
   * Transfer some amount (or --everything) to an account from another account (can be the same account).
   * @param {object} options
   * @param {string} options.to The account ID to fund
   * @param {string} options.from The account ID to fund from
   * @param {boolean} options.everything Transfer everything
   * @param {string} options.amount The amount to fund (integer/float string)
   */
  static fundAccount({ to, from, everything, amount }) {
    return this._sdkRequest('account_fund', { to_account: to, from_account: from, everything, amount });
  }

  /**
   * Remove an existing account.
   * @param {string} accountID The account's ID
   */
  static removeAccount(accountID) {
    return this._sdkRequest('account_remove', { account_id: accountID });
  }
  // #endregion

  // #region Support Methods
  /**
   * List supports and tips in my control.
   * @param {object} options
   * @param {string} options.accountID The account ID to list
   * @param {string|Array<string>} options.claimID The clain ID to list
   */
  static listSupports({ accountID, claimID }) {
    return this._sdkRequest('support_list', { account_id: accountID, claim_id: claimID });
  }

  /**
   * Create a support or a tip for name claim.
   * @param {object} options
   * @param {string} options.accountID The account ID to use
   * @param {string} options.claimID The claim ID to use
   * @param {number} options.amount The amount of support
   */
  static createSupport({ accountID, claimID, amount }) {
    return this._sdkRequest('support_create', {
      account_id: accountID, claim_id: claimID,
      amount, funding_account_ids: accountID });
  }

  /**
   * Abandon supports, including tips, of a specific claim, optionally keeping some amount as supports.
   * @param {object} options
   * @param {string} options.accountID The account ID to use
   * @param {string} options.claimID The claim ID to use
   */
  static abandonSupport({ accountID, claimID }) {
    return this._sdkRequest('support_abandon', { account_id: accountID, claim_id: claimID });
  }
  // #endregion

  // #region Wallet & Address Methods
  /**
   * Return the balance of a wallet
   */
  static walletBalance() {
    return this._sdkRequest('wallet_balance');
  }

  /**
   * Send the same number of credits to multiple
   * addresses using all accounts in wallet to fund the
   * transaction and the default account to receive any change.
   * @param {object} options
   * @param {string} options.to The wallet address to fund
   * @param {string} options.amount The amount to send
   */
  static sendToWallet({ amount, to }) {
    return this._sdkRequest('wallet_send', { amount, addresses: to });
  }

  /**
   * List account addresses or details of single address.
   */
  static listAddresses() {
    return this._sdkRequest('address_list', { page_size: 1 });
  }
  // #endregion
}

module.exports = LBRY;