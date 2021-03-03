import React, { Component } from 'react';
import ReactDom from 'react-dom';
import './common.css'
import {ElementSate} from "./util.js"
import {CatergoryList, ChannelList} from "./component/component"

const channelCategoryList = [{ categoryCode: 1, name: "卫视", elementState:  ElementSate.normal}, { categoryCode: 2, name: "央视",  elementState:  ElementSate.focus }]
const channelList = [{ channelCode: 1, name: "中央一台" }, { channelCode: 2, name: "央视二胎" }]


//直播封套页面
class LiveCoverPage extends React.Component {
    render() {
        //回看按钮部分
        const reviewButtonPart = <div className="button">
            <div className="to_lookback"></div>
            <div className="tips">回看</div>
        </div>

        //分类列表部分
        const categoryListPart = <div className="category_list"><p className="category_info">频道</p><CatergoryList channelCategoryList={this.props.channelCategoryList}></CatergoryList></div>
        
        //频道列表部分
        const channleListPart = <div className="channel_list"><ChannelList channelList={this.props.channelList}></ChannelList></div>

        return <div className="cover_scene_div">
            {reviewButtonPart}
            {categoryListPart}
            {channleListPart}
        </div>
    }
}

//直播分类页面
class LiveCategoryPage extends React.Component {
    render() {
        //标题部分
        const titlePart = <div className="liveCategoryTitle">
            <div className="part">
                <span className="category">分类</span>
                <span className="channel">频道</span>
            </div>
        </div>

        //分类列表部分
        const categoryListPart = <div className="c_p_p_0"><CatergoryList channelCategoryList={this.props.channelCategoryList}></CatergoryList></div>

        //频道列表部分
        const ChannelListPart = <div className="category-play-menu-list"><ChannelList channelList={this.props.channelList}></ChannelList></div>

        return <div className="play-menu-common-style category-play-menu">
            {titlePart}
            {categoryListPart}
            {ChannelListPart}
        </div>
    }
}



//console.log(listItems)
//const catergoryItem = <CatergoryItem categoryName="Sara" />;

ReactDom.render(
    // <CatergoryList channelCategoryList={channelCategoryList}></CatergoryList>,
    // <ChannelItem channelName="頻道一"></ChannelItem>,
    // <CoverChannelList channelList={channelList}></CoverChannelList>,
    <LiveCoverPage  channelList={channelList} channelCategoryList={channelCategoryList}></LiveCoverPage>,
    //<LiveCategoryPage channelList={channelList} channelCategoryList={channelCategoryList}></LiveCategoryPage>,
    // <AAA></AAA>,
    document.getElementById('root')
);


