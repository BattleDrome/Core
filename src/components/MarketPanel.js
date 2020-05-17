import React, { Component } from 'react'

import './MarketPanel.css'
import WarriorCard from './WarriorCard';

class MarketPanel extends Component {
    render() {
        let warriorList = this.props.warriors.filter(warrior => {
            return +warrior.get("state").valueOf() === 8
        })
        const listItems = warriorList.map((warrior) => <WarriorCard warriors={this.props.warriors} warrior={warrior} key={warrior.get("id")} />);
        return (
            <div id="outer_container" className="warriors_outer_container">
                <div id='warriors_container' className="pre-scrollable">
                    {listItems}
                </div>                
            </div>
        );
    }
}

export default MarketPanel
