import React, { Component } from 'react'
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input, FormText } from '../../node_modules/reactstrap';

import './WarriorsPanel.css'
import WarriorCard from './WarriorCard';

class WarriorsPanel extends Component {
    constructor(props) {
        super(props)
        this.state = {
            modalCreateVisible: false
        }
        this.toggleModalCreate = this.toggleModalCreate.bind(this)
        this.createWarrior = this.createWarrior.bind(this)
    }

    toggleModalCreate() {
        this.setState({ modalCreateVisible: !this.state.modalCreateVisible })
    }

    createWarrior(color, armor, shield, weapon) {
        window.game.createWarrior(color, armor, shield, weapon);
        this.toggleModalCreate()
    }

    render() {
        let warriorList = this.props.warriors.filter(warrior => {
            return warrior.get("owner") === window.chaindata.cachedAccount
        })
        const listItems = warriorList.map((warrior) => <WarriorCard warriors={this.props.warriors} warrior={warrior} key={warrior.get("id")} />);
        return (
            <div id="outer_container" className="warriors_outer_container">
                <Button outline color="success" size="lg" onClick={this.toggleModalCreate}>+</Button>
                <div id='warriors_container' className="pre-scrollable">
                    {listItems}
                </div>
                <WarriorCreateForm visible={this.state.modalCreateVisible} onToggle={this.toggleModalCreate} onSubmit={this.createWarrior} />
            </div>
        );
    }
}

class WarriorCreateForm extends Component {
    constructor(props) {
        super(props)
        this.defaultState = {
            color: 180,
            weapon: 0,
            armor: 0,
            shield: 0,
            colorexample: "hsl(180,40%,30%)"
        }
        this.state = this.defaultState
        this.handleColorChange = this.handleColorChange.bind(this)
        this.handleWeaponChange = this.handleWeaponChange.bind(this)
        this.handleArmorChange = this.handleArmorChange.bind(this)
        this.handleShieldChange = this.handleShieldChange.bind(this)
        this.handleFormSubmit = this.handleFormSubmit.bind(this)
        this.toggle = this.toggle.bind(this)
    }

    handleFormSubmit(event) {
        this.props.onSubmit(this.state.color, this.state.armor, this.state.shield, this.state.weapon)
        this.setState(this.defaultState)
        event.preventDefault()
    }

    handleColorChange(event) {
        let hue = event.target.value
        let saturation = 40
        let value = 30
        let hsvText = "hsl(" + hue + "," + saturation + "%," + value + "%)"
        this.setState({ color: hue, colorexample: hsvText })
    }

    handleWeaponChange(event) {
        this.setState({ weapon: event.target.value })
    }

    handleArmorChange(event) {
        this.setState({ armor: event.target.value })
    }

    handleShieldChange(event) {
        this.setState({ shield: event.target.value })
    }

    toggle() {
        this.props.onToggle()
    }

    render() {
        return (
            <Modal size="lg" isOpen={this.props.visible} toggle={this.toggle} className="warrior_modal_create">
                <ModalHeader toggle={this.toggle}>Create New Warrior</ModalHeader>
                <ModalBody>
                    <p>Use this form to specify the starting properties of your new warrior</p>
                    <Form onSubmit={e => { e.preventDefault(); }}>
                        <FormGroup>
                            <Label for="cw_color">Battle Colors</Label>
                            <Input type="range" min="0" max="360" value={this.props.color} id="cw_color" aria-describedby="colorHelp" onInput={this.handleColorChange} onChange={this.handleColorChange} />
                            <div className="color-example" style={{ backgroundColor: this.state.colorexample }} id="color-example"></div>
                            <FormText color="muted">
                                Select the battle colors (using the slider) for custom details on your warrior (cosmetic only)
                            </FormText>
                        </FormGroup>
                        <FormGroup>
                            <Label for="cw_weapontype">Weapon Type</Label>
                            <Input value={this.state.weapon} type="select" name="cw_weapontype" id="cw_weapontype" onChange={this.handleWeaponChange}>
                                <option value="0">Sword</option>
                                <option value="1">Falchion</option>
                                <option value="2">Broadsword</option>
                                <option value="3">Battle Axe</option>
                                <option value="4">Mace</option>
                                <option value="5">Hammer</option>
                                <option value="6">Flail</option>
                                <option value="7">Trident</option>
                                <option value="8">Halberd</option>
                                <option value="9">Spear</option>
                            </Input>
                            <FormText>
                                Select a weapon for the warrior to specialize in. (Note: this will affect combat, and it is not possible to change your weapon selection after creation)
                            </FormText>
                        </FormGroup>
                        <FormGroup>
                            <Label for="cw_armortype">Armor Type</Label>
                            <Input value={this.state.armor} type="select" name="cw_armortype" id="cw_armortype" onChange={this.handleArmorChange}>
                                <option value="0">Minimal</option>
                                <option value="1">Light</option>
                                <option value="2">Medium</option>
                                <option value="3">Heavy</option>
                            </Input>
                            <FormText>
                                Select what level of armor is worn by the warrior
                            </FormText>
                        </FormGroup>
                        <FormGroup>
                            <Label for="cw_shieldtype">Shield Type</Label>
                            <Input value={this.state.shield} type="select" name="cw_shieldtype" id="cw_shieldtype" onChange={this.handleShieldChange}>
                                <option value="0">None</option>
                                <option value="1">Light</option>
                                <option value="2">Medium</option>
                                <option value="3">Heavy</option>
                            </Input>
                            <FormText>
                                Choose if the warrior will use a shield, and if so, what type
                            </FormText>
                        </FormGroup>
                    </Form>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={this.toggle}>Cancel</Button>
                    <Button color="primary" onClick={this.handleFormSubmit}>Create Warrior</Button>
                </ModalFooter>
            </Modal>
        )
    }
}

export default WarriorsPanel
