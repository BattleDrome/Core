import React, { Component } from 'react'

import './AdItem.css'
import { Card, CardHeader, CardBody, Button } from 'reactstrap';
import AdForm from './AdForm'

class AdItem extends Component {

    constructor(props) {
        super(props)
        this.state = {
            modalEditVisible: false
        }
        this.toggleModalEdit = this.toggleModalEdit.bind(this)
    }

    toggleModalEdit() {
        this.setState({ modalEditVisible: !this.state.modalEditVisible })
    }

    fetchAttribute(attrib) {
        let attribVal = this.props.ad.get(attrib)
        if (attribVal === null || attribVal === undefined) {
            return "NULL"
        } else {
            return attribVal
        }
    }

    renderAdCard() {
        return(
            <Card className="ad-card">
                <CardHeader>
                    Ad #{this.fetchAttribute("id")}
                    <Button outline color="success" size="sm" onClick={this.toggleModalEdit}>Edit</Button>
                </CardHeader>
                <CardBody>{this.renderAdView()}</CardBody>
                <AdForm mode="edit" data={this.props.ad} visible={this.state.modalEditVisible} onToggle={this.toggleModalEdit} />
            </Card>
        )
    }

    renderAdView() {
        let adType = +this.fetchAttribute("type");
        let content = this.fetchAttribute("content").split(/\r\n|\r|\n/).map((line,idx)=><p key={idx}>{line}</p>)
        let url = this.fetchAttribute("url");
        if(adType===0){
            //Text Ad
            return(
                <div className="ad-view-container">
                    {content}
                </div>
            )
        }else{
            //Image Ad
            return (
                <div className="ad-view-container">
                    <img alt={content} src={url} />
                </div>
            )
        }
    }

    render() {
        if(this.props.mode==="manage"){
            return this.renderAdCard()
        }else{
            return(
                <div className="ad-wrapper">
                    {this.renderAdView()}
                </div>
            )
        }
    }
}

export default AdItem
