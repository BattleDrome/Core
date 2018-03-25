var BattleDromeCore = artifacts.require("BattleDromeCore.sol");
var EventCore = artifacts.require("EventCore.sol");
var WarriorCore = artifacts.require("WarriorCore.sol");

const mine = () => web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", params: [], id: 0})
const getTime = () => Math.floor(Date.now() / 1000);
const increaseTime = addSeconds => web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [addSeconds], id: 0})
const doMine = targetBlock => {
    //console.log("Mining Blocks: "+web3.eth.blockNumber+"->"+targetBlock); 
    while(web3.eth.blockNumber < targetBlock) {
        mine(); 
    }
}
const waitUntilAfter = targetTime => {
    var delay = targetTime - getTime();
    increaseTime(delay*2);
    mine();
}
const waitSeconds = delaySeconds => {
    increaseTime(delaySeconds*2);
    mine();
}

contract('EventCore', function(accounts) {
    var coreInstance;
    var wCoreInstance;
    var logEvents = false;

    it("Should start with zero events", async () => {
        coreInstance = await EventCore.deployed();
        var roundCount = await coreInstance.getEventCount.call();
        assert.equal(roundCount, 0, "The EventCore did not start with 0 rounds!");
    });

    it("Should allow for reasonable event creation fee", async () => {
        var eventFee = await coreInstance.getNewEventFee.call(5,10);
        assert.isBelow(eventFee.valueOf(),web3.toWei(1001,"finney"),"The minimum cost of a new event is too high!");
    });

    it("Should allow user to create event if none exist yet", async () => {
        var canCreate = await coreInstance.canCreateEvent.call(5);
        assert.isTrue(canCreate,"canCreateEvent() returned false!");
    });
    
    it("Should allow the actual creation of a new event", async () => {
        var eventEmitted = false;
        var eventFee = await coreInstance.getNewEventFee.call(5,10);
        txResult = await coreInstance.newEvent(2,5,0,5,0,5,5,web3.toWei(1,"finney"),{value:eventFee.valueOf()});
        for(var i=0; i<txResult.logs.length; i++) {
            var log = txResult.logs[i];
            if(log.event == "EventCreated") eventEmitted = true;
        }
        assert.equal(eventEmitted, true, "The EventCreated Event was not detected!")
    });

    it("Should not allow the same user to create another event after the first", async () => {
        var canCreate = await coreInstance.canCreateEvent.call(5);
        assert.isFalse(canCreate,"canCreateEvent() returned false!");
    });

    it("New Event should have correct values", async () => {
        var eWarriorMin = await coreInstance.getWarriorMin.call(0);
        var eWarriorMax = await coreInstance.getWarriorMax.call(0);
        var eMinLevel = await coreInstance.getMinLevel.call(0);
        var eMaxLevel = await coreInstance.getMaxLevel.call(0);
        var eMinEquipLevel = await coreInstance.getMinEquipLevel.call(0);
        var eMaxEquipLevel = await coreInstance.getMaxEquipLevel.call(0);
        var eMaxPolls = await coreInstance.getMaxPolls.call(0);
        var eJoinFee = await coreInstance.getJoinFee.call(0);
        assert.equal(eWarriorMin,2,"The new event had the wrong minimum warrior count!");
        assert.equal(eWarriorMax,5,"The new event had the wrong maximum warrior count!");
        assert.equal(eMinLevel,0,"The new event had the wrong minimum level!");
        assert.equal(eMaxLevel,5,"The new event had the wrong maximum level!");
        assert.equal(eMinEquipLevel,0,"The new event had the wrong minimum equipment level!");
        assert.equal(eMaxEquipLevel,5,"The new event had the wrong maximum equipment level!");
        assert.equal(eMaxPolls,5,"The new event had the wrong maximum poll count!");
        assert.equal(eJoinFee,web3.toWei(1,"finney"),"The new event had the wrong Join Fee!");
    });

    it("New Event should have zero participants to start", async () => {
        var count = await coreInstance.getParticipantCount.call(0);
        assert.equal(count,0,"The event started off with non-zero participant count!");
    });

    it("New Event should allow participants of appropriate level", async () => {
        var result = await coreInstance.canAddParticipant.call(0,1);
        assert.equal(result,true,"The event does not allow participants of level 1!");
    });

    it("New Event should NOT allow participants of too high level", async () => {
        var result = await coreInstance.canAddParticipant.call(0,20);
        assert.equal(result,false,"The event allows participants of level 10!");
    });

    /*
    it("New Event should NOT allow participants of too low level", async () => {
        var result = await coreInstance.canAddParticipant.call(0,0);
        assert.equal(result,false,"The event allows participants of level 0!");
    });
    */
    //TODO: FIX

    it("Should Allow New Warrior to Join", async () => {
        wCoreInstance = await WarriorCore.deployed();
        var warriorFee = await wCoreInstance.getWarriorCost.call();
        var txResult = await wCoreInstance.newWarrior("Bob",web3.eth.accounts[0],0,0,0,0,{value:warriorFee});
        var eventFound = false;
        var warriorID = 0;
        var warriorCount = 0;
        var gasUsed = txResult.receipt.cumulativeGasUsed;
        for(var i=0; i<txResult.logs.length; i++) {
            var log = txResult.logs[i];
            if(log.event=="WarriorCreated"){
                eventFound = true;
                warriorID = log.args.warrior;
                warriorCount = await wCoreInstance.getGlobalWarriorCount.call();
            }
        }
        assert.isTrue(eventFound,"The Warrior Created Event was Not Emitted!");
        var warriorBalance = await wCoreInstance.getBalance.call(warriorID);
        var joinFee = await coreInstance.getJoinFee.call(0);
        assert.isAbove(warriorBalance,joinFee,"The Warrior Can't Afford To Join!");
        await wCoreInstance.joinEvent(warriorID,0);
        var newParticipantCount = await coreInstance.getParticipantCount.call(0);
        assert.equal(newParticipantCount,1,"Warrior did not successfully join the event!");
    });

    it("Should Allow A Second Warrior to Join", async () => {
        var warriorFee = await wCoreInstance.getWarriorCost.call();
        var txResult = await wCoreInstance.newWarrior("Joey",web3.eth.accounts[0],0,0,0,0,{value:warriorFee});
        var eventFound = false;
        var warriorID = 0;
        var warriorCount = 0;
        var gasUsed = txResult.receipt.cumulativeGasUsed;
        for(var i=0; i<txResult.logs.length; i++) {
            var log = txResult.logs[i];
            if(log.event=="WarriorCreated"){
                eventFound = true;
                warriorID = log.args.warrior;
                warriorCount = await wCoreInstance.getGlobalWarriorCount.call();
            }
        }
        assert.isTrue(eventFound,"The Warrior Created Event was Not Emitted!");
        var warriorBalance = await wCoreInstance.getBalance.call(warriorID);
        var joinFee = await coreInstance.getJoinFee.call(0);
        assert.isAbove(warriorBalance,joinFee,"The Warrior Can't Afford To Join!");
        await wCoreInstance.joinEvent(warriorID,0);
        var newParticipantCount = await coreInstance.getParticipantCount.call(0);
        assert.equal(newParticipantCount,2,"Warrior did not successfully join the event!");
    });

    it("Should Allow A Third Warrior to Join", async () => {
        var warriorFee = await wCoreInstance.getWarriorCost.call();
        var txResult = await wCoreInstance.newWarrior("Jimmy",web3.eth.accounts[0],0,0,0,0,{value:warriorFee});
        var eventFound = false;
        var warriorID = 0;
        var warriorCount = 0;
        var gasUsed = txResult.receipt.cumulativeGasUsed;
        for(var i=0; i<txResult.logs.length; i++) {
            var log = txResult.logs[i];
            if(log.event=="WarriorCreated"){
                eventFound = true;
                warriorID = log.args.warrior;
                warriorCount = await wCoreInstance.getGlobalWarriorCount.call();
            }
        }
        assert.isTrue(eventFound,"The Warrior Created Event was Not Emitted!");
        var warriorBalance = await wCoreInstance.getBalance.call(warriorID);
        var joinFee = await coreInstance.getJoinFee.call(0);
        assert.isAbove(warriorBalance,joinFee,"The Warrior Can't Afford To Join!");
        await wCoreInstance.joinEvent(warriorID,0);
        var newParticipantCount = await coreInstance.getParticipantCount.call(0);
        assert.equal(newParticipantCount,3,"Warrior did not successfully join the event!");
    });

    it("Should Allow A Fourth Warrior to Join", async () => {
        var warriorFee = await wCoreInstance.getWarriorCost.call();
        var txResult = await wCoreInstance.newWarrior("Steve",web3.eth.accounts[0],0,0,0,0,{value:warriorFee});
        var eventFound = false;
        var warriorID = 0;
        var warriorCount = 0;
        var gasUsed = txResult.receipt.cumulativeGasUsed;
        for(var i=0; i<txResult.logs.length; i++) {
            var log = txResult.logs[i];
            if(log.event=="WarriorCreated"){
                eventFound = true;
                warriorID = log.args.warrior;
                warriorCount = await wCoreInstance.getGlobalWarriorCount.call();
            }
        }
        assert.isTrue(eventFound,"The Warrior Created Event was Not Emitted!");
        var warriorBalance = await wCoreInstance.getBalance.call(warriorID);
        var joinFee = await coreInstance.getJoinFee.call(0);
        assert.isAbove(warriorBalance,joinFee,"The Warrior Can't Afford To Join!");
        await wCoreInstance.joinEvent(warriorID,0);
        var newParticipantCount = await coreInstance.getParticipantCount.call(0);
        assert.equal(newParticipantCount,4,"Warrior did not successfully join the event!");
    });
   
    it("Should Allow The Event to Start", async () => {
        var canStart = await coreInstance.canStart.call(0);
        assert.isTrue(canStart,"The Event canStart() check failed!");
        var txResult = await coreInstance.start(0);
        var gasUsed = txResult.receipt.cumulativeGasUsed;
        var eventFound = false;
        var eventID = 0;
        for(var i=0; i<txResult.logs.length; i++) {
            var log = txResult.logs[i];
            if(log.event=="EventStarted"){
                eventFound = true;
                eventID = log.args.event_id;
            }
        }
        assert.isTrue(eventFound.valueOf(),"The Event Started Event was not emitted!");
        assert.equal(eventID.valueOf(),0,"The event that started had the wrong ID!");
        var newState = await coreInstance.getState.call(0);
        assert.equal(newState.valueOf(),1,"The Event State did not update to Active as expected!");
        var firstParticipant = await coreInstance.getParticipant.call(0,0);
        var secondParticipant = await coreInstance.getParticipant.call(0,1);
        var firstState = await wCoreInstance.getState.call(firstParticipant);
        var secondState = await wCoreInstance.getState.call(firstParticipant);
        assert.equal(firstState.valueOf(),5,"The first warrior didn't enter Battling state as expected!");
        assert.equal(secondState.valueOf(),5,"The second warrior didn't enter Battling state as expected!");
    });

    it("Should Allow The Event to be Polled Repeatedly (for a reasonable amount of gas)", async () => {
        var EventFinished = false;
        var defeatOccurred = false;
        var winnerFound = false;
        var txResult;
        var gasUsed;
        var killedID;
        var killerID;
        var defeatLoot;
        var winnerID;
        var polls = 0;
        var totalGas = 0;
        var pollGasPrice = web3.toWei(5,"gwei");
        var warriorStartingBalance = await wCoreInstance.getWarriorCost.call();
        var pollBalance = web3.eth.getBalance(web3.eth.accounts[2]);
        while(!EventFinished){
            waitSeconds(30);
            if(polls%2==1){
                txResult = await coreInstance.poll(0,{from:web3.eth.accounts[2],gasPrice:pollGasPrice});
            }else{
                txResult = await coreInstance.poll(0,{from:web3.eth.accounts[3],gasPrice:pollGasPrice});
            }
            gasUsed = txResult.receipt.cumulativeGasUsed;
            polls++;
            totalGas+=gasUsed;
            for(var i=0; i<txResult.logs.length; i++) {
                var log = txResult.logs[i];
                if(log.event=="WarriorEngaged"){
                    var A = log.args.warriorA;
                    var B = log.args.warriorB;
                    if(logEvents) console.log(A + " and " + B + " have engaged in battle!");
                }
                if(log.event=="WarriorHit"){
                    var defender = log.args.warrior;
                    var attacker = log.args.attacker;
                    var dmg = log.args.damageDealt;
                    if(dmg>0 && logEvents) console.log(attacker + " Hit " + defender + " for " + dmg + " Damage!");
                    if(dmg<=0 && logEvents) console.log(attacker + " Hit " + defender + " but he withstood the blow!");
                }
                if(log.event=="WarriorDodged"){
                    var defender = log.args.warrior;
                    var attacker = log.args.attacker;
                    if(logEvents) console.log(defender + " Dodged " + attacker + "'s Attack!");
                }
                if(log.event=="WarriorBlocked"){
                    var defender = log.args.warrior;
                    var attacker = log.args.attacker;
                    var dmg = log.args.damageBlocked;
                    if(logEvents) console.log(defender + " Blocked " + damageBlocked + " damage from " + defender + "'s Attack!");
                }
                if(log.event=="WarriorEscaped"){
                    var defender = log.args.warrior;
                    var attacker = log.args.attacker;
                    if(logEvents) console.log(defender + " Escaped From Battle With " + attacker + "!");
                }
                if(log.event=="WarriorDrankPotion"){
                    var defender = log.args.warrior;
                    var attacker = log.args.attacker;
                    if(logEvents) console.log(defender + " was nearly killed by " + attacker + "'s attack, but drank a potion to stay alive!");
                }
                if(log.event=="WarriorDefeated"){
                    killedID = log.args.warrior;
                    killerID = log.args.attacker;
                    defeatOccurred = true;
                    if(logEvents) console.log(killerID + " Defeated " + killedID + "!");
                }
                if(log.event=="EventWinner"){
                    winnerID = log.args.warrior;
                    winnerFound = true;
                    if(logEvents) console.log(winnerID + " has been declared the Winner!");
                }
                if(log.event=="EventFinished"){
                    EventFinished = true;
                    if(logEvents) console.log("The event has completed!");
                }
            }
        }
        var avgGas = totalGas/polls;
        assert.isTrue(EventFinished.valueOf(),"Somehow, the event did not finish!");
        if(defeatOccurred){
            var killedState = await wCoreInstance.getState(killedID);
            var killerBalance = await wCoreInstance.getBalance(killerID);
            var killerXP = await wCoreInstance.getXP(killerID);
            assert.equal(killedState.valueOf(),6,"The defeated warrior did not update to Incapacitated State as expected!");
            assert.isAbove(killerBalance.valueOf(),warriorStartingBalance.valueOf(),"The killer's balance didn't increase!");
            assert.isAbove(killerXP.valueOf(),0,"The killer didn't earn any XP for some reason!");
        }
        var pollBalanceNew = web3.eth.getBalance(web3.eth.accounts[2]);
        assert.isAbove(pollBalanceNew.valueOf(),pollBalance.valueOf(),"It was not profitable for the poller!");
        assert.isBelow(avgGas.valueOf(),4000000,"Too much average gas per poll (>4M or > 50% of block limit)!");
    });    

    it("Should show that the owner of the first event no longer has an active event", async () => {
        var hasCurrent = await coreInstance.hasCurrentEvent.call(web3.eth.accounts[0]);
        assert.isFalse(hasCurrent,"hasCurrentEvent() returned true but the event should be over!");
    });
    
    it("Should allow another user to create another event after the first", async () => {
        var canCreate = await coreInstance.canCreateEvent.call(5,{from:web3.eth.accounts[5]});
        assert.isTrue(canCreate,"canCreateEvent() returned false!");
    });
    
    it("Should allow the actual creation of another new event", async () => {
        var eventEmitted = false;
        var eventFee = await coreInstance.getNewEventFee.call(5,5);
        txResult = await coreInstance.newEvent(2,5,0,5,0,5,5,web3.toWei(1,"finney"),{from:web3.eth.accounts[5],value:eventFee.valueOf()});
        for(var i=0; i<txResult.logs.length; i++) {
            var log = txResult.logs[i];
            if(log.event == "EventCreated") eventEmitted = true;
        }
        assert.equal(eventEmitted, true, "The EventCreated Event was not detected!")
    });
    
});
