import React, { Component } from 'react'
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input, FormText, Container, Row, Col } from '../../node_modules/reactstrap';

import './EventsPanel.css'
import EventCard from './EventCard';

class EventsPanel extends Component {
    constructor(props) {
        super(props)
        this.state = {
            modalCreateVisible: false
        }
        this.toggleModalCreate = this.toggleModalCreate.bind(this)
        this.createEvent = this.createEvent.bind(this)
    }

    toggleModalCreate() {
        this.setState({ modalCreateVisible: !this.state.modalCreateVisible })
    }

    createEvent(warriorMin, warriorMax, minLevel, maxLevel, minEquipLevel, maxEquipLevel, maxPolls, joinFee) {
        window.game.createEvent(warriorMin, warriorMax, minLevel, maxLevel, minEquipLevel, maxEquipLevel, maxPolls, joinFee);
        this.toggleModalCreate()
    }

    render() {
        let eventList = this.props.events.filter(event => {
            return true
        })
        const listItems = eventList.map((event) => <EventCard warriors={this.props.warriors} ads={this.props.ads} event={event} key={event.get("id")} />);
        return (
            <div id="outer_container" className="events_outer_container">
                <Button outline color="success" size="lg" onClick={this.toggleModalCreate}>+</Button>
                <div id='events_container' className="pre-scrollable">
                    {listItems}
                </div>
                <EventCreateForm visible={this.state.modalCreateVisible} onToggle={this.toggleModalCreate} onSubmit={this.createEvent} />
            </div>
        );
    }
}

class EventCreateForm extends Component {
    constructor(props) {
        super(props)
        this.state = {
            warriorMin: 2,
            warriorMax: 10,
            minLevel: 0,
            maxLevel: 10,
            minEquipLevel: 0,
            maxEquipLevel: 10,
            maxPolls: 10,
            joinFee: 25
        }
        this.handleWarriorMinChange = this.handleWarriorMinChange.bind(this)
        this.handleWarriorMaxChange = this.handleWarriorMaxChange.bind(this)
        this.handleMinLevelChange = this.handleMinLevelChange.bind(this)
        this.handleMaxLevelChange = this.handleMaxLevelChange.bind(this)
        this.handleMinEquipLevelChange = this.handleMinEquipLevelChange.bind(this)
        this.handleMaxEquipLevelChange = this.handleMaxEquipLevelChange.bind(this)
        this.handleMaxPollsChange = this.handleMaxPollsChange.bind(this)
        this.handleJoinFeeChange = this.handleJoinFeeChange.bind(this)
        this.handleFormSubmit = this.handleFormSubmit.bind(this)
        this.toggle = this.toggle.bind(this)
    }

    handleFormSubmit(event) {
        this.props.onSubmit(this.state.warriorMin, this.state.warriorMax, this.state.minLevel, this.state.maxLevel, this.state.minEquipLevel, this.state.maxEquipLevel, this.state.maxPolls, this.state.joinFee)
        event.preventDefault()
    }

    handleWarriorMinChange(event) {
        this.setState({ warriorMin: event.target.value })
    }

    handleWarriorMaxChange(event) {
        this.setState({ warriorMax: event.target.value })
    }

    handleMinLevelChange(event) {
        this.setState({ minLevel: event.target.value })
    }

    handleMaxLevelChange(event) {
        this.setState({ maxLevel: event.target.value })
    }

    handleMinEquipLevelChange(event) {
        this.setState({ minEquipLevel: event.target.value })
    }

    handleMaxEquipLevelChange(event) {
        this.setState({ maxEquipLevel: event.target.value })
    }

    handleMaxPollsChange(event) {
        this.setState({ maxPolls: event.target.value })
    }

    handleJoinFeeChange(event) {
        this.setState({ joinFee: event.target.value })
    }

    toggle() {
        this.props.onToggle()
    }

    render() {
        return (
            <Modal size="lg" isOpen={this.props.visible} toggle={this.toggle} className="event_modal_create">
                <ModalHeader toggle={this.toggle}>Create New Event</ModalHeader>
                <ModalBody>
                    <p>Use this form to specify the starting properties of your new event</p>
                    <Form onSubmit={e => { e.preventDefault(); }}>
                    <FormGroup>
                            <Container>
                                <Row>
                                    <Col>
                                        <Label for="cw_minwarriors">Minimum # of Warriors</Label>
                                        <Input type="number" name="cw_minwarriors" id="cw_minwarriors" placeholder={this.state.warriorMin} onChange={this.handleWarriorMinChange} />
                                    </Col>
                                    <Col>
                                        <Label for="cw_minwarriors">Maximum # of Warriors</Label>
                                        <Input type="number" name="cw_maxwarriors" id="cw_maxwarriors" placeholder={this.state.warriorMax} onChange={this.handleWarriorMaxChange} />
                                    </Col>
                                </Row>
                            </Container>
                            <FormText color="muted">
                                Choose the minimum and maximum number of warriors required for the event to start.
                            </FormText>
                        </FormGroup>
                        <FormGroup>
                            <Container>
                                <Row>
                                    <Col>
                                        <Label for="cw_minlevel">Minimum Warrior Level</Label>
                                        <Input type="number" name="cw_minlevel" id="cw_minlevel" placeholder={this.state.minLevel} onChange={this.handleMinLevelChange} />
                                    </Col>
                                    <Col>
                                        <Label for="cw_maxlevel">Maximum Warrior Level</Label>
                                        <Input type="number" name="cw_maxlevel" id="cw_maxlevel" placeholder={this.state.maxLevel} onChange={this.handleMaxLevelChange} />
                                    </Col>
                                </Row>
                            </Container>
                            <FormText color="muted">
                                Choose the minimum and maximum level of all warriors who wish to join the event.
                            </FormText>
                        </FormGroup>
                        <FormGroup>
                            <Container>
                                <Row>
                                    <Col>
                                        <Label for="cw_minequip">Minimum Equipment Level</Label>
                                        <Input type="number" name="cw_minequip" id="cw_minequip" placeholder={this.state.minEquipLevel} onChange={this.handleMinEquipLevelChange} />
                                    </Col>
                                    <Col>
                                        <Label for="cw_maxequip">Maximum Equipment Level</Label>
                                        <Input type="number" name="cw_maxequip" id="cw_maxequip" placeholder={this.state.maxEquipLevel} onChange={this.handleMaxEquipLevelChange} />
                                    </Col>
                                </Row>
                            </Container>
                            <FormText color="muted">
                                Choose the minimum and maximum equipment level possessed by all warriors who wish to join the event.
                            </FormText>
                        </FormGroup>
                        <FormGroup>
                            <Label for="cw_maxpolls">Maximum # of Event Polls</Label>
                            <Input type="number" name="cw_maxpolls" id="cw_maxpolls" placeholder={this.state.maxPolls} onChange={this.handleMaxPollsChange} />
                            <FormText color="muted">
                                Please specify the maximum number of event polls by event "Crew" which will be allowed, before the event will be fircibly considered a draw (provided a winner is not already declared)
                            </FormText>
                        </FormGroup>
                        <FormGroup>
                            <Label for="cw_joinfee">Event Join Fee</Label>
                            <Input type="number" name="cw_joinfee" id="cw_joinfee" placeholder={this.state.joinFee} onChange={this.handleJoinFeeChange} />
                            <FormText color="muted">
                                Please set a Join Fee (in Finney). This is the fee that any warrior who wishes to join the event is required to pay for entry. This fee is added to the overall pool during the event.
                            </FormText>
                        </FormGroup>
                    </Form>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={this.toggle}>Cancel</Button>
                    <Button color="primary" onClick={this.handleFormSubmit}>Create Event</Button>
                </ModalFooter>
            </Modal>
        )
    }
}

export default EventsPanel
