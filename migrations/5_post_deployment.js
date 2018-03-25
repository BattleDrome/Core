var BattleDromeCore = artifacts.require("BattleDromeCore");
var EventCore = artifacts.require("EventCore");
var WarriorCore = artifacts.require("WarriorCore");

module.exports = function(deployer,network,accounts) {
    var primary = accounts[0];
    deployer.then(function(){
        var coreInstance;
        var wcInstance;
        var ecInstance;
        return BattleDromeCore.deployed().then(function(instance){
            coreInstance = instance;
            return EventCore.deployed();
        }).then(function(instance){
            ecInstance = instance;
            return WarriorCore.deployed();
        }).then(function(instance){
            wcInstance = instance;
        }).then(function(){
            ecInstance.changeController(coreInstance.address);
        }).then(function(){
            wcInstance.changeController(coreInstance.address);
        }).then(function(){       
            coreInstance.setAllChildCores(wcInstance.address,ecInstance.address);
        }).then(function(){       
            ecInstance.setWarriorCore(wcInstance.address);
        }).then(function(){       
            wcInstance.setEventCore(ecInstance.address);
        });
    });
};
