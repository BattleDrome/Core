pragma solidity ^0.4.18;

import "./Utils.sol";
import "./WarriorCore.sol";
import "./LibWarrior.sol";

contract EventCore is controlled,mortal,priced,hasRNG {
    uint constant minNewTime = 1 hours;
    uint constant minTimeBeforeCancel = 1 hours;
	uint constant minActiveTime = 1 hours;
	uint constant basePollCost = 10 finney;
	uint32 constant minPollDuration = 30 seconds;

	uint8 constant absoluteMaxWarriors = 255;
	uint8 constant meleesPerPollPerWarrior = 1;
    uint8 constant exchangesPerMelee = 2;
    uint8 constant escapeThreshold = 2;

	uint public unclaimedPool = 0;

	enum EventState { New, Active, Finished }

	struct Event {
		address owner;
		//Storage Cell 1 End
		uint balance;
		//Storage Cell 2 End
		uint joinFee;
		//Storage Cell 3 End
		uint winner;
		//Storage Cell 4 End
		uint32 timeOpen;
		uint32 timeStart;
		uint32 timeFinish;
		uint32 lastPollTime;
		uint32 newDuration;
		uint16 minLevel;
		uint16 maxLevel;
		uint16 minEquipLevel;
		uint16 maxEquipLevel;
		uint16 maxPolls;
		//Storage Cell 5 End
		uint8 warriorMin;
		uint8 warriorMax;
		bool winnerPresent;
		EventState state;
		//Variable Length Data:
		uint[] participants;
		address[] polls;
		mapping(uint=>bool) participantsPresent;				
	}

    WarriorCore public warriorCore;

	Event[] events;
	mapping(address=>uint) mrEvent;

    event EventCreated(
        uint32 indexed event_id,
        uint32 timeStamp,
		address indexed owner
        );
        
    event EventStarted(
        uint32 indexed event_id,
        uint32 timeStamp
        );
        
    event EventFinished(
        uint32 indexed event_id,
        uint32 timeStamp
        );
        
    event EventCancelled(
        uint32 indexed event_id,
        uint32 timeStamp
        );
    
    event EventPolled(
        uint32 indexed event_id,
        uint32 timeStamp,
		uint32 indexed pollCount
        );
    
    event EventWinner(
        uint32 indexed event_id,
        uint64 indexed warrior,
        uint32 timeStamp
        );

    event WarriorJoinedEvent(
        uint32 indexed event_id,
        uint64 indexed warrior,
        uint32 timeStamp
        );
    
    event WarriorDefeated(
        uint32 indexed event_id,
        uint64 indexed warrior,
        uint64 indexed attacker,
        uint16 warriorLevel,
        uint16 attackerLevel,
        uint32 timeStamp
        ); 
        
    event WarriorEngaged(
        uint32 indexed event_id,
        uint64 indexed warriorA,
        uint64 indexed warriorB,
        uint32 timeStamp
        );

    event WarriorEscaped(
        uint32 indexed event_id,
        uint64 indexed warrior,
        uint64 indexed attacker,
        uint32 timeStamp
        );
        
    event WarriorDrankPotion(
        uint32 indexed event_id,
        uint64 indexed warrior,
        uint64 indexed attacker,
        uint32 timeStamp
        );
        
    event WarriorHit(
        uint32 indexed event_id,
        uint64 indexed warrior,
        uint64 indexed attacker,
        uint32 damageDealt,
        uint32 timeStamp
        );

    event WarriorDodged(
        uint32 indexed event_id,
        uint64 indexed warrior,
        uint64 indexed attacker,
        uint32 timeStamp
        );

    event WarriorBlocked(
        uint32 indexed event_id,
        uint64 indexed warrior,
        uint64 indexed attacker,
        uint32 damageBlocked,
        uint32 timeStamp
        );

	modifier onlyEventState(uint eventID, EventState state) {
		require(events[eventID].state == state);
		_;
	}

	modifier onlyEventOwner(uint eventID) {
		require(msg.sender == events[eventID].owner);
		_;
	}

	modifier onlyTrustedWarriors() {
		//Check that the message came from the trusted WarriorCore from BattleDromeCore
		require(msg.sender == address(warriorCore));
		_;
	}

    function setWarriorCore(address core) public onlyOwner {
        warriorCore = WarriorCore(core);
    }

	function getNewEventFee(uint _warriorCount, uint _pollCount) public pure returns(uint) {
		return basePollCost * _warriorCount * _pollCount * 2;
	}

	function hasCurrentEvent(address owner) public view returns(bool) {
		return mrEvent[owner] != 0 || events[mrEvent[owner]].state != EventState.Finished;
	}

	function canCreateEvent(uint8 warriorMax) public view returns(bool) {
		return warriorMax<=absoluteMaxWarriors && (events.length==0 || !hasCurrentEvent(msg.sender));
	}

	function newEvent(uint8 _warriorMin, uint8 _warriorMax, uint16 _minLevel, uint16 _maxLevel, uint16 _minEquipLevel, uint16 _maxEquipLevel, uint16 _maxPolls, uint _joinFee) public payable costsWithExcess(getNewEventFee(_warriorMax,_maxPolls)) returns(uint theNewEvent) {
		require(canCreateEvent(_warriorMax));

		//Calculate Durations based on participants
		uint32 timeBase = 1 hours * _minLevel * _warriorMin;

		//Add a newly created warrior to the warriors array
		events.push(Event(
			msg.sender,				//owner
			msg.value,				//balance
			_joinFee,				//joinFee
			0,						//winner
			uint32(now),			//timeOpen
			0,						//timeStart
			0,						//timeFinish
			0,						//lastPollTime
			timeBase,				//newDuration
			_minLevel,				//minLevel
			_maxLevel,				//maxLevel
			_minEquipLevel,			//minEquipLevel
			_maxEquipLevel,			//maxEquipLevel
			_maxPolls,				//maxPolls
			_warriorMin,			//warriorMin
			_warriorMax,			//warriorMax
			false,					//winnerPresent
			EventState.New,			//state
			new uint[](0),			//participants
			new address[](0)		//polls
									//Note: participantsPresent Mapping Skipped as per Solidity Docs.
		));
		//Calculate Unclaimed Contribution
		getUnclaimedContribution(events.length-1);
		//Emit Event
		EventCreated(uint32(events.length-1),uint32(now),msg.sender);
		//Mark new most recent event for this owner:
		mrEvent[msg.sender] = events.length-1;
		//Return new event index
		return events.length-1;
	}

	function getUnclaimedContribution(uint eventID) internal {
		Event storage e = events[eventID];
		uint eventFee = getNewEventFee(e.warriorMax,e.maxPolls);
		if(unclaimedPool>eventFee){
			unclaimedPool -= eventFee;
			e.balance += eventFee;
		}else{
			unclaimedPool = 0;
			e.balance += unclaimedPool;
		}
	}

	function getEventCount() public view returns(uint) {
		return events.length;
	}

	function transferOwnership(uint theEvent, address newOwner) public onlyEventOwner(theEvent) {
		events[theEvent].owner = newOwner;
	}

	function getOwner(uint eventID) public view returns(address) {
		return events[eventID].owner;
	}

	function getWinnerRewardPool(uint eventID) public view returns(uint) {
		return events[eventID].balance-getPollRewardPool(eventID);
	}

	function getPollRewardPool(uint eventID) public view returns(uint) {
		return getCurrentRewardPerPoll(eventID)*getPollCount(eventID);
	}

	function getCurrentRewardPerPoll(uint eventID) public view returns(uint) {
		return events[eventID].balance/(getPollCount(eventID)*2);
	}
	
	function getBalance(uint eventID) public view returns(uint) {
		return events[eventID].balance;
	}

	function getWinner(uint eventID) public view returns(uint) {
		return events[eventID].winner;
	}

	function getPollCount(uint eventID) public view returns(uint32) {
		return uint32(events[eventID].polls.length);
	}

	function getLastPoll(uint eventID) public view returns(address) {
		if(events[eventID].polls.length>0){
			return events[eventID].polls[events[eventID].polls.length-1];
		}else{
			return address(0);
		}
	}

	function getTimeOpen(uint eventID) public view returns(uint32) {
		return events[eventID].timeOpen;
	}

	function getTimeStart(uint eventID) public view returns(uint32) {
		return events[eventID].timeStart;
	}

	function getTimeFinish(uint eventID) public view returns(uint32) {
		return events[eventID].timeFinish;
	}

	function getNewDuration(uint eventID) public view returns(uint32) {
		return events[eventID].newDuration;
	}

	function getMinLevel(uint eventID) public view returns(uint16) {
		return events[eventID].minLevel;
	}

	function getMaxLevel(uint eventID) public view returns(uint16) {
		return events[eventID].maxLevel;
	}

	function getMinEquipLevel(uint eventID) public view returns(uint16) {
		return events[eventID].minEquipLevel;
	}

	function getMaxEquipLevel(uint eventID) public view returns(uint16) {
		return events[eventID].maxEquipLevel;
	}

	function getMaxPolls(uint eventID) public view returns(uint16) {
		return events[eventID].maxPolls;
	}
	
	function getWarriorMin(uint eventID) public view returns(uint8) {
		return events[eventID].warriorMin;
	}

	function getWarriorMax(uint eventID) public view returns(uint8) {
		return events[eventID].warriorMax;
	}

	function getState(uint eventID) public view returns(EventState) {
		return events[eventID].state;
	}

	function getJoinFee(uint eventID) public view returns(uint) {
		return events[eventID].joinFee;
	}

	function getParticipantCount(uint eventID) public view returns(uint8) {
		return uint8(events[eventID].participants.length);
	}

	function getParticipant(uint eventID, uint idx) public view returns(uint) {
		return events[eventID].participants[idx];
	}

	function canAddParticipant(uint eventID, uint level) public view returns(bool) {
		return (
			level >= events[eventID].minLevel &&
			level <= events[eventID].maxLevel &&
			events[eventID].participants.length < events[eventID].warriorMax &&
			events[eventID].state == EventState.New
		);
	}

	function canParticipate(uint eventID, uint newWarrior) public view returns(bool) {
		return (warriorCore.getState(newWarrior)==LibWarrior.warriorState.Idle) 
			&& canAddParticipant(eventID, warriorCore.getLevel(newWarrior));
	}

	function checkParticipation(uint eventID, uint theWarrior) public view returns(bool) {
		return events[eventID].participantsPresent[theWarrior];
	}

	function canStart(uint eventID) public view returns(bool) {
		return (
			now - events[eventID].timeOpen > events[eventID].newDuration && 
			events[eventID].participants.length >= events[eventID].warriorMin
		);
	}	

	function canCancel(uint eventID) public view returns(bool) {
		return (
			now - events[eventID].timeOpen > minTimeBeforeCancel && 
			events[eventID].participants.length < events[eventID].warriorMin &&
			events[eventID].state == EventState.New
		);
	}	

	function hasWinner(uint eventID) public view returns(bool) {
		return events[eventID].winnerPresent;
	}

	function isStalemate(uint eventID) public view returns(bool) {
        return (
            !hasWinner(eventID) &&
            (getPollCount(eventID) >= getMaxPolls(eventID))
        );
	}

	function setStartTime(uint eventID, uint32 _timeStart) internal {
		events[eventID].timeStart = _timeStart;
	}

	function setFinishTime(uint eventID, uint32 _timeFinish) internal {
		events[eventID].timeFinish = _timeFinish;
	}

	function setState(uint eventID, EventState _state) internal {
		events[eventID].state = _state;
	}

	function joinEvent(uint eventID, uint theWarrior) public payable onlyTrustedWarriors() costs(getJoinFee(eventID)) {
		//Is this warrior allowed to join?
        require(canParticipate(eventID,theWarrior));
		events[eventID].participants.push(theWarrior);
		events[eventID].participantsPresent[theWarrior] = true;
		WarriorJoinedEvent(uint32(eventID),uint64(theWarrior),uint32(now));
	}

	function setWinner(uint eventID, uint theWinner) internal {
		events[eventID].winner = theWinner;
		events[eventID].winnerPresent = true;
	}

    function start(uint eventID) public onlyEventState(eventID,EventState.New) {
        require(canStart(eventID));
        setStartTime(eventID,uint32(now));
		setState(eventID,EventState.Active);
        for(uint p=0;p<events[eventID].participants.length;p++) {
			warriorCore.beginBattle(events[eventID].participants[p]);
		}
        EventStarted(uint32(eventID),uint32(now));
    }

    function cancel(uint eventID) public onlyEventOwner(eventID) onlyEventState(eventID,EventState.New) {
        require(canCancel(eventID));
        events[eventID].state = EventState.Finished;
        setFinishTime(eventID,uint32(now));
		for(uint p=0;p<events[eventID].participants.length;p++) {
			//Refund any fees paid by warrior
			warriorCore.payWarrior.value(events[eventID].joinFee)(events[eventID].participants[p]);
			//Remove the warrior from the event, freeing them
			warriorCore.endBattle(events[eventID].participants[p]);
		}
		//Send any remaining event balance back to the event owner
		events[eventID].owner.transfer(getBalance(eventID));
        EventCancelled(uint32(eventID),uint32(now));
    }

    function finish(uint eventID) internal {
        setState(eventID,EventState.Finished);
        setFinishTime(eventID,uint32(now));
		for(uint p=0;p<events[eventID].participants.length;p++) {
			warriorCore.endBattle(events[eventID].participants[p]);
		}
        EventFinished(uint32(eventID),uint32(now));
		payPollRewards(eventID);
		payWinnerRewards(eventID);
    }

	function payWarrior(uint eventID, uint amount, uint warriorID) internal {
		require(events[eventID].balance>=amount);
		events[eventID].balance -= amount;
		warriorCore.payWarrior.value(amount)(warriorID);
	}

	function payPlayer(uint eventID, uint amount, address player) internal {
		require(events[eventID].balance>=amount);
		events[eventID].balance -= amount;
		player.transfer(amount);
	}

	function payPollRewards(uint eventID) internal {
		uint pollReward = getCurrentRewardPerPoll(eventID);
		for(uint poll=0;poll<getPollCount(eventID);poll++){
			payPlayer(eventID,pollReward,events[eventID].polls[poll]);
		}
	}
	
	function payWinnerRewards(uint eventID) internal {
		uint rewardToPay = getBalance(eventID); //TODO: Fix this later, not important for beta.
		if(hasWinner(eventID)){
			payWarrior(eventID,rewardToPay,getWinner(eventID));
		}else{
			unclaimedWinnerRewards(eventID,rewardToPay);
		}
	}

	function unclaimedWinnerRewards(uint eventID, uint amount) internal {
		require(getBalance(eventID)>=amount);
		events[eventID].balance -= amount;
		unclaimedPool += amount;
	}

	function canPoll(uint eventID) public view returns (bool) {
		//Can't poll if either event in wrong state, or if you were the last poller.
		//Also can't poll more than once per `minPollDuration`
		return events[eventID].state == EventState.Active && getLastPoll(eventID) != msg.sender && now > events[eventID].lastPollTime + minPollDuration;
	}

	function poll(uint eventID) public {
		require(canPoll(eventID));
		events[eventID].polls.push(msg.sender);
		for(uint melee=0;melee<getParticipantCount(eventID)*meleesPerPollPerWarrior;melee++) {
			uint8 warriorIdxA = getRandomUint8()%getParticipantCount(eventID);
			uint8 warriorIdxB = getRandomUint8()%getParticipantCount(eventID)-1;
			if(warriorIdxB>=warriorIdxA) warriorIdxB++;
			uint a = getParticipant(eventID,warriorIdxA);
			uint b = getParticipant(eventID,warriorIdxB);
			if(resolveMelee(eventID,a,b)) {
				if(checkForWinner(eventID)){
					finish(eventID);
					return;
				}
			}
		}
		if(isStalemate(eventID) || hasWinner(eventID)){
			finish(eventID);
		} 
		EventPolled(uint32(eventID),uint32(now),getPollCount(eventID));
	}

    function resolveMelee(uint eventID, uint a, uint b) internal returns (bool) {
		WarriorEngaged(uint32(eventID),uint64(a),uint64(b),uint32(now));
		//Check for First Strike:
		if(warriorCore.getWeaponClass(a)==LibWarrior.WeaponClass.ExtRange && warriorCore.getWeaponClass(b)!=LibWarrior.WeaponClass.ExtRange) {
			//A Gets First Strike
			if(resolveAttack(eventID,a,b)) return true;
		} else if(warriorCore.getWeaponClass(b)==LibWarrior.WeaponClass.ExtRange && warriorCore.getWeaponClass(a)!=LibWarrior.WeaponClass.ExtRange) {
			//B Gets First Strike
			if(resolveAttack(eventID,b,a)) return true;
		}
		//No Remaining Advantage, continue with normal Melee Process:
        for(uint8 exchange=0;exchange<exchangesPerMelee;exchange++) {
            if(handleEscape(eventID,a,b)) return false;
            if(resolveAttack(eventID,a,b)) return true;
            if(resolveAttack(eventID,b,a)) return true;
        }
        return false;
    }

    function handleDefeat(uint eventID, uint attacker, uint defender) internal {
        warriorCore.sendLoot(defender,attacker);
        warriorCore.earnXPForKill(attacker,warriorCore.getLevel(defender));
        removeParticipant(eventID,defender);
        warriorCore.kill(defender);
        WarriorDefeated(uint32(eventID),uint64(defender),uint64(attacker),uint16(warriorCore.getLevel(defender)),uint16(warriorCore.getLevel(attacker)),uint32(now));
    }

    function checkForWinner(uint eventID) internal returns(bool) {
        if(getParticipantCount(eventID)==1){
            setWinner(eventID,getParticipant(eventID,0));
            EventWinner(uint32(eventID),uint64(getParticipant(eventID,0)),uint32(now));
            return true;
        }
        return false;
    }

    function handleEscape(uint eventID, uint a, uint b) internal returns(bool) {
        if(warriorCore.getLevel(a) > warriorCore.getLevel(b) + escapeThreshold) return attemptEscape(eventID,b,a);
        if(warriorCore.getLevel(b) > warriorCore.getLevel(a) + escapeThreshold) return attemptEscape(eventID,a,b);
    }

    function attemptEscape(uint eventID, uint escapee, uint opponent) internal returns(bool) {
		bool escaped = warriorCore.rollEscape(escapee) > warriorCore.getDex(opponent);
		if(escaped) WarriorEscaped(uint32(eventID),uint64(escapee),uint64(opponent),uint32(now));
        return escaped;
	}

    function resolveAttack(uint eventID, uint attacker, uint defender) internal returns(bool defenderDeath) {
        uint hitRoll = warriorCore.rollHit(attacker);
		uint dodgeRoll = warriorCore.rollDodge(defender);
		uint blockRoll = 0;
		int dmg = 0;
		uint dmgReduction = 0;
		if(hitRoll > dodgeRoll) {
			if(warriorCore.getShieldType(defender)!=LibWarrior.ShieldType.None && warriorCore.getShield(defender)>0) {
				//Defender has a shield, so has opportunity to block:
				//Bludgeoning Weapons can't be blocked by light or medium shields.
				if(warriorCore.getWeaponClass(attacker)!=LibWarrior.WeaponClass.Bludgeoning || warriorCore.getShieldType(defender)==LibWarrior.ShieldType.Heavy) {
					blockRoll = warriorCore.rollBlock(defender);
				}
			}
			dmg = warriorCore.rollDamage(attacker);
			if(hitRoll>blockRoll){
				//Hit was not blocked!
				dmgReduction = warriorCore.getDamageReduction(defender);
				if(warriorCore.getWeaponClass(attacker)==LibWarrior.WeaponClass.Cleaving || warriorCore.getWeaponClass(attacker)==LibWarrior.WeaponClass.Bludgeoning) {
					//Heavy Weapons Bypass some damage reduction
					dmgReduction = dmgReduction/2;
				}
				dmg -= int(dmgReduction);
				if(dmg>0){
					//Warrior was hit and received damage!
					WarriorHit(uint32(eventID),uint64(defender),uint64(attacker),uint32(dmg),uint32(now));
					warriorCore.wearWeapon(attacker);
					warriorCore.wearArmor(defender);
					if(warriorCore.applyDamage(defender,uint64(dmg))) {
						//Applied damage would result in death
						if(warriorCore.getPotions(defender)>0) {
							//Warrior had potions, auto-heal to keep warrior alive!
							warriorCore.autoPotion(defender);
							WarriorDrankPotion(uint32(eventID),uint64(defender),uint64(attacker),uint32(now));
						} else {
							//No potions, warrior defeated
							handleDefeat(eventID,attacker,defender);
							return true;
						}
					}
				}else{
					//Damage was nullified. But warrior was still hit
					WarriorHit(uint32(eventID),uint64(defender),uint64(attacker),0,uint32(now));
				}
			}else{
				//Hit was Blocked!
				WarriorBlocked(uint32(eventID),uint64(defender),uint64(attacker),uint32(dmg),uint32(now));
				//Block still causes wear to weapon, and to shield
				warriorCore.wearWeapon(attacker);
				warriorCore.wearShield(defender);
			}
        } else {
			//Warrior Dodged The Attack!
			WarriorDodged(uint32(eventID),uint64(defender),uint64(attacker),uint32(now));
		}
        return false;
    }

    function removeParticipant(uint eventID, uint removed) internal {
        for(uint i=0;i<getParticipantCount(eventID);i++) {
            if(events[eventID].participants[i]==removed) {
                events[eventID].participants[i] = events[eventID].participants[getParticipantCount(eventID)-1];
                events[eventID].participants.length--;
                return;
            }
        }
    }

}
