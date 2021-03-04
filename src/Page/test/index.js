import React, { Component } from 'react';
import ReactDom from 'react-dom';
import './common.css';
import { ElementSate, logInit, EventType } from "./util.js"
import { eventBus } from "../../lib/EventBus"
import { CoverPage, MstChannelPage } from "./page/mstChannelPage"
import { ChannelItem, MstChannelList } from "./component/component"
import './mstChannelItem.css'

import log from 'loglevel';

logInit()


window.document.onkeydown = function (e) {
    eventBus.emit(EventType.REMOTE_EVENT, e.keyCode)
};

window.document.onkeyup = function (e) {
    //console.log(e)
};

//let coverPage = new CoverPage()
//coverPage.show()


 let mstChannelPage = new MstChannelPage()
 mstChannelPage.show()
