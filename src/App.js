import React, { Component } from 'react'
import { TabContent, TabPane, Nav, NavItem, NavLink } from 'reactstrap'
import classnames from 'classnames'
import ChainData from './libs/chaindata.js'
import BattleDrome from './libs/battledrome.js'
import EventLogPanel from './components/EventLogPanel.js'
import HomePanel from './components/HomePanel.js'
import WarriorsPanel from './components/WarriorsPanel.js'
import EventsPanel from './components/EventsPanel.js'
import MarketPanel from './components/MarketPanel.js'
import AcademyPanel from './components/AcademyPanel.js'
import DocsPanel from './components/DocsPanel.js'

import ContractWarriorCore from './contracts/WarriorCore.json'
import ContractEventCore from './contracts/EventCore.json'
import ContractWagerCore from './contracts/WagerCore.json'
import ContractSponsorCore from './contracts/SponsorCore.json'

import 'bootstrap/dist/css/bootstrap.css'
import './css/darkly.min.css'
import './css/animate.css'
import './App.css'
import WatchedWarriorsPanel from './components/WatchedWarriorsPanel.js';
import AdsPanel from './components/AdsPanel.js';

class App extends Component {
  constructor(props) {
    super(props)

    this.toggle = this.toggle.bind(this);
    this.chainRefreshInterval = 500;
    this.contracts = [ContractWarriorCore, ContractEventCore, ContractWagerCore, ContractSponsorCore]
    window.chaindata = new ChainData(this.chainRefreshInterval, this.contracts, this.logEvent.bind(this), this.accountChange.bind(this))
    window.game = new BattleDrome(window.chaindata, this.chainDataUpdate.bind(this), this.logEvent.bind(this))

    this.state = {
      activeTab: '1',
      events: [],
      game: {
        warriors: new Map(),
        events: new Map(),
        ads: new Map()
      }
    }
  }

  async componentDidMount() {
    await window.chaindata.init()
    await window.game.init()
  }

  logEvent(category, level, message, toastTimeout = 0) {
    const newEvent = {
      category: category,
      level: level,
      message: message,
      toastTimeout: toastTimeout
    }
    var newEvents = this.state.events.slice()
    newEvents.push(newEvent)
    this.setState({ events: newEvents })
  }

  accountChange(account) {
    window.game.accountChange(account)
  }

  chainDataUpdate() {
    let newGameData = {
      warriors: window.game.cachedData.warriors,
      events: window.game.cachedData.events,
      ads: window.game.cachedData.ads
    }
    this.setState({game: newGameData})
  }

  toggle(tab) {
    if (this.state.activeTab !== tab) {
      this.setState({
        activeTab: tab
      });
    }
  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  render() {
    return (
      <div className="app-outer-container">
        <div className="app-nav-container">
          <Nav tabs>
            <NavItem><NavLink className={classnames({ active: this.state.activeTab === '1' })} onClick={() => { this.toggle('1'); }}>Home</NavLink></NavItem>
            <NavItem><NavLink className={classnames({ active: this.state.activeTab === '2' })} onClick={() => { this.toggle('2'); }}>My Warriors</NavLink></NavItem>
            <NavItem><NavLink className={classnames({ active: this.state.activeTab === '3' })} onClick={() => { this.toggle('3'); }}>Events</NavLink></NavItem>
            <NavItem><NavLink className={classnames({ active: this.state.activeTab === '4' })} onClick={() => { this.toggle('4'); }}>Marketplace</NavLink></NavItem>
            <NavItem><NavLink className={classnames({ active: this.state.activeTab === '5' })} onClick={() => { this.toggle('5'); }}>Academy</NavLink></NavItem>
            <NavItem><NavLink className={classnames({ active: this.state.activeTab === '6' })} onClick={() => { this.toggle('6'); }}>Watched Warriors</NavLink></NavItem>
            <NavItem><NavLink className={classnames({ active: this.state.activeTab === '7' })} onClick={() => { this.toggle('7'); }}>Advertise</NavLink></NavItem>
            <NavItem><NavLink className={classnames({ active: this.state.activeTab === '8' })} onClick={() => { this.toggle('8'); }}>Docs</NavLink></NavItem>
            <EventLogPanel events={this.state.events} />
          </Nav>
        </div>
        <TabContent activeTab={this.state.activeTab}>
          <TabPane tabId="1">
            <HomePanel />
          </TabPane>
          <TabPane tabId="2">
            <WarriorsPanel warriors={Array.from(this.state.game.warriors.values())}/>
          </TabPane>
          <TabPane tabId="3">
            <EventsPanel warriors={Array.from(this.state.game.warriors.values())} ads={Array.from(this.state.game.ads.values())} events={Array.from(this.state.game.events.values())} />
          </TabPane>
          <TabPane tabId="4">
            <MarketPanel warriors={Array.from(this.state.game.warriors.values())}/>
          </TabPane>
          <TabPane tabId="5">
            <AcademyPanel warriors={Array.from(this.state.game.warriors.values())}/>
          </TabPane>
          <TabPane tabId="6">
            <WatchedWarriorsPanel warriors={Array.from(this.state.game.warriors.values())}/>
          </TabPane>
          <TabPane tabId="7">
            <AdsPanel ads={Array.from(this.state.game.ads.values())}/>
          </TabPane>
          <TabPane tabId="8">
            <DocsPanel />
          </TabPane>
        </TabContent>
      </div>
    );
  }
}

export default App
