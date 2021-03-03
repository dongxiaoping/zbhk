import "../../../common/Loading.js";
import {AbstractView, AbstractListView} from "../../../Abstract/scene/AbstractView"
import {model} from "./Model"
import {sceneIds} from "../../../App/app_zbhk/AppGlobal";
import {addClass, getOffsetValue, getListSwitchMode, getByteLen, removeClass} from "../../../common/CommonUtils"
import {KeyCode} from "../../../common/FocusModule";
import {focusManage} from "./Focus";
import DataAccess from "../../../common/DataAccess";
import CommonConfig from "../../../common/Config";
import {moveType, liveOkResponse, mediaType, defaultBookInfo, defaultLiveCode} from "../../../common/GlobalConst"
import OTTConfig from "../../../common/CmsSwitch.js";
import { sysTime } from "../../../common/TimeUtils.js";
import {findIndex} from "../../../lib/lodash";
import playManage from "../../../App/app_zbhk/PlayManage";
import Book from "../../../common/UserBook";

class View extends AbstractView {
    constructor () {
        super ();
        this.categoryListView = new CategoryListView ();
        this.channelListView = new ChannelListView ();
        this.bookListView = new BookListView();
        this.pageElementType = {CATEGORY: 1, CHANNEL: 2, BOOK: 3};
        this.pageEle = document.getElementById("category_play_menu_scene");
        this.rightArrowEle = document.getElementById("category_play_menu_arrow_right_id");
        this.rightTipEle = document.getElementById("category_menu_arrow_two_right_id");
    }

    viewUpdateData () {
        super.viewUpdateData ();
        let param = window.WebApp.Nav.getNavParams (sceneIds.CATEGORY_PLAY_MENU_ID);
        let categoryCode = param.categoryCode;
        let channelCode = param.channelCode;
        model.setSelectedCategoryCode (categoryCode);
        model.setSelectedChannelCode (channelCode);

        let theOffset = this.categoryListView.getOffsetBySelectedCategoryCode (categoryCode);
        this.categoryListView.setOffset (theOffset);
        this.categoryListView.viewUpdateData ();

        theOffset = this.channelListView.getOffsetBySelectedChannelCode (channelCode);
        this.channelListView.setOffset (theOffset);
        this.channelListView.viewUpdateData ();
    }

    initPageWith () {
        let isShowChannelIcon = OTTConfig.showChannelIcon ()
        if (OTTConfig.pageArrowFlag()==0) { //单箭头
            this.rightArrowEle.style.display = 'none'
            this.rightTipEle.style.top = '340px'
        }
        if (isShowChannelIcon) {
            document.getElementsByClassName ('category-play-menu')[0].style.width = '548px'
            document.getElementById ('c_p_p_1').style.width = '307px'
            this.rightArrowEle.style.left = '510px'
            this.rightTipEle.style.left = '510px'
        }
    }

    getInitLocation (code) {
        let list = model.getCategoryList ();
        for (let i = 0; i < list.length; i++) {
            if (list[i].Code === code) {
                return {x: 0, y: i - view.categoryListView.offset};
            }
        }
        return {x: 0, y: 0};
    }

    viewPage () {
        super.viewPage ();
        this.initPageWith ()
        this.categoryListView.viewPage ();
        this.channelListView.viewPage ();
        let param = window.WebApp.Nav.getNavParams (sceneIds.CATEGORY_PLAY_MENU_ID);
        let categoryCode = param.categoryCode;
        let channelCode = param.channelCode;
        let location = this.getInitLocation (categoryCode);
        let channelLocation = this.channelListView.getLocationByChannelCode (channelCode);
        let okType = OTTConfig.okResponseType ();
        if(okType == liveOkResponse.PROGRAM_LIST || okType == liveOkResponse.PROGRAM_FOCUS_CHANNEL) {
            focusManage.setFocusLocation (location);
            focusManage.setLostLocation (channelLocation);
        } else if(okType == liveOkResponse.CATEGORY_LIST){
            focusManage.setFocusLocation (channelLocation);
            focusManage.setLostLocation (location);
        }
        let obId = view.getIdByLocation (channelLocation);
        let ob = document.getElementById (obId);
        addClass (ob, "select");
        focusManage.nodeUpdate ();
        focusManage.nodeFocus ();
    }

    processPageShow(listType) {
        if(listType == this.pageElementType.CHANNEL) {
            view.bookListView.bookListEle.style.display = "none";
            view.channelListView.channelListEle.style.display = "block";
            view.pageEle.style.width = "548px";
            if(OTTConfig.showChannelIcon ()) {
                if (OTTConfig.pageArrowFlag() == 1) {
                    this.rightArrowEle.style.display = "block";
                } else {
                    this.rightTipEle.style.display = "block";
                }
            }
        } else { //预约
            view.channelListView.channelListEle.style.display = "none";
            view.bookListView.bookListEle.style.display = "block";
            view.pageEle.style.width = "724px";
            view.pageEle.style.backgroundSize = "588px 100%";
            this.rightArrowEle.style.display = 'none';
            this.rightTipEle.style.display = 'none';
        }
    }

    getPageElementTypeByLocation (location) {
        if (location.x === 0) {
            return this.pageElementType.CATEGORY;
        } else if(location.x == 1){
            return this.pageElementType.CHANNEL;
        } else {
            return this.pageElementType.BOOK
        }
    }

    getIdByLocation (location) {
        let type = this.getPageElementTypeByLocation (location);
        if (type === this.pageElementType.CATEGORY) {
            return "category-play-menu-category-" + location.y;
        } else if(type == this.pageElementType.CHANNEL){
            return "category-play-menu-channel-" + location.y;
        } else {
            return "book_item_" + location.y;
        }
    }

    getDataByLocation (location) {
        let type = this.getPageElementTypeByLocation (location);
        if (type === this.pageElementType.CATEGORY) {
            return view.categoryListView.showList[location.y];
        } else if(type === this.pageElementType.CHANNEL){
            return view.channelListView.showList[location.y];
        } else {
            return view.bookListView.showList[location.y];
        }
    }

    destroy () {
        super.destroy ();
        this.categoryListView.destroy()
        this.channelListView.destroy()
    }
}

class CategoryListView extends AbstractListView {
    constructor () {
        super ("c_p_p_0");
        this.categoryListEle = document.getElementById(c_p_p_0);
        this.contentSize = 8;
        this.offset = 0;
        this.showList = [];
    }

    viewUpdateData () {
        this.showList = this.getShowListByOffset ();
    }

    viewPage () {
        super.viewPage ();
        this.updatePlayStyle ();
    }

    updatePlayStyle () {
        let playInfo = window.WebApp.getNowPlayInfo ();
        if (!playInfo) {
            return;
        }
        let categoryCode = playInfo.categoryCode;
        for (let i = 0; i < this.showList.length; i++) {
            if (this.showList[i].Code === categoryCode) {
                let obId = "category-play-menu-category-" + i;
                let ob = document.getElementById (obId);
                addClass (ob, "play");
                break;
            }
        }
    }

    getOffsetBySelectedCategoryCode (categoryCode) {
        let list = model.getCategoryList ();
        let myOffset = getOffsetValue (list, "Code", categoryCode, 8);
        return myOffset;
    }

    setShowList (list) {
        this.showList = list;
    }

    getLocationInShowList (categoryCode) {
        for (let i = 0; i < this.showList.length; i++) {
            if (this.showList[i].Code === categoryCode) {
                return i;
            }
        }
        return 0;
    }

    getShowList () {
        return this.showList;
    }

    getShowListCount () {
        return this.showList.length;
    }

    setOffset (x) {
        this.offset = x;
    }

    getShowListByOffset () {
        let list = [];
        let allList = model.getCategoryList ();
        for (let i = this.offset; i < (this.offset + this.contentSize); i++) {
            if (i < allList.length) {
                list.push (allList[i]);
            }
        }
        return list;
    }

    onBottomBorder () {
        let location = focusManage.getFocusLocation ();
        let setSelectedLocation = location.y;
        let showListCount = this.getShowListCount ();
        let moveMode = getListSwitchMode (setSelectedLocation, showListCount, KeyCode.KEY_RIGHT);
        let allList = model.getCategoryList ();
        if (moveMode === moveType.FOCUS_MOVE) {
            focusManage.lostNotice ();
            location.y++;
            focusManage.setFocusLocation (location);
        } else {
            if (this.offset + this.contentSize >= allList.length) {
                this.offset = 0;
                location.y = 0;
            } else {
                this.offset++;
            }
            focusManage.lostNotice ();
            focusManage.setFocusLocation (location);
        }
        this.viewUpdateData ();
        this.viewPage ();
        focusManage.nodeUpdate ();
        focusManage.nodeFocus ();
    }

    onTopBorder () {
        let location = focusManage.getFocusLocation ();
        let setSelectedLocation = location.y;
        let showListCount = this.getShowListCount ();
        let moveMode = getListSwitchMode (setSelectedLocation, showListCount, KeyCode.KEY_LEFT);
        if (moveMode === moveType.FOCUS_MOVE) {
            if (location.y <= 0) {
                return;
            }
            focusManage.lostNotice ();
            location.y--;
            focusManage.setFocusLocation (location);
        } else {
            if (this.offset <= 0) {
                return;
            }
            focusManage.lostNotice ();
            this.offset--;
            focusManage.setFocusLocation (location);
        }
        this.viewUpdateData ();
        this.viewPage ();
        focusManage.nodeUpdate ();
        focusManage.nodeFocus ();
    }

    onRightBorder () {
        let info = view.getDataByLocation(focusManage.getFocusLocation());
        let location = null;
        if(info.Code == defaultBookInfo.Code) {
            location = {x:2, y:0};
        } else {
            location = this.getChannelIndexToRight ();
        }
        let lostLocation = focusManage.getLostLocation ();
        if (lostLocation) {
            let lostElementType = view.getPageElementTypeByLocation (lostLocation);
            if (lostElementType === view.pageElementType.CHANNEL || lostElementType == view.pageElementType.BOOK) {
                location = lostLocation;
            }
        }
        focusManage.lostNotice ();
        focusManage.setFocusLocation (location);
        focusManage.nodeUpdate ();
        focusManage.nodeFocus ();
    }

    getChannelIndexToRight () {
        let nowPlayInfo = window.WebApp.getNowPlayInfo ();
        let channelCode = nowPlayInfo.channelCode;
        return view.channelListView.getLocationByChannelCode (channelCode);
    }
}

class ChannelListView extends AbstractListView {
    constructor () {
        super ("c_p_p_1");
        this.channelListEle = document.getElementById('c_p_p_1');
        this.contentSize = 8;
        this.offset = 0;
        this.showList = [];
    }

    viewUpdateData () {
        this.showList = this.getShowListByOffset ();
    }

    viewPage () {
        super.viewPage ();
        view.processPageShow(view.pageElementType.CHANNEL);
        this.updateCollectionIcon ();
        this.updatePlayStyle ();
        this.updateChannelNumAndIcon ()
    }

    updateChannelNumAndIcon () {
        try{
            if (!OTTConfig.showChannelNo ()) {
                let channelNums = document.getElementsByClassName ('channel-category-channel-num');
                let i = 0;
                for (; i < channelNums.length; i++) {
                    channelNums[i].style.visibility = 'hidden';
                }
            }
            let icons = document.getElementsByClassName ('category-play-menu-list-icon');
            if (!OTTConfig.showChannelIcon ()) {
                for (let i = 0; i < icons.length; i++) {
                    icons[i].style.display = 'none';
                }
            }else{
                for(let i = 0;i<icons.length;i++){
                    if(typeof (this.showList[i].ChannelIcon)!="undefined"
                        &&this.showList[i].ChannelIcon!=null&&this.showList[i].ChannelIcon!="")
                        icons[i].getElementsByTagName("img")[0].src = this.showList[i].ChannelIcon;
                }
            }
        }catch (e) {
            console.log(e)
        }
    }

    updatePlayStyle () {
        let playInfo = window.WebApp.getNowPlayInfo ();
        if (!playInfo) {
            return;
        }
        let channelCode = playInfo.channelCode;
        for (let i = 0; i < this.showList.length; i++) {
            if (this.showList[i].ChannelCode === channelCode) {
                let obId = "category-play-menu-channel-" + i;
                let ob = document.getElementById (obId);
                addClass (ob, "play");
                break;
            }
        }
    }

    updateCollectionIcon () {
        let selectedCategoryCode = model.getSelectedCategoryCode ();
        if (selectedCategoryCode === CommonConfig.mCollectionCode) {
            return;
        }
        let collectList = DataAccess.getCollectedChannel ();
        for (let i = 0; i < this.showList.length; i++) {
            let obId = "category-play-menu-channel-img-" + i;
            let ob = document.getElementById (obId);
            for (let j = 0; j < collectList.length; j++) {
                if (this.showList[i].ChannelCode === collectList[j].channelCode) {
                    ob.style.visibility = "visible";
                    break;
                }
            }
        }
    }

    getShowListCount () {
        return this.showList.length;
    }

    getLocationByChannelCode (code) {
        for (let i = 0; i < this.showList.length; i++) {
            if (this.showList[i].ChannelCode === code) {
                return {x: 1, y: i};
            }
        }
        return {x: 1, y: 0};
    }

    getShowListByOffset () {
        let list = [];
        let categoryCode = model.getSelectedCategoryCode ();
        let allList = model.getCategoryInfoByCode (categoryCode);
        allList = allList.Channels;
        for (let i = this.offset; i < (this.offset + this.contentSize); i++) {
            if (i < allList.length) {
                list.push (allList[i]);
            }
        }
        return list;
    }

    setOffset (x) {
        this.offset = x;
    }

    getOffsetBySelectedChannelCode (channelCode) {
        let categoryCode = model.getSelectedCategoryCode ();
        let list = model.getCategoryInfoByCode (categoryCode);
        list = list.Channels;
        let myOffset = getOffsetValue (list, "ChannelCode", channelCode, 8);
        return myOffset;
    }

    setShowList (list) {
        this.showList = list;
    }

    getShowList () {
        return this.showList;
    }

    onTopBorder (type) {
        let isChannel = type == view.pageElementType.CHANNEL;
        let location = focusManage.getFocusLocation ();
        let setSelectedLocation = location.y;
        let showListCount = isChannel ? this.getShowListCount () : view.bookListView.getShowListCount();
        let moveMode = getListSwitchMode (setSelectedLocation, showListCount, KeyCode.KEY_LEFT);
        let allList = null;
        if(isChannel) {
            allList = model.getCategoryInfoByCode (model.getSelectedCategoryCode ()).Channels;
        } else {
            allList = model.getBookList();
        }
        if (moveMode === moveType.FOCUS_MOVE) {
            if (location.y <= 0) {
                return;
            }
            focusManage.lostNotice ();
            location.y--;
            focusManage.setFocusLocation (location);
        } else {
            let that = isChannel ? this : view.bookListView;
            if (!isChannel && that.offset <= 0) { //预约不循环
                return;
            }
            //第一个的频道再向上，定位到最后一个频道
            if(that.offset<=0) {
                if(OTTConfig.isUpDownLoop()) {
                    that.offset = allList.length-that.contentSize;
                    if(this.offset<0) {  //只有一页的情况
                        that.offset = 0;
                        location.y = allList.length-1;
                    } else {
                        location.y = that.contentSize-1;
                    }
                } else {
                    return;
                }
            } else {
                that.offset--;
            }
            focusManage.lostNotice ();
            focusManage.setFocusLocation (location);
            that.viewUpdateData ();
            that.viewPage ();
        }
        focusManage.nodeUpdate ();
        focusManage.nodeFocus ();
    }

    onBottomBorder (type) {
        let isChannel = type == view.pageElementType.CHANNEL;
        let location = focusManage.getFocusLocation ();
        let setSelectedLocation = location.y;
        let showListCount = isChannel ? this.getShowListCount () : view.bookListView.getShowListCount();
        let moveMode = getListSwitchMode (setSelectedLocation, showListCount, KeyCode.KEY_RIGHT);
        let allList = null;
        if(isChannel) {
            allList = model.getCategoryInfoByCode (model.getSelectedCategoryCode ()).Channels;
        } else {
            allList = model.getBookList();
        }
        if (moveMode === moveType.FOCUS_MOVE) {
            if (location.y + 1 >= showListCount) {
                return;
            }
            focusManage.lostNotice ();
            location.y++;
            focusManage.setFocusLocation (location);
        } else {
            let that = isChannel ? this : view.bookListView;
            if(!isChannel && that.offset + that.contentSize >= allList.length) { //预约不循环
                return;
            }
            //最后一个频道再向下，定位到第一个频道
            if (that.offset + that.contentSize >= allList.length) {
                that.offset = 0;
                location.y = 0;
            } else {
                that.offset++;
            }
            focusManage.lostNotice ();
            focusManage.setFocusLocation (location);
            that.viewUpdateData ();
            that.viewPage ();
        }
        focusManage.nodeUpdate ();
        focusManage.nodeFocus ();
    }

    onLeftBorder () {
        let y = view.categoryListView.getLocationInShowList (model.getSelectedCategoryCode ());
        let location = focusManage.getFocusLocation ();
        focusManage.lostNotice ();
        location.y = y;
        location.x = 0;
        focusManage.setFocusLocation (location);
        focusManage.nodeUpdate ();
        focusManage.nodeFocus ();
    }
}

//预约节目单列表（按页翻页）
class BookListView extends AbstractListView {
    constructor () {
        super ("book_program_list");
        this.bookListEle = document.getElementById("book_list_view");
        this.contentSize = 6;
        this.itemIdPrefix = "book_item_";
        this.offset = 0;
        this.showList = []; //显示的分类列表
    }

    //更新数据
    viewUpdateData () {
        this.showList = this.getShowListByOffset();
    }

    //视图展现
    viewPage () {
        super.viewPage ();
        view.processPageShow(view.pageElementType.BOOK);
        let noDataTipsEle = document.getElementById("no_book_tip");
        if(this.showList.length > 0) {
            noDataTipsEle.style.display = "none";
            this.updateListStyle();
        } else {
            noDataTipsEle.style.display = "block";
        }
    }

    getShowListByOffset() {
        let list = [];
        let allList = model.getBookList();
        for (let i = this.offset; i < (this.offset + this.contentSize); i++) {
            if (i < allList.length) {
                list.push (allList[i]);
            }
        }
        return list;
    }

    getAllList () {
        return model.getBookList();
    }

    getShowListCount () {
        return this.showList.length;
    }

    //设置offset至直播，如果没有直播，设置offset至第一个预约节目
    setOffsetToLive () {
        let allProgramList = model.getBookList();
        let offset = 0;
        let now = sysTime.date ().Format ();
        let index = findIndex (allProgramList, function (o) {
            return (o.startTime < now && now < o.endTime);
        });
        if(index === -1) {
            index = findIndex (allProgramList, function (o) {
                return o.startTime > now;
            });
        }
        if (index !== -1) {
            if(index<=this.contentSize-1) {
                offset = 0;
            } else {
               offset=index-2;
            }
        }
        this.setOffset (offset);
    }

    setOffset (x) {
        this.offset = x;
    }

    //更新预约节目列表样式
    updateListStyle () {
        let len = this.showList.length;
        let now = sysTime.date().Format ();
        let playInfo = window.WebApp.getNowPlayInfo();
        for (let i = 0; i < len; i++) {
            let item = this.showList[i];
            let itemEle = document.getElementById("book_item_"+i);
            let iconEle = document.getElementById("status_icon_"+i);
            let liveCondition = playInfo.type == mediaType.LIVE && playInfo.channelCode == item.channelCode && (item.startTime <= now && now <= item.endTime);
            let schCondition = playInfo.type == mediaType.SCH && playInfo.scheduleCode == item.scheduleCode && item.startTime == playInfo.startTime && item.endTime == playInfo.endTime;
            if(liveCondition || schCondition) {  //正播节目标识
                addClass(itemEle, "play");
            } else {
                removeClass(itemEle, "play");
            }
            if(item.startTime <= now && now <= item.endTime) {
                addClass(itemEle, "playing");
                iconEle.className = 'playing_icon';
            } else if(item.startTime > now) {
                iconEle.className = "book_icon";
                let programEle = document.getElementById("program_info_"+i);
                let type = Book.isBooked(item.channelCode, item.programName, item.scheduleCode);
                type ? removeClass(programEle, "cancel_book") : addClass(programEle, "cancel_book");
                let statusEle = document.getElementById("status_tips_"+i);
                statusEle.innerHTML = type ? "已预约" : "预约";
            } else {
                iconEle.className = 'lookback_icon';
            }
            if(item.channelNo) {
                addClass(itemEle, "with_num");
            }
        }
    }

    updateOkTip(type) {
        let location = focusManage.getFocusLocation();
        let infoEle = document.getElementById("program_info_"+location.y);
        if(type) {
            removeClass(infoEle, "cancel_book")
        } else {
            addClass(infoEle, "cancel_book");
        }
        let statusEle = document.getElementById("status_tips_"+location.y);
        statusEle.innerHTML = type ? "已预约" : "预约";
        let tipEle = document.getElementById("operation_tip_" + location.y);
        tipEle.innerHTML = type ? "节目预约成功" : "预约已取消";
        tipEle.style.display = "block";
        setTimeout(function() {
            tipEle.style.display = "none";
        }, 1000);
    }

    bookOkResponse() {
        let location = focusManage.getFocusLocation();
        let info = view.getDataByLocation(location);
        let playInfo = null;
        let now = sysTime.date ().Format ();
        if(info.startTime <= now && now <= info.endTime) {
            playInfo = {type:mediaType.LIVE, categoryCode:defaultLiveCode, channelCode:info.channelCode};
        } else if(info.startTime > now) {
            if(Book.isBooked(info.channelCode, info.programName, info.scheduleCode)) {
                this.updateOkTip(false)
                Book.unBook(info.channelCode, info.programName, info.scheduleCode, info.startTime, info.endTime);
            } else {
                this.updateOkTip(true);
                Book.book(info.channelCode, info.programName, info.scheduleCode, info.startTime, info.endTime);
            }
            return;
        } else {
            playInfo={type:mediaType.SCH, categoryCode:defaultLiveCode, channelCode:info.channelCode, scheduleCode:info.scheduleCode, startTime:info.startTime ,endTime:info.endTime };
        }
        window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID);
        playManage.switchPlay(playInfo);
    }
}
export const view = new View ();
export default {view}