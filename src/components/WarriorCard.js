import React, { Component } from 'react'

import './WarriorCard.css'
import { Card, CardHeader, CardBody, CardFooter, Badge, Progress, Nav, NavItem, NavLink, TabContent, TabPane, Button, DropdownItem, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input, FormText, Alert } from '../../node_modules/reactstrap';
import classnames from 'classnames'
import WarriorImage from './WarriorImage';

class WarriorCard extends Component {
    constructor(props) {
        super(props)
        this.state = {
            flipped: false,
            collapsed: this.props.collapsed || false,
            activeTab: '1',
            modalNameVisible: false,
            modalPayVisible: false,
            modalSellVisible: false,
            modalTeachVisible: false,
            modalTrainWithVisible: false,
            modalWagerVisible: false,
            attributeCost: 0,
            equipmentCost: 0,
            bought: {
                str: 0,
                con: 0,
                dex: 0,
                luck: 0,
                weapon: 0,
                armor: 0,
                shield: 0,
                potions: 0,
                intpotions: 0
            }
        }
        this.cardFlipToggle = this.cardFlipToggle.bind(this)
        this.cardCollapseToggle = this.cardCollapseToggle.bind(this)
        this.toggleModalName = this.toggleModalName.bind(this)
        this.toggleModalPay = this.toggleModalPay.bind(this)
        this.toggleModalSell = this.toggleModalSell.bind(this)
        this.toggleModalTeach = this.toggleModalTeach.bind(this)
        this.toggleModalTrainWith = this.toggleModalTrainWith.bind(this)
        this.toggleModalWager = this.toggleModalWager.bind(this)
        this.less = this.less.bind(this)
        this.more = this.more.bind(this)
        this.updateCosts = this.updateCosts.bind(this)
        this.buyStats = this.buyStats.bind(this)
        this.buyEquip = this.buyEquip.bind(this)
        this.nameWarrior = this.nameWarrior.bind(this)
        this.payWarrior = this.payWarrior.bind(this)
        this.doNameWarrior = this.doNameWarrior.bind(this)
        this.doPayWarrior = this.doPayWarrior.bind(this)
        this.doSellWarrior = this.doSellWarrior.bind(this)
        this.doTeach = this.doTeach.bind(this)
        this.doPlaceWager = this.doPlaceWager.bind(this)
        this.togglePractice = this.togglePractice.bind(this)
        this.toggleTeaching = this.toggleTeaching.bind(this)
        this.toggleSale = this.toggleSale.bind(this)
        this.stopTraining = this.stopTraining.bind(this)
        this.reviveWarrior = this.reviveWarrior.bind(this)
        this.retireWarrior = this.retireWarrior.bind(this)
        this.drinkPotion = this.drinkPotion.bind(this)
        this.doTrainWithWarrior = this.doTrainWithWarrior.bind(this)
        this.buyWarrior = this.buyWarrior.bind(this)
    }

    cardFlipToggle() {
        this.setState({ flipped: !this.state.flipped })
    }

    cardCollapseToggle() {
        this.setState({ collapsed: !this.state.collapsed })
    }

    toggleModalName() {
        this.setState({ modalNameVisible: !this.state.modalNameVisible })
    }

    toggleModalPay() {
        this.setState({ modalPayVisible: !this.state.modalPayVisible })
    }

    toggleModalSell() {
        this.setState({ modalSellVisible: !this.state.modalSellVisible })
    }

    toggleModalTeach() {
        this.setState({ modalTeachVisible: !this.state.modalTeachVisible })
    }

    toggleModalTrainWith() {
        this.setState({ modalTrainWithVisible: !this.state.modalTrainWithVisible })
    }

    toggleModalWager() {
        this.setState({ modalWagerVisible: !this.state.modalWagerVisible })
    }

    fetchAttribute(attrib) {
        let attribVal = this.props.warrior.get(attrib)
        if (attrib === "name" && attribVal === "") attribVal = "UNNAMED"
        if (attribVal === null || attribVal === undefined) {
            return "NULL"
        } else {
            return attribVal
        }
    }

    setBackTab(tab) {
        if (this.state.activeTab !== tab) {
            this.setState({
                activeTab: tab
            });
        }
    }

    async updateCosts() {
        let attribCost = await window.game.getStatCost(+this.fetchAttribute("id"), this.state.bought.str, this.state.bought.dex, this.state.bought.con, this.state.bought.luck);
        let equipCost = 0;
        this.setState({ attributeCost: attribCost, equipmentCost: equipCost });
        console.log("AttribCost:" + attribCost)
    }

    less(thing) {
        let new_bought = this.state.bought
        new_bought[thing] -= 1;
        if (new_bought[thing] < 0) new_bought[thing] = 0;
        this.setState({ bought: new_bought })
        this.updateCosts();
    }

    more(thing) {
        let new_bought = this.state.bought
        new_bought[thing] += 1;
        if (new_bought[thing] > 10) new_bought[thing] = 10;
        this.setState({ bought: new_bought })
        this.updateCosts();
    }

    resetBoughtStats() {
        let newBought = this.state.bought;
        newBought.str = 0;
        newBought.dex = 0;
        newBought.con = 0;
        newBought.luck = 0;
        this.setState({ bought: newBought })
    }

    resetBoughtEquip() {
        let newBought = this.state.bought;
        newBought.weapon = 0;
        newBought.shield = 0;
        newBought.armor = 0;
        newBought.potions = 0;
        newBought.intpotions = 0;
        this.setState({ bought: newBought })
    }

    buyStats() {
        let purchaseWarriorStats = window.game.purchaseWarriorStats.bind(window.game)
        console.log("Buying Stats")
        console.log(window.game)
        console.log(this.state)
        purchaseWarriorStats(+this.fetchAttribute("id"), this.state.bought.str, this.state.bought.con, this.state.bought.dex, this.state.bought.luck)
        this.resetBoughtStats()
    }

    buyEquip() {
        let purchaseWarriorEquip = window.game.purchaseWarriorEquip.bind(window.game)
        purchaseWarriorEquip(+this.fetchAttribute("id"), this.state.bought.weapon, this.state.bought.shield, this.state.bought.armor, this.state.bought.potions, this.state.bought.intpotions)
        this.resetBoughtEquip()
    }

    nameWarrior() {
        this.toggleModalName()
    }

    doNameWarrior(name) {
        window.game.setWarriorName(+this.fetchAttribute("id"), name)
        this.toggleModalName()
    }

    doTrainWithWarrior(warriorID) {
        //TODO: Put checks in here
        window.game.warriorTrainWith(warriorID, +this.fetchAttribute("id"))
    }

    payWarrior() {
        this.toggleModalPay()
    }

    doPayWarrior(amount) {
        window.game.payWarrior(+this.fetchAttribute("id"), amount)
        this.toggleModalPay()
    }

    togglePractice() {
        if (this.fetchAttribute("state") === 1) {
            window.game.warriorStopPractice(+this.fetchAttribute("id"))
        } else {
            window.game.warriorStartPractice(+this.fetchAttribute("id"))
        }
    }

    toggleTeaching() {
        if (this.fetchAttribute("state") === 3) {
            window.game.warriorStopTeaching(+this.fetchAttribute("id"))
        } else {
            this.toggleModalTeach()
        }
    }

    doTeach(amount) {
        window.game.warriorStartTeaching(+this.fetchAttribute("id"), amount)
        this.toggleModalTeach()
    }

    toggleSale() {
        if (this.fetchAttribute("state") === 8) {
            window.game.warriorEndSale(+this.fetchAttribute("id"))
        } else {
            this.toggleModalSell()
        }
    }

    doSellWarrior(amount) {
        window.game.warriorStartSale(+this.fetchAttribute("id"), amount)
        this.toggleModalSell()
    }

    stopTraining() {
        //TODO: Put some checks and UI level error handling in here
        window.game.warriorStopTraining(+this.fetchAttribute("id"))
    }

    reviveWarrior() {
        //TODO: Put some checks and UI level error handling in here
        window.game.warriorRevive(+this.fetchAttribute("id"))
    }

    retireWarrior() {
        //TODO: Put some checks and UI level error handling in here
        window.game.warriorRetire(+this.fetchAttribute("id"))
    }

    drinkPotion() {
        //TODO: Put some checks and UI level error handling in here
        window.game.warriorDrinkPotion(+this.fetchAttribute("id"))
    }

    buyWarrior() {
        window.game.warriorPurchase(+this.fetchAttribute("id"))
    }

    doPlaceWager(amount) {
        window.game.placeWager(+this.props.eventID, +this.fetchAttribute("id"), +amount)
    }

    getTrainingTimeLeftString() {
        var trainingEnds = +this.fetchAttribute("trainingend");
        var currentTime = Math.floor(Date.now() / 1000);
        var secondsLeft = trainingEnds - currentTime;
        var minutesLeft = Math.ceil(secondsLeft / 60);
        var hoursLeft = Math.ceil(minutesLeft / 60);
        var daysLeft = Math.ceil(hoursLeft / 24);
        if (secondsLeft <= 0) {
            if (this.fetchAttribute("state") === 3) {
                return "";
            } else {
                return "Done!";
            }
        } else if (hoursLeft >= 24) {
            return daysLeft + " Days";
        } else if (minutesLeft >= 60) {
            return hoursLeft + " Hours";
        } else {
            return minutesLeft + " Min";
        }
    }

    renderAttribsAdmin() {
        return (
            <div>
                <WarriorAttribute label="STR:">
                    {this.fetchAttribute("str")} (+{this.state.bought.str})
                    <Button className="buy-button" onClick={() => this.less("str")}>-</Button>
                    <Button className="buy-button" onClick={() => this.more("str")}>+</Button>
                </WarriorAttribute>
                <WarriorAttribute label="CON:">
                    {this.fetchAttribute("con")} (+{this.state.bought.con})
                    <Button className="buy-button" onClick={() => this.less("con")}>-</Button>
                    <Button className="buy-button" onClick={() => this.more("con")}>+</Button>
                </WarriorAttribute>
                <WarriorAttribute label="DEX:">
                    {this.fetchAttribute("dex")} (+{this.state.bought.dex})
                    <Button className="buy-button" onClick={() => this.less("dex")}>-</Button>
                    <Button className="buy-button" onClick={() => this.more("dex")}>+</Button>
                </WarriorAttribute>
                <WarriorAttribute label="LUCK:">
                    {this.fetchAttribute("luck")} (+{this.state.bought.luck})
                    <Button className="buy-button" onClick={() => this.less("luck")}>-</Button>
                    <Button className="buy-button" onClick={() => this.more("luck")}>+</Button>
                </WarriorAttribute>
                <WarriorAttributeDivider />
                <Button className="action_button" color="primary" onClick={this.buyStats}>Purchase Attribute Upgrades</Button>
            </div>
        )
    }

    renderAttribsView() {
        return (
            <div>
                <WarriorAttribute label="STR:">
                    {this.fetchAttribute("str")}
                </WarriorAttribute>
                <WarriorAttribute label="CON:">
                    {this.fetchAttribute("con")}
                </WarriorAttribute>
                <WarriorAttribute label="DEX:">
                    {this.fetchAttribute("dex")}
                </WarriorAttribute>
                <WarriorAttribute label="LUCK:">
                    {this.fetchAttribute("luck")}
                </WarriorAttribute>
            </div>
        )
    }

    renderInventoryAdmin() {
        return (
            <div>
                <WarriorAttribute label="Weapon:">{this.fetchAttribute("weapontypestring")}</WarriorAttribute>
                <WarriorAttribute label="Weapon Level:">
                    {this.fetchAttribute("weapon")} (+{this.state.bought.weapon})
                    <Button className="buy-button" onClick={() => this.less("weapon")}>-</Button>
                    <Button className="buy-button" onClick={() => this.more("weapon")}>+</Button>
                </WarriorAttribute>
                <WarriorAttributeDivider />
                <WarriorAttribute label="Shield:">{this.fetchAttribute("shieldtypestring")}</WarriorAttribute>
                <WarriorAttribute label="Shield Level:">
                    {this.fetchAttribute("shield")} (+{this.state.bought.shield})
                    <Button className="buy-button" onClick={() => this.less("shield")}>-</Button>
                    <Button className="buy-button" onClick={() => this.more("shield")}>+</Button>
                </WarriorAttribute>
                <WarriorAttributeDivider />
                <WarriorAttribute label="Armor:">{this.fetchAttribute("armortypestring")}</WarriorAttribute>
                <WarriorAttribute label="Armor Level:">
                    {this.fetchAttribute("armor")} (+{this.state.bought.armor})
                    <Button className="buy-button" onClick={() => this.less("armor")}>-</Button>
                    <Button className="buy-button" onClick={() => this.more("armor")}>+</Button>
                </WarriorAttribute>
                <WarriorAttributeDivider />
                <WarriorAttribute label="Potions:">
                    {this.fetchAttribute("potions")} (+{this.state.bought.potions})
                    <Button className="buy-button" onClick={() => this.less("potions")}>-</Button>
                    <Button className="buy-button" onClick={() => this.more("potions")}>+</Button>
                </WarriorAttribute>
                <WarriorAttribute label="Intelligence Potions:">
                    {this.fetchAttribute("intpotions")} (+{this.state.bought.intpotions})
                    <Button className="buy-button" onClick={() => this.less("intpotions")}>-</Button>
                    <Button className="buy-button" onClick={() => this.more("intpotions")}>+</Button>
                </WarriorAttribute>
                <WarriorAttributeDivider />
                <Button className="action_button" color="primary" onClick={this.buyEquip}>Purchase Specified Equipment</Button>
            </div>
        )
    }

    renderInventoryView() {
        return (
            <div>
                <WarriorAttribute label="Weapon:">{this.fetchAttribute("weapontypestring")}</WarriorAttribute>
                <WarriorAttribute label="Weapon Level:">{this.fetchAttribute("weapon")}</WarriorAttribute>
                <WarriorAttributeDivider />
                <WarriorAttribute label="Shield:">{this.fetchAttribute("shieldtypestring")}</WarriorAttribute>
                <WarriorAttribute label="Shield Level:">{this.fetchAttribute("shield")}</WarriorAttribute>
                <WarriorAttributeDivider />
                <WarriorAttribute label="Armor:">{this.fetchAttribute("armortypestring")}</WarriorAttribute>
                <WarriorAttribute label="Armor Level:">{this.fetchAttribute("armor")}</WarriorAttribute>
                <WarriorAttributeDivider />
                <WarriorAttribute label="Potions:">{this.fetchAttribute("potions")}</WarriorAttribute>
                <WarriorAttribute label="Intelligence Potions:">{this.fetchAttribute("intpotions")}</WarriorAttribute>
            </div>
        )
    }

    renderActionsName() {
        return (
            <div>
                <WarriorButtonRow>
                    <Button className="action-button" color="primary" onClick={this.nameWarrior}>Choose Warrior Name</Button>
                </WarriorButtonRow>
            </div>
        )
    }

    renderActionsStopTraining() {
        return (
            <div>
                <WarriorButtonRow>
                    <Button className="action-button" color="primary" onClick={this.stopTraining}>Finish Training</Button>
                </WarriorButtonRow>
            </div>
        )
    }

    renderActionsDead() {
        return (
            <div>
                <WarriorButtonRow>
                    <Button className="action-button" color="primary" onClick={this.reviveWarrior}>Revive</Button>
                    <Button className="action-button" color="primary" onClick={this.retireWarrior}>Retire</Button>
                </WarriorButtonRow>
            </div>
        )
    }

    renderActionsPotion() {
        return (
            <div>
                <WarriorButtonRow>
                    <Button className="action-button" color="primary" onClick={this.drinkPotion}>Drink Potion</Button>
                </WarriorButtonRow>
            </div>
        )
    }

    renderActionsAdmin() {
        let togglePracticeString = this.fetchAttribute("state") === 1 ? "Finish Practicing" : "Start Practicing"
        let toggleTeachingString = this.fetchAttribute("state") === 3 ? "Stop Teaching" : "Become Teacher/Trainer"
        let toggleSaleString = this.fetchAttribute("state") === 8 ? "Stop Sale" : "Sell Warrior in Marketplace"
        let stopTrainingString = this.fetchAttribute("state") === 2 ? this.renderActionsStopTraining() : ""
        let deadString = this.fetchAttribute("state") === 6 ? this.renderActionsDead() : ""
        let potionString = this.fetchAttribute("potions") > 0 ? this.renderActionsPotion() : ""
        return (
            <div>
                <WarriorButtonRow>
                    <Button className="action-button" color="primary" onClick={this.togglePractice}>{togglePracticeString}</Button>
                </WarriorButtonRow>
                <WarriorButtonRow>
                    <Button className="action-button" color="primary" onClick={this.toggleTeaching}>{toggleTeachingString}</Button>
                </WarriorButtonRow>
                <WarriorButtonRow>
                    <Button className="action-button" color="primary" onClick={this.toggleSale}>{toggleSaleString}</Button>
                </WarriorButtonRow>
                {stopTrainingString}
                {deadString}
                {potionString}
            </div>
        )
    }

    renderActionsBuy() {
        return (
            <div>
                <WarriorButtonRow>
                    <Button className="action-button" color="primary" onClick={this.buyWarrior}>Purchase Warrior</Button>
                </WarriorButtonRow>
            </div>
        )
    }

    renderActionsTrain() {
        return (
            <div>
                <WarriorButtonRow>
                    <Button className="action-button" color="primary" onClick={this.toggleModalTrainWith}>Train With This Warrior</Button>
                </WarriorButtonRow>
            </div>
        )
    }

    renderWagerButton() {
        if (this.props.inEvent) {
            return (
                <div>
                    <WarriorButtonRow>
                        <Button className="action-button" color="primary" onClick={this.toggleModalWager}>Place Wager on this Warrior</Button>
                    </WarriorButtonRow>
                </div>
            )
        }
    }

    renderRoundedNumber(originalValue, dp = 2) {
        if (originalValue % 1 !== 0) {
            return originalValue.toFixed(dp).toString()
        } else {
            return originalValue.toString()
        }
    }

    render() {
        let isOwner = this.fetchAttribute("owner") === window.chaindata.cachedAccount
        let baseClass = this.state.collapsed ? "warrior-card warrior-card-collapsed" : "warrior-card"
        let collapseClass = this.state.collapsed ? "hidden-collapsed" : ""
        let flipIconClass = this.state.collapsed ? "hidden-collapsed" : "flip-icon"
        let collapseIconClass = this.state.collapsed ? "expand-icon" : "collapse-icon"
        let flippedClass = this.state.flipped ? baseClass + " flipped" : baseClass
        let warriorCosmetics = {
            color: this.fetchAttribute("color"),
            gender: this.fetchAttribute("gender"),
            skintone: this.fetchAttribute("skintone"),
            eyes: this.fetchAttribute("eyes"),
            nose: this.fetchAttribute("nose"),
            mouth: this.fetchAttribute("mouth"),
            hair: this.fetchAttribute("hair"),
            weapontype: this.fetchAttribute("weapontype"),
            armortype: this.fetchAttribute("armortype"),
            shieldtype: this.fetchAttribute("shieldtype"),
        }
        let statusString = this.fetchAttribute("statestring")
        if (statusString === "Practicing" || statusString === "Training" || statusString === "Teaching") {
            statusString += " " + this.getTrainingTimeLeftString()
        }
        let frontString = ""
        switch (statusString.split(" ")[0]) {
            case "ForSale": frontString = "Price: " + this.renderRoundedNumber(this.fetchAttribute("saleprice")) + " Finney"; break
            case "Teaching": frontString = this.fetchAttribute("dominantstat") + " - Fee: " + this.renderRoundedNumber(this.fetchAttribute("teachingfee")) + " Finney"; break
            default: frontString = this.renderRoundedNumber(this.fetchAttribute("balance")) + " Finney"
        }
        let backHeadingString = isOwner ? "Manage: " + this.fetchAttribute("name") : "Details: " + this.fetchAttribute("name")
        let renderedAttributes = isOwner ? this.renderAttribsAdmin() : this.renderAttribsView()
        let renderedInventory = isOwner ? this.renderInventoryAdmin() : this.renderInventoryView()
        let renderedActionButtonName = isOwner && this.fetchAttribute("name") === "UNNAMED" ? this.renderActionsName() : ""
        let renderedActionButtonsAdmin = isOwner ? this.renderActionsAdmin() : ""
        let renderedActionButtonsBuy = this.fetchAttribute("state") === 8 && !isOwner ? this.renderActionsBuy() : ""
        let renderedActionButtonsTrain = this.fetchAttribute("state") === 3 ? this.renderActionsTrain() : ""
        return (
            <div className="warrior-card-container">
                <Card className={flippedClass}>
                    <div className="front">
                        <CardHeader>
                            <Badge className="badge-status" color={this.fetchAttribute("statetypestring")}>{statusString}</Badge>
                            <span>{this.fetchAttribute("name")} </span>
                            <Badge className="badge-level" color="light">Lvl:{this.fetchAttribute("level")}</Badge>
                            <img className={flipIconClass} src="images/flip.png" alt="Flip" onClick={this.cardFlipToggle}></img>
                            <img className={collapseIconClass} alt="Collapse" onClick={this.cardCollapseToggle}></img>
                        </CardHeader>
                        {this.renderWagerButton()}
                        <WarriorImage className={collapseClass} cosmeticData={warriorCosmetics} imageSmoothingEnabled="true" />
                        <CardBody className={collapseClass}>
                            <div className="warrior-attribute">{frontString}</div>
                        </CardBody>
                        <CardFooter>
                            <Progress color="success" value={this.fetchAttribute("xppercent")}>
                                XP: {this.fetchAttribute("xp")}/{this.fetchAttribute("xpnext")}
                            </Progress>
                            <Progress color="danger" value={this.fetchAttribute("hppercent")}>
                                HP: {this.fetchAttribute("hp")}/{this.fetchAttribute("basehp")}
                            </Progress>
                        </CardFooter>
                    </div>
                    <div className="back">
                        <CardHeader>
                            <span>{backHeadingString}</span>
                            <Badge className="badge-level" color="light">Lvl:{this.fetchAttribute("level")}</Badge>
                            <img className={flipIconClass} src="images/flip.png" alt="Flip" onClick={this.cardFlipToggle}></img>
                        </CardHeader>
                        <CardBody className={collapseClass}>
                            <Nav tabs>
                                <NavItem>
                                    <NavLink className={classnames({ active: this.state.activeTab === '1' })} onClick={() => { this.setBackTab('1'); }}>
                                        Attributes
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className={classnames({ active: this.state.activeTab === '2' })} onClick={() => { this.setBackTab('2'); }}>
                                        Inventory
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className={classnames({ active: this.state.activeTab === '3' })} onClick={() => { this.setBackTab('3'); }}>
                                        Actions
                                    </NavLink>
                                </NavItem>
                            </Nav>
                            <TabContent activeTab={this.state.activeTab}>
                                <TabPane tabId="1">
                                    <WarriorAttribute label="Points Balance:">{this.fetchAttribute("points")}{this.state.attributeCost > 0 ? " (-" + this.state.attributeCost.toString() + ")" : ""}</WarriorAttribute>
                                    <WarriorAttributeDivider />
                                    {renderedAttributes}
                                </TabPane>
                                <TabPane tabId="2">
                                    <WarriorAttribute label="Balance:">{this.fetchAttribute("balance")} Finney</WarriorAttribute>
                                    <WarriorAttributeDivider />
                                    {renderedInventory}
                                </TabPane>
                                <TabPane tabId="3">
                                    {renderedActionButtonName}
                                    <WarriorButtonRow>
                                        <Button className="action-button" color="primary" onClick={this.payWarrior}>Pay Warrior</Button>
                                    </WarriorButtonRow>
                                    {renderedActionButtonsAdmin}
                                    {renderedActionButtonsBuy}
                                    {renderedActionButtonsTrain}
                                </TabPane>
                            </TabContent>
                        </CardBody>
                        <CardFooter>
                        </CardFooter>
                    </div>
                </Card>
                <WarriorNameForm visible={this.state.modalNameVisible} onToggle={this.toggleModalName} onSubmit={this.doNameWarrior} />
                <WarriorAmountForm
                    header="Pay Warrior"
                    description="Enter the amount to pay the warrior"
                    placeholder="0 (Finney)"
                    buttonText="Finalize Payment"
                    visible={this.state.modalPayVisible}
                    onToggle={this.toggleModalPay}
                    onSubmit={this.doPayWarrior}
                />
                <WarriorAmountForm
                    header="Sell Warrior in Marketplace"
                    description="Enter the Asking Price for this sale"
                    placeholder="100 (Finney)"
                    buttonText="Initiate Sale"
                    visible={this.state.modalSellVisible}
                    onToggle={this.toggleModalSell}
                    onSubmit={this.doSellWarrior}
                />
                <WarriorAmountForm
                    header="Begin Teaching"
                    description="Please choose a teaching fee for this warrior"
                    placeholder="50 (Finney)"
                    buttonText="Begin Teaching"
                    visible={this.state.modalTeachVisible}
                    onToggle={this.toggleModalTeach}
                    onSubmit={this.doTeach}
                />
                <TrainWithModal
                    visible={this.state.modalTrainWithVisible}
                    warriors={this.props.warriors}
                    trainerID={this.fetchAttribute("id")}
                    onSubmit={this.doTrainWithWarrior}
                    onToggle={this.toggleModalTrainWith}
                />
                <WagerModal
                    visible={this.state.modalWagerVisible}
                    onSubmit={this.doPlaceWager}
                    onToggle={this.toggleModalWager}
                    warriorID={this.fetchAttribute("id")}
                    eventID={this.props.eventID}
                />
            </div>
        );
    }
}

class WarriorAmountForm extends Component {
    constructor(props) {
        super(props)
        this.state = {
            amount: ""
        }
        this.handleAmountChange = this.handleAmountChange.bind(this)
        this.handleAmountSubmit = this.handleAmountSubmit.bind(this)
        this.toggle = this.toggle.bind(this)
    }

    handleAmountChange(event) {
        this.setState({ amount: event.target.value });
    }

    handleAmountSubmit(event) {
        this.props.onSubmit(this.state.amount)
        event.preventDefault()
    }

    toggle() {
        this.props.onToggle()
    }

    render() {
        return (
            <Modal size="sm" isOpen={this.props.visible} toggle={this.toggle} className="warrior_modal_amount">
                <ModalHeader toggle={this.toggle}>{this.props.header}</ModalHeader>
                <ModalBody>
                    <Form onSubmit={e => { e.preventDefault(); }}>
                        <FormGroup>
                            <Label for="name">{this.props.description}</Label>
                            <Input type="number" name="amount" id="amount" placeholder={this.props.placeholder} onChange={this.handleAmountChange} />
                        </FormGroup>
                    </Form>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={this.toggle}>Cancel</Button>
                    <Button color="primary" onClick={this.handleAmountSubmit}>{this.props.buttonText}</Button>
                </ModalFooter>
            </Modal>
        )
    }
}

class WarriorNameForm extends Component {
    constructor(props) {
        super(props)
        this.state = {
            name: ""
        }
        this.handleNameChange = this.handleNameChange.bind(this)
        this.handleNameSubmit = this.handleNameSubmit.bind(this)
        this.toggle = this.toggle.bind(this)
    }

    handleNameChange(event) {
        this.setState({ name: event.target.value });
    }

    handleNameSubmit(event) {
        this.props.onSubmit(this.state.name)
        event.preventDefault()
    }

    toggle() {
        this.props.onToggle()
    }

    render() {
        return (
            <Modal size="sm" isOpen={this.props.visible} toggle={this.toggle} className="warrior_modal_name">
                <ModalHeader toggle={this.toggle}>Select Warrior Name</ModalHeader>
                <ModalBody>
                    <Form onSubmit={e => { e.preventDefault(); }}>
                        <FormGroup>
                            <Label for="name">Warrior Name</Label>
                            <Input name="name" id="name" placeholder="New Warrior Name" onChange={this.handleNameChange} />
                        </FormGroup>
                    </Form>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={this.toggle}>Cancel</Button>
                    <Button color="primary" onClick={this.handleNameSubmit}>Finalize Name</Button>
                </ModalFooter>
            </Modal>
        )
    }
}

class WarriorButtonRow extends Component {
    render() {
        return (
            <div className="warrior-action-row">
                {this.props.children}
            </div>
        )
    }
}

class WarriorAttribute extends Component {
    render() {
        return (
            <div className="warrior-attribute">
                <div className="warrior-attribute-label">
                    {this.props.label}
                </div>
                <div className="warrior-attribute-value">
                    {this.props.children}
                </div>
            </div>
        )
    }
}

class WarriorAttributeDivider extends Component {
    render() {
        return (
            <div className="warrior-attribute-divider">
                <DropdownItem divider />
            </div>
        )
    }
}

class TrainWithModal extends Component {
    constructor(props) {
        super(props)
        this.handleSubmit = this.handleSubmit.bind(this)
        this.toggle = this.toggle.bind(this)
        this.validate = this.validate.bind(this)
        this.state = {
            error: false
        }
    }

    async handleSubmit(event) {
        event.persist()
        if (await this.validate(event.target.value)) {
            this.setState({ error: false })
            this.props.onSubmit(event.target.value)
            this.toggle()
        } else {
            this.setState({ error: true })
        }
        event.preventDefault()
    }

    async validate(chosenID) {
        return await window.game.canTrainWith(chosenID, this.props.trainerID)
    }

    toggle() {
        this.setState({ error: false })
        this.props.onToggle()
    }

    renderButtonList(availableWarriors) {
        return availableWarriors.map((warrior) => <Button className="warrior-train-button" key={warrior.get("id")} value={warrior.get("id")} color="primary" onClick={this.handleSubmit}>{warrior.get("id").toString()}: {warrior.get("name")}</Button>);
    }

    render() {
        let availableWarriors = this.props.warriors.filter(async (warrior) => {
            return (
                warrior.get("state") === 0 &&
                warrior.get("owner") === await window.chaindata.cachedAccount
            )
        })
        let formContents = ""
        let formError = this.state.error ? <Alert className="train-error" color="danger">That Warrior is currently unable to train with the selected Trainer. (note: this could be due to level, dominant stat level, available funds, or the trainer being busy)</Alert> : ""
        if (availableWarriors.length > 0) {
            formContents = (
                <Form onSubmit={e => { e.preventDefault(); }}>
                    <FormGroup>
                        <FormText>Please select one of your warriors below who is available to train with the selected trainer:</FormText>
                        {this.renderButtonList(availableWarriors)}
                        {formError}
                    </FormGroup>
                </Form>
            )
        } else {
            formContents = "You don't have any available warriors to train at this time (with this trainer)!"
        }
        return (
            <Modal size="sm" isOpen={this.props.visible} toggle={this.toggle} className="warrior_modal_train">
                <ModalHeader toggle={this.toggle}>Select a Warrior to Train</ModalHeader>
                <ModalBody>{formContents}</ModalBody>
            </Modal>
        )
    }
}

class WagerModal extends Component {
    constructor(props) {
        super(props)
        this.handleSubmit = this.handleSubmit.bind(this)
        this.handleAmountChange = this.handleAmountChange.bind(this)
        this.validate = this.validate.bind(this)
        this.toggle = this.toggle.bind(this)
        this.state = {
            error: false,
            amount: 1
        }
    }

    handleAmountChange(event) {
        this.setState({ amount: event.target.value });
    }

    async handleSubmit(event) {
        event.persist()
        if (await this.validate(this.state.amount)) {
            this.setState({ error: false })
            this.props.onSubmit(this.state.amount)
            this.toggle()
        } else {
            this.setState({ error: true })
        }
        event.preventDefault()
    }

    async validate(amount) {
        return await window.game.canWager(+amount, +this.props.warriorID, +this.props.eventID)
    }

    toggle() {
        this.props.onToggle()
    }

    render() {
        let formError = this.state.error ? <Alert className="wager-error" color="danger">That wager is invalid. It may be that the amount is below the minimum, or that you are unable to wager for another reason (for example you may already have a wager on another warrior which conflicts)</Alert> : ""
        return (
            <Modal size="sm" isOpen={this.props.visible} toggle={this.toggle} className="warrior_modal_amount">
                <ModalHeader toggle={this.toggle}>Place Wager</ModalHeader>
                <ModalBody>
                    <Form onSubmit={e => { e.preventDefault(); }}>
                        <FormGroup>
                            <FormText>Please enter an amount to wager (Finney)</FormText>
                            {formError}
                            <Input type="number" name="amount" id="amount" placeholder={this.state.amount} onChange={this.handleAmountChange} />
                        </FormGroup>
                    </Form>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={this.toggle}>Cancel</Button>
                    <Button color="primary" onClick={this.handleSubmit}>Place Wager</Button>
                </ModalFooter>
            </Modal>
        )
    }
}

export default WarriorCard
