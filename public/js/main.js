const CRYPTO_COW_ABI = [{"constant": false,"inputs": [{"name": "_spender","type": "address"},{"name": "_value","type": "uint256"},{"name": "data","type": "bytes"}],"name": "approveAndCall","outputs": [{"name": "","type": "bool"}],"payable": false,"stateMutability": "nonpayable","type": "function"}]
const CRYPTO_COW_ADDRESS = '0x7a2c786c8fcda3776cb01be73f184047b58e3734'
const BEEF_AUCTION_ABI = [{"anonymous": false,"inputs": [{"indexed": true,"name": "bidder","type": "address"},{"indexed": false,"name": "amount","type": "uint256"}],"name": "Bid","type": "event"},{"constant": true,"inputs": [],"name": "currentWinner","outputs": [{"name": "","type": "address"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": true,"inputs": [],"name": "endTime","outputs": [{"name": "","type": "uint256"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": true,"inputs": [],"name": "highestBid","outputs": [{"name": "","type": "uint256"}],"payable": false,"stateMutability": "view","type": "function"}]
const BEEF_AUCTION_ADDRESS = '0x2ff47352dd7ca01936fbb666f066b29f80ce10c4'

class App {
  constructor () {
    this.bidderAddress = document.querySelector('.bidder-address')
    this.biddingPrice = document.querySelector('.bidding-price')
    this.bidValue = document.querySelector('.bid-input__field')
    this.bidButton = document.querySelector('.bid-input__button')
    this.timer = new Timer(document.querySelector('.timer'))

    this.bidButton.addEventListener('click', this.bid.bind(this))

    this.init()
  }

  async init() {
    await this.initWeb3()
    this.setupTimer()
    this.displayCurrentWinner()
    this.displayHighestBid()
    this.watchBidEvent()
  }

  async initWeb3 () {
    this.web3 = await getWeb3()
    this.cryptoCow = this.web3.eth.contract(CRYPTO_COW_ABI).at(CRYPTO_COW_ADDRESS)
    this.auction = this.web3.eth.contract(BEEF_AUCTION_ABI).at(BEEF_AUCTION_ADDRESS)
  }

  setupTimer () {
    this.auction.endTime((err, result) => {
      if (!err) {
        this.timer.setEndTime(result)
        this.timer.start()
      }
    })
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

  displayBidHistory (log) {
    const row = document.createElement('tr')
    const bidderTd = document.createElement('td')
    const amountTd = document.createElement('td')
    bidderTd.textContent = log.args.bidder
    amountTd.textContent = log.args.amount.toNumber()
    row.append(bidderTd, amountTd)

    const tbody = document.querySelector('.bid-history__table-body')
    tbody.prepend(row)
  }

  watchBidEvent () {
    const bidEvent = this.auction.Bid({}, { fromBlock: 0, toBlock: 'latest' })
    bidEvent.watch((err, log) => {
      if (err) {
        console.error(err)
        return
      }
      this.displayCurrentWinner()
      this.displayHighestBid()
      this.displayBidHistory(log)
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

/**
 * @param {HTMLElement} target
 * @param {unix time} endTime
 */

class Timer {
  constructor(target, endTime) {
    this.target = target
    this.endTime = endTime
    this.isTimeUp = false
  }

  start () {
    this.interval = setInterval(() => {
      this.render()
    }, 1000)
  }

  clear () {
    clearInterval(this.interval)
  }

  setEndTime (endTime) {
    this.endTime = endTime
  }

  render () {
    let result
    const now = Math.floor(Date.now() / 1000)
    if (now > this.endTime) {
      result = '00:00:00'
      this.target.textContent = result
      this.isTimeup = true
      this.clear()
      return
    }
    const leftSeconds = this.endTime - now
    const hours = Math.floor(leftSeconds / 3600)
    const minutes = Math.floor(leftSeconds / 60) % 60
    const seconds = leftSeconds % 60
    result = `${hours}:${minutes}:${seconds}`
    this.target.textContent = result
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
