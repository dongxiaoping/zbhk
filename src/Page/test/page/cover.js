
import { BasePage, LiveCoverCpt } from "../component/component"
import React, { Component } from 'react';
import { ElementSate, EventType, KeyCode } from "../util.js"
import ReactDom from 'react-dom';

export class CoverPage extends BasePage {
    constructor() {
        super()
        this.coverPageData = {
            showCategoryData: [{ categoryCode: 1, name: "卫视", elementState: ElementSate.normal },
            { categoryCode: 2, name: "央视", elementState: ElementSate.focus }],
            showChannelData: [{ channelCode: 1, name: "中央一台" }, { channelCode: 2, name: "央视二胎" }]
        }
    }

    left() {
        super.left()
    }

    right() {
        super.right()
    }

    up() {
        super.up()
    }

    down() {
        super.down()
    }

    ok() {
        super.ok()
    }

    show() {
        ReactDom.render(
            <LiveCoverCpt coverPageData={this.coverPageData}></LiveCoverCpt>,
            document.getElementById('root')
        );
    }
}