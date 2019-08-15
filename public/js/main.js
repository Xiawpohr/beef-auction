const CRYPTO_COW_ABI = [{"constant": false,"inputs": [{"name": "_spender","type": "address"},{"name": "_value","type": "uint256"},{"name": "data","type": "bytes"}],"name": "approveAndCall","outputs": [{"name": "","type": "bool"}],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": true,"inputs": [{"name": "_owner","type": "address"}],"name": "balanceOf","outputs": [{"name": "","type": "uint256"}],"payable": false,"stateMutability": "view","type": "function"}]
const BEEF_AUCTION_ABI = [{"anonymous": false,"inputs": [{"indexed": true,"name": "bidder","type": "address"},{"indexed": false,"name": "amount","type": "uint256"}],"name": "Bid","type": "event"},{"constant": true,"inputs": [],"name": "currentWinner","outputs": [{"name": "","type": "address"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": true,"inputs": [],"name": "endTime","outputs": [{"name": "","type": "uint256"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": true,"inputs": [],"name": "highestBid","outputs": [{"name": "","type": "uint256"}],"payable": false,"stateMutability": "view","type": "function"}]
const CRYPTO_COW_ADDRESS = '0x7a2c786c8fcda3776cb01be73f184047b58e3734'
const BEEF_AUCTION_ADDRESS = '0x2ff47352dd7ca01936fbb666f066b29f80ce10c4'
const ETHERSCAN_DOMAIN = 'https://rinkeby.etherscan.io'


class App {
  constructor () {
    this.bidderAddress = document.querySelector('.bidder-address')
    this.biddingPrice = document.querySelector('.bidding-price')
    this.bidValue = document.querySelector('.bid-input__field-input')
    this.bidButton = document.querySelector('.bid-input__button')
    this.timer = new Timer(document.querySelector('.timer'))
    this.snackbar = new Snackbar(document.querySelector('.snackbar'))

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
    try {
      this.web3 = await getWeb3()
      this.cryptoCow = this.web3.eth.contract(CRYPTO_COW_ABI).at(CRYPTO_COW_ADDRESS)
      this.auction = this.web3.eth.contract(BEEF_AUCTION_ABI).at(BEEF_AUCTION_ADDRESS)
    } catch (e) {
      this.snackbar.show('你需要安裝 MetaMask。')
    }
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
        const bid = parseFloat(result) / Math.pow(10, 18)
        this.biddingPrice.textContent = `${bid.toFixed(3)} COW`
      }
    })
  }

  displayBidHistory (log) {
    const row = document.createElement('tr')
    const bidderTd = document.createElement('td')
    const amountTd = document.createElement('td')
    const etherscanTd = document.createElement('td')
    const etherscanLink = document.createElement('a')
    const etherscanIcon = document.createElement('img')
    bidderTd.textContent = log.args.bidder
    amountTd.textContent = (log.args.amount.toNumber() / Math.pow(10, 18)).toFixed(3)
    etherscanIcon.src = 'img/etherscan.svg'
    etherscanIcon.width = 24
    etherscanIcon.height = 24
    etherscanLink.href = `${ETHERSCAN_DOMAIN}/tx/${log.transactionHash}`
    etherscanLink.target = '_blank'
    etherscanLink.append(etherscanIcon)
    etherscanTd.append(etherscanLink)
    row.append(bidderTd, amountTd, etherscanTd)

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
    const value = parseFloat(this.bidValue.value) * Math.pow(10, 18)
    const bidderAddress = this.web3.eth.accounts[0]
    const balance = await this.getBalance()

    if (value > balance) {
      this.snackbar.show('餘額不夠')
      return
    }
    if (value < parseFloat(this.biddingPrice.textContent) * 1.1) {
      this.snackbar.show('競標金額沒有比目前出價金額高出 1%')
      return
    }

    this.cryptoCow.approveAndCall(BEEF_AUCTION_ADDRESS, value, data, (err, result) => {
      if (!err) {
        this.snackbar.show('交易成功，正在等待上鏈')
      }
    })
  }

  getBalance () {
    return new Promise((resolve, reject) => {
      this.cryptoCow.balanceOf(this.web3.eth.accounts[0], (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(parseFloat(result))
        }
      })
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


/**
 * @param {HTMLElement} target
 * @param {String} defaultMessage
 */
class Snackbar {
  constructor(target, defaultMessage='') {
    this.target = target
    this.message = target.querySelector('.snackbar__message')
    this.closeButton = target.querySelector('.snackbar__close')

    this.closeButton.addEventListener('click', this.close.bind(this))
    this.setMessage(defaultMessage)
    this.target.style.display = 'none'
  }

  setMessage (message) {
    this.message.textContent = message
  }

  close () {
    this.target.style.display = 'none'
  }

  show (message) {
    if (message) {
      this.setMessage(message)
    }
    this.target.style.display = 'flex'
  }
}


async function getWeb3 () {
  if (typeof window.ethereum === undefined) {
    throw new Error('You have to install MetaMask first.')
  }
  await window.ethereum.enable()
  return window.web3
}


window.onload = () => {
  window.app = new App()
}
