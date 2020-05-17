import React, { Component } from 'react'
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input, FormText, Alert } from '../../node_modules/reactstrap';

import './AdForm.css'

class AdForm extends Component {
    constructor(props) {
        super(props)
        this.defaultState = {
            adType: 0,
            content: "",
            url: "",
            submitEnabled: false,
            error: false,
            errorText: "",
            validImage: false,
        }
        this.state = this.defaultState
        this.handleTypeChange = this.handleTypeChange.bind(this)
        this.handleContentChange = this.handleContentChange.bind(this)
        this.handleUrlChange = this.handleUrlChange.bind(this)
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
        let validImage = false
        if(+this.state.adType===0){
            //Text Ad
            if(this.state.content.length>512){
                success=false
                errorText="Content text is too long!"
            }
            if(this.state.content.split(/\r\n|\r|\n/).length > 3){
                success=false
                errorText="Content text has too many lines!"
            }
            if(this.state.content.length<=0){
                success=false
                errorText="Text Content is Required!"
            }
        }else{
            //Image Ad
            if(this.state.content.length<=0){
                success=false
                errorText="Alt Text Content is Required!"
            }
            if(this.state.url.length<=0){
                success=false
                errorText="URL is Required!"
            }
            let isValidURL = (this.state.url.toLowerCase().includes("http://") || this.state.url.toLowerCase().includes("https://"))
            if(!isValidURL){
                success=false
                errorText="URL does not appear to be valid!"
            }
            validImage = true
        }
        if(this.state.error===this.success || this.state.errorText!==errorText || this.state.validImage!==validImage){
            this.setState({
                error:!success,
                submitEnabled:success,
                errorText:errorText,
                validImage:validImage
            })
        }
    }

    handleFormSubmit(event) {
        if(this.props.mode==="edit"){
            console.log("TODO: Save Edited Ad!")
        }else{
            window.game.createAd(this.state.adType,this.state.content,this.state.url)
            event.preventDefault()
        }
        this.toggle()
    }

    handleTypeChange(event) {
        this.setState({ adType: event.target.value })
        if(+event.target.value===0){
            this.setState({ url: "" })
        }
        this.validate()
    }

    handleContentChange(event) {
        this.setState({ content: event.target.value })
        this.validate()
    }

    handleUrlChange(event) {
        this.setState({ url: event.target.value })
        this.validate()
    }

    toggle() {
        this.props.onToggle()
        this.setState(this.defaultState)
    }

    renderImage() {
        if(this.state.validImage){
            return(
                <img src={this.state.url} alt={this.state.content} />
            )
        }else{
            return("")
        }
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
        let imageContent = this.renderImage()
        let errorContent = this.renderError()
        let title = this.props.mode==="edit" ? "Edit Ad" : "Create New Ad"
        let intro = this.props.mode==="edit" ? "Please edit any values for your ad, then click save" : "Use this form to create a new Ad"
        let submitText = this.props.mode==="edit" ? "Save Ad" : "Create Ad"
        //Stub to disable editing for now because it's broken
        //TODO: Fix
        if(this.props.mode==="edit"){
            return(
                <Modal size="lg" isOpen={this.props.visible} toggle={this.toggle} className="ad_modal_create">
                    <ModalHeader toggle={this.toggle}>{title}</ModalHeader>
                    <ModalBody>
                        <p>Note: Editing of existing ads is currently disabled in this release of BattleDrome. This feature is coming soon!</p>
                        <p>Sorry for the inconvenience!</p>
                    </ModalBody>       
                    <ModalFooter>
                        <Button color="secondary" onClick={this.toggle}>Cancel</Button>
                    </ModalFooter>
                </Modal>

            )
        }
        return (
            <Modal size="lg" isOpen={this.props.visible} toggle={this.toggle} className="ad_modal_create">
                <ModalHeader toggle={this.toggle}>{title}</ModalHeader>
                <ModalBody>
                    <p>{intro}</p>
                    {errorContent}
                    <Form onSubmit={e => { e.preventDefault(); }}>
                        <FormGroup>
                            <Label for="ca_type">Ad Type</Label>
                            <Input type="select" name="ca_type" id="ca_type" onChange={this.handleTypeChange}>
                                <option value="0">Text</option>
                                <option value="1">Image</option>
                            </Input>                            
                            <FormText color="muted">
                                <p>Please specify the type of ad.</p>
                                <p><b>Image:</b> Image type Ads will reference an externally hosted png image of dimensions 728x90 (also known as a standard Leaderboard image)</p>
                                <p><b>Text:</b> Text type Ads will render text in a 728x90 box. With a maximum length of 512 characters. Any excess text, or excessive lines will be truncated at render time.</p>
                            </FormText>
                        </FormGroup>
                        <FormGroup>
                            <Label for="ca_content">Ad Text Content</Label>
                            <Input type="textarea" name="ca_content" id="ca_content" placeholder={this.state.content} onChange={this.handleContentChange} />
                            <FormText color="muted">
                                <p>Please supply the text content for the new ad</p>
                                <p>In the event of an Image type ad, this is the alt text for the ad</p>
                                <p>In the event of a Text type ad, this is the actual ad content.</p>
                                <p>Note this content is limited to 512 characters in length</p>
                            </FormText>
                        </FormGroup>
                        <FormGroup>
                            <Label for="ca_url">Image URL</Label>
                            <Input type="url" disabled={this.state.adType===0} name="ca_url" id="ca_url" placeholder={this.state.url} onChange={this.handleUrlChange} />
                            <FormText color="muted">
                                <p>Please specify a remotely hosted image URL if this ad is of Image Type</p>
                                <p>This image MUST be a PNG file, and must be 728x90px in size. Any other image type/size will be rejected at render time.</p>
                                <p>If the image is valid, it will display below:</p>
                            </FormText>
                            {imageContent}
                        </FormGroup>
                    </Form>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={this.toggle}>Cancel</Button>
                    <Button color="primary" disabled={!this.state.submitEnabled} onClick={this.handleFormSubmit}>{submitText}</Button>
                </ModalFooter>
            </Modal>
        )
    }
}

export default AdForm
