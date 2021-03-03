
import {CatergoryList, ChannelList} from "../component/component"
import React, { Component } from 'react';
import ReactDom from 'react-dom';
//直播分类页面
export class LiveCategoryPage extends React.Component {
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