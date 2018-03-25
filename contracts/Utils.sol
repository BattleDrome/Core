pragma solidity ^0.4.18;

contract owned {
    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }
    
    function owned() public {
        owner = msg.sender;
    }
    
    function setOwner(address _newOwner) internal {
        owner = _newOwner;
    }
}

//Replacement for "changeOwner" in "owned" contract. Need a means for "simpler" contracts to simply have their owner changed
contract simpleTransferrable is owned {
    function changeOwner(address _newOwner) public onlyOwner {
        owner = _newOwner;
    }
}

contract mortal is owned {
    function eol() public onlyOwner {
        selfdestruct(owner);
    }
}

contract controlled is owned {
    address public controller;
    
    modifier onlyController() {
        require(msg.sender == controller);
        _;
    }
    
    modifier onlyControllerOrOwner() {
        require(msg.sender == controller || msg.sender == owner);
        _;
    }

    function controlled() public {
        controller = msg.sender;
    }
    
    function setController(address _newController) internal {
        controller = _newController;
    }
    
    function changeController(address _newController) public onlyController {
        controller = _newController;
    }
}

contract priced {
    modifier costs(uint _amount){
        require(msg.value >= _amount);
        _;
        if (msg.value > _amount) msg.sender.transfer(msg.value - _amount);
    }

    modifier costsWithExcess(uint _amount){
        require(msg.value >= _amount);
        _;
    }
}

contract hasRNG {
    uint64 nonce = 1;
    bytes32 hashCache;
    uint8 bytesLeft = 0;

    function reCache() internal {
        bytesLeft = 32;
        hashCache = getRandomBytes();
    }

    function getRandomBytes() internal returns (bytes32) {
        nonce++;
        uint64 hashSeed = uint64(block.blockhash(block.number-1));
        return keccak256(nonce,hashSeed);
    }   

    function getRandomUint8() internal returns (uint8) {
        if(bytesLeft<1) reCache();
        bytesLeft -= 1;
        return uint8(hashCache[bytesLeft]);
    }

    function getRandomUint16() internal returns (uint16) {
        uint16 valA = getRandomUint8();
        uint16 valB = getRandomUint8();
        return (valA << 8) + valB;
    }

    function getRandomUint24() internal returns (uint24) {
        uint24 valA = getRandomUint8();
        uint24 valB = getRandomUint8();
        uint24 valC = getRandomUint8();
        return (valA << 16) + (valB << 8) + valC;
    }

    function getRandom() internal returns (uint) {
        return uint(getRandomBytes());
    }
    
    function getRandomRange(uint min, uint max) internal returns (uint) {
        return (getRandom() % ((max+1)-min)) + min;
    }

    function getRandomRange8(uint min, uint max) internal returns (uint8) {
        return uint8((getRandomUint8() % ((max+1)-min)) + min);
    }

    function getRandomRange16(uint min, uint max) internal returns (uint16) {
        return uint16((getRandomUint16() % ((max+1)-min)) + min);
    }

    function getRandomRange24(uint min, uint max) internal returns (uint24) {
        return uint24((getRandomUint24() % ((max+1)-min)) + min);
    }
}
