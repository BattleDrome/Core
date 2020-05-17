import React, { Component } from 'react'
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input, FormText, Alert } from '../../node_modules/reactstrap';

import './SponsorBidForm.css'

class SponsorBidForm extends Component {
    constructor(props) {
        super(props)
        this.defaultState = {
            adID: -1,
            amount: 10,
            eventID: this.props.eventID,
            submitEnabled: false,
            error: false,
            errorText: "",
        }
        this.state = this.defaultState
        this.handleAdChange = this.handleAdChange.bind(this)
        this.handleAmountChange = this.handleAmountChange.bind(this)
        this.handleFormSubmit = this.handleFormSubmit.bind(this)
        this.validate = this.validate.bind(this)
        this.toggle = this.toggle.bind(this)
    }

    componentDidUpdate(prevProps, prevState) {
        if(this.state!==prevState){
            this.validate()
        }
    }

    validate() {
        let success = true
        let errorText = ""
        if(+this.state.amount<=0){
            success=false
            errorText="Must provide an amount greater than zero"
        }
        if(+this.state.adID<0){
            success=false
            errorText="Must select a valid Ad!"
        }
        if(this.state.error===success || this.state.errorText!==errorText){
            this.setState({
                error:!success,
                submitEnabled:success,
                errorText:errorText,
            })
        }
    }

    handleFormSubmit(event) {
        window.game.bid(this.state.eventID,this.state.adID,this.state.amount);
        event.preventDefault()
        this.toggle()
    }

    handleAdChange(event) {
        this.setState({ adID: event.target.value })
        this.validate()
    }

    handleAmountChange(event) {
        this.setState({ amount: event.target.value })
        this.validate()
    }

    toggle() {
        this.props.onToggle()
        this.setState(this.defaultState)
    }

    renderError() {
        if(this.state.error){
            return(
                <Alert color="danger">{this.state.errorText}</Alert>
            )
        }else{
            return("")
        }
    }

    render() {
        let errorContent = this.renderError()
        let adList = this.props.ads.filter(ad => {
            return ad.get("owner") === window.chaindata.cachedAccount
        })
        let ads = adList.map((ad)=><option key={ad.get("id")} value={ad.get("id")}>ID:{ad.get("id")} - {ad.get("content").split(/\r?\n/)[0]}</option>)
        return (
            <Modal size="lg" isOpen={this.props.visible} toggle={this.toggle} className="bid_modal_create">
                <ModalHeader toggle={this.toggle}>Event Sponsorship Bid Form</ModalHeader>
                <ModalBody>
                    <p>Use this form to select one of your ads, and provide a bid amount for your sponsorship of this event</p>
                    {errorContent}
                    <Form onSubmit={e => { e.preventDefault(); }}>
                        <FormGroup>
                            <Label for="bid_ad">Sponsorship Ad</Label>
                            <Input type="select" name="bid_ad" id="bid_ad" onChange={this.handleAdChange}>
                                <option key="null" value={-1}>Please select one of your ads</option>
                                {ads}
                            </Input>                            
                            <FormText color="muted">
                                <p>Please select one of your Ads</p>
                            </FormText>
                        </FormGroup>
                        <FormGroup>
                            <Label for="bid_amount">Bid Amount</Label>
                            <Input type="number" name="bid_amount" id="bid_amount" placeholder={this.state.amount} onChange={this.handleAmountChange} />
                            <FormText color="muted">
                                <p>Please provide the amount (in Finney) for your new Sponsorship Bid</p>
                                <p>Note: If you have an existing bid for the selected ad, this amount will be added to your existing bid.</p>
                            </FormText>
                        </FormGroup>
                    </Form>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={this.toggle}>Cancel</Button>
                    <Button color="primary" disabled={!this.state.submitEnabled} onClick={this.handleFormSubmit}>Submit Sponsorship Bid</Button>
                </ModalFooter>
            </Modal>
        )
    }
}

export default SponsorBidForm
