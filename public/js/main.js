const CRYPTO_COW_ABI = [{"constant": false,"inputs": [{"name": "_spender","type": "address"},{"name": "_value","type": "uint256"},{"name": "data","type": "bytes"}],"name": "approveAndCall","outputs": [{"name": "","type": "bool"}],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": true,"inputs": [{"name": "_owner","type": "address"}],"name": "balanceOf","outputs": [{"name": "","type": "uint256"}],"payable": false,"stateMutability": "view","type": "function"}]
const BEEF_AUCTION_ABI = [{"anonymous": false,"inputs": [{"indexed": true,"name": "bidder","type": "address"},{"indexed": false,"name": "amount","type": "uint256"}],"name": "Bid","type": "event"},{"constant": true,"inputs": [],"name": "currentWinner","outputs": [{"name": "","type": "address"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": true,"inputs": [],"name": "endTime","outputs": [{"name": "","type": "uint256"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": true,"inputs": [],"name": "highestBid","outputs": [{"name": "","type": "uint256"}],"payable": false,"stateMutability": "view","type": "function"}]
const CRYPTO_COW_ADDRESS = '0xFDb0065240753FEF4880a9CC7876be59E09D78BB'
const BEEF_AUCTION_ADDRESS = '0x38fA749021D01A0dADeb5C65B34B84cbFD1Cf0AA'
const ETHERSCAN_DOMAIN = 'https://etherscan.io'
const CRYPTO_COW_DECIMAL = new BigNumber(1e+18)
BigNumber.config({ RANGE: [-19, 61], EXPONENTIAL_AT: [-19, 61] })


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
    const isMainNet = await this.checkWeb3Network()
    if (isMainNet) {
      this.setupTimer()
      this.displayCurrentWinner()
      this.displayHighestBid()
      this.watchBidEvent()
    } else {
      this.snackbar.show('請切換到以太坊主網上。')
    }
  }

  async initWeb3 () {
    this.web3 = await getWeb3()
    const accounts = await this.web3.eth.getAccounts()
    this.account = accounts[0]
    this.cryptoCow = new this.web3.eth.Contract(CRYPTO_COW_ABI, CRYPTO_COW_ADDRESS)
    this.auction = new this.web3.eth.Contract(BEEF_AUCTION_ABI, BEEF_AUCTION_ADDRESS)
  }
  
  async checkWeb3Network () {
    const networkId = await this.web3.eth.net.getId()
    return networkId === 1
  }

  async setupTimer () {
    const endTimeRaw = await this.auction.methods.endTime().call()
    const endTime = endTimeRaw.toNumber()
    if (endTime * 1000 < Date.now()) {
      this.snackbar.show('競標時間已截止。')
      this.bidButton.disabled = true
    } else {
      this.timer.setEndTime(endTime)
      this.timer.start()
    }
  }

  async displayCurrentWinner () {
    const winner = await this.auction.methods.currentWinner().call()
    this.bidderAddress.textContent = winner
  }

  async displayHighestBid () {
    const highestBidRaw = await this.auction.methods.highestBid().call()
    const highestBidBig = new BigNumber(highestBidRaw)
    const hightestBid = highestBidBig.div(CRYPTO_COW_DECIMAL).toFixed(3).toString()
    this.biddingPrice.textContent = `${hightestBid} Cow`
  }

  displayBidHistory (log) {
    const row = document.createElement('tr')
    const bidderTd = document.createElement('td')
    const amountTd = document.createElement('td')
    const etherscanTd = document.createElement('td')
    const etherscanLink = document.createElement('a')
    const etherscanIcon = document.createElement('img')
    bidderTd.textContent = log.returnValues.bidder
    amountTd.textContent = new BigNumber(log.returnValues.amount).div(CRYPTO_COW_DECIMAL).toFixed(3).toString()
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
    this.auction.events.Bid({ fromBlock: 0 }).on('data', (log) => {
      this.setupTimer()
      this.displayCurrentWinner()
      this.displayHighestBid()
      this.displayBidHistory(log)
    })
  }

  async bid () {
    const bidderAddress = this.account
    const value = new BigNumber(this.bidValue.value)
    const biddingPrice = new BigNumber(parseFloat(this.biddingPrice.textContent))
    const balance = await this.getBalance()
    const data = '0x0'

    if (bidderAddress === undefined) {
      this.snackbar.show('你需要安裝 MetaMask。')
      return false
    }
    
    if (value.comparedTo(balance) > 0) {
      this.snackbar.show('餘額不夠。')
      return false
    }

    if (value.comparedTo(biddingPrice.times(1.1)) < 0) {
      this.snackbar.show('競標金額沒有比目前出價金額高出 1%。')
      return false
    }

    try {
      await this.cryptoCow.methods.approveAndCall(
        BEEF_AUCTION_ADDRESS,
        value.times(CRYPTO_COW_DECIMAL).toString(),
        data
      ).send({ from: this.account })
      this.snackbar.show('交易成功，正在等待上鏈。')
    } catch (e) {
      this.snackbar.show('交易發生錯誤，請再競標一次。')
    }
  }

  async getBalance () {
    const balance = await this.cryptoCow.methods.balanceOf(this.account).call()
    return new BigNumber(balance).div(CRYPTO_COW_DECIMAL)
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
    setTimeout(() => { this.close() }, 5000)
  }
}


async function getWeb3 () {
  let provider
  if (typeof window.ethereum === undefined) {
    provider = new Web3.provider.WebsocketProvider('wws://mainnet.infura.io/ws/v3/80efc64952264763bcd9a294113d7450')
  } else {
    await window.ethereum.enable()
    provider = window.web3.currentProvider
  }
  return new Web3(provider)
}


window.onload = () => {
  window.app = new App()
}
