pragma solidity ^0.4.18;

import "./WarriorCore.sol";
import "./EventCore.sol";
import "./Utils.sol";

/// @title Core Smart Contract for the BattleDrome Platform. Provides central version control for other components such as WarriorCore and EventCore.
/// @author Paul Mumby
/// @notice For Administrative Interaction Only
/// @dev Currently fairly light-weight, for administrative control/deployment of new contracts in the future. (primarily a placeholder for now)
contract BattleDromeCore is owned,simpleTransferrable {
    
    WarriorCore public warriorCore;
    EventCore public eventCore;
      
    /// @author Paul Mumby
    /// @notice Sets up linkages between child core contracts appropriately
    /// @dev Note this is primarily a placeholder for the time being
    /// @param _warriorCore Address for the new WarriorCore Contract
    /// @param _eventCore Address for the new EventCore Contract
    function setAllChildCores(address _warriorCore, address _eventCore) public onlyOwner {
        warriorCore = WarriorCore(_warriorCore);
        eventCore = EventCore(_eventCore);
    }

    /// @author Paul Mumby
    /// @notice Sets up linkage for WarriorCore only
    /// @dev Note this is primarily a placeholder for the time being
    /// @param core Address for the new WarriorCore Contract
    function setWarriorCore(address core) public onlyOwner {
        warriorCore = WarriorCore(core);
    }

    /// @author Paul Mumby
    /// @notice Sets up linkage for EventCore only
    /// @dev Note this is primarily a placeholder for the time being
    /// @param core Address for the new WarriorCore Contract
    function setEventCore(address core) public onlyOwner {
        eventCore = EventCore(core);
    }
     
}