const CRYPTO_COW_ABI = [{"constant": false,"inputs": [{"name": "_spender","type": "address"},{"name": "_value","type": "uint256"},{"name": "data","type": "bytes"}],"name": "approveAndCall","outputs": [{"name": "","type": "bool"}],"payable": false,"stateMutability": "nonpayable","type": "function"}]
const CRYPTO_COW_ADDRESS = '0x7a2c786c8fcda3776cb01be73f184047b58e3734'
const BEEF_AUCTION_ABI = [{"anonymous": false,"inputs": [{"indexed": true,"name": "bidder","type": "address"},{"indexed": false,"name": "amount","type": "uint256"}],"name": "Bid","type": "event"},{"constant": true,"inputs": [],"name": "currentWinner","outputs": [{"name": "","type": "address"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": true,"inputs": [],"name": "endTime","outputs": [{"name": "","type": "uint256"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": true,"inputs": [],"name": "highestBid","outputs": [{"name": "","type": "uint256"}],"payable": false,"stateMutability": "view","type": "function"}]
const BEEF_AUCTION_ADDRESS = '0x2ff47352dd7ca01936fbb666f066b29f80ce10c4'

class App {
  constructor () {
    this.timer = document.querySelector('.timer')
    this.bidderAddress = document.querySelector('.bidder-address')
    this.biddingPrice = document.querySelector('.bidding-price')
    this.bidValue = document.querySelector('.bid-input__field')
    this.bidButton = document.querySelector('.bid-input__button')

    this.bidButton.addEventListener('click', this.bid.bind(this))

    this.init()
  }

  async init() {
    await this.initWeb3()
    this.displayCurrentWinner()
    this.displayHighestBid()
  }

  async initWeb3 () {
    this.web3 = await getWeb3()
    this.cryptoCow = this.web3.eth.contract(CRYPTO_COW_ABI).at(CRYPTO_COW_ADDRESS)
    this.auction = this.web3.eth.contract(BEEF_AUCTION_ABI).at(BEEF_AUCTION_ADDRESS)
  }

  displayCurrentWinner () {
    this.auction.currentWinner((err, result) => {
      if (!err) {
        this.bidderAddress.textContent = result
      }
    })
  }

  displayHighestBid () {
    this.auction.highestBid((err, result) => {
      if (!err) {
        this.biddingPrice.textContent = `${parseFloat(result).toFixed(3)} COW`
      }
    })
  }

  async bid () {
    const data = '0x0'
    const value = parseFloat(this.bidValue.value)
    const bidderAddress = this.web3.eth.accounts[0]
    this.cryptoCow.approveAndCall(BEEF_AUCTION_ADDRESS, value, data, (err, result) => {
      if (!err) {
        console.log('bid transaction is pending...')
      }
    })
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
