
import {CatergoryList, ChannelList} from "../component/component"
import React, { Component } from 'react';
import ReactDom from 'react-dom';
//直播封套页面
export class LiveCoverPage extends React.Component {
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