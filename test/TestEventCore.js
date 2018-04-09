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

    async function createEvent(accountIdx, wMin, wMax, lMin, lMax, polls, joinFee) {
        //Should allow the appropriate creation check:
        var canCreate = await coreInstance.canCreateEvent.call(5);
        //assert.isTrue(canCreate,"canCreateEvent() returned false for accountIDX:"+accountIdx+" with wMax:"+wMax+"!");
        //Let's now actually create the event
        var eventEmitted = false;
        var eventFee = await coreInstance.getNewEventFee.call(5,10);
        var eventID = null;
        txResult = await coreInstance.newEvent(wMin,wMax,lMin,lMax,lMin,lMax,polls,web3.toWei(joinFee,"finney"),{from:web3.eth.accounts[accountIdx],value:eventFee.valueOf()});
        for(var i=0; i<txResult.logs.length; i++) {
            var log = txResult.logs[i];
            if(log.event == "EventCreated") {
                eventEmitted = true;
                eventID = log.args.event_id;
            }
        }
        assert.equal(eventEmitted, true, "The EventCreated Event was not detected!");
        //Now let's check if it's resulting values are correct:
        var eWarriorMin = await coreInstance.getWarriorMin.call(eventID);
        var eWarriorMax = await coreInstance.getWarriorMax.call(eventID);
        var eMinLevel = await coreInstance.getMinLevel.call(eventID);
        var eMaxLevel = await coreInstance.getMaxLevel.call(eventID);
        var eMinEquipLevel = await coreInstance.getMinEquipLevel.call(eventID);
        var eMaxEquipLevel = await coreInstance.getMaxEquipLevel.call(eventID);
        var eMaxPolls = await coreInstance.getMaxPolls.call(eventID);
        var eJoinFee = await coreInstance.getJoinFee.call(eventID);
        assert.equal(eWarriorMin,wMin,"The new event had the wrong minimum warrior count!");
        assert.equal(eWarriorMax,wMax,"The new event had the wrong maximum warrior count!");
        assert.equal(eMinLevel,lMin,"The new event had the wrong minimum level!");
        assert.equal(eMaxLevel,lMax,"The new event had the wrong maximum level!");
        assert.equal(eMinEquipLevel,lMin,"The new event had the wrong minimum equipment level!");
        assert.equal(eMaxEquipLevel,lMax,"The new event had the wrong maximum equipment level!");
        assert.equal(eMaxPolls,polls,"The new event had the wrong maximum poll count!");
        assert.equal(eJoinFee,web3.toWei(joinFee,"finney"),"The new event had the wrong Join Fee!");
        //Finally assuming all is good, return the resulting event fee to calling test:
        return eventID;
    };
    
    async function createWarrior(accountIdx, name, color, armor, shield, weapon) {
        var warriorFee = await wCoreInstance.getWarriorCost.call();
        var txResult = await wCoreInstance.newWarrior(web3.eth.accounts[accountIdx],color,armor,shield,weapon,{from:web3.eth.accounts[accountIdx],value:warriorFee});
        var eventFound = false;
        var warriorID = null;
        var gasUsed = txResult.receipt.cumulativeGasUsed;
        for(var i=0; i<txResult.logs.length; i++) {
            var log = txResult.logs[i];
            if(log.event=="WarriorCreated"){
                eventFound = true;
                warriorID = log.args.warrior;
                warriorCount = await wCoreInstance.getGlobalWarriorCount.call();
            }
        }
        await wCoreInstance.setName(warriorID,name,{from:web3.eth.accounts[accountIdx]});
        assert.isTrue(eventFound,"The Warrior Created Event was Not Emitted!");
        return warriorID;
    };

    async function warriorJoinEvent(accountIdx, eventID, warriorID) {
        var warriorBalance = await wCoreInstance.getBalance.call(warriorID);
        var joinFee = await coreInstance.getJoinFee.call(eventID);
        var oldParticipantCount = await coreInstance.getParticipantCount.call(eventID);
        assert.isAbove(warriorBalance,joinFee,"The Warrior ID:"+warriorID+" Can't Afford To Join Event ID:"+eventID+"!");
        await wCoreInstance.joinEvent(warriorID,eventID,{from:web3.eth.accounts[accountIdx]});
        var newParticipantCount = await coreInstance.getParticipantCount.call(eventID);
        assert.isAbove(newParticipantCount,oldParticipantCount,"Event ID:"+eventID+" Participant Count did not increase as expected for warrior ID:"+warriorID+"!");
    };

    async function startEvent(accountIdxA, eventID) {
        var canStart = await coreInstance.canStart.call(eventID);
        assert.isTrue(canStart,"The Event canStart() for event ID:"+eventID+" check failed!");
        var txResult = await coreInstance.start(eventID,{from:web3.eth.accounts[accountIdxA]});
        var gasUsed = txResult.receipt.cumulativeGasUsed;
        var eventFound = false;
        var startedEventID = 0;
        for(var i=0; i<txResult.logs.length; i++) {
            var log = txResult.logs[i];
            if(log.event=="EventStarted"){
                eventFound = true;
                startedEventID = log.args.event_id;
            }
        }
        assert.isTrue(eventFound.valueOf(),"The Event Started Event was not emitted for event ID:"+eventID+"!");
        assert.equal(startedEventID.valueOf(),eventID,"The event that started had the wrong ID!");
        var newState = await coreInstance.getState.call(eventID);
        assert.equal(newState.valueOf(),1,"The Event State of event ID:"+eventID+" did not update to Active as expected!");
        var firstParticipant = await coreInstance.getParticipant.call(eventID,0);
        var secondParticipant = await coreInstance.getParticipant.call(eventID,1);
        var firstState = await wCoreInstance.getState.call(firstParticipant);
        var secondState = await wCoreInstance.getState.call(secondParticipant);
        assert.equal(firstState.valueOf(),5,"The first warrior ID:"+firstParticipant+" didn't enter Battling state as expected due to event ID:"+eventID+" starting!");
        assert.equal(secondState.valueOf(),5,"The second warrior ID:"+secondParticipant+" didn't enter Battling state as expected due to event ID:"+eventID+" starting!");
    };

    async function runEventToCompletion(accountIdxA, accountIdxB, eventID) {
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
        var maxPolls = (await coreInstance.getMaxPolls.call(eventID)).valueOf();
        var pollBalance = web3.eth.getBalance(web3.eth.accounts[accountIdxA]);
        while(!EventFinished){
            waitSeconds(30);
            if(polls%2==1){
                txResult = await coreInstance.poll(eventID,{from:web3.eth.accounts[accountIdxA],gasPrice:pollGasPrice});
            }else{
                txResult = await coreInstance.poll(eventID,{from:web3.eth.accounts[accountIdxB],gasPrice:pollGasPrice});
            }
            gasUsed = txResult.receipt.cumulativeGasUsed;
            polls++;
            assert.isBelow(polls,maxPolls+1,"Polls for Event ID:"+eventID+" exceeded the maximum poll count!");
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
        assert.isTrue(EventFinished.valueOf(),"The event ID:"+eventID+" did not finish!");
        if(defeatOccurred){
            var killedState = await wCoreInstance.getState(killedID);
            var killerBalance = await wCoreInstance.getBalance(killerID);
            var killerXP = await wCoreInstance.getXP(killerID);
            assert.equal(killedState.valueOf(),6,"The defeated warrior in event ID:"+eventID+" did not update to Incapacitated State as expected!");
            assert.isAbove(killerBalance.valueOf(),warriorStartingBalance.valueOf(),"The killer's balance didn't increase in event ID:"+eventID+"!");
            assert.isAbove(killerXP.valueOf(),0,"The killer didn't earn any XP for some reason in event ID:"+eventID+"!");
        }
        var pollBalanceNew = web3.eth.getBalance(web3.eth.accounts[accountIdxA]);
        assert.isAtLeast(pollBalanceNew.valueOf(),pollBalance.valueOf(),"It was not profitable for the first poller of event ID:"+eventID+"!");
        assert.isBelow(avgGas.valueOf(),4000000,"Too much average gas per poll for event ID:"+eventID+" (>4M or > 50% of block limit)!");
    };

    before(async () => {
        coreInstance = await EventCore.deployed();
        wCoreInstance = await WarriorCore.deployed();
        assert.isNotNull(coreInstance,"Event Core Instance was Null!");
        assert.isNotNull(wCoreInstance,"Warrior Core Instance was Null!");
    });

    it("Should start with zero events", async () => {
        var roundCount = await coreInstance.getEventCount.call();
        assert.equal(roundCount, 0, "The EventCore did not start with 0 rounds!");
    });

    it("Should allow for reasonable event creation fee", async () => {
        var eventFee = await coreInstance.getNewEventFee.call(5,10);
        assert.isBelow(eventFee.valueOf(),web3.toWei(1500,"finney"),"The minimum cost of a new event is too high!");
    });

    it("Should allow user to create the first event", async () => {
        await createEvent(0, 2, 4, 0, 1, 4, 10);
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

    it("Should Allow 4 new warriors to Join the First Event", async () => {
        var ownerAccount = 0;
        var bob = await createWarrior(ownerAccount, "Bob", 0, 0, 0, 0);
        var steve = await createWarrior(ownerAccount, "Steve", 0, 0, 0, 0);
        var mike = await createWarrior(ownerAccount, "Mike", 0, 0, 0, 0);
        var tom = await createWarrior(ownerAccount, "Tom", 0, 0, 0, 0);
        await warriorJoinEvent(ownerAccount, 0, bob);
        await warriorJoinEvent(ownerAccount, 0, steve);
        await warriorJoinEvent(ownerAccount, 0, mike);
        await warriorJoinEvent(ownerAccount, 0, tom);
    });
  
    it("Should Allow The First Event to Start", async () => {
        await startEvent(0, 0);
    });

    it("Should Allow The Event to be Polled Repeatedly (for a reasonable amount of gas)", async () => {
        await runEventToCompletion(0, 1, 0);
    });    

    it("Should show that the owner of the first event no longer has an active event", async () => {
        var hasCurrent = await coreInstance.hasCurrentEvent.call(web3.eth.accounts[0]);
        assert.isFalse(hasCurrent,"hasCurrentEvent() returned true but the event should be over!");
    });
    
    it("Should allow the owner of the first event to create a new event", async () => {
        var canCreate = await coreInstance.canCreateEvent.call(5,{from:web3.eth.accounts[0]});
        assert.isTrue(canCreate,"canCreateEvent() returned false!");
    });
    
    it("Should allow another user to create another event after the first", async () => {
        var canCreate = await coreInstance.canCreateEvent.call(5,{from:web3.eth.accounts[1]});
        assert.isTrue(canCreate,"canCreateEvent() returned false!");
    });
    
    it("Should allow the creation of another new event, 4 warriors to join, and polling to completion with unclaimed balance.", async () => {
        var ownerAccount = 1;
        var secondEvent = await createEvent(ownerAccount, 2, 4, 0, 1, 1, 10);
        var bob = await createWarrior(ownerAccount, "Bob2", 0, 0, 0, 0);
        var steve = await createWarrior(ownerAccount, "Steve2", 0, 0, 0, 0);
        var mike = await createWarrior(ownerAccount, "Mike2", 0, 0, 0, 0);
        var tom = await createWarrior(ownerAccount, "Tom2", 0, 0, 0, 0);
        await warriorJoinEvent(ownerAccount, secondEvent, bob);
        await warriorJoinEvent(ownerAccount, secondEvent, steve);
        await warriorJoinEvent(ownerAccount, secondEvent, mike);
        await warriorJoinEvent(ownerAccount, secondEvent, tom);
        await startEvent(ownerAccount, secondEvent);
        await runEventToCompletion(ownerAccount+1, ownerAccount+2, secondEvent);
        var unclaimed = await coreInstance.getUnclaimedPool.call();
        assert.isAbove(unclaimed.valueOf(),0,"Unclaimed pool didn't increase!");
    });    

    it("Should allow the creation of a third event (which should receive some unclaimed pool)", async () => {
        var ownerAccount = 0;
        var eventFee = await coreInstance.getNewEventFee.call(4,1);
        var thirdEvent = await createEvent(ownerAccount, 2, 4, 0, 1, 1, 10);
        var eventBalance = await coreInstance.getBalance.call(thirdEvent);
        var eventFeeFinney = parseFloat(web3.fromWei(eventFee,"finney"));
        var eventBalanceFinney = parseFloat(web3.fromWei(eventBalance,"finney"));
        assert.isAbove(eventBalanceFinney,eventFeeFinney,"The event did not have the extra boosted prize pool as expected!");
    });

    it("Should not allow the previous user to create another event with a still active event", async () => {
        var canCreate = await coreInstance.canCreateEvent.call(2);
        assert.isFalse(canCreate,"canCreateEvent() returned true!");
    });

    it("Should allow the creation/joining and running of a 4th event (stress testing event creation system)", async () => {
        var ownerAccount = 1;
        var idx = 4;
        var stressEvent = await createEvent(ownerAccount, 2, 4, 0, 1, 5, 10);
        var bob = await createWarrior(ownerAccount, "StressedBob"+idx, 0, 0, 0, 1);
        var steve = await createWarrior(ownerAccount, "StressedSteve"+idx, 0, 0, 1, 2);
        var mike = await createWarrior(ownerAccount, "StressedMike"+idx, 0, 0, 1, 3);
        var tom = await createWarrior(ownerAccount, "StressedTom"+idx, 0, 1, 0, 4);
        await warriorJoinEvent(ownerAccount, stressEvent, bob);
        await warriorJoinEvent(ownerAccount, stressEvent, steve);
        await warriorJoinEvent(ownerAccount, stressEvent, mike);
        await warriorJoinEvent(ownerAccount, stressEvent, tom);
        await startEvent(ownerAccount, stressEvent);
        await runEventToCompletion(ownerAccount+1, ownerAccount+2, stressEvent);
    });

    it("Should allow the creation/joining and running of a 5th event (stress testing event creation system)", async () => {
        var ownerAccount = 1;
        var idx = 5;
        var stressEvent = await createEvent(ownerAccount, 2, 4, 0, 1, 5, 10);
        var bob = await createWarrior(ownerAccount, "StressedBob"+idx, 0, 0, 0, 5);
        var steve = await createWarrior(ownerAccount, "StressedSteve"+idx, 0, 0, 1, 6);
        var mike = await createWarrior(ownerAccount, "StressedMike"+idx, 0, 0, 1, 7);
        var tom = await createWarrior(ownerAccount, "StressedTom"+idx, 0, 1, 0, 8);
        await warriorJoinEvent(ownerAccount, stressEvent, bob);
        await warriorJoinEvent(ownerAccount, stressEvent, steve);
        await warriorJoinEvent(ownerAccount, stressEvent, mike);
        await warriorJoinEvent(ownerAccount, stressEvent, tom);
        await startEvent(ownerAccount, stressEvent);
        await runEventToCompletion(ownerAccount+1, ownerAccount+2, stressEvent);
    });

    it("Should allow the creation/joining and running of a 6th event (stress testing event creation system)", async () => {
        var ownerAccount = 1;
        var idx = 6;
        var stressEvent = await createEvent(ownerAccount, 2, 4, 0, 1, 5, 10);
        var bob = await createWarrior(ownerAccount, "StressedBob"+idx, 0, 0, 0, 9);
        var steve = await createWarrior(ownerAccount, "StressedSteve"+idx, 0, 2, 2, 0);
        var mike = await createWarrior(ownerAccount, "StressedMike"+idx, 0, 2, 2, 1);
        var tom = await createWarrior(ownerAccount, "StressedTom"+idx, 0, 2, 0, 2);
        await warriorJoinEvent(ownerAccount, stressEvent, bob);
        await warriorJoinEvent(ownerAccount, stressEvent, steve);
        await warriorJoinEvent(ownerAccount, stressEvent, mike);
        await warriorJoinEvent(ownerAccount, stressEvent, tom);
        await startEvent(ownerAccount, stressEvent);
        await runEventToCompletion(ownerAccount+1, ownerAccount+2, stressEvent);
    });

    it("Should allow the creation/joining and running of a 7th event (stress testing event creation system)", async () => {
        var ownerAccount = 2;
        var idx = 7;
        var stressEvent = await createEvent(ownerAccount, 2, 4, 0, 1, 5, 10);
        var bob = await createWarrior(ownerAccount, "StressedBob"+idx, 0, 1, 1, 1);
        var steve = await createWarrior(ownerAccount, "StressedSteve"+idx, 0, 1, 1, 2);
        var mike = await createWarrior(ownerAccount, "StressedMike"+idx, 0, 1, 1, 3);
        var tom = await createWarrior(ownerAccount, "StressedTom"+idx, 0, 1, 1, 4);
        await warriorJoinEvent(ownerAccount, stressEvent, bob);
        await warriorJoinEvent(ownerAccount, stressEvent, steve);
        await warriorJoinEvent(ownerAccount, stressEvent, mike);
        await warriorJoinEvent(ownerAccount, stressEvent, tom);
        await startEvent(ownerAccount, stressEvent);
        await runEventToCompletion(ownerAccount+1, ownerAccount+2, stressEvent);
    });

    it("Should allow the creation/joining and running of a 8th event (stress testing event creation system)", async () => {
        var ownerAccount = 2;
        var idx = 8;
        var stressEvent = await createEvent(ownerAccount, 2, 4, 0, 1, 5, 10);
        var bob = await createWarrior(ownerAccount, "StressedBob"+idx, 0, 2, 2, 1);
        var steve = await createWarrior(ownerAccount, "StressedSteve"+idx, 0, 2, 2, 2);
        var mike = await createWarrior(ownerAccount, "StressedMike"+idx, 0, 2, 2, 3);
        var tom = await createWarrior(ownerAccount, "StressedTom"+idx, 0, 2, 2, 4);
        await warriorJoinEvent(ownerAccount, stressEvent, bob);
        await warriorJoinEvent(ownerAccount, stressEvent, steve);
        await warriorJoinEvent(ownerAccount, stressEvent, mike);
        await warriorJoinEvent(ownerAccount, stressEvent, tom);
        await startEvent(ownerAccount, stressEvent);
        await runEventToCompletion(ownerAccount+1, ownerAccount+2, stressEvent);
    });

    it("Should allow the creation/joining and running of a 9th event (stress testing event creation system)", async () => {
        var ownerAccount = 2;
        var idx = 9;
        var stressEvent = await createEvent(ownerAccount, 2, 4, 0, 1, 5, 10);
        var bob = await createWarrior(ownerAccount, "StressedBob"+idx, 0, 1, 1, 6);
        var steve = await createWarrior(ownerAccount, "StressedSteve"+idx, 0, 1, 1, 7);
        var mike = await createWarrior(ownerAccount, "StressedMike"+idx, 0, 1, 1, 8);
        var tom = await createWarrior(ownerAccount, "StressedTom"+idx, 0, 1, 1, 9);
        await warriorJoinEvent(ownerAccount, stressEvent, bob);
        await warriorJoinEvent(ownerAccount, stressEvent, steve);
        await warriorJoinEvent(ownerAccount, stressEvent, mike);
        await warriorJoinEvent(ownerAccount, stressEvent, tom);
        await startEvent(ownerAccount, stressEvent);
        await runEventToCompletion(ownerAccount+1, ownerAccount+2, stressEvent);
    });

    it("Should allow the creation/joining and running of a 10th event (stress testing event creation system)", async () => {
        var ownerAccount = 2;
        var idx = 10;
        var stressEvent = await createEvent(ownerAccount, 2, 4, 0, 1, 5, 10);
        var bob = await createWarrior(ownerAccount, "StressedBob"+idx, 0, 1, 2, 9);
        var steve = await createWarrior(ownerAccount, "StressedSteve"+idx, 0, 2, 1, 1);
        var mike = await createWarrior(ownerAccount, "StressedMike"+idx, 0, 1, 2, 2);
        var tom = await createWarrior(ownerAccount, "StressedTom"+idx, 0, 2, 1, 5);
        await warriorJoinEvent(ownerAccount, stressEvent, bob);
        await warriorJoinEvent(ownerAccount, stressEvent, steve);
        await warriorJoinEvent(ownerAccount, stressEvent, mike);
        await warriorJoinEvent(ownerAccount, stressEvent, tom);
        await startEvent(ownerAccount, stressEvent);
        await runEventToCompletion(ownerAccount+1, ownerAccount+2, stressEvent);
    });

});
