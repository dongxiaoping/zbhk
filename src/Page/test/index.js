import React, { Component } from 'react';
import ReactDom from 'react-dom';
import './common.css';
import {ElementSate} from "./util.js"
import {LiveCoverPage} from "./page/cover"
import {LiveCategoryPage} from "./page/liveCategory"

const channelCategoryList = [{ categoryCode: 1, name: "卫视", elementState:  ElementSate.normal}, { categoryCode: 2, name: "央视",  elementState:  ElementSate.focus }]
const channelList = [{ channelCode: 1, name: "中央一台" }, { channelCode: 2, name: "央视二胎" }]







//console.log(listItems)
//const catergoryItem = <CatergoryItem categoryName="Sara" />;

ReactDom.render(
    // <CatergoryList channelCategoryList={channelCategoryList}></CatergoryList>,
    // <ChannelItem channelName="頻道一"></ChannelItem>,
    // <CoverChannelList channelList={channelList}></CoverChannelList>,
   // <LiveCoverPage  channelList={channelList} channelCategoryList={channelCategoryList}></LiveCoverPage>,
    <LiveCategoryPage channelList={channelList} channelCategoryList={channelCategoryList}></LiveCategoryPage>,
    // <AAA></AAA>,
    document.getElementById('root')
);


