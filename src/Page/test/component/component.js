import React, { Component } from 'react';

//分类单元
export class CatergoryItem extends React.Component {
    constructor(props){
        super(props)
        this.getElementSateClass = this.getElementSateClass.bind(this);
    }

    getElementSateClass(){
        return 1
    }

    render() {
        return <div className={"category_name " + this.props.elementState} >{this.props.categoryName}</div>;
    }
}

//频道单元
export class ChannelItem extends React.Component {
    render() {
        return <div className="channel_item"><span className="channel_name">{this.props.channelName}</span></div>
    }
}

//分类列表
export class CatergoryList extends React.Component {
    render() {
        const items = this.props.channelCategoryList.map((item) =>
            <CatergoryItem categoryName={item.name} elementState={item.elementState} key={item.categoryCode} />
        );
        return <React.Fragment>{items}</React.Fragment>;
    }
}

//频道列表
export class ChannelList extends React.Component {
    render() {
        const items = this.props.channelList.map((item) =>
            <ChannelItem channelName={item.name} key={item.channelCode} />
        );
        return <React.Fragment>{items}</React.Fragment>;
    }
}