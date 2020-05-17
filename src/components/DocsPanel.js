import React, { Component } from 'react'

import './DocsPanel.css'

class DocsPanel extends Component {
    render() {
        return (
            <div id='docs_container' className="pre-scrollable">
                <h2>BattleDrome Documentation</h2>
                <p>Eventually full end-user documentation for the project will live here. But for the alpha, as we revise, a wiki is far better suited to this task.</p>
                <p>So for the alpha and beta phases, please see the github wiki at: <a href="https://github.com/BattleDrome/Core/wiki">BattleDrome Core Wiki</a></p>
                <p>Also we strongly encourage the user-base to contribute and add to that wiki.</p>
            </div>
        );
    }
}

export default DocsPanel
