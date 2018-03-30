BDLib = {
    cosmetics: {
        gender: { index: 0, max: 1 },
        skintone: { index: 1, max: 3 },
        eyes: { index: 2, max: 5 },
        nose: { index: 3, max: 5 },
        mouth: { index: 4, max: 5 },
        hair: { index: 5, max: 5 }
    },
    contractDir: "./../build/contracts/",
    contractNames: ["EventCore.json", "WarriorCore.json"],
    contracts: {},
    web3Provider: null,
    ready: false,
    accountReady: false,
    cachedAccount: "",
    accountPendingAlert: null,

    init: function () {
        //Main Init Here
        BDLib.initWeb3();
        BDLib.initContracts();
        BDLib.ready = true;
    },

    initWeb3: function () {
        console.log("Initializing Web3...");
        // Is there is an injected web3 instance?
        if (typeof web3 !== 'undefined') {
            BDLib.web3Provider = web3.currentProvider;
        } else {
            // If no injected web3 instance is detected, fallback to the TestRPC
            BDLib.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
            console.log("No injection");
        }
        web3 = new Web3(BDLib.web3Provider);
        console.log("Initializing Account...");
        BDLib.initAccount();
    },

    getAccount: function () {
        var newAccount = web3.eth.defaultAccount;
        if (newAccount != undefined) {
            BDLib.accountReady = true;
            if (BDLib.cachedAccount != "" && newAccount != BDLib.cachedAccount) BDLib.detectedAccountChange();
            BDLib.cachedAccount = newAccount;
            if (BDLib.accountPendingAlert != null) {
                BD.notifySucceed(BDLib.accountPendingAlert);
                BDLib.accountPendingAlert = null;
            }
        } else {
            if (BDLib.accountPendingAlert == null) BDLib.accountPendingAlert = BD.showAccountPendingNotify();
        }
        return BDLib.cachedAccount;
    },

    detectedAccountChange: function () {
        BD.detectedAccountChange();
    },

    initAccount: function () {
        BDLib.getAccount();
        window.setTimeout(BDLib.initAccount, 1000);
    },

    initContracts: function () {
        console.log("Initializing Smart Contract Instances...");
        //Initialize Contracts Here
        $.each(BDLib.contractNames, function (index, file) {
            $.ajax({
                url: BDLib.contractDir + file,
                dataType: 'json',
                async: false,
                success: function (data) {
                    BDLib.contracts[data.contractName] = TruffleContract(data);
                    BDLib.contracts[data.contractName].setProvider(BDLib.web3Provider);
                }
            });
        });
        console.log(BDLib.contracts);
        BDLib.setupCombatLogWatch();
    },

    createWarrior: async (colorHue, armorType, shieldType, weaponType) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        console.log("Creating New Warrior");
        var warriorCost = await wc.getWarriorCost.call()
        var theNotify = BD.showCreateNotify("NewWarrior");
        var warriorEvent = wc.WarriorCreated({ creator: BDLib.getAccount() });
        warriorEvent.watch(async (error, event) => {
            if (!error) {
                console.log("WarriorCreated Event");
                //TODO Constrain this better now that name isn't checkable?
                BD.notifySucceed(theNotify);
                BD.forceRefresh();
            } else {
                console.log("WARRIOR CREATION ERROR: " + error);
            }
        });
        console.log("Firing TX");
        console.log(BDLib.getAccount());
        console.log(colorHue);
        console.log(armorType);
        console.log(shieldType);
        console.log(weaponType);
        var txResult = await wc.newWarrior(BDLib.getAccount(), colorHue, armorType, shieldType, weaponType, { value: warriorCost });
        console.log(txResult);
        return txResult;
    },

    createEvent: async (warriorMin, warriorMax, minLevel, maxLevel, minEquipLevel, maxEquipLevel, maxPolls, joinFee) => {
        var ec = await BDLib.contracts['EventCore'].deployed();
        console.log("Creating New Event");
        var eventCost = await ec.getNewEventFee.call(warriorMax, maxPolls).valueOf();
        var theNotify = BD.showCreateEventNotify(name);
        var creationEvent = ec.EventCreated({ owner: BDLib.getAccount() });
        var joinFeeFinney = await web3.toWei(joinFee, "Finney").valueOf();
        creationEvent.watch(async (error, event) => {
            if (!error) {
                console.log("EventCreated Event");
                //TODO: Make this check better... Need to align somehow to Bytes32 truncation?
                BD.notifySucceed(theNotify);
                BD.forceRefresh();
            } else {
                console.log("EVENT CREATION ERROR: " + error);
            }
        });
        //console.log("Firing Creation Event:");
        //console.log({warriorMin, warriorMax, minLevel, maxLevel, minEquipLevel, maxEquipLevel, maxPolls, joinFeeFinney, tx:{ value: eventCost }});
        var txResult = await ec.newEvent(warriorMin, warriorMax, minLevel, maxLevel, minEquipLevel, maxEquipLevel, maxPolls, joinFeeFinney, { value: eventCost });
        //console.log(txResult);
        return txResult;
    },

    setWarriorName: async (warriorId, name) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        await wc.setName(warriorId,name);
    },

    getWarriorName: async (warriorId) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        return await wc.getName.call(warriorId);
    },
    
    getWarriorState: async (warriorId) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        return (await wc.getState.call(warriorId)).valueOf();
    },

    getWarriorPotions: async (warriorId) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        return (await wc.getPotions.call(warriorId)).valueOf();
    },
    
    getWarriorDmg: async (warriorId) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        return (await wc.getDmg.call(warriorId)).valueOf();
    },

    getTrainingEnds: async (warriorId) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        return (await wc.getTrainingEnd.call(warriorId)).valueOf();
    },

    getPurchasePrice: async (warriorId) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        return (await wc.getSalePrice.call(warriorId)).valueOf();
    },

    getTrainingFee: async (warriorId) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        return (await wc.getTeachingFee.call(warriorId)).valueOf();
    },

    getTrainingTimeLeftString: async (warriorId) => {
        var trainingEnds = await BDLib.getTrainingEnds(warriorId);
        var currentTime = Math.floor(Date.now() / 1000);
        var secondsLeft = trainingEnds-currentTime;
        var minutesLeft = Math.ceil(secondsLeft/60);
        var hoursLeft = Math.ceil(minutesLeft/60);
        var daysLeft = Math.ceil(hoursLeft/24);
        if(secondsLeft<=0){
            return "Done!";
        }else if(hoursLeft>=24){
            return daysLeft+" Days";
        }else if(minutesLeft>=60){
            return hoursLeft+" Hours";
        }else{
            return minutesLeft+" Min";
        }
    },

    getEventState: async (eventId) => {
        var ec = await BDLib.contracts['EventCore'].deployed();
        return (await ec.getState.call(eventId)).valueOf();
    },

    fetchWarriorData: async (wc, warriorId) => {
        var warriorData = {
            'id': warriorId,
            'name': await wc.getName.call(warriorId),
            'owner': await wc.getOwner.call(warriorId),
            'balance': parseFloat((await web3.fromWei(await wc.getBalance.call(warriorId), "finney")).valueOf()).toFixed(2),
            'teachingfee': (await web3.fromWei(await wc.getTeachingFee.call(warriorId), "finney")).valueOf(),
            'saleprice': (await web3.fromWei(await wc.getSalePrice.call(warriorId), "finney")).valueOf(),
            'level': (await wc.getLevel.call(warriorId)).valueOf(),
            'xp': (await wc.getXP.call(warriorId)).valueOf(),
            'str': (await wc.getStr.call(warriorId)).valueOf(),
            'con': (await wc.getCon.call(warriorId)).valueOf(),
            'dex': (await wc.getDex.call(warriorId)).valueOf(),
            'luck': (await wc.getLuck.call(warriorId)).valueOf(),
            'dominantstatvalue': (await wc.getDominantStatValue.call(warriorId)).valueOf(),
            'points': (await wc.getPoints.call(warriorId)).valueOf(),
            'armor': (await wc.getArmor.call(warriorId)).valueOf(),
            'weapon': (await wc.getWeapon.call(warriorId)).valueOf(),
            'shield': (await wc.getShield.call(warriorId)).valueOf(),
            'armortype': (await wc.getArmorType.call(warriorId)).valueOf(),
            'weapontype': (await wc.getWeaponType.call(warriorId)).valueOf(),
            'shieldtype': (await wc.getShieldType.call(warriorId)).valueOf(),
            'potions': (await wc.getPotions.call(warriorId)).valueOf(),
            'intpotions': (await wc.getIntPotions.call(warriorId)).valueOf(),
            'basehp': (await wc.getBaseHP.call(warriorId)).valueOf(),
            'hp': (await wc.getHP.call(warriorId)).valueOf(),
            'hppercent': ((await wc.getHP.call(warriorId)).valueOf() / (await wc.getBaseHP.call(warriorId)).valueOf() * 100) + "%",
            'xpnext': (await wc.getXPTargetForLevel.call((await wc.getLevel.call(warriorId)).valueOf())).valueOf(),
            'xppercent': Math.min(((await wc.getXP.call(warriorId)).valueOf() / (await wc.getXPTargetForLevel.call((await wc.getLevel.call(warriorId)).valueOf())).valueOf() * 100),100) + "%",
            'state': (await wc.getState.call(warriorId)).valueOf(),
            'trainingend': (await wc.getTrainingEnd.call(warriorId)).valueOf(),
            'color': (await wc.getColorHue.call(warriorId)).valueOf(),
            'gender': (await wc.getCosmeticProperty.call(warriorId, 0)).valueOf(),
        };
        if(warriorData.name.length<=0) warriorData.name = "UNNAMED";
        warriorData = await BDLib.buildWarriorCosmetics(wc, warriorId, warriorData);
        warriorData = await BDLib.buildWarriorEnumStrings(warriorData);
        warriorData = await BDLib.calculateWarriorDominantStat(warriorData);
        warriorData = await BDLib.setToggleStrings(warriorData);

        //WTF?!?!?!
        //TODO: This is a hack to solve that the cosmetic resolutions for some reason take a while to resolve to real numbers
        //Until then they are still bigints for some reason? (Even though the function has completed).
        //400ms delay on each warrior seems to be required on testnet... Need further investigation on this timing issue...
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        };
        await sleep(400);
        return warriorData;
    },

    fetchEventData: async (ec, eventId) => {
        var eventData = {
            'id': eventId,
            'owner': await ec.getOwner.call(eventId),
            'balance': (await web3.fromWei(await ec.getBalance.call(eventId), "finney")).valueOf(),
            'joinfee': (await web3.fromWei(await ec.getJoinFee.call(eventId), "finney")).valueOf(),
            'winner': await ec.getWinner.call(eventId),
            'timeopen': (await ec.getTimeOpen.call(eventId)).valueOf(),
            'timestart': (await ec.getTimeStart.call(eventId)).valueOf(),
            'timefinish': (await ec.getTimeFinish.call(eventId)).valueOf(),
            'newduration': (await ec.getNewDuration.call(eventId)).valueOf(),
            'minlevel': (await ec.getMinLevel.call(eventId)).valueOf(),
            'maxlevel': (await ec.getMaxLevel.call(eventId)).valueOf(),
            'minequiplevel': (await ec.getMinEquipLevel.call(eventId)).valueOf(),
            'maxequiplevel': (await ec.getMaxEquipLevel.call(eventId)).valueOf(),
            'minwarriors': (await ec.getWarriorMin.call(eventId)).valueOf(),
            'maxwarriors': (await ec.getWarriorMax.call(eventId)).valueOf(),
            'haswinner': await ec.hasWinner.call(eventId),
            'state': (await ec.getState.call(eventId)).valueOf(),
            'participantcount': (await ec.getParticipantCount.call(eventId)).valueOf(),
            'pollcount': (await ec.getPollCount.call(eventId)).valueOf(),
        };
        eventData = await BDLib.buildEventDerivedValues(eventData);
        eventData = await BDLib.buildEventEnumStrings(eventData);
        //console.log(eventData);
        return eventData;
    },

    buildEventDerivedValues: async (eventData) => {
        eventData['crewpool'] = eventData['balance'] / 2;
        eventData['prizepool'] = eventData['balance'] / 2;
        eventData['canstartinhours'] = ((parseInt(eventData['timeopen']) + parseInt(eventData['newduration'])) - Date.now()) / (60 * 60);
        if (eventData['canstartinhours'] >= 0) {
            eventData['canstartstring'] = "Can Start In (approximately): " + Math.abs(eventData['canstartinhours']) + " Hours";
        } else {
            if(eventData['participantcount']>=eventData['minwarriors']){
                eventData['canstartstring'] = "Can Start Now!";
            }else{
                eventData['canstartstring'] = "Not Enough Participants Yet!";
            }
        }
        return eventData;
    },

    buildWarriorEnumStrings: async (warriorData) => {
        var id = warriorData['id'];
        switch (parseInt(warriorData.weapontype)) {
            case 0: warriorData['weapontypestring'] = "Sword"; break;
            case 1: warriorData['weapontypestring'] = "Falchion"; break;
            case 2: warriorData['weapontypestring'] = "Broadsword"; break;
            case 3: warriorData['weapontypestring'] = "Axe"; break;
            case 4: warriorData['weapontypestring'] = "Mace"; break;
            case 5: warriorData['weapontypestring'] = "Hammer"; break;
            case 6: warriorData['weapontypestring'] = "Flail"; break;
            case 7: warriorData['weapontypestring'] = "Trident"; break;
            case 8: warriorData['weapontypestring'] = "Halberd"; break;
            case 9: warriorData['weapontypestring'] = "Spear"; break;
        }
        switch (parseInt(warriorData.armortype)) {
            case 0: warriorData['armortypestring'] = "Minimal"; break;
            case 1: warriorData['armortypestring'] = "Light"; break;
            case 2: warriorData['armortypestring'] = "Medium"; break;
            case 3: warriorData['armortypestring'] = "Heavy"; break;
        }
        switch (parseInt(warriorData.shieldtype)) {
            case 0: warriorData['shieldtypestring'] = "None"; break;
            case 1: warriorData['shieldtypestring'] = "Light"; break;
            case 2: warriorData['shieldtypestring'] = "Medium"; break;
            case 3: warriorData['shieldtypestring'] = "Heavy"; break;
        }
        switch (parseInt(warriorData.state)) {
            case 0: warriorData['statestring'] = "Idle"; break;
            case 1: warriorData['statestring'] = "Practicing ("+await BDLib.getTrainingTimeLeftString(id)+")"; break;
            case 2: warriorData['statestring'] = "Training ("+await BDLib.getTrainingTimeLeftString(id)+")"; break;
            case 3: warriorData['statestring'] = "Teaching"; break;
            case 4: warriorData['statestring'] = "BattlePending"; break;
            case 5: warriorData['statestring'] = "Battling"; break;
            case 6: warriorData['statestring'] = "Incapacitated"; break;
            case 7: warriorData['statestring'] = "Retired"; break;
            case 8: warriorData['statestring'] = "ForSale"; break;
        }
        switch (parseInt(warriorData.state)) {
            case 0: warriorData['statetypestring'] = "primary"; break;
            case 1: warriorData['statetypestring'] = "warning"; break;
            case 2: warriorData['statetypestring'] = "warning"; break;
            case 3: warriorData['statetypestring'] = "warning"; break;
            case 4: warriorData['statetypestring'] = "danger"; break;
            case 5: warriorData['statetypestring'] = "danger"; break;
            case 6: warriorData['statetypestring'] = "dark"; break;
            case 7: warriorData['statetypestring'] = "light"; break;
            case 8: warriorData['statetypestring'] = "info"; break;
        }
        return warriorData;
    },

    buildEventEnumStrings: function (eventData) {
        switch (parseInt(eventData.state)) {
            case 0: eventData['statestring'] = "New"; break;
            case 1: eventData['statestring'] = "Active"; break;
            case 2: eventData['statestring'] = "Finished"; break;
        }
        switch (parseInt(eventData.state)) {
            case 0: eventData['statetypestring'] = "primary"; break;
            case 1: eventData['statetypestring'] = "danger"; break;
            case 2: eventData['statetypestring'] = "success"; break;
        }
        return eventData;
    },

    buildWarriorCosmetics: async (wc, warriorId, warriorData) => {
        Object.keys(BDLib.cosmetics).forEach(async (key, idx) => {
            var rValue = (await wc.getCosmeticProperty.call(warriorId, BDLib.cosmetics[key].index)).valueOf() % 10000;
            warriorData[key] = parseFloat((rValue / 10000) * BDLib.cosmetics[key].max).toFixed(0);
        });
        return warriorData;
    },

    calculateWarriorDominantStat: async (warriorData) => {
        var domStatString;
        if(warriorData.dominantstatvalue==warriorData.str) domStatString = "Strength";
        else if(warriorData.dominantstatvalue==warriorData.dex) domStatString = "Dexterity";
        else domStatString = "Constitution";
        warriorData['dominantstat'] = domStatString;
        return warriorData;
    },

    setToggleStrings: async (warriorData) => {
        if(warriorData.statestring.startsWith("Practicing")){
            warriorData['practicetoggle'] = "Finish Practicing";
        }else{
            warriorData['practicetoggle'] = "Start Practicing";
        }
        if(warriorData.statestring=="ForSale"){
            warriorData['saletoggle'] = "Cancel Marketplace Sale";
        }else{
            warriorData['saletoggle'] = "Sell Warrior in Marketplace";
        }
        if(warriorData.statestring=="Teaching"){
            warriorData['teachtoggle'] = "Stop Teaching";
        }else{
            warriorData['teachtoggle'] = "Teach at the Academy";
        }
        return warriorData;
    },

    getWarriorList: async () => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        var warriors = [];
        var warriorCount = await wc.getWarriorCount.call(BDLib.getAccount());
        console.log("Warrior Count: " + warriorCount);
        for (var i = 0; i < warriorCount; i++) {
            var warrior = await wc.getWarriorID.call(BDLib.getAccount(), i);
            var warriorId = warrior.valueOf();
            warriors.push(await BDLib.fetchWarriorData(wc, warriorId));
        }
        return warriors;
    },

    getEventList: async () => {
        var ec = await BDLib.contracts['EventCore'].deployed();
        var events = [];
        var eventCount = await ec.getEventCount.call();
        console.log("Event Count: " + eventCount);
        for (i = eventCount - 1; i >= eventCount - 20 && i >= 0; i--) {
            events.push(await BDLib.fetchEventData(ec, i));
        }
        return events;
    },

    getMarketList: async () => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        var warriors = [];
        var marketCount = await wc.getWarriorMarketCount.call();
        console.log("Market Count: " + marketCount);
        for (var i = marketCount-1; i >= 0; i--) {
            var warrior = await wc.getWarriorIDFromMarket.call(i);
            var warriorId = warrior.valueOf();
            warriors.push(await BDLib.fetchWarriorData(wc, warriorId));
        }
        return warriors;
    },

    getAcademyList: async () => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        var warriors = [];
        var academyCount = await wc.getTrainerMarketCount.call();
        console.log("Academy Count: " + academyCount);
        for (var i = academyCount-1; i >= 0; i--) {
            var warrior = await wc.getTrainerIDFromMarket.call(i);
            var warriorId = warrior.valueOf();
            warriors.push(await BDLib.fetchWarriorData(wc, warriorId));
        }
        return warriors;
    },

    payWarrior: async (warriorId,amount) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        var theNotify = BD.showPurchaseNotify();
        var weiAmount = web3.toWei(parseFloat(amount),"finney");
        console.log("Paying Warrior:"+weiAmount);
        var txResult = await wc.payWarrior(warriorId,{value:weiAmount});
        BD.forceRefresh();
        BD.notifySucceed(theNotify);
    },

    getStatCost: async (warriorId, strBuyVal, dexBuyVal, conBuyVal, luckBuyVal) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        var statCost = (await wc.getStatsCost.call(warriorId, strBuyVal, dexBuyVal, conBuyVal, luckBuyVal)).valueOf();
        return statCost;
    },

    purchaseStats: async (warriorId, strBuyVal, dexBuyVal, conBuyVal, luckBuyVal) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        var theNotify = BD.showPurchaseNotify();
        var txResult = await wc.buyStats(warriorId, strBuyVal, dexBuyVal, conBuyVal, luckBuyVal);
        BD.forceRefresh();
        BD.notifySucceed(theNotify);
    },

    getEquipCost: async (warriorId, armorBuyVal, shieldBuyVal, weaponBuyVal, potionsBuyVal, intpotionsBuyVal) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        var equipCost = (await wc.getEquipCost.call(warriorId, armorBuyVal, shieldBuyVal, weaponBuyVal, potionsBuyVal, intpotionsBuyVal)).valueOf();
        var equipCostFinney = (await web3.fromWei(equipCost, "Finney")).valueOf();
        return equipCostFinney;
    },

    purchaseEquip: async (warriorId, armorBuyVal, shieldBuyVal, weaponBuyVal, potionsBuyVal, intpotionsBuyVal) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        var theNotify = BD.showPurchaseNotify();
        var equipCost = (await wc.getEquipCost.call(warriorId, armorBuyVal, shieldBuyVal, weaponBuyVal, potionsBuyVal, intpotionsBuyVal)).valueOf();
        var txResult = await wc.buyEquipment(warriorId, armorBuyVal, shieldBuyVal, weaponBuyVal, potionsBuyVal, intpotionsBuyVal, { value: equipCost });
        BD.forceRefresh();
        BD.notifySucceed(theNotify);
    },

    canJoinEvent: async (eventId, warriorId) => {
        var ec = await BDLib.contracts['EventCore'].deployed();
        var canJoin = await ec.canParticipate.call(eventId, warriorId);
        return canJoin;
    },

    canStartEvent: async (eventId) => {
        var ec = await BDLib.contracts['EventCore'].deployed();
        var canStart = await ec.canStart.call(eventId);
        return canStart;
    },

    canCancelEvent: async (eventId) => {
        var ec = await BDLib.contracts['EventCore'].deployed();
        var canCancel = await ec.canCancel.call(eventId);
        return canCancel;
    },

    canCreateEvent: async (warriorMax) => {
        var ec = await BDLib.contracts['EventCore'].deployed();
        var canCreate = await ec.canCreateEvent.call(warriorMax);
        return canCreate;
    },

    canPollEvent: async (eventId) => {
        var ec = await BDLib.contracts['EventCore'].deployed();
        var canPoll = await ec.canPoll.call(eventId);
        return canPoll;
    },

    joinEvent: async (eventId, warriorId) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        var ec = await BDLib.contracts['EventCore'].deployed();
        var theNotify = BD.showJoinEventNotify(name);
        var eventJoinEvent = ec.WarriorJoinedEvent({ warrior: warriorId, event_id: eventId });
        eventJoinEvent.watch(async (error, event) => {
            if (!error) {
                console.log("WarriorJoinedEvent Event");
                BD.notifySucceed(theNotify);
                BD.forceRefresh();
            } else {
                console.log("EVENT JOIN ERROR: " + error);
            }
        });
        var txResult = await wc.joinEvent(warriorId, eventId);
        return txResult;
    },
    
    startEvent: async (eventId) => {
        var ec = await BDLib.contracts['EventCore'].deployed();
        var theNotify = BD.showStartEventNotify(name);
        var eventStartEvent = ec.EventStarted({ event_id: eventId });
        eventStartEvent.watch(async (error, event) => {
            if (!error) {
                console.log("EventStarted Event");
                BD.notifySucceed(theNotify);
                BD.forceRefresh();
            } else {
                console.log("EVENT START ERROR: " + error);
            }
        });
        var txResult = await ec.start(eventId);
        return txResult;
    },

    cancelEvent: async (eventId) => {
        var ec = await BDLib.contracts['EventCore'].deployed();
        var theNotify = BD.showCancelNotifyEvent(name);
        var eventCancelEvent = ec.EventCancelled({ event_id: eventId });
        eventCancelEvent.watch(async (error, event) => {
            if (!error) {
                console.log("EventCancelled Event");
                BD.notifySucceed(theNotify);
                BD.forceRefresh();
            } else {
                console.log("EVENT CANCEL ERROR: " + error);
            }
        });
        var txResult = await ec.cancel(eventId);
        return txResult;
    },

    pollEvent: async (eventId) => {
        var ec = await BDLib.contracts['EventCore'].deployed();
        var pollGasPrice = web3.toWei(1,"gwei");
        var pollGasLimit = 6000000;
        var txResult = await ec.poll(eventId,{gasPrice:pollGasPrice,gasLimit:pollGasLimit});
        return txResult;
    },

    setupCombatLogWatch: async () => {
        var ec = await BDLib.contracts['EventCore'].deployed();
        var event;
        event = ec.WarriorDefeated({});
        event.watch(BD.handleCombatLogEvent);
        event = ec.WarriorEngaged({});
        event.watch(BD.handleCombatLogEvent);
        event = ec.WarriorEscaped({});
        event.watch(BD.handleCombatLogEvent);
        event = ec.WarriorDrankPotion({});
        event.watch(BD.handleCombatLogEvent);
        event = ec.WarriorHit({});
        event.watch(BD.handleCombatLogEvent);
        event = ec.WarriorDodged({});
        event.watch(BD.handleCombatLogEvent);
        event = ec.WarriorBlocked({});
        event.watch(BD.handleCombatLogEvent);
        event = ec.EventFinished({});
        event.watch(BD.handleCombatLogEvent);
        event = ec.EventWinner({});
        event.watch(BD.handleCombatLogEvent);
    },

    warriorPractice: async (warriorId) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        var name = await BDLib.getWarriorName(warriorId);
        var theNotify = BD.showWarriorNotify(name,"Practice");
        var warriorEvent = wc.WarriorTraining({ warrior: warriorId });
        warriorEvent.watch(async (error, event) => {
            if (!error) {
                console.log("Warrior Event");
                BD.notifySucceed(theNotify);
                BD.forceRefresh();
            } else {
                console.log("WARRIOR EVENT ERROR: " + error);
            }
        });
        var txResult = await wc.practice(warriorId);
        return txResult;
    },

    warriorStopPracticing: async (warriorId) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        var name = await BDLib.getWarriorName(warriorId);
        var theNotify = BD.showWarriorNotify(name,"Stop Practice");
        var warriorEvent = wc.WarriorDoneTraining({ warrior: warriorId });
        warriorEvent.watch(async (error, event) => {
            if (!error) {
                console.log("Warrior Event");
                BD.notifySucceed(theNotify);
                BD.forceRefresh();
            } else {
                console.log("WARRIOR EVENT ERROR: " + error);
            }
        });
        var txResult = await wc.stopPracticing(warriorId);
        return txResult;
    },
    
    warriorStopTraining: async (warriorId) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        var name = await BDLib.getWarriorName(warriorId);
        var theNotify = BD.showWarriorNotify(name,"Stop Training");
        var warriorEvent = wc.WarriorDoneTraining({ warrior: warriorId });
        warriorEvent.watch(async (error, event) => {
            if (!error) {
                console.log("Warrior Event");
                BD.notifySucceed(theNotify);
                BD.forceRefresh();
            } else {
                console.log("WARRIOR EVENT ERROR: " + error);
            }
        });
        var txResult = await wc.stopTraining(warriorId);
        return txResult;
    },

    warriorStartTeaching: async (warriorId,fee) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        var name = await BDLib.getWarriorName(warriorId);
        var theNotify = BD.showWarriorNotify(name,"Start Teaching");
        var trainingFee = web3.toWei(parseFloat(fee),"finney");
        var warriorEvent = wc.NewTrainer({ warrior: warriorId });
        warriorEvent.watch(async (error, event) => {
            if (!error) {
                console.log("Warrior Event");
                BD.notifySucceed(theNotify);
                BD.forceRefresh();
            } else {
                console.log("WARRIOR EVENT ERROR: " + error);
            }
        });
        var txResult = await wc.startTeaching(warriorId,trainingFee);
        return txResult;
    },

    warriorStopTeaching: async (warriorId) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        var name = await BDLib.getWarriorName(warriorId);
        var theNotify = BD.showWarriorNotify(name,"Stop Teaching");
        var warriorEvent = wc.TrainerStopped({ warrior: warriorId });
        warriorEvent.watch(async (error, event) => {
            if (!error) {
                console.log("Warrior Event");
                BD.notifySucceed(theNotify);
                BD.forceRefresh();
            } else {
                console.log("WARRIOR EVENT ERROR: " + error);
            }
        });
        var txResult = await wc.stopTeaching(warriorId,{gas:250000});
        return txResult;
    },

    canTrainWith: async (warriorId, trainerId) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        var canTrain = await wc.canTrainWith.call(warriorId, trainerId);
        return canTrain;
    },

    warriorTrainWith: async (warriorId,trainerId) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        var name = await BDLib.getWarriorName(warriorId);
        var theNotify = BD.showWarriorNotify(name,"Train With Trainer");
        var warriorEvent = wc.WarriorTraining({ warrior: warriorId });
        warriorEvent.watch(async (error, event) => {
            if (!error) {
                console.log("Warrior Event");
                BD.notifySucceed(theNotify);
                BD.forceRefresh();
            } else {
                console.log("WARRIOR EVENT ERROR: " + error);
            }
        });
        var txResult = await wc.trainWith(warriorId,trainerId);
        return txResult;
    },

    warriorRevive: async (warriorId) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        var name = await BDLib.getWarriorName(warriorId);
        var reviveCost = await wc.getReviveCost.call(warriorId);
        var theNotify = BD.showWarriorNotify(name,"Revive");
        var warriorEvent = wc.WarriorRevived({ warrior: warriorId });
        warriorEvent.watch(async (error, event) => {
            if (!error) {
                console.log("Warrior Event");
                BD.notifySucceed(theNotify);
                BD.forceRefresh();
            } else {
                console.log("WARRIOR EVENT ERROR: " + error);
            }
        });
        var txResult = await wc.revive(warriorId,{value:reviveCost});
        return txResult;
    },

    warriorDrinkPotion: async (warriorId) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        var name = await BDLib.getWarriorName(warriorId);
        var theNotify = BD.showWarriorNotify(name,"Drink Potion");
        var warriorEvent = wc.WarriorDrankPotion({ warrior: warriorId });
        warriorEvent.watch(async (error, event) => {
            if (!error) {
                console.log("Warrior Event");
                BD.notifySucceed(theNotify);
                BD.forceRefresh();
            } else {
                console.log("WARRIOR EVENT ERROR: " + error);
            }
        });
        var txResult = await wc.drinkPotion(warriorId);
        return txResult;
    },

    warriorRetire: async (warriorId) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        var name = await BDLib.getWarriorName(warriorId);
        var theNotify = BD.showWarriorNotify(name,"Retire");
        var warriorEvent = wc.WarriorRetired({ warrior: warriorId });
        warriorEvent.watch(async (error, event) => {
            if (!error) {
                console.log("Warrior Event");
                BD.notifySucceed(theNotify);
                BD.forceRefresh();
            } else {
                console.log("WARRIOR EVENT ERROR: " + error);
            }
        });
        var txResult = await wc.retire(warriorId);
        return txResult;
    },

    warriorStartSale: async (warriorId,salePrice) => {
        console.log("Starting Sale, warriorId:'"+warriorId+"' salePrice:'"+salePrice+"'");
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        var name = await BDLib.getWarriorName(warriorId);
        var price = web3.toWei(parseFloat(salePrice),"finney");
        var theNotify = BD.showWarriorNotify(name,"Start Sale");
        var warriorEvent = wc.WarriorSaleStarted({ warrior: warriorId });
        warriorEvent.watch(async (error, event) => {
            if (!error) {
                console.log("Warrior Event");
                BD.notifySucceed(theNotify);
                BD.forceRefresh();
            } else {
                console.log("WARRIOR EVENT ERROR: " + error);
            }
        });
        var txResult = await wc.startSale(warriorId,price);
        return txResult;
    },

    warriorEndSale: async (warriorId) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        var name = await BDLib.getWarriorName(warriorId);
        var theNotify = BD.showWarriorNotify(name,"End Sale");
        var warriorEvent = wc.WarriorSaleEnded({ warrior: warriorId });
        warriorEvent.watch(async (error, event) => {
            if (!error) {
                console.log("Warrior Event");
                BD.notifySucceed(theNotify);
                BD.forceRefresh();
            } else {
                console.log("WARRIOR EVENT ERROR: " + error);
            }
        });
        var txResult = await wc.endSale(warriorId,{gas:250000});
        return txResult;
    },
    
    warriorPurchase: async (warriorId) => {
        var wc = await BDLib.contracts['WarriorCore'].deployed();
        var name = await BDLib.getWarriorName(warriorId);
        var purchasePrice = await BDLib.getPurchasePrice(warriorId);
        var theNotify = BD.showWarriorNotify(name,"Purchase");
        var warriorEvent = wc.WarriorPurchased({ warrior: warriorId });
        warriorEvent.watch(async (error, event) => {
            if (!error) {
                console.log("Warrior Event");
                BD.notifySucceed(theNotify);
                BD.forceRefresh();
            } else {
                console.log("WARRIOR EVENT ERROR: " + error);
            }
        });
        var txResult = await wc.purchase(warriorId,{ value: purchasePrice, gas:250000 });
        return txResult;
    },



};