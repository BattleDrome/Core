import React, { Component } from 'react'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Badge, Alert } from 'reactstrap'
import FileSaver from 'file-saver'

import './EventLogPanel.css'

class EventLogPanel extends Component {
    static defaultProps = {
        maxHistory: 1000,
        events: []
    }

    constructor(props) {
        super(props)

        this.state = {
            events: [],
            visible: false,
            read: 0,
            lastID: 0
        }

        this.toggleVisible = this.toggleVisible.bind(this)
        this.clearLogs = this.clearLogs.bind(this)
        this.saveLogs = this.saveLogs.bind(this)
    }

    componentDidUpdate(prevProps) {
        if(this.props.events.length > prevProps.events.length){
            //New Events flowed in via props
            const newEvents = this.props.events.slice(prevProps.events.length)
            for(const event of newEvents){
                this.newEvent(event.category,event.level,event.message,event.toastTimeout)
            }
        }
    }

    newEvent(category, level, message, toastTimeout = 0) {
        const now = new Date()
        const timestamp = now.toISOString()
        var toastLevel = "info";
        if(level==="error" || level==="danger") {
            level = "danger";
            toastLevel = "error";
        }else{
            toastLevel = level;
        }
        console.log("EventLog: "+timestamp+" - "+level+" - "+category+": "+message);
        if (toastTimeout > 0 && !this.state.visible) {
            const toastConfig = {
                autoClose: toastTimeout,
                type: toastLevel,
                position: "bottom-right"
            }
            toast("#"+this.state.events.length+": "+category+": "+message,toastConfig)
        }
        var newState = this.state;
        newState.events.push({
            id: newState.lastID++,
            timestamp: timestamp,
            category: category,
            level: level,
            message: message
        })
        if(newState.events.length>this.props.maxHistory) newState.events.shift()
        this.setState(newState)
    }

    toggleVisible() {
        this.setState({visible:!this.state.visible})
        if(this.state.visible) this.setState({read:this.state.events.length})
    }

    clearLogs() {
        //TODO: How to solve this? with react data flow...
    }
    
    saveLogs() {
        var jsonString = JSON.stringify(this.state.events)
        var logBlob = new Blob([jsonString],{type: "application/json;charset=utf-8"})
        var fileName = "BattleDrome_Logs_"+Date.now()+".json"
        FileSaver.saveAs(logBlob, fileName);
    }

    render() {
        const listItems = this.state.events.map((event) =>
            <div className="event_log_entry_container" key={event.id}>
                <Alert color={event.level} className="event_log_entry">
                    <div className="event_log_item_header">{event.timestamp} - {event.category}:</div>
                    <div className="event_log_item_message">{event.message}</div>
                </Alert>
            </div>
        );
        return (
            <div id='event_log_container' className="event_log_container">
                <Button color="secondary" size="sm" onClick={this.toggleVisible} outline>
                    Notifications <Badge color="secondary">{this.state.events.length-this.state.read}</Badge>
                </Button>
                <Modal size="lg" isOpen={this.state.visible} toggle={this.toggleVisible} className="event_log_modal">
                    <ModalHeader toggle={this.toggleVisible}>System Event Log</ModalHeader>
                    <ModalBody>
                        {listItems}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onClick={this.toggleVisible}>Close</Button>
                        <Button color="secondary" onClick={this.clearLogs}>Clear Log</Button>
                        <Button outline color="secondary" onClick={this.saveLogs}>Download Logs</Button>
                    </ModalFooter>
                </Modal>                
                <ToastContainer />
            </div>
        );
    }
}

export default EventLogPanel
