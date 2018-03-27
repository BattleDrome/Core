pragma solidity ^0.4.18;

import "./Utils.sol";
import "./EventCore.sol";
import "./LibWarrior.sol";

contract WarriorCore is owned,simpleTransferrable,controlled,mortal,hasRNG,priced {

    //////////////////////////////////////////////////////////////////////////////////////////
    // Config
    //////////////////////////////////////////////////////////////////////////////////////////

    //Costing Config
    uint constant warriorCost = 100 finney;
    uint constant potionCost = 100 finney;
    uint constant intPotionCost = 500 finney;
    uint constant armorCost = 1 finney;
    uint constant armorCostFactor = 10;
    uint constant weaponCostFactor = 10;
    uint constant weaponCost = 1 finney;

    //Misc Config
    uint32 constant cashoutDelay = 24 hours;    
    uint8 constant luckMultiplier = 2;
    uint16 constant wearPercentage = 10;

    //////////////////////////////////////////////////////////////////////////////////////////
    // State
    //////////////////////////////////////////////////////////////////////////////////////////

	struct AccountData {
		uint[] warriors;
	}

	EventCore eventCore;

	mapping(address=>AccountData) warriorMapping;
	mapping(string=>bool) warriorNames;
    mapping(uint=>uint) trainerMapping;

	LibWarrior.warrior[] warriors;
    uint[] warriorMarket;
    uint[] trainerMarket;

    //////////////////////////////////////////////////////////////////////////////////////////
    // Modifiers
    //////////////////////////////////////////////////////////////////////////////////////////

	modifier onlyTrustedEvents() {
		//Check that the message came from the trusted EventCore from BattleDromeCore
		require(msg.sender == address(eventCore));
		_;
	}

	modifier onlyState(uint warriorID, LibWarrior.warriorState state) {
		require(warriors[warriorID].state == state);
		_;
	}

	modifier costsPoints(uint warriorID, uint _points) {
        require(warriors[warriorID].points >= uint64(_points));
        warriors[warriorID].points -= uint64(_points);
        _;
    }

    modifier costsPassThrough(uint _amount, uint warriorID) {
        require(msg.value >= _amount);
        _;
        if (msg.value > _amount) msg.sender.transfer(msg.value - _amount);
        LibWarrior.payWarriorInternal(warriors[warriorID],_amount,false);
    }

    modifier costsPassThroughTax(uint _amount, uint warriorID) {
        require(msg.value >= _amount);
        _;
        if (msg.value > _amount) msg.sender.transfer(msg.value - _amount);
        LibWarrior.payWarriorInternal(warriors[warriorID],_amount,true);
    }

	modifier onlyWarriorOwner(uint warriorID) {
		require(msg.sender == warriors[warriorID].owner);
		_;
	}

	modifier onlyDoneTraining(uint warriorID) {
        require(now >= warriors[warriorID].trainingEnds);
        _;
    }

    modifier onlyAfter(uint warriorID, uint _time) {
        require(now >= warriors[warriorID].creationTime + _time);
        _;
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // Events
    //////////////////////////////////////////////////////////////////////////////////////////

    event WarriorCreated(
        address indexed creator,
        uint64 indexed warrior,
        uint32 timeStamp
        );
    
    event WarriorLevelled(
        uint64 indexed warrior,
        uint32 timeStamp
        );

    event WarriorRetired(
        uint64 indexed warrior,
        uint indexed balance,
        uint32 timeStamp
        );

    event WarriorRevived(
        uint64 indexed warrior,
        uint32 timeStamp
        );
    
    event WarriorDrankPotion(
        uint64 indexed warrior,
        uint32 timeStamp
        );

    event WarriorTraining(
        uint64 indexed warrior,
        uint32 timeStamp
        );

    event WarriorDoneTraining(
        uint64 indexed warrior,
        uint32 timeStamp
        );

    event NewTrainer(
        uint64 indexed warrior,
        uint indexed fee,
        uint32 timeStamp
        );
    
    event TrainerStopped(
        uint64 indexed warrior,
        uint32 timeStamp
        );

    event WarriorSaleStarted(
        uint64 indexed warrior,
        uint indexed salePrice,
        uint32 timeStamp
        );

    event WarriorSaleEnded(
        uint64 indexed warrior,
        uint32 timeStamp
        );

    event WarriorPurchased(
        uint64 indexed warrior,
        address indexed newOwner,
        uint32 timeStamp
        );

    //////////////////////////////////////////////////////////////////////////////////////////
    // Warrior Constructor
    //////////////////////////////////////////////////////////////////////////////////////////

	function newWarrior(address warriorOwner, uint16 colorHue, uint8 armorType, uint8 shieldType, uint8 weaponType) public payable costs(warriorCost) returns(uint theNewWarrior) {
        //Generate a new random seed for the warrior
        uint randomSeed = getRandom();
		//Generate a new warrior, and add it to the warriors array
		warriors.push(LibWarrior.newWarrior(warriorOwner,randomSeed,colorHue,LibWarrior.ArmorType(armorType),LibWarrior.ShieldType(shieldType),LibWarrior.WeaponType(weaponType)));
		//Add the warrior to the appropriate owner index
		addWarrior(warriorOwner,warriors.length-1);
		//Pay the warrior the fee
		LibWarrior.payWarriorInternal(warriors[warriors.length-1],warriorCost,false);
        //Fire the event
        WarriorCreated(warriorOwner,uint64(warriors.length-1),uint32(now));
		//Return new warrior index
		return warriors.length-1;
	}

    //////////////////////////////////////////////////////////////////////////////////////////
    // Collection Management
    //////////////////////////////////////////////////////////////////////////////////////////

	function getGlobalWarriorCount() public view returns(uint) {
		return warriors.length;
	}

	function getWarriorID(address warriorOwner, uint warriorNumber) public view returns(uint) {
		return warriorMapping[warriorOwner].warriors[warriorNumber];
	}

	function getWarriorCount(address warriorOwner) public view returns(uint) {
		return warriorMapping[warriorOwner].warriors.length;
	}

	function removeWarrior(address warriorOwner, uint theWarrior) internal {
        for(uint i=0;i<warriorMapping[warriorOwner].warriors.length;i++) {
            if(warriorMapping[warriorOwner].warriors[i]==theWarrior) {
				warriorMapping[warriorOwner].warriors[i] = warriorMapping[warriorOwner].warriors[warriorMapping[warriorOwner].warriors.length-1];
				warriorMapping[warriorOwner].warriors.length--;
                return;
            }
        }
	}

	function addWarrior(address warriorOwner, uint theWarrior) internal {
		warriorMapping[warriorOwner].warriors.push(theWarrior);
	}

    function nameExists(string _name) public view returns(bool) {
        return warriorNames[_name] == true;
    }

	function transferOwnershipInternal(uint warriorID, address oldOwner, address newOwner) internal {
		removeWarrior(oldOwner,warriorID);
		addWarrior(newOwner,warriorID);
        LibWarrior.setOwner(warriors[warriorID],newOwner);
	}

	function transferOwnership(uint warriorID, address oldOwner, address newOwner) public onlyWarriorOwner(warriorID) {
        transferOwnershipInternal(warriorID,oldOwner,newOwner);
	}

	function addWarriorToMarket(uint theWarrior) internal {
		warriorMarket.push(theWarrior);
	}

	function removeWarriorFromMarket(uint theWarrior) internal {
        if(warriorMarket.length==1) {
            delete warriorMarket;
        }else{
            for(uint i=0;i<warriorMarket.length;i++) {
                if(warriorMarket[i]==theWarrior) {
                    warriorMarket[i] = warriorMarket[warriorMarket.length-1];
                    warriorMarket.length--;
                    return;
                }
            }
        }
	}

    function getWarriorMarketCount() public view returns (uint) {
        return warriorMarket.length;
    }

    function getWarriorIDFromMarket(uint index) public view returns (uint) {
        return warriorMarket[index];
    }

	function addTrainerToMarket(uint theWarrior) internal {
		trainerMarket.push(theWarrior);
	}

	function removeTrainerFromMarket(uint theWarrior) internal {
        if(trainerMarket.length==1) {
            delete trainerMarket;
        }else{
            for(uint i=0;i<trainerMarket.length;i++) {
                if(trainerMarket[i]==theWarrior) {
                    trainerMarket[i] = trainerMarket[trainerMarket.length-1];
                    trainerMarket.length--;
                    return;
                }
            }
        }
	}

    function getTrainerMarketCount() public view returns (uint) {
        return trainerMarket.length;
    }

    function getTrainerIDFromMarket(uint index) public view returns (uint) {
        return trainerMarket[index];
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // Basic Getters
    //////////////////////////////////////////////////////////////////////////////////////////

    function getWarriorCost() public pure returns(uint) {
        return warriorCost;
    }

	function getOwner(uint warriorID) public view returns(address) {
		return warriors[warriorID].owner;
	}

	function getBalance(uint warriorID) public view returns(uint) {
		return warriors[warriorID].balance;
	}

	function getTeachingFee(uint warriorID) public view returns(uint) {
		return warriors[warriorID].teachingFee;
	}

	function getSalePrice(uint warriorID) public view returns(uint) {
		return warriors[warriorID].salePrice;
	}

	function getLevel(uint warriorID) public view returns(uint) {
		return warriors[warriorID].level;
	}

	function getXP(uint warriorID) public view returns(uint) {
		return warriors[warriorID].xp;
	}

	function getStr(uint warriorID) public view returns(uint) {
		return warriors[warriorID].str;
	}

	function getCon(uint warriorID) public view returns(uint) {
		return warriors[warriorID].con;
	}

	function getDex(uint warriorID) public view returns(uint) {
		return warriors[warriorID].dex;
	}
	
	function getLuck(uint warriorID) public view returns(uint) {
		return warriors[warriorID].luck;
	}

	function getDmg(uint warriorID) public view returns(uint) {
		return warriors[warriorID].dmg;
	}

	function getPoints(uint warriorID) public view returns(uint) {
		return warriors[warriorID].points;
	}

	function getArmor(uint warriorID) public view returns(uint) {
		return warriors[warriorID].armorStrength;
	}

	function getShield(uint warriorID) public view returns(uint) {
		return warriors[warriorID].shieldStrength;
	}

	function getWeapon(uint warriorID) public view returns(uint) {
		return warriors[warriorID].weaponStrength;
	}

	function getArmorType(uint warriorID) public view returns(LibWarrior.ArmorType) {
		return warriors[warriorID].armorType;
	}

	function getShieldType(uint warriorID) public view returns(LibWarrior.ShieldType) {
		return warriors[warriorID].shieldType;
	}

	function getWeaponType(uint warriorID) public view returns(LibWarrior.WeaponType) {
		return warriors[warriorID].weaponType;
	}

	function getPotions(uint warriorID) public view returns(uint) {
		return warriors[warriorID].potions;
	}

	function getIntPotions(uint warriorID) public view returns(uint) {
		return warriors[warriorID].intPotions;
	}

	function getState(uint warriorID) public view returns(LibWarrior.warriorState) {
		return warriors[warriorID].state;
	}

	function getTrainingEnd(uint warriorID) public view returns(uint) {
		return warriors[warriorID].trainingEnds;
	}

	function getColorHue(uint warriorID) public view returns(uint) {
		return warriors[warriorID].colorHue;
	}

    //////////////////////////////////////////////////////////////////////////////////////////
    // Derived/Calculated Getters
    //////////////////////////////////////////////////////////////////////////////////////////

    function getName(uint warriorID) public view returns(string) {
        return LibWarrior.getName(warriors[warriorID]);
    }

    function getXPTargetForLevel(uint16 level) public pure returns(uint) {
        return LibWarrior.getXPTargetForLevel(level);
    }

    function getBaseHP(uint warriorID) public view returns (uint) {
		return LibWarrior.getBaseHP(warriors[warriorID]);
    }

    function getHP(uint warriorID) public view returns (int) {
        return LibWarrior.getHP(warriors[warriorID]);
    }

    function canRevive(uint warriorID) public view returns(bool) {
		return LibWarrior.canRevive(warriors[warriorID]);
    }

    function getXPForKill(uint warriorID, uint16 killLevel) public view returns (uint) {
        return LibWarrior.getXPForKill(warriors[warriorID],killLevel);
    }

    function getXPForPractice(uint warriorID) public view returns (uint) {
        return LibWarrior.getXPForPractice(warriors[warriorID]);
    }

    function getDominantStatValue(uint warriorID) public view returns(uint) {
        return LibWarrior.getDominantStatValue(warriors[warriorID]);
    }

    function getTimeToPractice(uint warriorID) public view returns(uint) {
		return LibWarrior.getTimeToPractice(warriors[warriorID]);
    }

    function getLuckFactor(uint warriorID) internal returns (uint) {
        return getRandomRange24(0,warriors[warriorID].luck*luckMultiplier);
    }

    function getCosmeticProperty(uint warriorID, uint propertyIndex) public view returns (uint) {
        return LibWarrior.getCosmeticProperty(warriors[warriorID],propertyIndex);
    }

    function getWeaponClass(uint warriorID) public view returns(LibWarrior.WeaponClass) {
        return LibWarrior.getWeaponClass(warriors[warriorID]);
    }

    function getReviveCost(uint warriorID) public view returns(uint) {
        return LibWarrior.getReviveCost(warriors[warriorID]);
    }
    
    function canTrainWith(uint warriorID, uint trainerID) public view returns(bool) {
        return LibWarrior.canTrainWith(warriors[warriorID],warriors[trainerID]);
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // Costing Getters
    //////////////////////////////////////////////////////////////////////////////////////////

    function getStatsCost(uint warriorID, uint8 strAmount, uint8 dexAmount, uint8 conAmount, uint8 luckAmount) public view returns (uint) {
        return LibWarrior.getStatsCost(warriors[warriorID],strAmount,dexAmount,conAmount,luckAmount);
    }

    function getEquipCost(uint warriorID, uint8 armorAmount, uint8 shieldAmount, uint8 weaponAmount, uint8 potionAmount, uint8 intPotionAmount) public view returns(uint) {
        return LibWarrior.getEquipCost(warriors[warriorID],armorAmount,shieldAmount,weaponAmount,potionAmount,intPotionAmount);
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // Setters
    //////////////////////////////////////////////////////////////////////////////////////////

    function setName(uint warriorID, string name) public onlyWarriorOwner(warriorID) {
		//Check if the name is unique
		require(!nameExists(name));
        //Set the name
        LibWarrior.setName(warriors[warriorID],name);
        //Add warrior's name to index
        warriorNames[name] = true;
    }

    function setEventCore(address core) public onlyOwner {
        eventCore = EventCore(core);
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // Buying Things
    //////////////////////////////////////////////////////////////////////////////////////////

    function buyStats(uint warriorID, uint8 strAmount, uint8 dexAmount, uint8 conAmount, uint8 luckAmount) public onlyWarriorOwner(warriorID) onlyState(warriorID,LibWarrior.warriorState.Idle) costsPoints(warriorID,getStatsCost(warriorID,strAmount,dexAmount,conAmount,luckAmount)) {
        LibWarrior.buyStats(warriors[warriorID],strAmount,dexAmount,conAmount,luckAmount);
    }

    function buyEquipment(uint warriorID, uint8 armorAmount, uint8 shieldAmount, uint8 weaponAmount, uint8 potionAmount, uint8 intPotionAmount) public payable costsPassThrough(getEquipCost(warriorID,armorAmount,shieldAmount,weaponAmount,potionAmount,intPotionAmount),warriorID) onlyState(warriorID, LibWarrior.warriorState.Idle) {
        LibWarrior.buyEquipment(warriors[warriorID],armorAmount,shieldAmount,weaponAmount,potionAmount,intPotionAmount);
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // Transaction/Payment Handling
    //////////////////////////////////////////////////////////////////////////////////////////

	function payWarrior(uint warriorID) payable public {
		LibWarrior.payWarriorInternal(warriors[warriorID],msg.value,false);
	}

    //////////////////////////////////////////////////////////////////////////////////////////
    // Actions/Activities/Effects
    //////////////////////////////////////////////////////////////////////////////////////////

	function awardXP(uint warriorID, uint64 amount) public onlyTrustedEvents {
        LibWarrior.awardXP(warriors[warriorID],amount);
    }

    function earnXPForKill(uint warriorID, uint killLevel) public onlyTrustedEvents onlyState(warriorID, LibWarrior.warriorState.Battling) {
        LibWarrior.earnXPForKill(warriors[warriorID],killLevel);
    }

    function practice(uint warriorID) public onlyWarriorOwner(warriorID) onlyState(warriorID, LibWarrior.warriorState.Idle) {
        LibWarrior.practice(warriors[warriorID]);
        WarriorTraining(uint64(warriorID),uint32(now));
    }

	function stopPracticing(uint warriorID) public onlyWarriorOwner(warriorID) onlyDoneTraining(warriorID) onlyState(warriorID, LibWarrior.warriorState.Practicing) {
        LibWarrior.stopPracticing(warriors[warriorID]);
        WarriorDoneTraining(uint64(warriorID),uint32(now));
    }

    function startTeaching(uint warriorID, uint teachingFee) public onlyWarriorOwner(warriorID) onlyState(warriorID, LibWarrior.warriorState.Idle) {
        LibWarrior.startTeaching(warriors[warriorID],teachingFee);
        addTrainerToMarket(warriorID);
        NewTrainer(uint64(warriorID),teachingFee,uint32(now));
    }

	function stopTeaching(uint warriorID) public onlyWarriorOwner(warriorID) onlyDoneTraining(warriorID) onlyState(warriorID, LibWarrior.warriorState.Teaching) {
        LibWarrior.stopTeaching(warriors[warriorID]);
        removeTrainerFromMarket(warriorID);
        TrainerStopped(uint64(warriorID),uint32(now));
    }

    function trainWith(uint warriorID, uint trainerID) public onlyWarriorOwner(warriorID) onlyState(warriorID, LibWarrior.warriorState.Idle) onlyState(trainerID, LibWarrior.warriorState.Teaching) onlyDoneTraining(trainerID) {
        LibWarrior.trainWith(warriors[warriorID],warriors[trainerID]);
        trainerMapping[warriorID] = trainerID;
        WarriorTraining(uint64(trainerID),uint32(now));
        WarriorTraining(uint64(warriorID),uint32(now));
    }

	function stopTraining(uint warriorID) public onlyWarriorOwner(warriorID) onlyDoneTraining(warriorID) onlyState(warriorID, LibWarrior.warriorState.Training) {
        LibWarrior.stopTraining(warriors[warriorID],warriors[trainerMapping[warriorID]]);
        WarriorDoneTraining(uint64(warriorID),uint32(now));
    }
	
    function revive(uint warriorID) public payable costsPassThrough(getReviveCost(warriorID),warriorID) onlyState(warriorID, LibWarrior.warriorState.Incapacitated) {
        LibWarrior.revive(warriors[warriorID]);
        WarriorRevived(uint64(warriorID),uint32(now));
    }

	function retire(uint warriorID) public onlyWarriorOwner(warriorID) onlyAfter(warriorID,cashoutDelay) {
        LibWarrior.retire(warriors[warriorID]);
        WarriorRetired(uint64(warriorID),warriors[warriorID].balance,uint32(now));
    }

    function kill(uint warriorID) public onlyTrustedEvents onlyState(warriorID,LibWarrior.warriorState.Battling) {
        LibWarrior.kill(warriors[warriorID]);
    }

    function autoPotion(uint warriorID) public onlyTrustedEvents onlyState(warriorID,LibWarrior.warriorState.Battling) {
        LibWarrior.drinkPotion(warriors[warriorID]);
    }

    function drinkPotion(uint warriorID) public onlyWarriorOwner(warriorID) onlyState(warriorID,LibWarrior.warriorState.Idle) {
        LibWarrior.drinkPotion(warriors[warriorID]);
        WarriorDrankPotion(uint64(warriorID),uint32(now));
    }

	function joinEvent(uint warriorID, uint eventID) public onlyWarriorOwner(warriorID) {
        LibWarrior.warrior storage w = warriors[warriorID];
		//Can the warrior afford to join?
		require(w.balance>eventCore.getJoinFee(eventID));
		eventCore.joinEvent.value(eventCore.getJoinFee(eventID))(eventID,warriorID);
		LibWarrior.setState(w,LibWarrior.warriorState.BattlePending);	
	}

	function beginBattle(uint warriorID) public onlyTrustedEvents {
		LibWarrior.setState(warriors[warriorID],LibWarrior.warriorState.Battling);
	}

	function endBattle(uint warriorID) public onlyTrustedEvents {
        LibWarrior.warrior storage w = warriors[warriorID];        
		//Check if warrior is still standing
		if(w.state==LibWarrior.warriorState.Battling) {
			//If so then reset them to idle
			LibWarrior.setState(w,LibWarrior.warriorState.Idle);
		}
		//If they are incapacitated, or retired, or already idle, we don't care.
	}

    function sendLoot(uint sender, uint recipient) public onlyTrustedEvents {
        LibWarrior.warrior storage s = warriors[sender];
        LibWarrior.warrior storage r = warriors[recipient];
		uint amount = s.balance/2;
        s.balance -= amount;
		LibWarrior.payWarriorInternal(r,amount,true);
    }

    function startSale(uint warriorID, uint salePrice) public onlyWarriorOwner(warriorID) onlyState(warriorID,LibWarrior.warriorState.Idle) {
        LibWarrior.startSale(warriors[warriorID],salePrice);
        addWarriorToMarket(warriorID);
        WarriorSaleStarted(uint64(warriorID),salePrice,uint32(now));
    }

    function endSale(uint warriorID) public onlyWarriorOwner(warriorID) onlyState(warriorID,LibWarrior.warriorState.ForSale) {
        LibWarrior.endSale(warriors[warriorID]);
        removeWarriorFromMarket(warriorID);
        WarriorSaleEnded(uint64(warriorID),uint32(now));
    }

    function purchase(uint warriorID) public payable costs(getSalePrice(warriorID)) onlyState(warriorID,LibWarrior.warriorState.ForSale) {
        LibWarrior.warrior storage w = warriors[warriorID];
        address oldOwner = w.owner;
        oldOwner.transfer(getSalePrice(warriorID));
        LibWarrior.endSale(w);
        transferOwnershipInternal(warriorID,oldOwner,msg.sender);
        removeWarriorFromMarket(warriorID);
        WarriorPurchased(uint64(warriorID),msg.sender,uint32(now));
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // Combat
    //////////////////////////////////////////////////////////////////////////////////////////

    function dieRoll(uint warriorID, uint min, uint max) internal returns (uint24 roll) {
		uint24 lf = uint24(getLuckFactor(warriorID));
        roll = getRandomRange24(min+lf,max+(lf/2));
    }

    function rollHit(uint warriorID) public onlyTrustedEvents returns (uint roll) {
        LibWarrior.warrior storage w = warriors[warriorID];
        uint16 dex = LibWarrior.getCombatDex(w);
		roll = dieRoll(warriorID,dex/2,dex*2);
    }

    function rollDodge(uint warriorID) public onlyTrustedEvents returns (uint roll) {
        LibWarrior.warrior storage w = warriors[warriorID];
        uint16 dex = LibWarrior.getCombatDex(w);
		roll = dieRoll(warriorID,dex/3,dex*2);
    }

    function rollDamage(uint warriorID) public onlyTrustedEvents returns (int roll) {
        LibWarrior.warrior storage w = warriors[warriorID];
        uint16 str = LibWarrior.getCombatStr(w);
		roll = dieRoll(warriorID,str/2,str*2);
    }

    function rollEscape(uint warriorID) public onlyTrustedEvents returns (uint roll) {
        LibWarrior.warrior storage w = warriors[warriorID];
        uint16 dex = LibWarrior.getCombatDex(w);
		roll = dieRoll(warriorID,0,dex);
    }

    function rollBlock(uint warriorID) public onlyTrustedEvents returns (uint roll) {
        LibWarrior.warrior storage w = warriors[warriorID];
        uint16 str = LibWarrior.getCombatStr(w);
        uint16 dex = LibWarrior.getCombatDex(w);
		roll = dieRoll(warriorID,0,str+dex);
    }

	function getDamageReduction(uint warriorID) public view returns (uint64) {
        return LibWarrior.getDamageReduction(warriors[warriorID]);
    }

    function applyDamage(uint warriorID, uint damage) public onlyTrustedEvents onlyState(warriorID,LibWarrior.warriorState.Battling) returns (bool) {
        return LibWarrior.applyDamage(warriors[warriorID],damage);
    }

    function wearArmor(uint warriorID) public onlyTrustedEvents {
        LibWarrior.wearArmor(warriors[warriorID]);
    }

    function wearShield(uint warriorID) public onlyTrustedEvents {
        LibWarrior.wearShield(warriors[warriorID]);
    }

    function wearWeapon(uint warriorID) public onlyTrustedEvents {
        LibWarrior.wearWeapon(warriors[warriorID]);
    }

}
