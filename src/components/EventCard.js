import React, { Component } from 'react'

import './EventCard.css'
import { Card, CardHeader, CardBody, CardFooter, Badge, DropdownItem, Button, Modal, ModalHeader, ModalBody, Form, FormGroup, FormText, Alert } from '../../node_modules/reactstrap';
import EventSpectator from './EventSpectator';

class EventCard extends Component {
    constructor(props) {
        super(props)
        this.state = {
            flipped: false,
            modalSpectateVisible: false,
            modalJoinVisible: false
        }
        this.cardFlipToggle = this.cardFlipToggle.bind(this)
        this.toggleModalSpectate = this.toggleModalSpectate.bind(this)
        this.toggleModalJoin = this.toggleModalJoin.bind(this)
        this.doJoinEvent = this.doJoinEvent.bind(this)
        this.startEvent = this.startEvent.bind(this)
        this.cancelEvent = this.cancelEvent.bind(this)
        this.pollEvent = this.pollEvent.bind(this)
    }

    cardFlipToggle() {
        this.setState({ flipped: !this.state.flipped })
    }

    toggleModalSpectate() {
        this.setState({ modalSpectateVisible: !this.state.modalSpectateVisible })
    }

    toggleModalJoin() {
        this.setState({ modalJoinVisible: !this.state.modalJoinVisible })
    }

    fetchAttribute(attrib) {
        let attribVal = this.props.event.get(attrib)
        if (attribVal === null || attribVal === undefined) {
            return "NULL"
        } else {
            return attribVal
        }
    }

    async doJoinEvent(warriorId) {
        window.game.joinEvent(this.fetchAttribute("id"), warriorId)
    }

    async startEvent() {
        window.game.startEvent(this.fetchAttribute("id"))
    }

    async cancelEvent() {
        window.game.cancelEvent(this.fetchAttribute("id"))
    }

    async pollEvent() {
        window.game.pollEvent(this.fetchAttribute("id"))
    }

    render() {
        let flippedClass = this.state.flipped ? "event-card flipped" : "event-card"
        let statusString = this.fetchAttribute("statestring")
        let canStartColor = this.fetchAttribute("canstart") ? "success" : "danger"
        let canStartString = this.fetchAttribute("canstart") ? "Yes" : "No"
        return (
            <div className="event-card-container">
                <Card className={flippedClass}>
                    <div className="front">
                        <CardHeader>
                            <Badge className="badge-status" color={this.fetchAttribute("statetypestring")}>{statusString}</Badge>
                            <span>Event #{this.fetchAttribute("id")} </span>
                            <Badge className="badge-fee" color="light">Join: {this.fetchAttribute("joinfee")} Finney</Badge>
                            <img className='flip-icon' src="images/flip.png" alt="Flip" onClick={this.cardFlipToggle}></img>
                            <img className='maximize-icon' src="images/maximize.png" alt="Maximize/Spectate" onClick={this.toggleModalSpectate}></img>
                        </CardHeader>
                        <CardBody>
                        <img width="160" height="160" className='event-image' src="images/event.svg" alt="Event"></img>
                            <EventAttribute label="Crew Pool:">{this.fetchAttribute("crewpool")} Finney</EventAttribute>
                            <EventAttribute label="Prize Pool:">{this.fetchAttribute("prizepool")} Finney</EventAttribute>
                            <EventAttributeDivider />
                            <EventAttribute label="Level Range:">Min:{this.fetchAttribute("minlevel")} / Max:{this.fetchAttribute("maxlevel")}</EventAttribute>
                            <EventAttribute label="Equipment Range:">Min:{this.fetchAttribute("minequiplevel")} / Max:{this.fetchAttribute("maxequiplevel")}</EventAttribute>
                            <EventAttributeDivider />
                            <EventAttribute label="Participation:">Min:{this.fetchAttribute("warriormin")} / Max:{this.fetchAttribute("warriormax")}</EventAttribute>
                            <EventAttributeDivider />
                            <Badge className="badge-owner" color="info">Owner: {this.fetchAttribute("owner")}</Badge>
                        </CardBody>
                        <CardFooter>
                            <EventAttribute label="Event Can Start:"><Badge className="badge_canstart" color={canStartColor} size="sm">{canStartString}</Badge></EventAttribute>
                            <EventAttribute label="Current Joined Warriors:">{this.fetchAttribute("participants").length}</EventAttribute>
                        </CardFooter>
                    </div>
                    <div className="back">
                        <CardHeader>
                            <Badge className="badge-status" color={this.fetchAttribute("statetypestring")}>{statusString}</Badge>
                            <span>Event #{this.fetchAttribute("id")} </span>
                            <img className='flip-icon' src="images/flip.png" alt="Flip" onClick={this.cardFlipToggle}></img>
                        </CardHeader>
                        <CardBody>
                            Actions:
                            <EventAttributeDivider />
                            <EventButtonRow>
                                <Button className="action-button" color="primary" onClick={this.toggleModalJoin}>Select a Warrior to Join This Event</Button>
                            </EventButtonRow>
                            <EventButtonRow>
                                <Button className="action-button" color="primary" onClick={this.startEvent}>Start The Event</Button>
                            </EventButtonRow>
                            <EventButtonRow>
                                <Button className="action-button" color="primary" onClick={this.cancelEvent}>Cancel The Event</Button>
                            </EventButtonRow>
                            <EventButtonRow>
                                <Button className="action-button" color="primary" onClick={this.pollEvent}>Poll This Event (Crew)</Button>
                            </EventButtonRow>
                            <EventButtonRow>
                                <Button className="action-button" color="primary" onClick={this.toggleModalSpectate}>Open Event Spectator View</Button>
                            </EventButtonRow>
                        </CardBody>
                        <CardFooter>
                        </CardFooter>
                    </div>
                </Card>
                <EventJoinModal eventID={this.fetchAttribute("id")} visible={this.state.modalJoinVisible} warriors={this.props.warriors} onToggle={this.toggleModalJoin} onSubmit={this.doJoinEvent} />
                <EventSpectator warriors={this.props.warriors} ads={this.props.ads} event={this.props.event} visible={this.state.modalSpectateVisible} onToggle={this.toggleModalSpectate} />
            </div>
        );
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
                <DropdownItem divider />
            </div>
        )
    }
}

class EventButtonRow extends Component {
    render() {
        return (
            <div className="event-action-row">
                {this.props.children}
            </div>
        )
    }
}

class EventJoinModal extends Component {
    constructor(props) {
        super(props)
        this.handleSubmit = this.handleSubmit.bind(this)
        this.toggle = this.toggle.bind(this)
        this.state = {
            error: false
        }
    }

    async handleSubmit(event) {
        event.persist()
        if(await this.validate(event.target.value)){
            this.setState({error:false})
            this.props.onSubmit(event.target.value)
            this.toggle()
        }else{
            this.setState({error:true})
        }
        event.preventDefault()
    }

    async validate(chosenID) {
        return await window.game.canJoinEvent(this.props.eventID, chosenID)
    }

    toggle() {
        this.props.onToggle()
    }

    renderButtonList(availableWarriors) {
        return availableWarriors.map((warrior) => <Button className="warrior-join-button" key={warrior.get("id")} value={warrior.get("id")} color="primary" onClick={this.handleSubmit}>{warrior.get("id").toString()}: {warrior.get("name")}</Button>);
    }

    render() {
        let availableWarriors = this.props.warriors.filter((warrior) => {
            return (
                warrior.get("state") === 0 &&
                warrior.get("owner") === window.chaindata.cachedAccount
            )
        })
        let formContents = ""
        let formError = this.state.error? <Alert className="join-error" color="danger">That Warrior is currently unable to join the selected Event. (note: this could be due to event restrictions, available funds, etc)</Alert> : ""
        if (availableWarriors.length > 0) {
            formContents = (
                <Form onSubmit={e => { e.preventDefault(); }}>
                    <FormGroup>
                        <FormText>Please select one of your available warriors below to join the event:</FormText>
                        {this.renderButtonList(availableWarriors)}
                        {formError}
                    </FormGroup>
                </Form>
            )
        } else {
            formContents = "You don't have any available warriors to join the event at this time!"
        }
        return (
            <Modal size="sm" isOpen={this.props.visible} toggle={this.toggle} className="warrior_modal_amount">
                <ModalHeader toggle={this.toggle}>Select a Warrior to Join</ModalHeader>
                <ModalBody>{formContents}</ModalBody>
            </Modal>
        )
    }
}

export default EventCard
