import React, { Component } from 'react'
import { Button } from '../../node_modules/reactstrap';

import './AdsPanel.css'
import AdItem from './AdItem'
import AdForm from './AdForm'

class AdsPanel extends Component {
    constructor(props) {
        super(props)
        this.state = {
            modalCreateVisible: false
        }
        this.toggleModalCreate = this.toggleModalCreate.bind(this)
    }

    toggleModalCreate() {
        this.setState({ modalCreateVisible: !this.state.modalCreateVisible })
    }

    render() {
        let adList = this.props.ads.filter(ad => {
            return ad.get("owner") === window.chaindata.cachedAccount
        })
        const listItems = adList.map((ad) => <AdItem mode="manage" ad={ad} key={ad.get("id")} />);
        return (
            <div id="outer_container" className="ads_outer_container">
                <p>In order to advertise on BattleDrome events, you must sponsor an event. Sponsoring an event allows you to place one of your ads into the ad rotation for the event (there will only be a maximum of 3 ads in each events ad rotation).</p>
                <p>Use this page to manage your ads. You can create an ad with the button on the right. Your ads will list below, and can be edited at any time.</p>
                <p>Event Sponsorship is an auction. The top 3 high bidders will be selected and their ads put into rotation.</p>
                <p>For more information on how Event Sponsorship and Advertising works, please see the documentation</p>
                <Button outline color="success" size="lg" onClick={this.toggleModalCreate}>+</Button>
                <div id='ads_container' className="pre-scrollable">
                    {listItems}
                </div>
                <AdForm mode="new" visible={this.state.modalCreateVisible} onToggle={this.toggleModalCreate} />
            </div>
        );
    }
}

export default AdsPanel
