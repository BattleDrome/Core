import React, { Component } from 'react'

import './EventSpectator.css'
import { Modal, ModalHeader, ModalBody, ModalFooter, Alert, Row, Col, Button, Card, CardHeader, CardBody, Collapse, Badge } from '../../node_modules/reactstrap';
import WarriorCard from './WarriorCard';
import AdItem from './AdItem';
import SponsorBidForm from './SponsorBidForm';

class EventSpectator extends Component {
    constructor(props) {
        super(props)
        this.toggle = this.toggle.bind(this)
        this.pollEvent = this.pollEvent.bind(this)
        this.startEvent = this.startEvent.bind(this)
        this.calcEvent = this.calcEvent.bind(this)
        this.payEvent = this.payEvent.bind(this)
        this.state = {
            modalBidVisible: false
        }
        this.toggleModalBid = this.toggleModalBid.bind(this)
    }

    toggleModalBid() {
        this.setState({ modalBidVisible: !this.state.modalBidVisible })
    }

    componentDidMount() {
        this.scrollToBottom()
    }

    toggle() {
        this.props.onToggle()
    }

    pollEvent() {
        window.game.pollEvent(this.fetchAttribute("id"))
    }

    startEvent() {
        window.game.startEvent(this.fetchAttribute("id"))
    }

    calcEvent() {
        window.game.calculateWagerWinners(this.fetchAttribute("id"))
    }

    payEvent() {
        window.game.payWagerWinners(this.fetchAttribute("id"))
    }

    fetchAttribute(attrib) {
        let attribVal = this.props.event.get(attrib)
        if (attribVal === null || attribVal === undefined) {
            return "NULL"
        } else {
            return attribVal
        }
    }

    scrollToBottom = () => {
        //this.logEnd.scrollIntoView({ behavior: "smooth" })
        //TODO: Autoscroll would be nice...
    }

    renderStartButton() {
        if (this.fetchAttribute("canstart") && this.fetchAttribute("state") === 0) {
            return (
                <Button className="action-button" color="success" onClick={this.startEvent}>Start The Event</Button>
            )
        } else {
            return ""
        }
    }

    renderPollButton() {
        if (this.fetchAttribute("state") === 1) {
            return (
                <Button className="action-button" color="info" onClick={this.pollEvent}>Poll This Event (Crew)</Button>
            )
        } else {
            return ""
        }
    }

    renderCalcButton() {
        if (this.fetchAttribute("cancalculate")) {
            return (
                <Button className="action-button" color="warning" onClick={this.calcEvent}>Calculate Wagers</Button>
            )
        } else {
            return ""
        }
    }

    renderPayButton() {
        if (this.fetchAttribute("canpay")) {
            return (
                <Button className="action-button" color="warning" onClick={this.payEvent}>Payout Wagers</Button>
            )
        } else {
            return ""
        }
    }

    renderCloseButton() {
        return (
            <Button className="action-button" color="primary" onClick={this.toggle}>Close</Button>
        )
    }

    renderButtons() {
        return (
            <div>
                {this.renderStartButton()}
                {this.renderPollButton()}
                {this.renderCalcButton()}
                {this.renderPayButton()}
                {this.renderCloseButton()}
            </div>
        )
    }

    render() {
        let logs = this.fetchAttribute("logentries").map((log) => {
            log.key = log.blockNumber + "_" + log.transactionIndex + "_" + log.logIndex
            return log
        })
        const combatLogs = logs.map((log) => <CombatLogEntry log={log} key={log.key} />);
        const polls = this.fetchAttribute("polls").map((poll, index) => <Alert key={index} className="poll_alert" color="info">{poll}</Alert>)
        const wagers = this.fetchAttribute("wagers").map((wager, index) => <Wager key={index} className="wager_alert" calculated={this.fetchAttribute("wagerscalculated")} wager={wager} warriors={this.fetchAttribute("participants")} />)
        const sponsorship = this.fetchAttribute("sponsorship");
        const bids = sponsorship.bids.map((bid, index) => <Bid key={index} className="bid_alert" calculated={sponsorship.winnersCalculated} bid={bid} />)
        const ads = sponsorship.winningAds.map((ad, index) => <AdItem key={index} ad={ad} />)
        const ad = ads.length > 0 ? ads[Math.floor(Math.random() * ads.length)] : ""
        const warriors = this.fetchAttribute("participants").map((warrior) => <WarriorCard warriors={this.props.warriors} inEvent={true} eventID={this.fetchAttribute("id")} collapsed={true} warrior={warrior} key={warrior.get("id")} />);
        const wagerCount = this.fetchAttribute("wagers").length
        const bidCount = bids.length
        const pollCount = this.fetchAttribute("polls").length
        const participantCount = this.fetchAttribute("participants").length
        return (
            <Modal isOpen={this.props.visible} toggle={this.toggle} className="event_spectator_modal">
                <ModalHeader toggle={this.toggle}>Spectating Event: #{this.fetchAttribute("id")}</ModalHeader>
                <ModalBody>
                    <Row className="spectator_main_row">
                        <Col className="utility_column">
                            <UtilityPanel expanded={true} headerText="Event Statistics">
                                <EventAttribute label="Crew Pool:">{this.fetchAttribute("crewpool")} Finney</EventAttribute>
                                <EventAttribute label="Prize Pool:">{this.fetchAttribute("prizepool")} Finney</EventAttribute>
                                <EventAttributeDivider />
                                <EventAttribute label="Level Range:">Min:{this.fetchAttribute("minlevel")} / Max:{this.fetchAttribute("maxlevel")}</EventAttribute>
                                <EventAttribute label="Equipment Range:">Min:{this.fetchAttribute("minequiplevel")} / Max:{this.fetchAttribute("maxequiplevel")}</EventAttribute>
                                <EventAttributeDivider />
                                <EventAttribute label="Participation:">Min:{this.fetchAttribute("warriormin")} / Max:{this.fetchAttribute("warriormax")}</EventAttribute>
                                <EventAttributeDivider />
                            </UtilityPanel>
                            <UtilityPanel expanded={false} headerText="Wagers" headerBadge={wagerCount}>
                                {wagers}
                            </UtilityPanel>
                            <UtilityPanel expanded={false} headerText="Poll History" headerBadge={pollCount}>
                                {polls}
                            </UtilityPanel>
                            <UtilityPanel expanded={false} headerText="Participants" headerBadge={participantCount}>
                                {warriors}
                            </UtilityPanel>
                            <UtilityPanel expanded={false} headerText="Advertising" headerBadge={bidCount}>
                                <Button outline color="success" size="sm" onClick={this.toggleModalBid}>New Sponsorship Bid</Button>
                                <SponsorBidForm eventID={this.fetchAttribute("id")} ads={this.props.ads} visible={this.state.modalBidVisible} onToggle={this.toggleModalBid} />
                                {bids}
                            </UtilityPanel>
                        </Col>
                        <Col className="log_column">
                            {ad}
                            {combatLogs}
                            <div className="combat_log_bottom" ref={(el) => { this.logEnd = el; }}></div>
                        </Col>
                    </Row>
                </ModalBody>
                <ModalFooter>
                    {this.renderButtons()}
                </ModalFooter>
            </Modal>
        )
    }
}

class EventAttribute extends Component {
    render() {
        return (
            <div className="event-attribute">
                <div className="event-attribute-label">
                    {this.props.label}
                </div>
                <div className="event-attribute-value">
                    {this.props.children}
                </div>
            </div>
        )
    }
}

class EventAttributeDivider extends Component {
    render() {
        return (
            <div className="event-attribute-divider">
            </div>
        )
    }
}

class UtilityPanel extends Component {
    static defaultProps = {
        expanded: false,
        headerText: "Header",
        headerBadge: ""
    }

    constructor(props) {
        super(props)
        this.state = {
            expanded: props.expanded
        }
        this.toggle = this.toggle.bind(this)
    }

    toggle() {
        this.setState({ expanded: !this.state.expanded })
    }

    renderHeaderBadge() {
        if (String(this.props.headerBadge).length > 0) {
            return (
                <Badge className="utility_badge_alert" color="dark">{this.props.headerBadge}</Badge>
            )
        } else {
            return ""
        }
    }

    render() {
        let collapseIconClass = this.state.expanded ? "collapse-icon" : "expand-icon"
        return (
            <Card className="utility-card">
                <CardHeader onClick={this.toggle}>
                    {this.props.headerText}
                    {this.renderHeaderBadge()}
                    <img className={collapseIconClass} alt="Collapse"></img>
                </CardHeader>
                <Collapse isOpen={this.state.expanded}>
                    <CardBody>
                        {this.props.children}
                    </CardBody>
                </Collapse>
            </Card>
        )
    }
}

class CombatLogEntry extends Component {
    static defaultProps = {
        log: {
            blockNumber: 0,
            timeStamp: 0,
            event: "TestEvent",
            logIndex: 0,
            args: {
                test_val: "Test",
                other_val: "Other"
            }
        }
    }

    constructor(props) {
        super(props)
        this.state = {
            color: "secondary",
            message: "..."
        }
    }

    async componentDidMount() {
        await this.updateLog()
    }

    async updateLog() {
        this.setState({
            color: this.getColor(),
            message: await this.processMessage()
        })
    }

    async buildLogMessageEngage() {
        let wc = window.chaindata.contractInstances['WarriorCore'];
        let warriorIDA = this.props.log.args.warriorA
        let warriorIDB = this.props.log.args.warriorB
        let warriorNameA = await wc.getName(warriorIDA.toNumber())
        let warriorNameB = await wc.getName(warriorIDB.toNumber())
        return "Warrior [" + warriorNameA + ":" + warriorIDA + "] Engaged Warrior [" + warriorNameB + ":" + warriorIDB + "]"
    }

    async buildLogMessageHit() {
        let wc = window.chaindata.contractInstances['WarriorCore'];
        let defenderID = this.props.log.args.warrior
        let attackerID = this.props.log.args.attacker
        let defenderName = await wc.getName(defenderID.toNumber())
        let attackerName = await wc.getName(attackerID.toNumber())
        let damage = this.props.log.args.damageDealt
        if (damage > 0) {
            return "Warrior [" + attackerName + ":" + attackerID + "] Successfully Hit Warrior [" + defenderName + ":" + defenderID + "] for " + damage + " Damage!"
        } else {
            return "Warrior [" + attackerName + ":" + attackerID + "] Successfully Hit Warrior [" + defenderName + ":" + defenderID + "] But No Damage Was Dealt!"
        }
    }

    async buildLogMessageDodge() {
        let wc = window.chaindata.contractInstances['WarriorCore'];
        let defenderID = this.props.log.args.warrior
        let attackerID = this.props.log.args.attacker
        let defenderName = await wc.getName(defenderID.toNumber())
        let attackerName = await wc.getName(attackerID.toNumber())
        return "Warrior [" + defenderName + ":" + defenderID + "] Successfully Dodged an Attack By Warrior [" + attackerName + ":" + attackerID + "]"
    }

    async buildLogMessageBlock() {
        let wc = window.chaindata.contractInstances['WarriorCore'];
        let defenderID = this.props.log.args.warrior
        let attackerID = this.props.log.args.attacker
        let defenderName = await wc.getName(defenderID.toNumber())
        let attackerName = await wc.getName(attackerID.toNumber())
        return "Warrior [" + defenderName + ":" + defenderID + "] Successfully Blocked an Attack By Warrior [" + attackerName + ":" + attackerID + "]"
    }

    async buildLogMessageEquipment() {
        let wc = window.chaindata.contractInstances['WarriorCore'];
        let warriorID = this.props.log.args.warrior
        let warriorName = await wc.getName(warriorID.toNumber())
        let logEquipType = this.props.log.args.equipment.toString()
        let logEquipLevel = this.props.log.args.result.toString()
        let equipmentType = ""
        console.log("Equipment Worn:" + typeof (logEquipType) + " T:" + logEquipType + " @" + logEquipLevel)
        switch (logEquipType) {
            case "0": equipmentType = "Weapon"; break;
            case "1": equipmentType = "Shield"; break;
            case "2": equipmentType = "Armor"; break;
            default: equipmentType = "UNKNOWN"; break;
        }
        return "Warrior [" + warriorName + ":" + warriorID + "]'s " + equipmentType + " has worn, and has been reduced in quality!"
    }

    async buildLogMessagePotion() {
        let wc = window.chaindata.contractInstances['WarriorCore'];
        let warriorID = this.props.log.args.warrior
        let warriorName = await wc.getName(warriorID.toNumber())
        return "Warrior [" + warriorName + ":" + warriorID + "] quickly quaffed a potion in order to recover!"
    }

    async buildLogMessageDefeat() {
        let wc = window.chaindata.contractInstances['WarriorCore'];
        let defenderID = this.props.log.args.warrior
        let attackerID = this.props.log.args.attacker
        let defenderName = await wc.getName(defenderID.toNumber())
        let attackerName = await wc.getName(attackerID.toNumber())
        let defenderLevel = this.props.log.args.warriorLevel
        let attackerLevel = this.props.log.args.attackerLevel
        return "Warrior [" + attackerName + ":" + attackerID + "] of Level:" + attackerLevel + " Has Defeated Warrior [" + defenderName + ":" + defenderID + "] of Level:" + defenderLevel
    }

    async buildLogMessageWinner() {
        let wc = window.chaindata.contractInstances['WarriorCore'];
        let id = this.props.log.args.warrior
        let name = await wc.getName(id.toNumber())
        return "Warrior [" + name + ":" + id + "] Has Been Declared The WINNER!"
    }

    async processMessage() {
        let lightLog = {
            blockNumber: this.props.log.blockNumber,
            timeStamp: this.props.log.timeStamp,
            event: this.props.log.event,
            logIndex: this.props.log.logIndex,
            args: this.props.log.args
        }
        let logMessage = ""
        switch (this.props.log.event) {
            case "EventStarted":
                logMessage = "Event Started!"
                break
            case "WarriorEngaged":
                logMessage = await this.buildLogMessageEngage()
                break
            case "WarriorHit":
                logMessage = await this.buildLogMessageHit()
                break
            case "WarriorDodged":
                logMessage = await this.buildLogMessageDodge()
                break
            case "WarriorBlocked":
                logMessage = await this.buildLogMessageBlock()
                break
            case "WarriorDefeated":
                logMessage = await this.buildLogMessageDefeat()
                break
            case "EquipmentWorn":
                logMessage = await this.buildLogMessageEquipment()
                break
            case "WarriorDrankPotion":
                logMessage = await this.buildLogMessagePotion()
                break
            case "EventWinner":
                logMessage = await this.buildLogMessageWinner()
                break
            case "EventFinished":
                logMessage = "Event Finished!"
                break
            default: logMessage = "Unhandled Combat Event: " + JSON.stringify(lightLog)
        }
        return logMessage
    }

    getColor() {
        switch (this.props.log.event) {
            case "WarriorEngaged": return "info"
            case "WarriorHit": return "warning"
            case "EquipmentWorn": return "warning"
            case "WarriorDodged": return "success"
            case "WarriorBlocked": return "success"
            case "WarriorDefeated": return "danger"
            case "WarriorDrankPotion": return "secondary"
            case "EventWinner": return "success"
            default: return "secondary"
        }
    }

    render() {
        return (
            <Alert className="log_message_alert" color={this.state.color}>{this.state.message}</Alert>
        )
    }
}

class Wager extends Component {
    static defaultProps = {
        wager: {
            amount: 0,
            id: 0,
            owner: 0x00,
            warrior: 0,
            warriorname: "",
            won: false,
        },
        warrior: {},
        calculated: false
    }

    getColor() {
        if (!this.props.calculated) {
            return "info"
        } else {
            if (this.props.wager.won) {
                return "success"
            } else {
                return "danger"
            }
        }
    }

    getText() {
        let warriorName = this.props.wager.warriorname
        let warriorID = this.props.wager.warrior
        let ownerAddress = this.props.wager.owner
        let amount = this.props.wager.amount
        return (
            <div>
                {amount} Finney On: {warriorName} (ID:{warriorID})<br />
                By: {ownerAddress}
            </div>
        )
    }

    render() {
        return (
            <Alert className={this.props.className} color={this.getColor()}>{this.getText()}</Alert>
        )
    }
}

class Bid extends Component {
    static defaultProps = {
        bid: {
            id: 0,
            owner: 0x00,
            amount: 0,
            ad: {},
            won: false,
        },
        calculated: false
    }

    getColor() {
        if (!this.props.calculated) {
            return "info"
        } else {
            if (this.props.bid.won) {
                return "success"
            } else {
                return "danger"
            }
        }
    }

    getText() {
        let ownerAddress = this.props.bid.owner
        let amount = this.props.bid.amount
        let ad = <AdItem ad={this.props.bid.ad} />
        return (
            <div>
                {amount} Finney<br />
                By: {ownerAddress}
                {ad}
            </div>
        )
    }

    render() {
        return (
            <Alert className={this.props.className} color={this.getColor()}>{this.getText()}</Alert>
        )
    }
}

export default EventSpectator
