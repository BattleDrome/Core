import Web3 from 'web3'
import TruffleContract from '@truffle/contract'

class ChainData {
    constructor(pollInterval, contractArray, logEventCallback, accountChangeCallback) {
        this.pollInterval = pollInterval
        this.lastPollTime = 0
        this.skippedPollTolerance = 20
        this.contractArray = contractArray
        this.contractPath = '../../build/contracts/'
        this.web3Provider = null
        this.ready = false
        this.accountReady = false
        this.accountList = []
        this.cachedAccount = ""
        this.latestBlock = 0
        this.pendingTX = []
        this.watchedObjects = []
        this.contracts = {}
        this.contractInstances = {}
        this.logEventCallback = logEventCallback
        this.accountChangeCallback = accountChangeCallback
        this.suspendMessages = false;
    }

    log(message, level = "info", timeout = 3000) {
        this.logEventCallback("Blockchain", level, message, timeout)
    }

    async init() {
        await this.initWeb3()
        await this.initContracts()
        this.poll()
        this.pollWatchdog()
        this.ready = true
        this.log("Blockchain Initialization Complete!")
    }

    async poll() {
        this.lastPollTime = Date.now()
        //this.log("Poll!");
        //Check for account changes:
        await this.getAccount()
        //Check for new block:
        let currentBlock = await this.web3.eth.getBlockNumber()
        if (currentBlock > this.latestBlock) {
            let blockData = await this.web3.eth.getBlock(currentBlock)
            this.latestBlock = currentBlock
            await this.newBlock(blockData)
        }
        window.setTimeout(this.poll.bind(this), this.pollInterval);
    }

    pollWatchdog() {
        let currentTime = Date.now()
        let lastPollDuration = currentTime - this.lastPollTime
        window.setTimeout(this.pollWatchdog.bind(this), this.pollInterval * 10)
        //console.log("Duration:"+lastPollDuration+" Tolerance:"+this.pollInterval*this.skippedPollTolerance)
        if (this.lastPollTime > 0 && lastPollDuration > this.pollInterval * this.skippedPollTolerance) {
            console.log("Too many blockchain polls missed. Blockchain Interface has obviously malfunctioned... Watchdog is attempting a jumpstart... Please report this error!")
            this.poll();
        }
    }

    async newBlock(blockData) {
        var blockNumber = blockData.number;
        //console.log("New Block Detected:" + blockNumber);
        //console.log("Checking Watched Objects!")
        this.checkWatchedObjects(blockNumber);
        //console.log("Checking Watched Transactions!")
        for (const tx of blockData.transactions) {
            //console.log("Checking TX: "+tx)
            await this.checkTX(tx);
        }
        //console.log("Done Checking Transactions!")
    }

    async checkWatchedObjects(blockNumber) {
        var blockEvents = await this.fetchBlockLogs(blockNumber);
        for (const idx in this.watchedObjects) {
            if (this.watchedObjects.hasOwnProperty(idx)) {
                var watch = this.watchedObjects[idx];
                var update = false;
                if (typeof watch.hooks === 'string' || watch.hooks instanceof String) {
                    update = this.handleHook(watch.hooks, blockEvents, watch.id);
                } else if ((watch.hooks !== undefined && watch.hooks !== null) && watch.hooks.constructor === Array) {
                    //We have a hooks array
                    for (const hookidx in watch.hooks) {
                        if (watch.hooks.hasOwnProperty(hookidx)) {
                            var hook = watch.hooks[hookidx];
                            if (this.handleHook(hook, blockEvents, watch.id, watch.callback)) {
                                update = true
                                break
                            }
                        }
                    }
                } else {
                    //No hooks provided, so always update on every block
                    update = true;
                }
                if (update) {
                    if (watch.callback instanceof Function) {
                        watch.callback(watch.id);
                    }
                }
            }
        }
    }

    handleHook(hookString, blockEvents, id, callback) {
        for (const idx in blockEvents) {
            if (blockEvents.hasOwnProperty(idx)) {
                let event = blockEvents[idx];
                //console.log("Checking HookString:["+hookString+"] Against Event:")
                //console.log(event)
                if (!hookString.includes(":") && event.FQN === hookString) {
                    return true;
                }
                if (hookString.includes(":")) {
                    let [hook_fqn, hook_id_field] = hookString.split(":")
                    if (hook_fqn === event.FQN) {
                        //console.log("Event FQN Matches...")
                        let id_val = event.args.hasOwnProperty(hook_id_field) ? +event.args[hook_id_field].valueOf() : null
                        //console.log("Checking if:"+id_val+"==="+id+" -> "+(id_val===id))
                        if (id === "*") {
                            if (callback instanceof Function) {
                                callback(id_val);
                            }
                            return false
                        } else {
                            return id_val === id
                        }
                    }
                }
            }
        }
        return false;
    }

    watchObject(objectID, eventHooks, callback, deleteCallback) {
        var idVal = objectID === "*" ? objectID : +objectID
        var watch = { id: idVal, hooks: eventHooks, callback: callback, delete: deleteCallback };
        this.watchedObjects.push(watch);
    }

    stopWatch(objectID) {
        for (const watch in this.watchedObjects) {
            if (watch.id === objectID) {
                console.log("Deleting Watch:" + watch);
                //TODO: Delete and call deletion callback
            }
        }
    }

    watchTX(txData, callback) {
        this.log("TX: " + txData.tx + " Pending...", "info", 0)
        this.pendingTX[txData.tx] = callback;
    }

    async checkTX(txHash) {
        let reciept = await this.web3.eth.getTransactionReceipt(txHash)
        await this.handleTX(reciept)
    }

    async handleTX(txData) {
        var txHash = txData.transactionHash;
        var txLogs = await this.fetchTXLogs(txData);
        //Trigger callback if relevant
        //console.log("Checking for Pending TX")
        if (txHash in this.pendingTX) {
            this.log("Pending TX:" + txHash + " Completed!", "info", 0);
            this.pendingTX[txHash](txData, txLogs);
            delete this.pendingTX[txHash];
        }
    }

    async fetchBlockLogs(blockNumber) {
        //console.log("Reading Block Event Logs for Block #" + blockNumber)
        let contractInstanceEventsMapFunc = entry => {
            let contractName = entry[0]
            let contractInstance = entry[1]
            let eventFilter = {
                fromBlock: blockNumber,
                toBlock: blockNumber
            }
            //console.log("Fetching Instance Events for Block:" + blockNumber + " Contract:"+contractName)
            return [contractName, contractInstance.getPastEvents("allEvents", eventFilter)]
            /*
            return [contractName,new Promise((resolveFunction, rejectFunction) => {
                contractInstance.getPastEvents("allEvents",eventFilter,(error, logs) => {
                    if (!error) {
                        console.log("PROMISE SUCCESS")
                        resolveFunction(logs);
                    } else {
                        console.log("PROMISE ERROR")
                        rejectFunction(error);
                    }
                })
            })];
            */
        }
        let eventEnrichmentMapFunc = async (entry) => {
            let contractName = entry[0]
            let eventsData = await entry[1]
            eventsData.map(event => {
                //console.log("Enriching Event: "+event.event)
                event.contractName = contractName
                event.FQN = contractName + "." + event.event
                //console.log("Event FQN = "+event.FQN)
                return event
            })
            return eventsData
        }
        let eventAggregatorFunc = (acc, cur) => acc.concat(cur)
        //console.log("Mapping Events in Block Log Promises...")
        let contractLogPromises = Object.entries(this.contractInstances).map(contractInstanceEventsMapFunc)
        //console.log("Enriching Block Logs...")
        let contractEnrichedLogEntries = contractLogPromises.map(eventEnrichmentMapFunc)
        //console.log("Resolving Promises...")
        //console.log(contractEnrichedLogEntries)
        let resolvedLogEntries = await Promise.all(contractEnrichedLogEntries)
        //console.log("Aggregating Events...")
        let aggregatedLogEntries = resolvedLogEntries.reduce(eventAggregatorFunc)
        //console.log("Returning Block Log Results...")
        return aggregatedLogEntries
    }

    async fetchTXLogs(txData) {
        var blockNumber = txData.blockNumber;
        var txHash = txData.transactionHash;
        //console.log(txData)
        //console.log("Fetching Transaction Logs for TX:"+txHash)
        const blockEventLogs = await this.fetchBlockLogs(blockNumber);
        //console.log("Filtering TX Logs")
        var txEventLogs = blockEventLogs.filter(event => event.transactionHash === txHash)
        return txEventLogs;
    }

    async initWeb3() {
        console.log("Initializing Web3...");
        if (typeof window.ethereum !== 'undefined') {
            // Is the new EIP1102 window.ethereum injected provider present?
            this.web3Provider = window.ethereum
            await window.ethereum.enable()
            console.log("Privacy Enabled Ethereum Browser Detected");
        } else if (typeof window.web3 !== 'undefined') {
            // Is there is an injected web3 instance?
            this.web3Provider = window.web3.currentProvider;
            console.log("Legacy Web3 Browser Injection Detected! See Documentation for EIP1102 For assistance improving your privacy!");
        } else {
            // If no injected web3 instance is detected, fallback to the TestRPC
            this.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
            console.log("No injection Detected! Falling back to direct RPC Provider!");
        }
        console.log("Instantiating Web3 Instance Using Detected Provider...")
        this.web3 = new Web3(this.web3Provider);
        console.log("Web3 Instantiated!")
    }

    async getAccount() {
        this.accountList = await this.web3.eth.getAccounts()
        let newAccount = this.accountList[0]
        var oldCache = this.cachedAccount;
        if (newAccount !== undefined) {
            this.cachedAccount = newAccount;
            this.accountReady = true;
            if (newAccount !== oldCache) {
                if (oldCache !== "" && oldCache !== undefined) {
                    this.detectedAccountChange()
                } else {
                    this.log("Initial Account Detected: " + this.cachedAccount)
                }
            }
            this.suspendMessages = false;
        } else {
            if (!this.suspendMessages) {
                this.log("Account Selection Pending, or you have logged out of your browser plugin... Please see your browser plugin (ie: metamask)", "warning")
                this.suspendMessages = true;
            }
        }
        return this.cachedAccount;
    }

    detectedAccountChange() {
        this.log("New Account Selected: " + this.cachedAccount)
        this.accountChangeCallback(this.cachedAccount)
    }

    async initContracts() {
        console.log("Initializing Smart Contract Instances...");
        //Initialize Contracts Here
        console.log(this.contractArray.length + " Contracts Found...");
        for (const contractData of this.contractArray) {
            console.log("...Initializing Contract " + contractData.contractName);
            this.contracts[contractData.contractName] = TruffleContract(contractData);
            this.contracts[contractData.contractName].setProvider(this.web3Provider);
            let contractInstance = await this.contracts[contractData.contractName].deployed();
            this.contractInstances[contractData.contractName] = contractInstance
        };
    }

    convertUnitFixed(bigintVal, unit, decimals = 2) {
        let convertedBigInt = this.web3.utils.fromWei(bigintVal, unit)
        let convertedValue = convertedBigInt.valueOf()
        //let fixedValue = convertedValue.toFixed(decimals)
        //TODO: Fix this
        return convertedValue
    }
}

export default ChainData
