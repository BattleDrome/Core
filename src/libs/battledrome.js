class BattleDrome {
    constructor(chaindata, dataUpdateCallback, logEventCallback) {
        this.chaindata = chaindata
        this.logEventCallback = logEventCallback
        this.dataUpdateCallback = dataUpdateCallback
        this.cachedData = {
            warriors: new Map(),
            events: new Map(),
            ads: new Map()
        }
        this.cosmetics = {
            gender: { index: 0, max: 1 },
            skintone: { index: 1, max: 3 },
            eyes: { index: 2, max: 5 },
            nose: { index: 3, max: 5 },
            mouth: { index: 4, max: 5 },
            hair: { index: 5, max: 5 }
        }
        this.weaponStrings = new Map([
            [0, "Sword"],
            [1, "Falchion"],
            [2, "Broadsword"],
            [3, "Axe"],
            [4, "Mace"],
            [5, "Hammer"],
            [6, "Flail"],
            [7, "Trident"],
            [8, "Halberd"],
            [9, "Spear"]
        ])
        this.armorStrings = new Map([
            [0, "Minimal"],
            [1, "Light"],
            [2, "Medium"],
            [3, "Heavy"]
        ])
        this.shieldStrings = new Map([
            [0, "None"],
            [1, "Light"],
            [2, "Medium"],
            [3, "Heavy"]
        ])
        this.warriorStateStrings = new Map([
            [0, "Idle"],
            [1, "Practicing"],
            [2, "Training"],
            [3, "Teaching"],
            [4, "BattlePending"],
            [5, "Battling"],
            [6, "Incapacitated"],
            [7, "Retired"],
            [8, "ForSale"]
        ])
        this.warriorStateTypeStrings = new Map([
            [0, "primary"],
            [1, "warning"],
            [2, "warning"],
            [3, "warning"],
            [4, "danger"],
            [5, "danger"],
            [6, "dark"],
            [7, "light"],
            [8, "info"]
        ])
        this.eventStateStrings = new Map([
            [0, "New"],
            [1, "Active"],
            [2, "Finished"]
        ])
        this.eventStateTypeStrings = new Map([
            [0, "primary"],
            [1, "danger"],
            [2, "success"]
        ])
        this.battleEvents = [
            "EventStarted",
            "EventFinished",
            "EventWinner",
            "WarriorDefeated",
            "WarriorEngaged",
            "WarriorEscaped",
            "WarriorDrankPotion",
            "WarriorHit",
            "WarriorDodged",
            "WarriorBlocked",
            "EquipmentWorn"
        ]
        this.updateWarrior = this.updateWarrior.bind(this)
    }

    logGame(message, level = "info", timeout = 3000) {
        this.logEventCallback("Game", level, message, timeout)
    }

    logWarrior(message, level = "info", timeout = 3000) {
        this.logEventCallback("Warrior", level, message, timeout)
    }

    logEvent(message, level = "info", timeout = 3000) {
        this.logEventCallback("Event", level, message, timeout)
    }

    logWager(message, level = "info", timeout = 3000) {
        this.logEventCallback("Wager", level, message, timeout)
    }

    logSponsor(message, level = "info", timeout = 3000) {
        this.logEventCallback("Sponsorship", level, message, timeout)
    }

    log(message, level = "info", timeout = 3000) {
        this.logGame(message, level, timeout)
    }

    async init() {
        let myWarriors = await this.getWarriorList(await window.chaindata.getAccount())
        let marketWarriors = await this.getMarketList()
        let academyWarriors = await this.getAcademyList()
        let combinedWarriors = myWarriors.concat(marketWarriors, academyWarriors)
        let uniqueWarriors = combinedWarriors.filter((value, index, self) => self.indexOf(value) === index)
        let initialEvents = await this.getEventList(20)
        let myAds = await this.getAdList(await window.chaindata.getAccount())
        for (let warriorID of uniqueWarriors) {
            this.watchWarrior(warriorID)
        }
        for (let eventID of initialEvents) {
            this.watchEvent(eventID)
        }
        for (let adID of myAds) {
            this.watchAd(adID)
        }
        this.setupNewWarriorListener()
        this.setupNewEventListener()
        this.setupNewAdListener()
    }

    async accountChange(account) {
        let myWarriors = await this.getWarriorList(account)
        for (let warriorID of myWarriors) {
            this.watchWarrior(warriorID)
        }
        let myAds = await this.getAdList(account)
        for (let adID of myAds) {
            this.watchAd(adID)
        }
    }

    updateData() {
        this.dataUpdateCallback(this.cachedData)
    }

    async searchWarrior(searchText) {
        let wc = this.chaindata.contractInstances['WarriorCore']
        let warriorCount = await wc.getGlobalWarriorCount.call()
        let nameExists = await wc.nameExists.call(searchText)
        this.logGame("Searching For: " + searchText)
        if (nameExists) {
            let foundID = (await wc.getWarriorIDByName(searchText)).toNumber();
            this.logGame("Found Warrior ID:" + foundID + " Name:" + searchText)
            this.foundWarrior(foundID)
        } else {
            let searchID = Number.parseInt(searchText, 10)
            if (Number.isNaN(searchID)) {
                this.logGame("Warrior Named:" + searchText + " Couldn't Be Found!", "danger")
            } else {
                if (searchID >= 0 && searchID < warriorCount) {
                    this.foundWarrior(searchID)
                    this.logGame("Found Warrior By ID:" + searchID)
                } else {
                    this.logGame("Sarch by Name for:" + searchText + " returned zero results, and " + searchID + " is not a valid Warrior ID!", "danger")
                }
            }
        }
    }

    foundWarrior(warriorID) {
        if (this.cachedData.warriors.has(warriorID)) {
            this.logGame("Warrior already being watched by UI!", "warning")
        } else {
            this.watchWarrior(warriorID)
        }
    }

    setupNewWarriorListener() {
        let hooks = [
            "WarriorCore.NewTrainer:warrior",
            "WarriorCore.WarriorSaleStarted:warrior"
        ]
        let callback = this.newWarriorHandler.bind(this)
        this.chaindata.watchObject("*", hooks, callback)
    }

    newWarriorHandler(warriorID) {
        this.watchWarrior(+warriorID)
    }

    setupNewEventListener() {
        let hooks = [
            "EventCore.EventCreated:event_id"
        ]
        let callback = this.newEventHandler.bind(this)
        this.chaindata.watchObject("*", hooks, callback)
    }

    newEventHandler(eventID) {
        this.watchEvent(+eventID)
    }

    setupNewAdListener() {
        let hooks = [
            "SponsorCore.NewAd:id"
        ]
        let callback = this.newAdHandler.bind(this)
        this.chaindata.watchObject("*", hooks, callback)
    }

    newAdHandler(adID) {
        this.watchAd(+adID)
    }

    async updateAd(adID) {
        this.cachedData.ads.set(+adID, await this.fetchAdData(adID))
        this.updateData()
    }

    async fetchAdData(adID) {
        let sc = this.chaindata.contractInstances['SponsorCore'];
        let adData = new Map()
        adData.set("id", +adID)
        adData.set("type", +(await sc.getType.call(adID)))
        adData.set("owner", await sc.getOwner.call(adID))
        adData.set("content", await sc.getContent.call(adID))
        adData.set("url", await sc.getURL.call(adID))
        //TODO: WTF, this is still an issue? Fix this shit...
        //At least now data loads in parallel, so these delays aren't as noticeable (don't compound)
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms))
        }
        await sleep(1000)
        return adData
    }

    watchAd(adID) {
        //console.log("Watching Warrior:" + warriorID)
        let hooks = [
            "SponsorCore.UpdateAd:id"
        ]
        let callback = this.updateAd.bind(this)
        this.chaindata.watchObject(adID, hooks, callback)
        callback(adID);
    }

    async getAdList(account) {
        let sc = window.chaindata.contractInstances['SponsorCore']
        let ads = []
        let adCount = await sc.getOwnerAdCount.call(await window.chaindata.getAccount())
        for (let i = 0; i < adCount; i++) {
            let adID = (await sc.getOwnerAdIDByIndex.call(await window.chaindata.getAccount(), i)).toNumber();
            ads.push(adID)
        }
        return ads
    }

    async createAd(adType, content, url) {
        let sc = window.chaindata.contractInstances['SponsorCore']
        let txCallback = (function (txData, txLogs) {
            this.logSponsor("Ad Creation TX Succeeded");
            for (const message of txLogs) {
                if (message.event === "NewAd") {
                    let adID = message.args.id.toNumber();
                    this.watchAd(adID);
                }
            }
        }).bind(this)
        this.logSponsor("Initiating Ad Creation");
        let account = await this.chaindata.getAccount()
        let txResult = await sc.newAd(adType, content, url, { from: account });
        this.chaindata.watchTX(txResult, txCallback);
        return txResult;
    }

    async bid(eventID, adID, amountFinney) {
        let sc = window.chaindata.contractInstances['SponsorCore']
        var bidAmount = this.chaindata.web3.utils.toWei(window.chaindata.web3.utils.toBN(amountFinney), "Finney");
        let txCallback = (function (txData, txLogs) {
            this.logSponsor("Event Sponsorship Bid Successful!");
        }).bind(this)
        this.logSponsor("Initiating Event Sponsorship Bid Request...");
        let account = await this.chaindata.getAccount()
        let txResult = await sc.bid(+eventID, +adID, { from: account, value: bidAmount });
        this.chaindata.watchTX(txResult, txCallback);
        return txResult;
    }

    async saveEvent(eventData) {
        //TODO: Finish me!
        console.log("TODO: SAVE HERE!")
    }

    async updateWarrior(warriorID) {
        //console.log("Updating Warrior:" + warriorID)
        this.cachedData.warriors.set(+warriorID, await this.fetchWarriorData(warriorID))
        this.updateData()
    }

    async fetchWarriorData(warriorID) {
        let wc = this.chaindata.contractInstances['WarriorCore'];
        let warriorData = new Map()
        warriorData.set("id", warriorID)
        warriorData.set("name", await wc.getName.call(warriorID))
        warriorData.set("owner", await wc.getOwner.call(warriorID))
        warriorData.set("balance", +this.chaindata.convertUnitFixed(await wc.getBalance.call(warriorID), "finney", 2))
        warriorData.set("teachingfee", +this.chaindata.convertUnitFixed(await wc.getTeachingFee.call(warriorID), "finney", 2))
        warriorData.set("saleprice", +this.chaindata.convertUnitFixed(await wc.getSalePrice.call(warriorID), "finney", 2))
        warriorData.set("level", +(await wc.getLevel.call(warriorID)).toNumber())
        warriorData.set("xp", +(await wc.getXP.call(warriorID)).toNumber())
        warriorData.set("str", +(await wc.getStr.call(warriorID)).toNumber())
        warriorData.set("con", +(await wc.getCon.call(warriorID)).toNumber())
        warriorData.set("dex", +(await wc.getDex.call(warriorID)).toNumber())
        warriorData.set("luck", +(await wc.getLuck.call(warriorID)).toNumber())
        warriorData.set("dominantstatvalue", +(await wc.getDominantStatValue.call(warriorID)).toNumber())
        warriorData.set("points", +(await wc.getPoints.call(warriorID)).toNumber())
        warriorData.set("armor", +(await wc.getArmor.call(warriorID)).toNumber())
        warriorData.set("weapon", +(await wc.getWeapon.call(warriorID)).toNumber())
        warriorData.set("shield", +(await wc.getShield.call(warriorID)).toNumber())
        warriorData.set("armortype", +(await wc.getArmorType.call(warriorID)).toNumber())
        warriorData.set("weapontype", +(await wc.getWeaponType.call(warriorID)).toNumber())
        warriorData.set("shieldtype", +(await wc.getShieldType.call(warriorID)).toNumber())
        warriorData.set("potions", +(await wc.getPotions.call(warriorID)).toNumber())
        warriorData.set("intpotions", +(await wc.getIntPotions.call(warriorID)).toNumber())
        warriorData.set("basehp", +(await wc.getBaseHP.call(warriorID)).toNumber())
        warriorData.set("hp", +(await wc.getHP.call(warriorID)).toNumber())
        warriorData.set("hppercent", +(warriorData.get("hp") / warriorData.get("basehp")) * 100)
        warriorData.set("xpnext", +(await wc.getXPTargetForLevel.call(warriorData.get("level"))).toNumber())
        warriorData.set("xppercent", +Math.min((warriorData.get("xp") / (await wc.getXPTargetForLevel.call(warriorData.get("level"))).toNumber() * 100), 100))
        warriorData.set("state", +(await wc.getState.call(warriorID)).toNumber())
        warriorData.set("trainingend", +(await wc.getTrainingEnd.call(warriorID)).toNumber())
        warriorData.set("color", +(await wc.getColorHue.call(warriorID)).toNumber())
        warriorData.set("gender", +(await wc.getCosmeticProperty.call(warriorID, 0)).toNumber())
        warriorData.set("weapontypestring", this.weaponStrings.get(+warriorData.get("weapontype")))
        warriorData.set("armortypestring", this.armorStrings.get(+warriorData.get("armortype")))
        warriorData.set("shieldtypestring", this.shieldStrings.get(+warriorData.get("shieldtype")))
        warriorData.set("statestring", this.warriorStateStrings.get(+warriorData.get("state")))
        warriorData.set("statetypestring", this.warriorStateTypeStrings.get(+warriorData.get("state")))
        warriorData.set("dominantstat", this.calculateWarriorDominantStat(+warriorData.get("dominantstatvalue"), +warriorData.get("str"), +warriorData.get("con"), +warriorData.get("dex")))
        //Generate Cosmetics
        Object.keys(this.cosmetics).forEach(async (key, idx) => {
            var rValue = (await wc.getCosmeticProperty.call(warriorID, this.cosmetics[key].index)).toNumber() % 10000
            warriorData.set(key, parseFloat((rValue / 10000) * this.cosmetics[key].max).toFixed(0))
        })
        //TODO: WTF, this is still an issue? Fix this shit...
        //At least now data loads in parallel, so these delays aren't as noticeable (don't compound)
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms))
        }
        await sleep(1000)
        return warriorData
    }

    calculateWarriorDominantStat(domval, str, con, dex) {
        let domStatString = ""
        if (domval === str) domStatString = "Strength"
        else if (domval === dex) domStatString = "Dexterity"
        else domStatString = "Constitution"
        return domStatString
    }

    watchWarrior(warriorID) {
        //console.log("Watching Warrior:" + warriorID)
        let hooks = [
            "WarriorCore.WarriorCreated:warrior",
            "WarriorCore.WarriorAltered:warrior",
            "WarriorCore.WarriorLevelled:warrior",
            "WarriorCore.WarriorRetired:warrior",
            "WarriorCore.WarriorRevived:warrior",
            "WarriorCore.WarriorDrankPotion:warrior",
            "WarriorCore.WarriorTraining:warrior",
            "WarriorCore.WarriorDoneTraining:warrior",
            "WarriorCore.NewTrainer:warrior",
            "WarriorCore.TrainerStopped:warrior",
            "WarriorCore.WarriorSaleStarted:warrior",
            "WarriorCore.WarriorSaleEnded:warrior",
            "WarriorCore.WarriorPurchased:warrior",
            "EventCore.WarriorJoinedEvent:warrior",
            "EventCore.WarriorDefeated:warrior",
            "EventCore.WarriorEscaped:warrior",
            "EventCore.WarriorDrankPotion:warrior",
            "EventCore.WarriorHit:warrior",
            "EventCore.WarriorDodged:warrior",
            "EventCore.WarriorBlocked:warrior",
            "EventCore.EquipmentWorn:warrior"
        ]
        let callback = this.updateWarrior.bind(this)
        this.chaindata.watchObject(warriorID, hooks, callback)
        callback(warriorID);
    }

    async updateEvent(eventID) {
        this.cachedData.events.set(+eventID, await this.fetchEventData(eventID))
        this.updateData()
    }

    async fetchEventData(eventID) {
        let ec = this.chaindata.contractInstances['EventCore'];
        let eventData = new Map()
        eventData.set("id", eventID)
        eventData.set("owner", await ec.getOwner.call(eventID))
        eventData.set("balance", +this.chaindata.convertUnitFixed(await ec.getBalance.call(eventID), "finney", 2))
        eventData.set("crewpool", +eventData.get("balance") * 0.2)
        eventData.set("prizepool", +eventData.get("balance") * 0.8)
        eventData.set("joinfee", +this.chaindata.convertUnitFixed(await ec.getJoinFee.call(eventID), "finney", 2))
        eventData.set("winner", +(await ec.getWinner.call(eventID)).toNumber())
        eventData.set("timeopen", +(await ec.getTimeOpen.call(eventID)).toNumber())
        eventData.set("timestart", +(await ec.getTimeStart.call(eventID)).toNumber())
        eventData.set("blockstart", +(await ec.getBlockStart.call(eventID)).toNumber())
        eventData.set("timefinish", +(await ec.getTimeFinish.call(eventID)).toNumber())
        eventData.set("timesincelastpoll", +(await ec.getTimeSinceLastPoll.call(eventID)).toNumber())
        eventData.set("minlevel", +(await ec.getMinLevel.call(eventID)).toNumber())
        eventData.set("maxlevel", +(await ec.getMaxLevel.call(eventID)).toNumber())
        eventData.set("minequiplevel", +(await ec.getMinEquipLevel.call(eventID)).toNumber())
        eventData.set("maxequiplevel", +(await ec.getMaxEquipLevel.call(eventID)).toNumber())
        eventData.set("maxpolls", +(await ec.getMaxPolls.call(eventID)).toNumber())
        eventData.set("warriormin", +(await ec.getWarriorMin.call(eventID)).toNumber())
        eventData.set("warriormax", +(await ec.getWarriorMax.call(eventID)).toNumber())
        eventData.set("haswinner", await ec.hasWinner.call(eventID))
        eventData.set("state", +(await ec.getState.call(eventID)).toNumber())
        eventData.set("canstart", await ec.canStart.call(eventID))
        eventData.set("cancancel", await ec.canCancel.call(eventID))
        eventData.set("statestring", this.eventStateStrings.get(+eventData.get("state")))
        eventData.set("statetypestring", this.eventStateTypeStrings.get(+eventData.get("state")))
        eventData.set("participants", await this.fetchEventParticipants(eventID))
        eventData.set("polls", await this.fetchEventPolls(eventID))
        eventData.set("logentries", await this.fetchEventLogEntries(eventID))
        eventData.set("wagers", await this.fetchEventWagers(eventID))
        eventData.set("wagerscalculated", await this.getWagersCalculated(eventID))
        eventData.set("wagerspaid", await this.getWagersPaid(eventID))
        eventData.set("cancalculate", await this.canCalculateWagerWinners(eventID))
        eventData.set("canpay", await this.canPayWagerWinners(eventID))
        eventData.set("sponsorship", await this.fetchSponsorship(eventID))
        //TODO: WTF, this is still an issue? Fix this shit...
        //At least now data loads in parallel, so these delays aren't as noticeable (don't compound)
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms))
        }
        await sleep(500)
        return eventData
    }

    async fetchEventParticipants(eventID) {
        let ec = this.chaindata.contractInstances['EventCore'];
        let participants = []
        let participantcount = +(await ec.getParticipantCount.call(eventID)).toNumber()
        for (let i = 0; i < participantcount; i++) {
            let warriorID = +(await ec.getParticipant.call(eventID, i)).toNumber()
            participants.push(await this.fetchWarriorData(warriorID))
        }
        return participants
    }

    async fetchSponsorship(eventID) {
        let sc = this.chaindata.contractInstances['SponsorCore'];
        let bids = await this.fetchEventBids(eventID);
        let winnersCalculated = await sc.winnersCalculated.call(eventID)
        let winningAds = [];
        if (winnersCalculated) {
            let winnerCount = await sc.getWinnerCount.call(eventID);
            for (let i = 0; i < winnerCount; i++) {
                let winningAdID = (await sc.getWinningAd.call(eventID, i)).toNumber();
                winningAds.push(await this.fetchAdData(winningAdID))
            }
        }
        let sponsorData = {
            winnersCalculated: winnersCalculated,
            bids: bids,
            winningAds: winningAds
        }
        return sponsorData;
    }

    async fetchEventBids(eventID) {
        let sc = this.chaindata.contractInstances['SponsorCore'];
        let bids = []
        let bidCount = +(await sc.getSponsorBidCount.call(eventID)).toNumber()
        for (let i = 0; i < bidCount; i++) {
            bids.push(await this.fetchBid(eventID, i))
        }
        return bids;
    }

    async fetchBid(eventID, bidID) {
        let sc = this.chaindata.contractInstances['SponsorCore'];
        let adID = (await sc.getSponsorBidAd.call(eventID, bidID)).toNumber();
        let bidAmountWei = await sc.getSponsorBidAmount.call(eventID, bidID);
        let bid = {
            id: bidID,
            owner: await sc.getSponsorBidOwner.call(eventID, bidID),
            amount: await window.chaindata.web3.utils.fromWei(bidAmountWei, "Finney"),
            ad: await this.fetchAdData(adID),
            won: await sc.getSponsorBidWon.call(eventID, bidID)
        }
        return bid;
    }

    async fetchEventPolls(eventID) {
        let ec = this.chaindata.contractInstances['EventCore'];
        let pollers = []
        let pollerCount = +(await ec.getPollCount.call(eventID)).toNumber()
        for (let i = 0; i < pollerCount; i++) {
            let poller = await ec.getPoller.call(eventID, i)
            pollers.push(poller)
        }
        return pollers
    }

    async fetchEventWagers(eventID) {
        let wc = this.chaindata.contractInstances['WagerCore'];
        let wagers = []
        let wagerCount = +(await wc.getWagerCount.call(eventID)).toNumber()
        for (let i = 0; i < wagerCount; i++) {
            wagers.push(await this.fetchWager(eventID, i))
        }
        return wagers
    }

    async fetchWager(eventID, wagerID) {
        let wc = this.chaindata.contractInstances['WagerCore']
        let warriorcore = this.chaindata.contractInstances['WarriorCore']
        let wagerAmountWei = await wc.getWagerAmount.call(eventID, wagerID)
        let warriorID = +(await wc.getWagerWarrior.call(eventID, wagerID)).toNumber()
        let wager = {
            id: wagerID,
            owner: await wc.getWagerOwner.call(eventID, wagerID),
            warrior: warriorID,
            warriorname: await warriorcore.getName.call(warriorID),
            amount: await window.chaindata.web3.utils.fromWei(wagerAmountWei, "Finney"),
            won: await wc.getWagerWinner.call(eventID, wagerID)
        }
        return wager;
    }

    async fetchEventLogEntries(eventID) {
        let ec = this.chaindata.contractInstances['EventCore']
        let startBlock = await ec.getBlockStart.call(eventID)
        let eventFilter = { fromBlock: startBlock, toBlock: "latest", filter: { event_id: eventID } }
        let logs = await ec.getPastEvents("allEvents", eventFilter)
        let filteredLogs = logs.filter((log) => {
            return this.battleEvents.includes(log.event) && +eventID === +log.args.event_id.toNumber()
        })
        let sortedLogs = filteredLogs.sort((a, b) => {
            return a.blockNumber - b.blockNumber || a.logIndex - b.logIndex
        })
        return sortedLogs
    }

    watchEvent(eventID) {
        let hooks = [
            "EventCore.EventCreated:event_id",
            "EventCore.EventUnclaimedBonus:event_id",
            "EventCore.EventHasUnclaimed:event_id",
            "EventCore.EventStarted:event_id",
            "EventCore.EventFinished:event_id",
            "EventCore.EventCancelled:event_id",
            "EventCore.EventPolled:event_id",
            "EventCore.EventWinner:event_id",
            "EventCore.WarriorJoinedEvent:event_id",
            "EventCore.WarriorDefeated:event_id",
            "EventCore.WarriorEngaged:event_id",
            "EventCore.WarriorEscaped:event_id",
            "EventCore.WarriorDrankPotion:event_id",
            "EventCore.WarriorHit:event_id",
            "EventCore.WarriorDodged:event_id",
            "EventCore.WarriorBlocked:event_id",
            "EventCore.EquipmentWorn:event_id",
            "WagerCore.NewWager:eventID",
            "WagerCore.AddWager:eventID",
            "WagerCore.WinnersCalculated:eventID",
            "WagerCore.PaymentTriggered:eventID",
            "SponsorCore.NewBid:eventID",
            "SponsorCore.UpdateBid:eventID"
        ]
        let callback = this.updateEvent.bind(this)
        this.chaindata.watchObject(eventID, hooks, callback)
        callback(eventID);
    }

    async createEvent(warriorMin, warriorMax, minLevel, maxLevel, minEquipLevel, maxEquipLevel, maxPolls, joinFeeFinney) {
        let ec = window.chaindata.contractInstances['EventCore']
        let eventCost = await ec.getNewEventFee.call(warriorMax, maxPolls);
        let joinFee = (await window.chaindata.web3.utils.toWei(window.chaindata.web3.utils.toBN(joinFeeFinney), "Finney")).toString();
        let txCallback = (function (txData, txLogs) {
            this.logEvent("Event Creation TX Succeeded");
            for (const message of txLogs) {
                if (message.event === "EventCreated") {
                    let eventID = message.args.event_id.toNumber();
                    this.watchEvent(eventID);
                }
            }
        }).bind(this)
        this.logEvent("Initiating Event Creation");
        let account = await this.chaindata.getAccount()
        try {
            let txResult = await ec.newEvent(warriorMin, warriorMax, minLevel, maxLevel, minEquipLevel, maxEquipLevel, maxPolls, joinFee, { from: account, value: eventCost });
            this.chaindata.watchTX(txResult, txCallback);
            return txResult;
        } catch (e) {
            this.logEvent("Error Creating Transaction!");
            console.log("Error Creating Transaction in createEvent:");
            console.error(e)
        }
    }

    async getEventList(limit) {
        let ec = window.chaindata.contractInstances['EventCore']
        let events = []
        let eventCount = await ec.getEventCount.call()
        if (eventCount > 0) {
            let maxEvent = Math.max(eventCount - 1, 0)
            let minEvent = Math.max(eventCount - limit, 0)
            for (let i = maxEvent; i >= minEvent; i--) {
                events.push(i)
            }
        }
        return events
    }

    async canJoinEvent(eventId, warriorId) {
        let ec = window.chaindata.contractInstances['EventCore']
        let canJoin = await ec.canParticipate.call(eventId, warriorId)
        return canJoin
    }

    async canCreateEvent(warriorMax) {
        let ec = window.chaindata.contractInstances['EventCore']
        let canCreate = await ec.canCreateEvent.call(warriorMax)
        return canCreate
    }

    async canPollEvent(eventId) {
        let ec = window.chaindata.contractInstances['EventCore']
        let canPoll = await ec.canPoll.call(eventId)
        return canPoll
    }

    async joinEvent(eventId, warriorId) {
        var wc = this.chaindata.contractInstances['WarriorCore'];
        var txCallback = (function (txData, txLogs) {
            this.logEvent("Warrior:" + warriorId + " Successfully Joined Event:" + eventId);
        }).bind(this);
        this.logEvent("Warrior:" + warriorId + " Requesting to Join Event:" + eventId)
        let txResult = await wc.joinEvent(warriorId, eventId, { from: window.chaindata.cachedAccount });
        this.chaindata.watchTX(txResult, txCallback);
        return txResult;
    }

    async startEvent(eventId) {
        let ec = window.chaindata.contractInstances['EventCore']
        var txCallback = (function (txData, txLogs) {
            this.logEvent("Event:" + eventId + " Started Successfully");
        }).bind(this);
        this.logEvent("Requesting Event Start for EventID:" + eventId)
        let txResult = await ec.start(eventId, { from: window.chaindata.cachedAccount });
        this.chaindata.watchTX(txResult, txCallback);
        return txResult;
    }

    async cancelEvent(eventId) {
        let ec = window.chaindata.contractInstances['EventCore']
        var txCallback = (function (txData, txLogs) {
            this.logEvent("Event:" + eventId + " Cancelled Successfully");
        }).bind(this);
        this.logEvent("Requesting Event Cancellation for EventID:" + eventId)
        let txResult = await ec.cancel(eventId, { from: window.chaindata.cachedAccount });
        this.chaindata.watchTX(txResult, txCallback);
        return txResult;
    }

    async pollEvent(eventId) {
        let ec = window.chaindata.contractInstances['EventCore']
        var pollGasPrice = this.chaindata.web3.utils.toWei(window.chaindata.web3.utils.toBN(1), "gwei");
        var pollGasLimit = 6000000;
        var txCallback = (function (txData, txLogs) {
            this.logEvent("Event:" + eventId + " Polled Successfully");
        }).bind(this);
        this.logEvent("Requesting Event Poll for EventID:" + eventId)
        let txResult = await ec.poll(eventId, { from: window.chaindata.cachedAccount, gasPrice: pollGasPrice, gasLimit: pollGasLimit });
        this.chaindata.watchTX(txResult, txCallback);
        return txResult;
    }

    async createWarrior(colorHue, armorType, shieldType, weaponType) {
        var wc = this.chaindata.contractInstances['WarriorCore'];
        var warriorCost = await wc.getWarriorCost.call();
        var txCallback = (function (txData, txLogs) {
            for (const message of txLogs) {
                if (message.event === "WarriorCreated") {
                    var warriorID = message.args.warrior.toNumber();
                    this.logWarrior("Warrior Creation TX Succeeded, New Warrior ID:" + warriorID + " has been created!");
                    this.watchWarrior(warriorID);
                }
            }
        }).bind(this);
        this.logWarrior("Initiating Warrior Creation: [Weapon: " + weaponType + " Shield:" + shieldType + " Armor:" + armorType + " Color:" + colorHue + "]");
        var account = await this.chaindata.getAccount()
        var txResult = await wc.newWarrior(account, colorHue, armorType, shieldType, weaponType, { from: account, value: warriorCost });
        this.chaindata.watchTX(txResult, txCallback);
        return txResult;
    }

    async getWarriorList(account) {
        let wc = window.chaindata.contractInstances['WarriorCore']
        let warriors = []
        let warriorCount = await wc.getWarriorCount.call(await window.chaindata.getAccount())
        for (let i = 0; i < warriorCount; i++) {
            let warrior = await wc.getWarriorID.call(await window.chaindata.getAccount(), i)
            let warriorId = warrior.toNumber()
            warriors.push(warriorId)
        }
        return warriors
    }

    async getMarketList() {
        let wc = window.chaindata.contractInstances['WarriorCore']
        let warriors = []
        let warriorCount = await wc.getWarriorMarketCount.call()
        for (let i = 0; i < warriorCount; i++) {
            let warrior = await wc.getWarriorIDFromMarket.call(i)
            let warriorId = warrior.toNumber()
            warriors.push(warriorId)
        }
        return warriors
    }

    async getAcademyList() {
        let wc = window.chaindata.contractInstances['WarriorCore']
        let warriors = []
        let warriorCount = await wc.getTrainerMarketCount.call()
        for (let i = 0; i < warriorCount; i++) {
            let warrior = await wc.getTrainerIDFromMarket.call(i)
            let warriorId = warrior.toNumber()
            warriors.push(warriorId)
        }
        return warriors
    }

    async setWarriorName(warriorId, name) {
        let wc = window.chaindata.contractInstances['WarriorCore'];
        let txCallback = (txData, txLogs) => {
            this.logWarrior("Warrior NameChange Successful for:" + warriorId + "(" + name + ")")
        }
        this.logWarrior("Requesting Warrior Name Change for WarriorID:" + warriorId + " To:" + name)
        let txResult = await wc.setName(warriorId, name, { from: window.chaindata.cachedAccount });
        window.chaindata.watchTX(txResult, txCallback);
    }

    async payWarrior(warriorId, amount) {
        let wc = window.chaindata.contractInstances['WarriorCore'];
        let txCallback = (txData, txLogs) => {
            this.logWarrior("Warrior Pay Successful for:" + warriorId + "(" + amount + " Finney)")
        }
        this.logWarrior("Requesting Warrior Pay for WarriorID:" + warriorId + " Amount:" + amount + " Finney")
        let weiAmount = await window.chaindata.web3.utils.toWei(amount, "finney")
        let txResult = await wc.payWarrior(warriorId, { value: weiAmount, from: window.chaindata.cachedAccount });
        window.chaindata.watchTX(txResult, txCallback);
    }

    async warriorStartPractice(warriorId) {
        let wc = window.chaindata.contractInstances['WarriorCore'];
        let txCallback = (txData, txLogs) => {
            this.logWarrior("Warrior ID:" + warriorId + " Successfully Started Practicing")
        }
        this.logWarrior("Requesting WarriorID:" + warriorId + " To Start Practicing")
        let txResult = await wc.practice(warriorId, { from: window.chaindata.cachedAccount });
        window.chaindata.watchTX(txResult, txCallback);
    }

    async warriorStopPractice(warriorId) {
        let wc = window.chaindata.contractInstances['WarriorCore'];
        let txCallback = (txData, txLogs) => {
            this.logWarrior("Warrior ID:" + warriorId + " Successfully Stopped Practicing")
        }
        this.logWarrior("Requesting WarriorID:" + warriorId + " To Stop Practicing")
        let txResult = await wc.stopPracticing(warriorId, { from: window.chaindata.cachedAccount });
        window.chaindata.watchTX(txResult, txCallback);
    }

    async warriorStartTeaching(warriorId, fee) {
        let wc = window.chaindata.contractInstances['WarriorCore'];
        let trainingFee = window.chaindata.web3.utils.toWei(window.chaindata.web3.utils.toBN(fee), "finney").toString();
        let txCallback = (txData, txLogs) => {
            this.logWarrior("Warrior ID:" + warriorId + " Successfully Started Teaching For Fee:" + fee + " Finney")
        }
        this.logWarrior("Requesting WarriorID:" + warriorId + " To Start Teaching For Fee:" + fee + " Finney")
        let txResult = await wc.startTeaching(warriorId, trainingFee, { from: window.chaindata.cachedAccount });
        window.chaindata.watchTX(txResult, txCallback);
    }

    async warriorStopTeaching(warriorId) {
        let wc = window.chaindata.contractInstances['WarriorCore'];
        let txCallback = (txData, txLogs) => {
            this.logWarrior("Warrior ID:" + warriorId + " Successfully Stopped Teaching")
        }
        this.logWarrior("Requesting WarriorID:" + warriorId + " To Stop Teaching")
        let txResult = await wc.stopTeaching(warriorId, { from: window.chaindata.cachedAccount, gas: 250000 });
        window.chaindata.watchTX(txResult, txCallback);
    }

    async warriorStartSale(warriorId, salePrice) {
        let wc = window.chaindata.contractInstances['WarriorCore'];
        let weiPrice = window.chaindata.web3.utils.toWei(window.chaindata.web3.utils.toBN(salePrice), "finney").toString();
        let txCallback = (txData, txLogs) => {
            this.logWarrior("Warrior ID:" + warriorId + " Successfully Listed Warrior For Sale in Marketplace for Price:" + salePrice + " Finney")
        }
        this.logWarrior("Requesting WarriorID:" + warriorId + " Sale Listing in Marketplace for Price:" + salePrice + " Finney")
        let txResult = await wc.startSale(warriorId, weiPrice, { from: window.chaindata.cachedAccount });
        window.chaindata.watchTX(txResult, txCallback);
    }

    async warriorEndSale(warriorId) {
        let wc = window.chaindata.contractInstances['WarriorCore'];
        let txCallback = (txData, txLogs) => {
            this.logWarrior("Warrior ID:" + warriorId + " Successfully Removed Sale Listing from Marketplace")
        }
        this.logWarrior("Requesting WarriorID:" + warriorId + " To be Delisted from Marketplace")
        let txResult = await wc.endSale(warriorId, { from: window.chaindata.cachedAccount, gas: 250000 });
        window.chaindata.watchTX(txResult, txCallback);
    }

    async canTrainWith(warriorId, trainerId) {
        let wc = window.chaindata.contractInstances['WarriorCore'];
        let canTrain = await wc.canTrainWith.call(warriorId, trainerId);
        return canTrain;
    }

    async warriorTrainWith(warriorId, trainerId) {
        let wc = window.chaindata.contractInstances['WarriorCore'];
        let txCallback = (txData, txLogs) => {
            this.logWarrior("Warrior ID:" + warriorId + " Successfully started training with Trainer:" + trainerId)
        }
        this.logWarrior("Requesting Training for WarriorID:" + warriorId + " With Trainer:" + trainerId)
        let txResult = await wc.trainWith(warriorId, trainerId, { from: window.chaindata.cachedAccount });
        window.chaindata.watchTX(txResult, txCallback);
    }

    async warriorStopTraining(warriorId) {
        let wc = window.chaindata.contractInstances['WarriorCore'];
        let txCallback = (txData, txLogs) => {
            this.logWarrior("Warrior ID:" + warriorId + " Successfully completed training")
        }
        this.logWarrior("Requesting Training completion for WarriorID:" + warriorId)
        let txResult = await wc.stopTraining(warriorId, { from: window.chaindata.cachedAccount });
        window.chaindata.watchTX(txResult, txCallback);
    }

    async warriorRevive(warriorId) {
        let wc = window.chaindata.contractInstances['WarriorCore'];
        let reviveCost = await wc.getReviveCost.call(warriorId);
        let txCallback = (txData, txLogs) => {
            this.logWarrior("Warrior ID:" + warriorId + " Successfully Revived!")
        }
        this.logWarrior("Requesting Revival of WarriorID:" + warriorId)
        let txResult = await wc.revive(warriorId, { from: window.chaindata.cachedAccount, value: reviveCost });
        window.chaindata.watchTX(txResult, txCallback);
    }

    async warriorRetire(warriorId) {
        let wc = window.chaindata.contractInstances['WarriorCore'];
        let txCallback = (txData, txLogs) => {
            this.logWarrior("Warrior ID:" + warriorId + " Successfully Retired!")
        }
        this.logWarrior("Requesting Permenant Retirement of WarriorID:" + warriorId)
        let txResult = await wc.retire(warriorId, { from: window.chaindata.cachedAccount });
        window.chaindata.watchTX(txResult, txCallback);
    }

    async warriorDrinkPotion(warriorId) {
        let wc = window.chaindata.contractInstances['WarriorCore'];
        let txCallback = (txData, txLogs) => {
            this.logWarrior("Warrior ID:" + warriorId + " Successfully Drank a Potion!")
        }
        this.logWarrior("Requesting WarriorID:" + warriorId + " Drinks a Healing Potion")
        let txResult = await wc.drinkPotion(warriorId, { from: window.chaindata.cachedAccount });
        window.chaindata.watchTX(txResult, txCallback);
    }

    async warriorPurchase(warriorId) {
        let wc = window.chaindata.contractInstances['WarriorCore'];
        let purchaseCost = await wc.getSalePrice.call(warriorId);
        let txCallback = (txData, txLogs) => {
            this.logWarrior("Warrior ID:" + warriorId + " Successfully Purchased!")
        }
        this.logWarrior("Requesting Purchase of WarriorID:" + warriorId)
        let txResult = await wc.purchase(warriorId, { from: window.chaindata.cachedAccount, value: purchaseCost, gas: 250000 });
        window.chaindata.watchTX(txResult, txCallback);
    }

    async getStatCost(warriorId, strBuyVal, dexBuyVal, conBuyVal, luckBuyVal) {
        let wc = window.chaindata.contractInstances['WarriorCore']
        let statCost = (await wc.getStatsCost.call(warriorId, strBuyVal, dexBuyVal, conBuyVal, luckBuyVal)).toNumber()
        return statCost
    }

    async getEquipCost(warriorId, weaponBuyVal, shieldBuyVal, armorBuyVal, potionsBuyVal, intpotionsBuyVal) {
        let wc = window.chaindata.contractInstances['WarriorCore'];
        let equipCost = await wc.getEquipCost.call(warriorId, armorBuyVal, shieldBuyVal, weaponBuyVal, potionsBuyVal, intpotionsBuyVal)
        let equipCostFinney = await window.chaindata.web3.utils.fromWei(equipCost, "Finney")
        return equipCostFinney
    }

    async purchaseWarriorStats(warriorId, strBuyVal, conBuyVal, dexBuyVal, luckBuyVal) {
        let pointCost = await this.getStatCost(warriorId, strBuyVal, dexBuyVal, conBuyVal, luckBuyVal);
        let pointBalance = this.cachedData.warriors.get(warriorId).get("points")
        if (+pointBalance >= +pointCost) {
            if (strBuyVal > 0 || conBuyVal > 0 || dexBuyVal > 0 || luckBuyVal > 0) {
                let wc = window.chaindata.contractInstances['WarriorCore']
                let txCallback = (txData, txLogs) => {
                    this.logWarrior("Warrior Attribute Purchase Succeeded!")
                }
                this.logWarrior("Requesting Warrior Attribute Purchase (WarriorID:" + warriorId + " STR:" + strBuyVal + " DEX:" + dexBuyVal + " CON:" + conBuyVal + " LUCK:" + luckBuyVal + " COST:" + pointCost + ")")
                let txResult = await wc.buyStats(warriorId, strBuyVal, dexBuyVal, conBuyVal, luckBuyVal, { from: window.chaindata.cachedAccount })
                window.chaindata.watchTX(txResult, txCallback);
            } else {
                this.logWarrior("Warrior Attribute Purchase Request Failed! You didn't specify any attributes to buy!", "error")
            }
        } else {
            this.logWarrior("Warrior Attribute Purchase Request Failed! You have insufficient points! The requested attributes cost:" + pointCost + " points!", "error")
        }
    }

    async purchaseWarriorEquip(warriorId, weaponBuyVal, shieldBuyVal, armorBuyVal, potionsBuyVal, intpotionsBuyVal) {
        let finneyCost = await this.getEquipCost(warriorId, armorBuyVal, shieldBuyVal, weaponBuyVal, potionsBuyVal, intpotionsBuyVal);
        let weiCost = await window.chaindata.web3.utils.toWei(window.chaindata.web3.utils.toBN(finneyCost), "Finney");
        let wc = window.chaindata.contractInstances['WarriorCore']
        let txCallback = (txData, txLogs) => {
            this.logWarrior("Warrior Equipment Purchase Succeeded!")
        }
        this.logWarrior("Requesting Warrior Equipment Purchase (WarriorID:" + warriorId + " Weapon:" + weaponBuyVal + " Shield:" + shieldBuyVal + " Armor:" + armorBuyVal + " Potions:" + potionsBuyVal + " IntPotions:" + intpotionsBuyVal + " COST:" + finneyCost + " Finney)")
        let txResult = await wc.buyEquipment(warriorId, armorBuyVal, shieldBuyVal, weaponBuyVal, potionsBuyVal, intpotionsBuyVal, { value: weiCost, from: window.chaindata.cachedAccount });
        window.chaindata.watchTX(txResult, txCallback);
    }

    async wagerPresent(eventId) {
        let wc = window.chaindata.contractInstances['WagerCore'];
        let present = await wc.ownerPresent.call(eventId, await window.chaindata.getAccount());
        return present;
    }

    async getWagerIDByOwner(eventId, ownerAddress) {
        let wc = window.chaindata.contractInstances['WagerCore'];
        let wagerId = (await wc.getWagerIDByOwner.call(eventId, ownerAddress, { from: window.chaindata.cachedAccount })).toNumber();
        return wagerId;
    }

    async canWager(amountFinney, warriorId, eventId) {
        let wc = window.chaindata.contractInstances['WagerCore'];
        let amountWei = (await window.chaindata.web3.utils.toWei(window.chaindata.web3.utils.toBN(amountFinney), "Finney")).toString();
        let canWager = await wc.canWager.call(amountWei, warriorId, eventId, { from: window.chaindata.cachedAccount });
        return canWager;
    }

    async canPayWagerWinners(eventId) {
        let wc = window.chaindata.contractInstances['WagerCore'];
        let canPay = await wc.canPayWinners.call(eventId, { from: window.chaindata.cachedAccount });
        return canPay;
    }

    async canCalculateWagerWinners(eventId) {
        let wc = window.chaindata.contractInstances['WagerCore'];
        let canCalc = await wc.canCalculateWinners.call(eventId, { from: window.chaindata.cachedAccount });
        return canCalc;
    }

    async getWagersCalculated(eventId) {
        let wc = window.chaindata.contractInstances['WagerCore'];
        let calculated = await wc.winnersCalculated.call(eventId, { from: window.chaindata.cachedAccount });
        return calculated;
    }

    async getWagersPaid(eventId) {
        let wc = window.chaindata.contractInstances['WagerCore'];
        let paid = await wc.winnersPaid.call(eventId, { from: window.chaindata.cachedAccount });
        return paid;
    }

    async calculateWagerWinners(eventId) {
        let wc = window.chaindata.contractInstances['WagerCore']
        let txCallback = (txData, txLogs) => {
            this.logWager("Wager Winners Successfully Calculated!")
        }
        this.logWager("Requesting Wager Winner Calculation (EventID:" + eventId + ")")
        let txResult = await wc.calculateWinners(eventId, { from: window.chaindata.cachedAccount });
        window.chaindata.watchTX(txResult, txCallback);
    }

    async payWagerWinners(eventId) {
        let wc = window.chaindata.contractInstances['WagerCore']
        let txCallback = (txData, txLogs) => {
            this.logWager("Wager Winners Successfully Paid!")
        }
        this.logWager("Requesting Wager Winner Payment (EventID:" + eventId + ")")
        let txResult = await wc.payWinners(eventId, { from: window.chaindata.cachedAccount });
        window.chaindata.watchTX(txResult, txCallback);
    }

    async placeWager(eventId, warriorId, amountFinney) {
        let wc = window.chaindata.contractInstances['WagerCore']
        let amountWei = await window.chaindata.web3.utils.toWei(window.chaindata.web3.utils.toBN(amountFinney), "Finney");
        let txCallback = (txData, txLogs) => {
            this.logWager("Wager on EventID:" + eventId + " on WarriorID:" + warriorId + " for " + amountFinney + " Finney, Placed Successfully!")
        }
        this.logWager("Requesting Wager on EventID:" + eventId + " on WarriorID:" + warriorId + " for " + amountFinney + " Finney")
        let txResult = await wc.wager(warriorId, eventId, { value: amountWei, from: window.chaindata.cachedAccount });
        window.chaindata.watchTX(txResult, txCallback);
    }


}

export default BattleDrome
