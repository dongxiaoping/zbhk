import React, { Component } from 'react';
import { ElementSate, EventType, KeyCode } from "../util.js"
import { eventBus } from "../../../lib/EventBus"

//播放ID
export const PlayingProgramId = React.createContext('');
//分类单元
export class CatergoryItem extends React.Component {
    render() {
        return <div className={"category_name " + this.props.elementState} >{this.props.categoryName}</div>;
    }
}

export class MstChannelList extends React.Component {
    render() {
        const items = this.props.list.map((item) =>
            <MstChannelItem key={item.code} channel={item} />
        );
        return <div className="mst-channel-list">{items}</div>
    }
}


export class MstChannelItem extends React.Component {
    static contextType = PlayingProgramId;
    constructor() {
        super()

    }

    componentDidMount() {
       // console.log(this.context)//{'mst-channel-item '+ this.props.channel.elementSate == ElementSate.focus?'focus':''}
    }


    render() {
        return <div className='mst-channel-item'>
            <img className="vip-label" src="http://www.toplaygame.cn/img/VIP.png"></img>
            {typeof(this.props.channel.program[this.context] ) !=="undefined" &&
            <img className="playing-label"  src="http://www.toplaygame.cn/img/playing-white.gif"></img>
            }
            <div className="label number-label">
                <p className="number">{this.props.channel.number}</p>
            </div>
            <div className="label channel-label">
                <p className="channel">{this.props.channel.name}</p>
            </div>
            <div className=" label program-label">
                <p className="program">{this.props.channel.nowTimePlaying.prgrameName}</p>
            </div>
            <div className="more-label">
                <img src="http://www.toplaygame.cn/img/arrow_right.png"></img>
                <p>更多</p>
            </div>
            {this.props.channel.elementSate == ElementSate.focus &&
                <div className="focus-div"></div>
            }
        </div>
    }
}

//频道单元
export class ChannelItem extends React.Component {
    constructor(props) {
        super(props)
        this.getElementSateClass = this.getElementSateClass.bind(this);
    }

    getElementSateClass() {
        return 1
    }

    render() {
        return <div className="channel_item"><span className="channel_name">{this.props.channelName}</span></div>
    }
}

//分类列表
export class CatergoryList extends React.Component {
    componentDidMount() {
        // console.log(this.props.channelCategoryList)
    }

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


export class BasePage {
    constructor() {
        this.remoteId = Math.random()
        this.mountRemote()
    }
    //挂载遥控器事件
    mountRemote() {
        eventBus.on(EventType.REMOTE_EVENT, this.remoteId, (keyCode) => {
            switch (keyCode) {
                case KeyCode.KEY_UP:
                    this.up()
                    break
                case KeyCode.KEY_DOWN:
                    this.down()
                    break
                case KeyCode.KEY_LEFT:
                    this.left()
                    break
                case KeyCode.KEY_RIGHT:
                    this.right()
                    break
                default:
            }
        })
    }

    removeMountRemote() {
        eventBus.off(EventType.REMOTE_EVENT, this.remoteId)
    }

    left() {
        console.log("left")
    }

    right() {
        console.log("right")
    }

    up() {
        console.log("up")
    }

    down() {
        console.log("down")
    }

    ok() {
        console.log("ok")
    }
}

//mst 频道列表页面部分
export class MstChannelCpt extends React.Component {

    render() {
        let bottomArrow = <div className="review-arrow down">
            <img src="http://www.toplaygame.cn/img/arrow_down.png"></img>
        </div>
        return <div className="mst-channel-list-view">
            <MstChannelList list={this.props.pageInfo.category}></MstChannelList>
            {bottomArrow}
        </div>
    }
}


//直播封套页面
export class LiveCoverCpt extends React.Component {
    constructor(props) {
        super(props)
    }

    test() {
        setTimeout(() => {
            this.state.showCategoryData[1].elementState = ElementSate.normal
            this.left()
            this.setState({
                showCategoryData: this.state.showCategoryData
            });
        }, 5000)
    }

    componentDidMount() {
        // console.log(this.props.coverPageData)
    }

    render() {
        //回看按钮部分
        const reviewButtonPart = <div className="button">
            <div className="to_lookback"></div>
            <div className="tips">回看</div>
        </div>

        //分类列表部分
        const categoryListPart = <div className="category_list"><p className="category_info">频道</p><CatergoryList channelCategoryList={this.props.coverPageData.showCategoryData}></CatergoryList></div>

        //频道列表部分
        const channleListPart = <div className="channel_list"><ChannelList channelList={this.props.coverPageData.showChannelData}></ChannelList></div>

        return <div className="cover_scene_div">
            {reviewButtonPart}
            {categoryListPart}
            {channleListPart}
        </div>
    }
}
