import {AbstractView,AbstractListView} from "../../../Abstract/scene/AbstractView";
import {FocusNode} from "../../../common/FocusModule";
import {sysTime} from "../../../common/TimeUtils";
import OTT from '../../../common/OttMiddle';
import OTTConfig from '../../../common/CmsSwitch';
import DataAccess from "../../../common/DataAccess";
import {addClass, removeClass} from "../../../common/CommonUtils";
import imageLoad  from "../../../common/ImageLoad"
import {KeyCode} from "../../../common/FocusModule";
import {moveType, programUpdateDataType, mediaType} from "../../../common/GlobalConst";
import { sceneIds } from "../../../App/app_ailive/AppGlobal.js";
import {keyEvent} from "./KeyEvent";
import {focusManage} from "./Focus";
import {model} from "./Model";
import {channelItemResponse, dateItemResponse, programItemResponse, recItemResponse} from "./KeyEvent";
import default_horizontal_icon from "../../../images/pages_ailive/default_horizontal_icon.jpg";

class View extends AbstractView {
    constructor() {
        super();
        this.channelListView = new channelListView();
        this.dateListView = new dateListView();
        this.programListView = new programListView();
    }
    viewUpdateData() {
        super.viewUpdateData();
        this.channelListView.viewUpdateData(programUpdateDataType.BY_PLAY_INFO);
        this.dateListView.viewUpdateData(programUpdateDataType.BY_PLAY_INFO);
        this.programListView.viewUpdateData(programUpdateDataType.BY_PLAY_INFO);
    }

    viewPage() {
        super.viewPage();
        this.channelListView.viewPage();
        this.dateListView.viewPage();
        this.programListView.viewPage();
        //落焦到节目上，需要对日期加上选中样式
        this.dateListView.addSelectedDateStyle();
    }

    prevNextOne(obj, type) {
        let moveMode = view.getListSwitchMode(obj.getSelectItemLocation(), obj.contentSize, type);
        let item = (type == KeyCode.KEY_RIGHT) ? obj.getNextItem() : obj.getPreItem();
        if(item == null) {
            if(obj.itemIdPrefix == view.programListView.itemIdPrefix) {    //节目单到达首尾，跨天节目的处理
                this.processProgramCrossDay(type);
            }
            return;
        }
        obj.setSelectedItem(item);
        if(moveMode == moveType.FOCUS_MOVE){
            focusManage.lostNotice();
        }else{
            obj.offset = (type == KeyCode.KEY_RIGHT) ? obj.offset+1 : obj.offset - 1;
            obj.updateShowDataByOffset();
        }
        obj.updateNode();
        obj.nodeFocus();
    }

    processProgramCrossDay(type) {
        let idx = view.dateListView.selectedDate.idx;
        //第一天最前面一个节目再左移和最后一天最后一个节目再右移，不跨天
        if((idx == 0 && type == KeyCode.KEY_LEFT) || (idx == model.dateList.length - 1 && type == KeyCode.KEY_RIGHT)) {
            return;
        }
        idx = type == KeyCode.KEY_LEFT ? --idx : ++idx;
        let startTime = model.dateList[idx].date+" 00:00:00";
        let endTime = model.dateList[idx].date+" 23:59:59";
        let reqArgs = {
            channelCode: view.channelListView.selectedChannel.ChannelCode,
            startDate: startTime,
            endDate: endTime,
            callback: function(programData) {
                model.setProgramList(programData);
                view.dateListView.updateCrossDayDate(idx, type);
                view.programListView.updateCrossDayProgram(type);
            }
        };
        DataAccess.requestChannelSchedule(reqArgs);
    }

    destroy(){
        super.destroy();
        this.channelListView.destroyView();
        this.dateListView.destroyView();
        this.programListView.destroyView();
        focusManage.lostNotice();
    }
}

class channelListView extends AbstractListView {
    constructor() {
        super("scene_channel_item");
        this.selectedChannel = null;
    }
    viewUpdateData() {
        this.selectedChannel = model.getChannelInfo();
    }
    viewPage() {
        super.viewPage();
    }

    destroyView() {
        super.destroy();
        this.selectedChannel = null;
    }
}

class dateListView extends AbstractListView {
    constructor() {
        super("scene_date_list");
        this.itemIdPrefix = "scene_date_item_";
        this.contentSize = 6;
        this.offset = 1;     //默认显示后面6天
        this.dateList = []; //显示的日期列表
        this.selectedDate = null;
    }
    viewUpdateData(type) {
        if(type == programUpdateDataType.BY_PLAY_INFO) {
            this.setDateDataByPlayInfo(model.getPlayInfo());
        } else if(type == programUpdateDataType.BY_DATE) {
            this.setDateDataByDate();
        }
        let allDateList = model.dateList;
        for(let i = this.offset; i < (this.offset + this.contentSize); i++) {
            if(i < allDateList.length) {
                this.dateList.push(allDateList[i]);
            }
        }
    }
    viewPage() {
        super.viewPage();
        this.addPlayingDateStyle();
    }
    //根据日期（今天）设置日期列表要显示的数据
    setDateDataByDate() {
        let dateList = model.getDateList();
        let len = dateList.length;
        if(len > this.contentSize) {
            this.setOffset(len - this.contentSize);
        } else {
            this.setOffset(0);
        }
        this.setSelectedItem(dateList[len-1]);
    }
    //根据播放信息设置日期列表要显示的数据
    setDateDataByPlayInfo(playInfo) {
        if(playInfo.type == mediaType.LIVE) {     //直播,日期为今天
            this.setDateDataByDate();
        } else if(playInfo.type == mediaType.SCH){    //回看
            let dateList = model.getDateList();
            let startTime = playInfo.startTime;
            let showDate = startTime.substr(0, 4)+"-"+startTime.substr(4, 2)+"-"+startTime.substr(6, 2);
            let len = dateList.length;
            for(let i=0; i<len; i++) {
                if(dateList[i].date == showDate) {
                    this.setSelectedItem(dateList[i]);
                    let offset = view.getOffsetByIndexRight(i, this.contentSize);
                    this.setOffset(offset);
                    return;
                }
            }
            this.setOffset(1);
        }
    }
    //根据播放信息，对正在播放的日期高亮显示
    addPlayingDateStyle() {
        let playInfo = model.getPlayInfo();
        let selectedChannelCode = view.channelListView.selectedChannel.ChannelCode;
        let playingChannelCode = playInfo.channelCode;
        let playingDate = null;
        if(playInfo.type == mediaType.LIVE) {
            let allDateList = model.getDateList();
            playingDate = allDateList[allDateList.length - 1].dateShow;
        } else if(playInfo.type == mediaType.SCH) {
            let startTime = playInfo.startTime;
            playingDate = startTime.substr(4, 2)+"-"+startTime.substr(6, 2);
        }
        if(playingDate) {
            let dateList = this.getDateList();
            for (let i = 0; i < dateList.length; i++) {
                let ele = document.getElementById("date_play_"+i);
                if(ele) {
                    if (dateList[i].dateShow == playingDate && selectedChannelCode == playingChannelCode) {
                        ele.style.opacity = "1.0";
                        ele.style.fontSize = "34px";     //正播日期字号放大10%
                    } else if(dateList[i].dateShow != this.selectedDate.dateShow){
                        ele.style.opacity = "0.5";
                        ele.style.fontSize = "30px";
                    }
                }
            }
        }
        view.programListView.addPlayingProgramStyle();
    }
    //选中的日期加上select样式：带线，带箭头，不带日期
    addSelectedDateStyle(flag=false){
        let idx = this.contentSize - 1;
        if(!flag) {   //不一定今天选中，需要遍历
            for (let i = 0; i < this.dateList.length; i++) {
                if(this.dateList[i].date == this.selectedDate.date) {
                    idx = i;
                    break;
                }
            }
        }
        let ele = document.getElementById(this.itemIdPrefix + idx);
        addClass(ele, "item_select");
        let dateShowEle = document.getElementById("date_show_"+idx);
        if(dateShowEle) {
            dateShowEle.style.display = "none";
        }
        let datePlayEle = document.getElementById("date_play_"+idx);
        if(datePlayEle) {
            datePlayEle.style.opacity = "1";
        }
    }
    setOffset(offset) {
        this.offset = offset;
    }
    getDateList() {
        return this.dateList;
    }
    getItemListCount(){
        return this.dateList.length;
    }
    getListAllCount() {
        return model.dateList.length;
    }
    getSelectedItem(){
        return this.selectedDate;
    }
    setSelectedItem(date){
        this.selectedDate = date;
    }
    getSelectItemLocation() {
        let dateList = this.getDateList();
        for(let i=0;i<dateList.length;i++){
            if(dateList[i].date == this.selectedDate.date){
                return i;
            }
        }
        return 0;
    }
    getNextItem(){
        let dateList = model.getDateList();
        for(let i=0; i<dateList.length; i++){
            if(dateList[i].date == this.selectedDate.date){
                if(i == (dateList.length-1)){
                    return null;
                }
                return dateList[i+1];
            }
        }
        return null;
    }
    getPreItem(){
        let dateList = model.getDateList();
        for(let i=0; i<dateList.length; i++){
            if(dateList[i].date == this.selectedDate.date){
                if(i == 0){
                    return null;
                }
                return dateList[i-1];
            }
        }
        return null;
    }
    destroyView() {
        super.destroy();
        this.offset = 0;
        this.dateList = [];
        this.selectedDate = null;
    }
    //列表联动之后，更新日期节点中的数据
    updateNode() {
        let dateItemId = this.itemIdPrefix + this.getSelectItemLocation();
        let dateFocus = new FocusNode({x: 0, y: 0, event_agent: dateItemResponse, cache: 0});
        dateFocus.addChild(new FocusNode({
            x: 0, y: 0, id: dateItemId,
            data: {call: this, list: this.getSelectedItem(), id: focusManage.dateNodeId}
        }));
        focusManage.sceneFocus.replaceChild(0, 0, dateFocus);
    }
    nodeFocus() {
        let selectedNode = focusManage.sceneFocus.getChild(0, 0);
        let region = selectedNode.coordTostr();
        focusManage.focusExt.initByhistory(focusManage.sceneFocus, region);
        this.addPlayingDateStyle();
    }
    updateShowDataByOffset() {
        let allDateList = model.getDateList();
        this.dateList = [];
        for(let i=0; i<this.contentSize; i++) {
            let item = allDateList[this.offset+i];
            document.getElementById("date_play_"+i).innerHTML = item.weekShow;
            document.getElementById("date_show_"+i).innerHTML = item.dateShow;
            this.dateList.push(item);
        }
    }
    updateCrossDayDate(idx, type) {
        let allDateList = model.dateList;
        let selectedDate = allDateList[idx];
        this.setSelectedItem(selectedDate);
        let flag = false;
        for(let i=0; i<this.dateList.length; i++) {
            if(this.dateList[i].date == selectedDate.date) {
                flag = true;
                break;
            }
        }
        if(!flag) {  //显示的日期里，跨天到不在正显示的日期里面
            type == KeyCode.KEY_LEFT ? this.offset-- : this.offset++;
            this.dateList = [];
            for(let i = this.offset; i < (this.offset + this.contentSize); i++) {
                if(i < allDateList.length) {
                    this.dateList.push(allDateList[i]);
                }
            }
            this.viewPage();
        }
        this.updateNode();
        this.changeSelectedDateStyle(type);
    }
    changeSelectedDateStyle(type) {
        let idx = this.getSelectItemLocation();
        let oldIdx = type == KeyCode.KEY_LEFT ? idx+1 : idx-1;
        let oldEle = document.getElementById(this.itemIdPrefix + oldIdx);
        removeClass(oldEle, "item_select");
        let oldDatePlayEle = document.getElementById("date_play_"+oldIdx);
        oldDatePlayEle.style.opacity = "0.5";

        let ele = document.getElementById(this.itemIdPrefix + idx);
        addClass(ele, "item_select");
        let dateShowEle = document.getElementById("date_show_"+idx);
        dateShowEle.style.display = "none";
        let datePlayEle = document.getElementById("date_play_"+idx);
        datePlayEle.style.opacity = "1";
    }
}

class programListView extends AbstractListView {
    constructor() {
        super("scene_program_list");
        this.itemIdPrefix = "scene_program_item_";
        this.contentSize = 6;
        this.offset = 0;
        this.programList = []; //显示的节目列表
        this.selectedProgram = null;
    }
    viewUpdateData(type) {
        if(type == programUpdateDataType.BY_PLAY_INFO) {
            this.setProgramDataByPlayInfo(model.getPlayInfo());
        } else if(type == programUpdateDataType.BY_DATE) {
            this.setProgramDataByPlayDate();
        }
        let allProgramList = model.programList;
        if(allProgramList) {
            for(let i = this.offset; i < (this.offset + this.contentSize); i++) {
                if(i < allProgramList.length) {
                    this.programList.push(allProgramList[i]);
                }
            }
        }
    }
    viewPage() {
        if(this.programList.length > 0) {
            super.viewPage();
            this.viewPageImg();
            this.addLiveProgramProgressStyle();
            this.addPlayingProgramStyle();
        } else {
            this.viewNoProgram();
        }
    }
    viewPageImg(){
        for(let i=0; i<this.programList.length; i++) {
            imageLoad.setBackgroundImg("scene_program_item_"+i, this.programList[i].programImgUrl, default_horizontal_icon);
        }
    }
    viewNoProgram() {
        document.getElementById('scene_program_list').innerHTML = '<div class="program_no_data">该频道暂无节目单</div>';
    }
    //对直播节目:1.加上进度条样式;
    addLiveProgramProgressStyle() {
        let firstNotPlay = true;
        for(let i=0; i<this.programList.length; i++) {
            let item = this.programList[i];
            let now = sysTime.date().Format();
            let eleProgress = document.getElementById("program_progress_"+i);
            let tipsEle = document.getElementById("program_tips_"+i);
            let programNameEle = document.getElementById("program_name_"+i);
            if(item.StartTime <= now && now <= item.EndTime) {    //直播节目:显示进度条，去掉“即将播放”标识，去掉节目颜色的灰色标识
                if(eleProgress) {
                    eleProgress.style.display = "block";
                    let width = this.computeProgramProgress(item, 292);
                    let midEle = document.getElementById("progress_mid_"+i);
                    if(midEle){
                        midEle.style.width = width+"px";
                    }
                }
                tipsEle ? tipsEle.style.display = "none" : null;
                programNameEle ? removeClass(programNameEle, "not_begin") : null;
            } else if(now < item.StartTime) {     //未播节目: 有节目颜色的灰色标识，去掉进度条
                if(firstNotPlay) {   //第一条未播节目,才加上“即将播放”标识，
                    firstNotPlay = false;
                    tipsEle ? tipsEle.style.display = "block" : null;
                } else {
                    tipsEle ? tipsEle.style.display = "none" : null;
                }
                programNameEle ? addClass(programNameEle, "not_begin") : null;
                eleProgress ? eleProgress.style.display = "none": null
            } else {    //回看节目：去掉进度条，去掉“即将播放”标识，去掉节目颜色的灰色标识
                eleProgress ? eleProgress.style.display = "none" : null;
                tipsEle ? tipsEle.style.display = "none" : null;
                programNameEle ? removeClass(programNameEle, "not_begin") : null;
            }
        }
    }
    //根据日期列表选中信息设置节目列表要显示的数据
    setProgramDataByPlayDate() {
        let allProgramList = model.programList;
        if(allProgramList) {
            let len = allProgramList.length;
            let offset = 0;
            if(view.dateListView.selectedDate.date == sysTime.getTodayDay()) {   //今天，定位到直播节目（播放的是今天的回看节目，也不定位回看，优先定位到直播节目）
                let now = sysTime.date().Format();
                for (let i = 0; i < len; i++) {
                    let item = allProgramList[i];
                    if (item.StartTime <= now && now <= item.EndTime) {
                        this.setSelectedItem(item);
                        offset = view.getOffsetByIndexSecondLast(len, i, this.contentSize);
                        this.setOffset(offset);
                        return;
                    }
                }
            } else {   //非今天的节目，选中日期，有正在播放的回看节目，定位到该回看节目，否则，从第一个开始显示
                let playInfo = model.getPlayInfo();
                if(playInfo.type == mediaType.SCH) {
                    let playDate = playInfo.startTime.substr(4, 2) + "-" + playInfo.startTime.substr(6, 2);
                    if(view.dateListView.selectedDate.dateShow == playDate) {
                        for (let i = 0; i < len; i++) {
                            let item = allProgramList[i];
                            if (item.ScheduleCode == playInfo.scheduleCode) {
                                this.setSelectedItem(item);
                                //offset = view.getOffsetByIndexRight(i, this.contentSize);
                                offset = view.getOffsetByIndex(i, len, this.contentSize);
                                this.setOffset(offset);
                                return;
                            }
                        }
                    }
                }
                this.setOffset(0);
                this.setSelectedItem(allProgramList[0]);
            }
        }
    }
    //根据播放信息设置节目列表要显示的数据
    setProgramDataByPlayInfo(playInfo) {
        let offset = 0;
        let allProgramList = model.programList;
        if(allProgramList) {
            let len = allProgramList.length;
            let now = sysTime.date().Format();
            let type = playInfo.type;
            for (let i = 0; i < len; i++) {
                let item = allProgramList[i];
                let flag = null;
                if (type == mediaType.LIVE) {    //直播节目
                    flag = item.StartTime <= now && now <= item.EndTime;
                } else if(type == mediaType.SCH){      //回看节目
                    flag = item.ScheduleCode == playInfo.scheduleCode
                }
                if (flag) {
                    this.setSelectedItem(item);
                    if(type == mediaType.LIVE) {
                        offset = view.getOffsetByIndexSecondLast(len, i, this.contentSize);
                    } else {
                        offset = view.getOffsetByIndex(i, len, this.contentSize);    //初次进入，节目定位到中间
                    }
                    this.setOffset(offset);
                    return;
                }
            }
        }
        this.setOffset(offset);
    }
    //根据播放信息，对正在播放的节目，节目名称橙色标识（标识视频流正在播放的节目）
    addPlayingProgramStyle() {
        let playInfo = model.getPlayInfo();
        let programList = this.getProgramList();
        let now = sysTime.date().Format();
        for (let i = 0; i < programList.length; i++) {
            let item = programList[i];
            let programEle = document.getElementById("scene_program_item_" + i);
            if (programEle) {
                let flag = null;
                if (playInfo.type == mediaType.LIVE) {   //直播的正播节目
                    flag = playInfo.channelCode == item.ChannelCode && item.StartTime <= now && now <= item.EndTime
                } else {    //回看的正播节目
                    flag = playInfo.scheduleCode == item.ScheduleCode;
                }
                if (flag) {
                    addClass(programEle, "playing_program")
                } else {
                    removeClass(programEle, "playing_program");
                }
            }
        }
    }
    //对选中的节目，加上选中标识
    addSelectedProgramStyle() {
        let programList = this.getProgramList();
        for(let i=0; i<programList.length; i++){
            if(this.selectedProgram) {
                if(programList[i].ScheduleCode == this.selectedProgram.ScheduleCode) {
                    let ele = document.getElementById(this.itemIdPrefix+i);
                    if(ele) {
                        addClass(ele, "item_select");
                    }
                    let arrowEle = document.getElementById("program_item_arrow_"+i);
                    if(arrowEle) {
                        arrowEle.style.display = "block";
                    }
                    return;
                }
            }
        }
    }
    //计算进度条
    computeProgramProgress(data, maxWidth) {
        let width = 0;
        if(data) {
            let starttime = Date.parse(new Date().parseExt(data.StartTime));
            let endtime = Date.parse(new Date().parseExt(data.EndTime));
            let now = sysTime.now() * 1000;
            width = (parseInt(now) - starttime) / (endtime - starttime);
            width = parseInt(width * maxWidth);
            if(width > maxWidth) {
                width = maxWidth;
            }
            if(endtime < now){
                width = 0;
            }
        }
        return width;
    }
    setOffset(offset) {
        this.offset = offset;
    }
    getOffset() {
        return this.offset;
    }
    setProgramList(info) {
        this.programList = info;
    }
    getListAllCount() {
        return model.programList.length;
    }
    getProgramList() {
        return this.programList;
    }
    getItemListCount(){
        return this.programList.length;
    }
    getSelectedItem(){
        return this.selectedProgram;
    }
    setSelectedItem(program){
        this.selectedProgram = program;
    }
    getSelectItemLocation() {
        let programList = this.getProgramList();
        for(let i=0; i<programList.length; i++){
            if(this.selectedProgram) {
                if (programList[i].ScheduleCode == this.selectedProgram.ScheduleCode) {
                    return i;
                }
            }
        }
        return 0;
    }
    getNextItem(){
        let programList = model.getProgramList();
        for(let i=0; i<programList.length; i++){
            if(this.selectedProgram) {
                if(programList[i].ScheduleCode == this.selectedProgram.ScheduleCode) {
                    if (i == (programList.length - 1)) {
                        return null;
                    }
                    return programList[i + 1];
                }
            }
        }
        return null;
    }
    getPreItem(){
        let programList = model.getProgramList();
        for(let i=0; i<programList.length; i++){
            if(this.selectedProgram) {
                if (programList[i].ScheduleCode == this.selectedProgram.ScheduleCode) {
                    if (i == 0) {
                        return null;
                    }
                    return programList[i - 1];
                }
            }
        }
        return null;
    }
    destroyView() {
        super.destroy();
        this.offset = 0;
        this.programList = [];
        this.selectedProgram = null;
    }
    //列表联动之后，更新节目单节点中的数据
    updateNode() {
        let programItemId = this.itemIdPrefix + this.getSelectItemLocation();
        let programFocus = new FocusNode({x: 0, y: 1, event_agent: programItemResponse, cache: 0});
        if(this.programList.length > 0) {    //在没有节目单的时候，programFocus里面不添加节点
            programFocus.addChild(new FocusNode({
                x: 0, y: 0, id: programItemId,
                data: {call: this, list: this.getSelectedItem(), id: focusManage.programNodeId}
            }));
        }
        focusManage.sceneFocus.replaceChild(0, 1, programFocus);
    }
    nodeFocus() {
        let selectedNode = focusManage.sceneFocus.getChild(0, 1);
        let region = selectedNode.coordTostr();
        focusManage.focusExt.initByhistory(focusManage.sceneFocus, region);
    }
    updateShowDataByOffset() {
        let allProgramList = model.getProgramList();
        this.programList = [];
        for(let i=0; i<this.contentSize; i++) {
            let item = allProgramList[this.offset+i];
            document.getElementById("start_time_"+i).innerHTML = item.startTimeFmt;
            document.getElementById("program_name_"+i).innerHTML = item.Name;
            imageLoad.setBackgroundImg("scene_program_item_"+i, item.programImgUrl, default_horizontal_icon);
            this.programList.push(item);
        }
        this.addPlayingProgramStyle();
        this.addLiveProgramProgressStyle();
    }
    updateCrossDayProgram(type) {
        let allProgramList = model.getProgramList();
        let len = allProgramList.length;
        if(type == KeyCode.KEY_LEFT) {
            this.offset = len - this.contentSize;
            this.setSelectedItem(allProgramList[len - 1]);
        } else {
            this.offset = 0;
            this.setSelectedItem(allProgramList[0]);
        }
        this.programList = [];
        for(let i = this.offset; i < (this.offset + this.contentSize); i++) {
            if(i < len) {
                this.programList.push(allProgramList[i]);
            }
        }
        this.updateNode();
        this.viewPage();
        this.nodeFocus();
    }

    changePlayingProgramStyle(idx) {
        let len = this.programList.length;
        for(let i=0; i<len; i++) {
            let programEle = document.getElementById(this.itemIdPrefix+i);
            if(programEle) {
                if (i == idx) {
                    addClass(programEle, "playing_program")
                } else {
                    removeClass(programEle, "playing_program");
                }
            }
        }
    }
}

export const view = new View();
export default {view}