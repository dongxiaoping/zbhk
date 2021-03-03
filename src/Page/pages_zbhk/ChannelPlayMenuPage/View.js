import "../../../common/Loading.js";
import {model} from "./Model"
import {AbstractView,AbstractListView} from "../../../Abstract/scene/AbstractView"
import {getOffsetValue,getListSwitchMode} from "../../../common/CommonUtils"
import DataAccess from "../../../common/DataAccess";
import {removeClass,addClass} from "../../../common/CommonUtils"
import Collection from "../../../common/UserCollection"
import CommonConfig from "../../../common/Config"
import {programTimeType, moveType, mediaType, interfaceType, LogType, liveOkResponse} from "../../../common/GlobalConst"
import {KeyCode} from "../../../common/FocusModule";
import JxLog from "../../../common/Log"
import {focusManage} from "./Focus";
import OTTConfig from "../../../common/CmsSwitch";
import modelManage from "../../../App/app_zbhk/ModelManage";
import Book from "../../../common/UserBook.js";
class View extends AbstractView {
    constructor() {
        super();
        this.channelListView = new ChannelListView();
        this.dateListView = new DateListView();
        this.programListView = new ProgramListView();
        this.pageElementType = {CHANNEL: 1, DATE: 2,COLLECT:3,PROGRAM:4};
    }

    //返回页面宽度，宽度和是否显示频道号以及是否显示台标有关
    initPageWith(){
        if(OTTConfig.showChannelIcon()){
            let item = document.getElementsByClassName('channel-play-menu')[0];
            item.style.width='925px'
            item.style.backgroundSize = "785px 100%";
            document.getElementById('p_d_p_0').style.width='305px'
        }
    }
    viewUpdateData() {
        super.viewUpdateData();
        let channelCode = model.getSelectedChannelCode();
        let theOffset = this.channelListView.getOffsetBySelectedChannelCode(channelCode);
        this.channelListView.setOffset(theOffset);
        this.channelListView.viewUpdateData();

        let channelCodeIndex = this.channelListView.getIndexInShowList(channelCode);
        let channleLocation = {x:0,y:channelCodeIndex};
        focusManage.setFocusLocation(channleLocation);
        focusManage.lost();
        this.dateListView.viewUpdateData();
        if(this.isOkShowPage()){
            let selectedScheduleCode =model.getSelectedScheduleCode();
            let dateIndex = this.dateListView.getIndexInShowList(model.getSelectedDay());
            let dateLocation = {x:1,y:dateIndex};
            focusManage.setFocusLocation(dateLocation);
            focusManage.lost();
            let theOffset = this.programListView.getOffsetByScheduleCode(selectedScheduleCode);
            this.programListView.setOffset(theOffset);
            this.programListView.viewUpdateData();
            let index = this.programListView.getIndexInShowList(selectedScheduleCode);
            let programLocation = {x:2,y:index};
            focusManage.setFocusLocation(programLocation);
            this.programListView.viewPage();
        }else{
            focusManage.setFocusLocation({ x: 1, y: 0 });
            view.programListView.channelScheduleInfoUpdatedNotice();
        }
        if (OTTConfig.okResponseType() == liveOkResponse.PROGRAM_FOCUS_CHANNEL) {
            focusManage.setFocusLocation(channleLocation);
        }
    }

    isOkShowPage(){
        let selectedScheduleCode =model.getSelectedScheduleCode();
        if(selectedScheduleCode){
            return true;
        }else{
            return false;
        }
    }

    viewPage() {
        super.viewPage();
        this.initPageWith()
        this.channelListView.viewPage();
        this.dateListView.viewPage();
        if(this.isOkShowPage()){
            let lostLocation = this.channelListView.getLostLocation();
            let obId = this.getIdByLocation(lostLocation);
            let ob = document.getElementById(obId);
            addClass(ob, "select");
        }
        let selectedCategoryCode = model.getSelectedCategoryCode();
        let categoryInfo = model.getCategoryInfoByCode(selectedCategoryCode);
        document.getElementById("select-category-name-show-id").innerHTML=categoryInfo.Name;
        let channelCode = model.getSelectedChannelCode();
        this.dateListView.collectViewUpdate(channelCode);
        let modeType = modelManage.getModeType();
        if(interfaceType.ACTION_LIVE_CHANNEL_LOCK == modeType){
           this.lockChannelPageView()
        }
    }
    //频道锁定页面处理
    lockChannelPageView(){
        try{
            document.getElementById("channel_play_menu_scene").style.width = "500px"
            let allList = model.getCategoryInfo().Channels
            let name = allList[0].ChannelName
            document.getElementById("channel_play_menu_part_channel_name").innerText = name
        }catch (e) {
            console.log(e)
        }
    }

    getPageElementTypeByLocation(location){
        if(location.x===0){
            return this.pageElementType.CHANNEL;
        }else if(location.x===1&&location.y===-1){
            return this.pageElementType.COLLECT;
        }else if(location.x===1){
            return this.pageElementType.DATE;
        }else{
            return this.pageElementType.PROGRAM;
        }
    }

    getIdByLocation(location){
        let type = this.getPageElementTypeByLocation(location);
        if(type===this.pageElementType.CHANNEL){
            return "p_d_p_0_0_"+location.y;
        }else if(type===this.pageElementType.DATE){
            return "p_d_p_1_0_"+location.y;
        }else if(type===this.pageElementType.PROGRAM){
            return "p_d_p_2_0_"+location.y;
        }else{
            return "p_d_p_1_c";
        }
    }

    getDataByLocation(location){
        let type = this.getPageElementTypeByLocation(location);
        if(type===this.pageElementType.DATE){
            let info = model.getChannelDateSchedule();
            return info[location.y];
        }else if(type===this.pageElementType.CHANNEL){
            return this.channelListView.showList[location.y];
        }else if(type===this.pageElementType.PROGRAM){
            return this.programListView.showList[location.y];
        }else if(type===this.pageElementType.COLLECT){
            let channelCode = model.getSelectedChannelCode();
            return DataAccess.getChannelInfo(channelCode);
        }
        return null;
    }

    destroy(){
        super.destroy();
        this.programListView.destroy();
        this.dateListView.destroy();
        this.channelListView.destroy();
    }
}

class ChannelListView extends AbstractListView {
    constructor() {
        super("p_d_p_0");
        this.contentSize = 8;
        this.offset = 0;
        this.showList = [];
    }

    viewUpdateData(){
        this.showList = this.getShowListByOffset();
    }

    viewPage() {
        super.viewPage();
        this.updateChannelNumAndIcon()
        this.updateCollectionIcon();
        this.updatePlayStyle();
    }

    getIndexInShowList(channelCode){
        for(let i=0;i<this.showList.length;i++){
            if(this.showList[i].ChannelCode===channelCode){
                return i;
            }
        }
        JxLog.e([LogType.PAGE], "Page/pages_zbhk/ChannelPlayMenuPage/View/ChannelListView/getIndexInShowList",
            ["在频道列表中未找到指定的频道", channelCode]);
        return 0;
    }

    updateChannelNumAndIcon(){
        try{
            if(!OTTConfig.showChannelNo()) {
                let channelNums = document.getElementsByClassName('schedule-menu-channel-num');
                let i = 0;
                for(;i<channelNums.length;i++){
                    channelNums[i].style.visibility = 'hidden';
                }
            }
            let icons = document.getElementsByClassName('channel-play-menu-list-icon');
            if(!OTTConfig.showChannelIcon()) {
                for(let i = 0;i<icons.length;i++){
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

    updatePlayStyle(){
        let playInfo = window.WebApp.getNowPlayInfo();
        let channelCode = playInfo.channelCode;
        let setIndex = -1;
        for(let i=0;i<this.showList.length;i++){
            if(this.showList[i].ChannelCode===channelCode){
                setIndex = i;
                break;
            }
        }
        if(setIndex===-1){
            return ;
        }
        let obId = "p_d_p_0_0_"+setIndex;
        let ob = document.getElementById(obId);
        addClass(ob,"play");
    }

    updateCollectionIcon(){
        let collectList = DataAccess.getCollectedChannel();
        for(let i=0;i<this.showList.length;i++){
            let obId = "channel-play-menu-list-collection-icon-"+i;
            let ob = document.getElementById(obId);
            for(let j=0;j<collectList.length;j++){
                if(this.showList[i].ChannelCode === collectList[j].channelCode){
                    removeClass(ob,"menu-channel-collection-hidden");
                    break;
                }
            }
        }
    }

    getShowListCount(){
        return this.showList.length;
    }

    getShowListByOffset(){
        let list = [];
        let allList = model.getCategoryInfo();
        allList = allList.Channels;
        for(let i = this.offset; i < (this.offset + this.contentSize); i++) {
            if(i < allList.length) {
                list.push(allList[i]);
            }
        }
        return list;
    }

    getOffsetBySelectedChannelCode(channelCode){
        let list = model.getCategoryInfo();
        list = list.Channels;
        return getOffsetValue(list,"ChannelCode",channelCode,8);
    }

    setOffset(x) {
        this.offset = x;
    }

    setShowList(list){
        this.showList = list;
    }

    getShowList(){
        return this.showList;
    }

    onBottomBorder(){
        let location = focusManage.getFocusLocation();
        let setSelectedLocation = location.y;
        let showListCount = this.getShowListCount();
        let moveMode =  getListSwitchMode(setSelectedLocation,showListCount,KeyCode.KEY_RIGHT);
        let allList = model.getCategoryInfo().Channels;
        if(moveMode === moveType.FOCUS_MOVE){
            if(location.y+1>=showListCount){
                return ;
            }
            focusManage.lostNotice();
            location.y++;
            focusManage.setFocusLocation(location);
        }else{
            //最后一个频道再向下，定位到第一个频道
            if(this.offset+this.contentSize>=allList.length){
                this.offset = 0;
                location.y = 0;
            }else{
                this.offset++;
            }
            focusManage.lostNotice();
            focusManage.setFocusLocation(location);
            this.viewUpdateData();
            this.viewPage();
        }
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }

    onTopBorder(){
        let location = focusManage.getFocusLocation();
        let setSelectedLocation = location.y;
        let showListCount = this.getShowListCount();
        let moveMode =  getListSwitchMode(setSelectedLocation,showListCount,KeyCode.KEY_LEFT);
        let allList = model.getCategoryInfo().Channels;
        if(moveMode === moveType.FOCUS_MOVE){
            if(location.y<=0){
                return ;
            }
            focusManage.lostNotice();
            location.y--;
            focusManage.setFocusLocation(location);
        }else{
            //第一个的频道再向上，定位到最后一个频道
            if(this.offset<=0) {
                if(OTTConfig.isUpDownLoop()) {
                    this.offset = allList.length-this.contentSize;
                    if (this.offset < 0) {  //只有一页的情况
                        this.offset = 0;
                        location.y = allList.length - 1;
                    } else {
                        location.y = that.contentSize - 1;
                    }
                } else {
                    return;
                }
            } else {
                this.offset--;
            }
            focusManage.lostNotice();
            focusManage.setFocusLocation(location);
            this.viewUpdateData();
            this.viewPage();
        }
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }

    destroy(){
        super.destroy();
        this.showList = [];
    }
}

class DateListView extends AbstractListView {
    constructor() {
        super("p_d_p_1");
        this.contentSize = 7;
        this.offset = 0;
        this.showList = [];
    }

    viewPage(){
        super.viewPage();
        this.updatePlayStyle();
        let channelCode = model.getSelectedChannelCode();
        this.collectViewUpdate(channelCode);
        let modeType = modelManage.getModeType();
        if(interfaceType.ACTION_LIVE_CHANNEL_LOCK == modeType){
            document.getElementById("p_d_p_1_c").style.display = "none"
        }
    }

    viewUpdateData(){
        this.showList = model.getChannelDateSchedule();
    }

    updatePlayStyle(){
        let playInfo = window.WebApp.getNowPlayInfo();
        let channelCode = playInfo.channelCode;
        let selectedChannelCode = model.getSelectedChannelCode();
        if(selectedChannelCode===channelCode){
            let dayTab = playInfo.startTime?model.getDayTab(playInfo.startTime):model.getNowDay();
            for(let i=0;i<this.showList.length;i++){
                if(this.showList[i].date ===dayTab){
                    let obId = "p_d_p_1_0_"+i;
                    let ob = document.getElementById(obId);
                    addClass(ob,"play");
                    break;
                }
            }
        }
    }

    getIndexInShowList(dayInfo){
        for(let i=0;i<this.showList.length;i++){
            if(this.showList[i].date===dayInfo){
                return i;
            }
        }
        return 0;
    }

    onBottomBorder(){
        let location = focusManage.getFocusLocation();
        focusManage.lostNotice();
        if(location.y<(this.showList.length-1)){
            location.y++;
        }else{
            location.y = 0;
        }
        focusManage.setFocusLocation(location);
        this.viewUpdateData();
        this.viewPage();
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }

    onTopBorder(){
        let location = focusManage.getFocusLocation();
        if(location.y<=-1){
            return;
        }
        let modeType = modelManage.getModeType();
        if(interfaceType.ACTION_LIVE_CHANNEL_LOCK == modeType && location.y<=0){
           return;
        }
        focusManage.lostNotice();
        location.y--;
        focusManage.setFocusLocation(location);
        this.viewUpdateData();
        this.viewPage();
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }

    collectViewUpdate(channelCode){
        let labelOb = document.getElementById("p_d_p_1_c");
        if(!labelOb){
            return ;
        }
        let selectedChanelCode = model.getSelectedChannelCode();
        if(Collection.isCollected(channelCode)||model.getSelectedCategoryCode()===CommonConfig.mCollectionCode){//已经收藏
            labelOb.innerHTML = "取消收藏";
            if(channelCode===selectedChanelCode){
                let index = view.channelListView.getIndexInShowList(selectedChanelCode);
                let setId = "channel-play-menu-list-collection-icon-"+index;
                let setOb = document.getElementById(setId);
                removeClass(setOb,"menu-channel-collection-hidden");
            }
        }else{//未收藏
            labelOb.innerHTML = "收藏频道";
            if(channelCode===selectedChanelCode){
                let index = view.channelListView.getIndexInShowList(selectedChanelCode);
                let setId = "channel-play-menu-list-collection-icon-"+index;
                let setOb = document.getElementById(setId);
                addClass(setOb,"menu-channel-collection-hidden");
            }
        }

    }

    destroy(){
        super.destroy();
        this.showList = [];
    }
}

class ProgramListView extends AbstractListView {
    constructor() {
        super("p_d_p_2");
        this.contentSize = 8;
        this.offset = 0;
        this.showList = [];
        this.bookTipTimer = null;
    }

    viewUpdateData() {
        this.showList = this.getShowListByOffset();
    }

    getShowList() {
        return this.showList;
    }

    getShowListByOffset() {
        let list = [];
        let allList = model.getChannelScheduleInfo();
        for (let i = this.offset; i < this.offset + this.contentSize; i++) {
            if (i < allList.length) {
                list.push(allList[i]);
            }
        }
        return list;
    }

    viewPage() {
        super.viewPage();
        if (this.showList.length <= 0) {
            let listDiv = document.getElementById(this.id);
            listDiv.innerHTML =
                '<p style="color:white;margin-left: 60px;margin-top: 250px;">暂无节目单</p>';
        }
        this.updatePageStyle();
        this.updatePlayStyle();
    }

    updatePlayStyle() {
        let playInfo = window.WebApp.getNowPlayInfo();
        let playType = playInfo.type;
        let scheduleCode = "";
        let selectedChannelCode = model.getSelectedChannelCode();
        if (selectedChannelCode !== playInfo.channelCode) {
            return;
        }
        if (playType === mediaType.LIVE) {
            let playProgram = model.getLiveProgramInfo();
            if (!playProgram) {
                return;
            }
            scheduleCode = playProgram.ScheduleCode;
        } else {
            scheduleCode = playInfo.scheduleCode;
        }
        let setIndex = -1;
        for (let i = 0; i < this.showList.length; i++) {
            if (this.showList[i].ScheduleCode === scheduleCode) {
                setIndex = i;
                break;
            }
        }
        if (setIndex === -1) {
            return;
        }
        let obId = "p_d_p_2_0_" + setIndex;
        let ob = document.getElementById(obId);
        addClass(ob, "play");
        let typeObId = obId + "_type";
        let typeOb = document.getElementById(typeObId);
        typeOb.style.display = "block";
    }

    updatePageStyle() {
        for (let i = 0; i < this.showList.length; i++) {
            let item = this.showList[i];
            let indexLocation = { x: 2, y: i };
            let obId = view.getIdByLocation(indexLocation);
            let ob = document.getElementById(obId);
            if (item.programType === programTimeType.IS_LIVE) {
                addClass(ob, "program-live-style");
            } else if (item.programType === programTimeType.IS_FORE_SHOW) {
                addClass(ob, "program-foreshow-style");
                if (Book.isBooked(item.ChannelCode,item.Name,item.ScheduleCode)) {
                    addClass(ob, "is-booked");
                }
            }
        }
    }

    setOffset(x) {
        this.offset = x;
    }

    getIndexInShowList(scheduleCode) {
        for (let i = 0; i < this.showList.length; i++) {
            if (this.showList[i].ScheduleCode === scheduleCode) {
                return i;
            }
        }
        JxLog.e(
            [LogType.PAGE],
            "Page/pages_zbhk/ChannelPlayMenuPage/View/ProgramListView/getIndexInShowList",
            ["error:节目单节目数据定位错误，未找到指定节目数据!"]
        );
        return 0;
    }

    channelScheduleInfoUpdatedNotice() {
        JxLog.d(
            [LogType.PAGE],
            "Page/pages_zbhk/ChannelPlayMenuPage/View/ProgramListView/channelScheduleInfoUpdatedNotice",
            ["节目单数据更新通知"]
        );
        let offSet = this.getOffsetByLiveProgram();
        this.setOffset(offSet);
        this.viewUpdateData();
        this.viewPage();
    }

    getOffsetByLiveProgram() {
        let list = model.getChannelScheduleInfo();
        let location = this.getSelectedIndexMoveFromDate(list);
        let len = list.length;
        if (len - location < this.contentSize) {
            location =
                location - this.contentSize > 0
                    ? location + 1 - this.contentSize
                    : 0;
            return location;
        }
        for (let m = 0; m < 3; m++) {
            if (location > 0) {
                location--;
            }
        }
        return location;
    }

    getSelectedIndexMoveFromDate(list) {
        let location = 0;
        let playInfo = window.WebApp.getNowPlayInfo();
        let playChannelCode = playInfo.channelCode;
        let selectedChannelCode = model.getSelectedChannelCode();
        if (playChannelCode === selectedChannelCode) {
            let playScheduleCode = playInfo.scheduleCode
                ? playInfo.scheduleCode
                : null;
            for (let i = 0; i < list.length; i++) {
                if (list[i].ScheduleCode === playScheduleCode) {
                    location = i;
                    break;
                }
                if (list[i].programType === programTimeType.IS_LIVE) {
                    location = i;
                    break;
                }
            }
        } else {
            for (let i = 0; i < list.length; i++) {
                if (list[i].programType === programTimeType.IS_LIVE) {
                    location = i;
                    break;
                }
            }
        }
        return location;
    }

    getOffsetByScheduleCode(scheduleCode) {
        let list = model.getChannelScheduleInfo();
        let location = 0;
        let len = list.length;
        for (let i = 0; i < len; i++) {
            if (list[i].ScheduleCode === scheduleCode) {
                location = i;
                break;
            }
        }
        if (len - location < this.contentSize) {
            location =
                location - this.contentSize > 0
                    ? location + 1 - this.contentSize
                    : 0;
            return location;
        }
        for (let m = 0; m < 3; m++) {
            if (location > 0) {
                location--;
            }
        }
        return location;
    }

    getShowListCount() {
        return this.showList.length;
    }

    onBottomBorder() {
        let location = focusManage.getFocusLocation();
        let setSelectedLocation = location.y;
        let showListCount = this.getShowListCount();
        let moveMode = getListSwitchMode(
            setSelectedLocation,
            showListCount,
            KeyCode.KEY_RIGHT
        );
        let allList = model.getChannelScheduleInfo();
        if (moveMode === moveType.FOCUS_MOVE) {
            if (location.y + 1 >= showListCount) {
                return;
            }
            focusManage.lostNotice();
            location.y++;
            focusManage.setFocusLocation(location);
        } else {
            if (this.offset + this.contentSize >= allList.length) {
                this.offset = 0;
                location.y = 0;
            } else {
                this.offset++;
            }
            focusManage.lostNotice();
            focusManage.setFocusLocation(location);
        }
        this.viewUpdateData();
        this.viewPage();
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }

    onTopBorder() {
        let location = focusManage.getFocusLocation();
        let setSelectedLocation = location.y;
        let showListCount = this.getShowListCount();
        let moveMode = getListSwitchMode(
            setSelectedLocation,
            showListCount,
            KeyCode.KEY_LEFT
        );
        let allList = model.getChannelScheduleInfo();
        if (moveMode === moveType.FOCUS_MOVE) {
            if (location.y <= 0) {
                return;
            }
            focusManage.lostNotice();
            location.y--;
            focusManage.setFocusLocation(location);
        } else {
            if (this.offset <= 0) {
                return;
            }
            focusManage.lostNotice();
            this.offset--;
            focusManage.setFocusLocation(location);
        }
        this.viewUpdateData();
        this.viewPage();
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }

    onBookOk(type) {
       let location = focusManage.getFocusLocation();
       let tipEle = document.getElementById("book_operation_tip_"+location.y);
       tipEle.innerHTML = type ? "节目预约成功" : "预约已取消";
       tipEle.style.display = "block";
       clearTimeout(this.bookTipTimer);
       this.bookTipTimer = setTimeout(function () {
           tipEle.style.display = "none";
       }, 1000);
       let itemEle = document.getElementById("p_d_p_2_0_"+location.y);
       let typeEle = document.getElementById("p_d_p_2_0_"+location.y+"_type");
       if(type) {
           addClass(itemEle, "is-booked");
           typeEle.style.display="none";
       } else {
           removeClass(itemEle, "is-booked");
           typeEle.style.display = "block";
       }
    }

    destroy() {
        super.destroy();
        this.showList = [];
    }
}

export const view = new View();
export default {view}