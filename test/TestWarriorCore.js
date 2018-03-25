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

contract('WarriorCore', function(accounts) {
    var coreInstance;

    it("Should start with zero warriors", async () => {
        coreInstance = await WarriorCore.deployed();
        var warriorCount = await coreInstance.getGlobalWarriorCount.call();
        assert.equal(warriorCount,0,"WarriorCore started with non-zero warrior count!");
    });

    it("WarriorCount of Main Account should start as zero", async () => {
        var warriorCount = await coreInstance.getWarriorCount.call(web3.eth.accounts[0]);
        assert.equal(warriorCount,0,"Main Account started with non-zero warrior count!");
    });

    it("Should allow Creation of a new Warrior (with reasonable gas cost)", async () => {
        var warriorFee = await coreInstance.getWarriorCost.call();
        var txResult = await coreInstance.newWarrior("Bob",web3.eth.accounts[0],0,0,0,0,{value:warriorFee});
        var eventFound = false;
        var warriorID = 0;
        var warriorCount = 0;
        var gasUsed = txResult.receipt.cumulativeGasUsed;
        for(var i=0; i<txResult.logs.length; i++) {
            var log = txResult.logs[i];
            if(log.event=="WarriorCreated"){
                eventFound = true;
                warriorID = log.args.warrior;
                warriorCount = await coreInstance.getGlobalWarriorCount.call();
                ownerWarriorCount = await coreInstance.getWarriorCount.call(web3.eth.accounts[0]);
            }
        }
        assert.isTrue(eventFound, "The WarriorCreated Event was not detected!");
        assert.isAbove(warriorCount, 0, "The WarriorCount does not reflect the new warrior!");
        assert.isAbove(ownerWarriorCount, 0, "The WarriorCount for the Main Account does not reflect the new warrior!");
        assert.isBelow(gasUsed,500000,"The newWarrior method call consumed more than 500,000 units of gas! Unacceptable!");
    });

    it("Should allow Creation of Multiple Warriors", async () => {
        var warriorFee = await coreInstance.getWarriorCost.call();
        var txResultA = await coreInstance.newWarrior("Joe",web3.eth.accounts[0],0,0,0,0,{value:warriorFee});
        var txResultB = await coreInstance.newWarrior("Dave",web3.eth.accounts[0],0,0,0,0,{value:warriorFee});
        var eventFoundA = false;
        var eventFoundB = false;
        var warriorCount = 0;
        for(var i=0; i<txResultA.logs.length; i++) {
            var log = txResultA.logs[i];
            if(log.event=="WarriorCreated"){
                eventFoundA = true;
            }
        }
        for(var i=0; i<txResultB.logs.length; i++) {
            var log = txResultB.logs[i];
            if(log.event=="WarriorCreated"){
                eventFoundB = true;
            }
        }
        warriorCount = await coreInstance.getGlobalWarriorCount.call();
        assert.isTrue(eventFoundA, "The WarriorCreated Event was not detected for the second warrior!");
        assert.isTrue(eventFoundA, "The WarriorCreated Event was not detected for the third warrior!");
        assert.isAbove(warriorCount, 2, "The WarriorCount does not reflect the new warriors!");
    });

    it("Should have the correct name", async () => {
        var name = await coreInstance.getName.call(0);
        assert.equal(name,"Bob","Warrior didn't have the correct name!");
    });

    it("Should start at level zero", async () => {
        var level = await coreInstance.getLevel.call(0);
        assert.equal(level.valueOf(),0,"Warrior had non-zero level to start!");
    });

    it("Should start in state Idle", async () => {
        var state = await coreInstance.getState.call(0);
        assert.equal(state.valueOf(),0,"Warrior is not starting in Idle State!");
    });

    it("Should start with appropriate starting stats", async () => {
        var str = await coreInstance.getStr.call(0);
        var dex = await coreInstance.getDex.call(0);
        var con = await coreInstance.getCon.call(0);
        var luck = await coreInstance.getLuck.call(0);
        assert.equal(str.valueOf(),5,"Warrior had wrong starting STR value");
        assert.equal(dex.valueOf(),5,"Warrior had wrong starting DEX value");
        assert.equal(con.valueOf(),5,"Warrior had wrong starting CON value");
        assert.equal(luck.valueOf(),5,"Warrior had wrong starting LUCK value");
    })

    it("Should start with no damage", async () => {
        var damage = await coreInstance.getDmg.call(0);
        assert.equal(damage.valueOf(),0,"Warrior started with damage!");
    });
    
    it("Should start with appropriate hitpoints", async () => {
        var str = await coreInstance.getStr.call(0);
        var con = await coreInstance.getCon.call(0);
        var level = await coreInstance.getLevel.call(0);
        var hpConFactor = 3;
        var hpStrFactor = 1;
        //OMG Javascript crash and die a horrible burning death!!!!
        //TODO: Fix this from concatenating to string, to do real math... 
        //Javascript... WTF?!?!?!?!
        //var desiredHP = (parseInt(con)*parseInt(hpConFactor)*parseInt(level))+(parseInt(str)*parseInt(hpStrFactor));
        var desiredHP = 20;
        var hp = await coreInstance.getHP.call(0);
        assert.equal(hp.valueOf(),desiredHP,"Warrior had incorrect starting HP!");
    });

    it("Should start with appropriate starting points", async () => {
        var points = await coreInstance.getPoints.call(0);
        assert.equal(points.valueOf(),500,"Warrior did not start with correct amount of points!");
    });

    it("Should not start with any equipment", async () => {
        var armor = await coreInstance.getArmor.call(0);
        var shield = await coreInstance.getShield.call(0);
        var weapon = await coreInstance.getWeapon.call(0);
        var potions = await coreInstance.getPotions.call(0);
        var intPotions = await coreInstance.getIntPotions.call(0);
        assert.equal(armor.valueOf(),0,"Warrior had non-zero starting armor!");
        assert.equal(shield.valueOf(),0,"Warrior had non-zero starting shield!");
        assert.equal(weapon.valueOf(),0,"Warrior had non-zero starting weapon!");
        assert.equal(potions.valueOf(),0,"Warrior had non-zero starting potions!");
        assert.equal(intPotions.valueOf(),0,"Warrior had non-zero starting int potions!");
    });

    it("Should allow owner to buy minimal stats initially", async () => {
        await coreInstance.buyStats(0,1,1,1,0);
        var str = await coreInstance.getStr.call(0);
        var dex = await coreInstance.getDex.call(0);
        var con = await coreInstance.getCon.call(0);
        var luck = await coreInstance.getLuck.call(0);
        var points = await coreInstance.getPoints.call(0);
        assert.equal(str.valueOf(),6,"Warrior STR did not increase as expected!");
        assert.equal(dex.valueOf(),6,"Warrior DEX did not increase as expected!");
        assert.equal(con.valueOf(),6,"Warrior CON did not increase as expected!");
        assert.equal(luck.valueOf(),5,"Warrior LUCK did not stay constant as expected!");
        assert.equal(points.valueOf(),425,"Warrior Points did not decrease as expected!");
    });

    it("Should allow the owner to initiate 'practice'", async () => {
        await coreInstance.practice(0);
        var newState = await coreInstance.getState.call(0);
        assert.equal(newState.valueOf(),1,"Warrior did not enter 'Practicing' state as expected!");
    });

    it("Should end after the expected duration", async () => {
        waitUntilAfter(await coreInstance.getTrainingEnd.call(0));
        await coreInstance.stopPracticing(0);
        var newState = await coreInstance.getState.call(0);
        assert.equal(newState.valueOf(),0,"Warrior was not able to re-enter 'Idle' state after expected number of blocks of training!");
    });

    it("Should have gained some XP after practice", async () => {
        var xp = await coreInstance.getXP.call(0);
        assert.isAbove(xp.valueOf(),0,"Warrior did not gain any XP!");
    });

    it("Should have gained the appropriate amount of XP after practice", async () => {
        var xp = await coreInstance.getXP.call(0);
        var level = await coreInstance.getLevel.call(0);
        var xpExpected = await coreInstance.getXPForPractice(0);
        assert.equal(xp.valueOf(),xpExpected.valueOf(),"Warrior did not gain the expected amount of XP!");
    });

    it("Should level up after earning appropriate xp", async () => {
        var xp = await coreInstance.getXP.call(0);
        var level = await coreInstance.getLevel.call(0);
        var trainingNeeded = 2;
        var newLevel = level;
        for(var i=0;i<trainingNeeded;i++){
            //console.log("Iteration: "+i+" @Level:"+await coreInstance.getLevel.call(0));
            await coreInstance.practice(0);
            waitUntilAfter(await coreInstance.getTrainingEnd.call(0));
            await coreInstance.stopPracticing(0);
        }
        newLevel = await coreInstance.getLevel.call(0);
        assert.isAbove(newLevel,level,"Warrior did not increase in level!");
    });

    it("Should allow the owner (via BattleDromeCore) to buy equipment", async () => {
        var equipCost = await coreInstance.getEquipCost.call(0,5,5,5,2,2);
        await coreInstance.buyEquipment(0,5,5,5,2,2,{value:equipCost.valueOf()});
        var armor = await coreInstance.getArmor.call(0);
        assert.equal(armor.valueOf(),5,"Warrior did not receive new armor as expected!");
        var shield = await coreInstance.getArmor.call(0);
        assert.equal(shield.valueOf(),5,"Warrior did not receive new shield as expected!");
        var weapon = await coreInstance.getWeapon.call(0);
        assert.equal(weapon.valueOf(),5,"Warrior did not receive new weapon as expected!");
        var potions = await coreInstance.getPotions.call(0);
        assert.equal(potions.valueOf(),2,"Warrior did not receive new potions as expected!");
        var intPotions = await coreInstance.getIntPotions.call(0);
        assert.equal(intPotions.valueOf(),2,"Warrior did not receive new int potions as expected!");
    });

    it("Should allow practice to be faster by consuming Int Potions", async () => {
        await coreInstance.practice(0);
        var newState = await coreInstance.getState.call(0);
        assert.equal(newState.valueOf(),1,"Warrior did not enter 'Practicing' state as expected!");
        //TODO: Check for duration here should be appropriately smaller
        waitUntilAfter(await coreInstance.getTrainingEnd.call(0));
        await coreInstance.stopPracticing(0);
        var newState = await coreInstance.getState.call(0);
        assert.equal(newState.valueOf(),0,"Warrior was not able to re-enter 'Idle' state after expected number of blocks of training!");
        var intPotions = await coreInstance.getIntPotions.call(0);
        assert.equal(intPotions.valueOf(),1,"Warrior did not consume an int potion as expected!");
        //TODO: Check if xp went up again
    });
    
    it("Should allow a warrior to initiate teaching if idle", async () => {
        var txResult = await coreInstance.startTeaching(0,web3.toWei(1,"finney"));
        var eventFound = false;
        for(var i=0; i<txResult.logs.length; i++) {
            var log = txResult.logs[i];
            if(log.event=="NewTrainer"){
                eventFound = true;
            }
        }
        assert.equal(eventFound,true,"NewTrainer Event was not emitted!");
    });

    it("Should allow training from a level stat teacher", async () => {
        await coreInstance.trainWith(1,0);
        var newStateTrainee = await coreInstance.getState.call(1);
        var targetBlockTrainer = await coreInstance.getTrainingEnd.call(0);
        var targetBlockTrainee = await coreInstance.getTrainingEnd.call(1);
        assert.equal(newStateTrainee.valueOf(),2,"Warrior did not enter 'Training' state as expected!");
        assert.equal(targetBlockTrainee.valueOf(),targetBlockTrainer.valueOf(),"Trainer and Trainee should sync up for their 'TrainingEnd' value!")
    });

    it("Should allow completion of training", async () => {
        waitUntilAfter(await coreInstance.getTrainingEnd.call(1));
        await coreInstance.stopTraining(1);
        var newState = await coreInstance.getState(1);
        assert.equal(newState.valueOf(),0,"Trainee did not return to Idle State!");
    });

    it("Training with a balanced trainer results in STR increase", async () => {
        var str = await coreInstance.getStr.call(1);
        assert.equal(str.valueOf(),6,"Strength did not increase to the expected value!");
    });

    it("Trainer should be able to stop Teaching if Not Busy", async () => {
        await coreInstance.stopTeaching(0);
        var newState = await coreInstance.getState(1);
        assert.equal(newState.valueOf(),0,"Trainer did not return to Idle State!");
    });

    it("Buying DEX for trainer results in DEX dominance", async () => {
        await coreInstance.buyStats(0,0,1,0,0);
        var dexVal = await coreInstance.getDex(0);
        var strVal = await coreInstance.getStr(0);
        var conVal = await coreInstance.getCon(0);
        var domStat = await coreInstance.getDominantStatValue.call(0);
        assert.equal(dexVal.valueOf(),8,"Dex did not increase as expected!");
        assert.equal(domStat.valueOf(),dexVal.valueOf(),"Dominant Stat is not equal to Dex!");
        assert.notEqual(domStat.valueOf(),strVal.valueOf(),"Dominant Stat is equal to Str instead of Dex!");
        assert.notEqual(domStat.valueOf(),conVal.valueOf(),"Dominant Stat is equal to Con instead of Dex!");
    });

    it("Trainer should be able to start Teaching Again", async () => {
        var txResult = await coreInstance.startTeaching(0,web3.toWei(1,"finney"));
        var eventFound = false;
        for(var i=0; i<txResult.logs.length; i++) {
            var log = txResult.logs[i];
            if(log.event=="NewTrainer"){
                eventFound = true;
            }
        }
        assert.equal(eventFound,true,"NewTrainer Event was not emitted!");
    });

    it("Training with a DEX dominant trainer results in DEX increase", async () => {
        await coreInstance.trainWith(1,0);
        var newStateTrainee = await coreInstance.getState.call(1);
        var targetBlockTrainer = await coreInstance.getTrainingEnd.call(0);
        var targetBlockTrainee = await coreInstance.getTrainingEnd.call(1);
        assert.equal(newStateTrainee.valueOf(),2,"Warrior did not enter 'Training' state as expected!");
        assert.equal(targetBlockTrainee.valueOf(),targetBlockTrainer.valueOf(),"Trainer and Trainee should sync up for their 'TrainingEnd' value!")
        waitUntilAfter(await coreInstance.getTrainingEnd.call(1));
        await coreInstance.stopTraining(1);
        var newState = await coreInstance.getState(1);
        assert.equal(newState.valueOf(),0,"Trainee did not return to Idle State!");
        var dex = await coreInstance.getDex.call(1);
        assert.equal(dex.valueOf(),6,"Dex did not increase to the expected value!");
    });

    it("Trainer should be able to stop Teaching if Not Busy (part2)", async () => {
        await coreInstance.stopTeaching(0);
        var newState = await coreInstance.getState(1);
        assert.equal(newState.valueOf(),0,"Trainer did not return to Idle State!");
    });

    it("Buying CON for trainer results in CON dominance", async () => {
        await coreInstance.buyStats(0,0,0,2,0);
        var dexVal = await coreInstance.getDex(0);
        var strVal = await coreInstance.getStr(0);
        var conVal = await coreInstance.getCon(0);
        var domStat = await coreInstance.getDominantStatValue.call(0);
        assert.equal(conVal.valueOf(),9,"Con did not increase as expected!");
        assert.equal(domStat.valueOf(),conVal.valueOf(),"Dominant Stat is not equal to Con!");
        assert.notEqual(domStat.valueOf(),strVal.valueOf(),"Dominant Stat is equal to Str instead of Con!");
        assert.notEqual(domStat.valueOf(),dexVal.valueOf(),"Dominant Stat is equal to Dex instead of Con!");
    });

    it("Trainer should be able to start Teaching Again (part2)", async () => {
        var txResult = await coreInstance.startTeaching(0,web3.toWei(1,"finney"));
        var eventFound = false;
        for(var i=0; i<txResult.logs.length; i++) {
            var log = txResult.logs[i];
            if(log.event=="NewTrainer"){
                eventFound = true;
            }
        }
        assert.equal(eventFound,true,"NewTrainer Event was not emitted!");
    });

    it("Training with a CON dominant trainer results in CON increase", async () => {
        await coreInstance.trainWith(1,0);
        var newStateTrainee = await coreInstance.getState.call(1);
        var targetBlockTrainer = await coreInstance.getTrainingEnd.call(0);
        var targetBlockTrainee = await coreInstance.getTrainingEnd.call(1);
        assert.equal(newStateTrainee.valueOf(),2,"Warrior did not enter 'Training' state as expected!");
        assert.equal(targetBlockTrainee.valueOf(),targetBlockTrainer.valueOf(),"Trainer and Trainee should sync up for their 'TrainingEnd' value!")
        waitUntilAfter(await coreInstance.getTrainingEnd.call(1));
        await coreInstance.stopTraining(1);
        var newState = await coreInstance.getState(1);
        assert.equal(newState.valueOf(),0,"Trainee did not return to Idle State!");
        var con = await coreInstance.getCon.call(1);
        assert.equal(con.valueOf(),6,"Con did not increase to the expected value!");
        await coreInstance.stopTeaching(0);
    });

    it("Should start with an empty marketplace", async () => {
        var marketCount = await coreInstance.getWarriorMarketCount.call();
        assert.equal(marketCount.valueOf(),0,"Market had non-zero count!");
    });
    
    it("Should allow warrior to be put up for sale", async () => {
        await coreInstance.startSale(0,web3.toWei(1,"ether"));
        var newState = await coreInstance.getState.call(0);
        var salePrice = await coreInstance.getSalePrice.call(0);
        var marketCount = await coreInstance.getWarriorMarketCount.call();
        assert.equal(newState.valueOf(),8,"Warrior failed to enter 'ForSale' State!");
        assert.equal(salePrice.valueOf(),web3.toWei(1,"ether"),"Warrior did not have the expected sale price!");
        assert.equal(marketCount.valueOf(),1,"Market count didn't reflect new warrior for sale!");
    });

    it("Should allow the purchase of a warrior that is for sale", async () => {
        var oldBalance = web3.eth.getBalance(web3.eth.accounts[0]);
        var oldOwnerOldWarriorCount = await coreInstance.getWarriorCount.call(web3.eth.accounts[0]);
        var newOwnerOldWarriorCount = await coreInstance.getWarriorCount.call(web3.eth.accounts[1]);
        var salePrice = await coreInstance.getSalePrice.call(0);
        await coreInstance.purchase(0,{from:web3.eth.accounts[1],value:salePrice});
        var newState = await coreInstance.getState.call(0);
        var newSalePrice = await coreInstance.getSalePrice.call(0);
        var newOwner = await coreInstance.getOwner.call(0);
        var oldOwnerNewWarriorCount = await coreInstance.getWarriorCount.call(web3.eth.accounts[0]);
        var newOwnerNewWarriorCount = await coreInstance.getWarriorCount.call(web3.eth.accounts[1]);
        var newBalance = web3.eth.getBalance(web3.eth.accounts[0]);
        var desiredBalance = oldBalance.plus(salePrice);
        assert.equal(newState.valueOf(),0,"Warrior failed to return to Idle state after purchase!");
        assert.equal(newSalePrice.valueOf(),0,"Warrior sale price did not reset to zero after purchase!");
        assert.equal(newOwner.valueOf(),web3.eth.accounts[1],"Warrior ownership does not reflect purchaser!");
        assert.equal(newBalance.valueOf(),desiredBalance.valueOf(),"Seller's new balance does not accurately reflect sale price!")
        assert.isBelow(oldOwnerNewWarriorCount.valueOf(),oldOwnerOldWarriorCount.valueOf(),"Old Owner's warrior count did not decrease!");
        assert.isAbove(newOwnerNewWarriorCount.valueOf(),newOwnerOldWarriorCount.valueOf(),"New Owner's warrior count did not increase!");
    });
});