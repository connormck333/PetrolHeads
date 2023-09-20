const MAX_MINT_AMOUNT_PUBLIC = 5;
const MAX_MINT_AMOUNT_PRESALE = 2;
const MIN_MINT_AMOUNT = 1;
const PRICE_PUBLIC = 0.15;
const PRICE_PRESALE = 0.12;

App = {
  loading: false,
  contract: undefined,
  address: '0xbC21CA2d7F111D114e08999DCFEE9afa916Bb4e4',
  modals: {
    tx: new bootstrap.Modal(document.getElementById("transaction-modal"), {backdrop: 'static'}),
    metaMask: new bootstrap.Modal(document.getElementById("metamask-modal"), {backdrop: 'static'}),
    error: new bootstrap.Modal(document.getElementById("error-modal"), {backdrop: 'static'}),
    unauthorised: new bootstrap.Modal(document.getElementById("unauthorised-modal"), {backdrop: 'static'})
  },
  errorCount: 0,
  phase: undefined,

  load: async () => {
    console.log('App loading...');

    // Disable Button
    App.toggleButton(false);

    let account_loaded = false;

    if (await App.loadWeb3() === 'connected') {
      try {

        await App.loadAccount();
        account_loaded = true;
        await App.loadContract();

        App.errorCount = 0;

        App.modals.error.hide();

      } catch (err) {
        console.log(err);
        App.errorCount++;

        if (account_loaded) {
          document.getElementById("error-body").innerText = "There was an error loading the smart contract from Ethereum. Please try again later.";
        } else {
          document.getElementById("error-body").innerText = "There was an error loading the account from your wallet. Please try again later.";
        }

        if (App.errorCount > 1) {
          document.getElementById("error-count").innerText = `(${App.errorCount.toString()})`
        }
        App.modals.error.show();
      }

      App.getTotalSupply();
      App.getPhase();
      App.toggleButton(true);
    }
  },

  loadWeb3: async () => {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    }
    // Modern dapp browsers...
    if (window.ethereum) {
      window.web3 = new Web3(ethereum);
      try {
        // Request account access if needed
        await ethereum.enable();
        // Acccounts now exposed
        web3.eth.sendTransaction({/* ... */});
      } catch (error) {
        // User denied account access...
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = web3.currentProvider;
      window.web3 = new Web3(web3.currentProvider);
      // Acccounts always exposed
      web3.eth.sendTransaction({/* ... */});
    }
    // Non-dapp browsers...
    else {
      App.modals.metaMask.show();

      return 'error';
    }

    App.modals.metaMask.hide();
    App.noWalletCount = 0;
    return 'connected';
  },

  loadAccount: async () => {
    accounts = await web3.eth.getAccounts();
    App.account = accounts[0];
    window.ethereum.on('accountsChanged', async () => {
      const newAccounts = await web3.eth.getAccounts();
      App.account = newAccounts[0];
      App.onAccountLoaded();
    });
    App.onAccountLoaded();
  },

  loadContract: async () => {
    const json = await $.getJSON('./contracts/contract.json');
    const contract_abi = new web3.eth.Contract(json, App.address);
    // const contract = contract_abi.at('0x39Fe7c5854bA6d75F45E4877e3c1398Ac873a254');
    App.contract = contract_abi;
  },

  reloadPage: () => {
    window.location.reload();
  },

  getTotalSupply: () => {
    App.contract.methods.totalSupply().call(function (err, res) {
      if (!err) {
        console.log(res);
        document.getElementById('supply').innerHTML = res.toString() + '/10000';
      }
    });
  },

  onAccountLoaded: () => {
    const wallet_btn = document.getElementById('wallet-btn');
    wallet_btn.innerText = 'Mint';
    wallet_btn.onclick = App.mint;
    const account_txt_pre = document.getElementById('account-connected-pre');
    const account_txt = document.getElementById('account-connected');
    account_txt_pre.innerHTML = 'Connected to: <span class="grey">'+ App.shortenAddress(App.account) +'</span>';
  },

  mint: async () => {

    // Check phase
    let proof = [];
    if (App.phase !== 'public') {
      // Check Whitelist
      const authorised = await App.isAuthorisedToMint();
      if (!authorised.authorised) {
        document.getElementById("ua-message-body").innerText = authorised.error_msg;
        return App.modals.unauthorised.show();
      }
      proof = authorised.proof;
    }
    console.log(proof)

    // Disable button
    App.toggleButton(false);

    // Mint NFT
    const price_phase = App.phase === 'public' ? PRICE_PUBLIC : PRICE_PRESALE;
    const num_to_mint = document.getElementById('counter-value').textContent;
    const price_eth = (num_to_mint * price_phase).toFixed(2);
    const price_wei = web3.utils.toWei(price_eth, 'ether');

    const tx_params = {
      from: App.account,
      to: App.address,
      value: parseInt(price_wei).toString(16),
      data: App.contract.methods.mint(App.account, parseInt(num_to_mint), proof).encodeABI(),
    }

    try {
      const tx_hash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [tx_params]
      });
      console.log('success', tx_hash);

      const modal_header = document.getElementById('modal-header');
      const modal_footer = document.getElementById('modal-footer');
      modal_header.innerHTML = '<h2>Minting ' + num_to_mint + ' Petrol Heads</h2>';
      modal_footer.innerHTML = '<p>View transaction on Etherscan: <a target="_blank" href="https://rinkeby.etherscan.io/tx/' + tx_hash + '">' + App.shortenAddress(tx_hash) + '</a></p>'

      App.modals.tx.show();

      let transactionFinished = null;
      while (transactionFinished === null) {
        transactionFinished = await web3.eth.getTransactionReceipt(tx_hash);
        if (!transactionFinished) {
          await App.sleep(15000);
        }
      }
      console.log(transactionFinished);

      // Show success
      const modal_body = document.getElementById('modal-body');
      modal_body.innerHTML = '<p class="pt-4 fs-5">You have successfully minted ' + num_to_mint + ' Petrol Heads!</p> <button onclick="App.closeTxModal()" class="btn btn-primary">Close</button>'

    } catch (err) {
      console.log(err);
    }

    // Enable Mint button
    App.toggleButton(true);
  },

  isAuthorisedToMint: async () => {

    try {
      const res = await fetch('/api/checkwl?id=' + encodeURIComponent(App.account), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (res.status === 408) {
        return {authorised: false, error_msg: '408 Connection Timeout.'}
      } else if (res.status !== 200) {
        return {authorised: false, error_msg: 'You are not authorised to mint yet.'}
      }

      const json = await res.json();
      // const proof = json.proof.map((item, index) => web3.utils.asciiToHex(item.proof));
      return {authorised: true, proof: json.proof};

    } catch (err) {
      console.log('ERROR:', err);
      return {authorised: false, error_msg: 'Unknown error occurred.'}
    }
  },

  getPhase: () => {
    App.contract.methods.phase().call(function(err, res) {
      if (!err) {
        console.log(res)
        App.phase = res === '0' ? 'presale' : 'public';
        document.getElementById('current-price').innerText = `${App.phase === 'presale' ? PRICE_PRESALE : PRICE_PUBLIC} ETH + gas`;
        document.getElementById('table-price').innerHTML = `${App.phase === 'presale' ? PRICE_PRESALE : PRICE_PUBLIC} ETH + gas`;
        document.getElementById('table-limit').innerHTML = App.phase === 'presale' ? MAX_MINT_AMOUNT_PRESALE : MAX_MINT_AMOUNT_PUBLIC;
      }
    });
  },

  sleep: time => {
    return new Promise(resolve => setTimeout(resolve, time));
  },

  shortenAddress: a => {
    const l = a.length;
    return (
      a[0] + a[1] + a[2] + '...' + a[l - 4] + a[l - 3] + a[l - 2] + a[l - 1]
    )
  },

  closeTxModal: async () => {
    App.modals.tx.hide();
    await App.sleep(5);
    const modal_body = document.getElementById('modal-body');
    modal_body.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div><p class="pt-4 fs-5">Waiting on transaction to be mined... This may take a few minutes.</p>'
  },

  toggleButton: bool => {
    const wallet_btn = document.getElementById('wallet-btn');
    wallet_btn.disabled = !bool;
    if (!bool) {
      wallet_btn.innerHTML = '<div class="spinner-border text-dark" role="status"><span class="visually-hidden">Loading...</span></div>';
    } else {
      wallet_btn.innerHTML = App.contract !== undefined ? 'Mint' : 'Connect Wallet';
    }
  },

  incrementCounter: () => {
    const element = document.getElementById("counter-value");
    const current = element.textContent;
    const max_mint = App.phase === 'public' ? MAX_MINT_AMOUNT_PUBLIC : MAX_MINT_AMOUNT_PRESALE;
    if (current >= max_mint || isNaN(current)) {
      return;
    }

    const value = (parseInt(current) + 1);

    element.textContent = value.toString();
    const price_phase = App.phase === 'public' ? PRICE_PUBLIC : PRICE_PRESALE;
    document.getElementById("current-price").innerHTML = (price_phase * value).toFixed(2) + " ETH + gas";
  },

  decrementCounter: () => {
    const element = document.getElementById("counter-value");
    const current = element.textContent;
    if (current <= MIN_MINT_AMOUNT || isNaN(current)) {
      return;
    }

    const value = parseInt(current) - 1;

    element.textContent = value.toString();
    const price_phase = App.phase === 'public' ? PRICE_PUBLIC : PRICE_PRESALE;
    document.getElementById("current-price").innerHTML = (price_phase * value).toFixed(2) + " ETH + gas";
  }
}
