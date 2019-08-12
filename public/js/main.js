const CRYPTO_COW_ABI = [{"constant": false,"inputs": [{"name": "_spender","type": "address"},{"name": "_value","type": "uint256"},{"name": "data","type": "bytes"}],"name": "approveAndCall","outputs": [{"name": "","type": "bool"}],"payable": false,"stateMutability": "nonpayable","type": "function"}]
const CRYPTO_COW_ADDRESS = '0x7a2c786c8fcda3776cb01be73f184047b58e3734'
const BEEF_AUCTION_ADDRESS = '0x2ff47352dd7ca01936fbb666f066b29f80ce10c4'

class App {
  constructor () {
    this.timer = document.querySelector('.timer')
    this.bidderAddress = document.querySelector('.bidder-address')
    this.biddingPrice = document.querySelector('.bidding-price')
    this.bidValue = document.querySelector('.bid-input__field')
    this.bidButton = document.querySelector('.bid-input__button')

    this.bidButton.addEventListener('click', this.bid.bind(this))

    this.initWeb3()
  }

  async bid () {
    const data = '0x0'
    const value = parseFloat(this.bidValue.value)
    const bidderAddress = this.web3.eth.accounts[0]
    const token = this.web3.eth.contract(CRYPTO_COW_ABI).at(CRYPTO_COW_ADDRESS)
    token.approveAndCall(BEEF_AUCTION_ADDRESS, value, data, (err, result) => {
      if (!err) {
        this.bidderAddress.textContent = bidderAddress
        this.biddingPrice.textContent = `${value.toFixed(3)} COW`
      }
    })
  }

  async initWeb3 () {
    this.web3 = await getWeb3()
  }
}

async function getWeb3 () {
  if (typeof window.ethereum === undefined) {
    console.error('You have to install MetaMask first.')
    return
  }
  await window.ethereum.enable()
  return window.web3
}

window.onload = () => {
  window.app = new App()
}
