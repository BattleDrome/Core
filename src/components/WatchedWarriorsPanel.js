import React, { Component } from 'react'
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input, FormText } from '../../node_modules/reactstrap';

import './WatchedWarriorsPanel.css'
import WarriorCard from './WarriorCard';

class WatchedWarriorsPanel extends Component {
    constructor(props) {
        super(props)
        this.state = {
            modalSearchVisible: false
        }
        this.toggleModalSearch = this.toggleModalSearch.bind(this)
        this.searchWarrior = this.searchWarrior.bind(this)
    }

    toggleModalSearch() {
        this.setState({ modalSearchVisible: !this.state.modalSearchVisible })
    }

    searchWarrior(searchText) {
        window.game.searchWarrior(searchText)
        this.toggleModalSearch()
    }

    render() {
        let warriorList = this.props.warriors.filter(warrior => {
            return (
                warrior.get("owner") !== window.chaindata.cachedAccount &&
                +warrior.get("state").valueOf() !== 3 &&
                +warrior.get("state").valueOf() !== 8
            )
        })
        const listItems = warriorList.map((warrior) => <WarriorCard warriors={this.props.warriors} warrior={warrior} key={warrior.get("id")} />);
        return (
            <div id="outer_container" className="watched_outer_container">
                <Button className="search_button" outline color="success" size="lg" onClick={this.toggleModalSearch}>
                    <img alt="Search" src="/images/search.png"></img>
                </Button>
                <div id='watched_container' className="pre-scrollable">
                    {listItems}
                </div>
                <WarriorSearchForm visible={this.state.modalSearchVisible} onToggle={this.toggleModalSearch} onSubmit={this.searchWarrior} />
            </div>
        );
    }
}

class WarriorSearchForm extends Component {
    constructor(props) {
        super(props)
        this.state = {
            text: ""
        }
        this.handleTextChange = this.handleTextChange.bind(this)
        this.handleTextSubmit = this.handleTextSubmit.bind(this)
        this.toggle = this.toggle.bind(this)
    }

    handleTextChange(event) {
        this.setState({ text: event.target.value });
    }

    handleTextSubmit(event) {
        this.props.onSubmit(this.state.text)
        this.setState({text: ""})
        event.preventDefault()
    }

    toggle() {
        this.props.onToggle()
    }

    render() {
        return (
            <Modal size="sm" isOpen={this.props.visible} toggle={this.toggle} className="warrior_modal_search">
                <ModalHeader toggle={this.toggle}>Warrior Search</ModalHeader>
                <ModalBody>
                    <Form onSubmit={e => { e.preventDefault(); }}>
                        <FormGroup>
                            <Label for="search">Search</Label>
                            <Input name="search" id="search" placeholder="Search Terms" onChange={this.handleTextChange} />
                            <FormText>
                                Search instructions here
                            </FormText>
                        </FormGroup>
                    </Form>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={this.toggle}>Cancel</Button>
                    <Button color="primary" onClick={this.handleTextSubmit}>Search</Button>
                </ModalFooter>
            </Modal>
        )
    }
}

export default WatchedWarriorsPanel
