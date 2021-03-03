import {AbstractView, AbstractListView} from "../../../Abstract/scene/AbstractView"
import {KeyCode} from "../../../common/FocusModule"
import {OTTConfig} from "../../../common/CmsSwitch"
import {sysTime} from "../../../common/TimeUtils"
import PlayerDataAccess from "../../../common/PlayerDataAccess"
import imageLoad  from "../../../common/ImageLoad"
import Collection from "../../../common/UserCollection"
import {moveType, mediaType, screenEntryType} from "../../../common/GlobalConst"
import { sceneIds } from "../../../App/app_ailive/AppGlobal.js";
import ChannelPay from "../../../App/app_ailive/ChannelPay";
import {keyOpTipForLive, keyOpTipForLookBack} from "../../../App/app_ailive/app.component";
import {keyEvent} from "./KeyEvent"
import {focusManage} from "./Focus"
import {model} from "./Model"
import exit_menu_collection_icon from "../../../images/pages_ailive/exit_menu_collection_icon.png"
import exit_menu_uncollection_icon from "../../../images/pages_ailive/exit_menu_uncollection_icon.png"
import default_vertical_icon from "../../../images/pages_ailive/default_vertical_icon.jpg";

class View extends AbstractView {
    constructor() {
        super();
        this.playInfoScreenView = new playInfoScreenView();
        this.recListView = new recListView();
    }
    viewUpdateData() {
        super.viewUpdateData();
        this.playInfoScreenView.viewUpdateData();
        this.recListView.viewUpdateData();
        keyOpTipForLive.hide();
        keyOpTipForLookBack.hide();
    }

    viewPage() {
        super.viewPage();
        this.playInfoScreenView.viewPage();
        this.recListView.viewPage();
    }

    destroy(){
        super.destroy();
        this.playInfoScreenView.destroy();
        this.recListView.destroy();
    }

    getIdByLocation(location) {
        let x = location.x;
        let showReview = OTTConfig.showLiveReviewList();
        if(ChannelPay.isNeedPay) {
            if(x == 0) {
                return "pay_entry";
            }else if(x == 1) {
                return showReview ? "program_entry" : "collection_entry";
            } else if(x == 2) {
                return showReview ? "collection_entry" : "rec_item_"+(x-2);
            } else if(x >= 3) {
                return "rec_item_"+(x-3);
            }
        } else {
            if(x == 0) {
                return showReview ? "program_entry" : "collection_entry";
            } else if(x == 1) {
                return showReview ? "collection_entry" : "rec_item_"+(x-1);
            } else if(x >= 2) {
                return "rec_item_"+(x-2);
            }
        }
    }

    getFocusTypeByLocation(location) {
        let x = location.x;
        let showReview = OTTConfig.showLiveReviewList();
        if(ChannelPay.isNeedPay) {
            if(x == 0) {
                return screenEntryType.PAY_ENTRY;
            } else if(x == 1) {
                return showReview ? screenEntryType.PROGRAM_ENTRY : screenEntryType.COLLECTION_ENTRY;
            } else if(x == 2) {
                return showReview ? screenEntryType.COLLECTION_ENTRY : screenEntryType.REC_ENTRY;
            } else if(x >= 3) {
                return screenEntryType.REC_ENTRY;
            }
        } else {
            if(x == 0) {
                return showReview ? screenEntryType.PROGRAM_ENTRY : screenEntryType.COLLECTION_ENTRY;
            } else if(x == 1) {
                return showReview ? screenEntryType.COLLECTION_ENTRY : screenEntryType.REC_ENTRY;
            } else {
                return screenEntryType.REC_ENTRY;
            }
        }

    }

    prevNextOne(type) {
        let focusLocation = focusManage.getFocusLocation();
        let recList = model.getRecList();
        let len = recList.length;
        let idx = 0;
        if(ChannelPay.isNeedPay) {
            idx++;
        }
        if(OTTConfig.showLiveReviewList()) {
            idx++;
        }
        let condition = len+idx;
        if((type == KeyCode.KEY_LEFT && focusLocation.x<=0) || (type == KeyCode.KEY_RIGHT && focusLocation.x>=condition)) {
            return;
        }
        focusManage.lostNotice();
        type == KeyCode.KEY_LEFT ? focusLocation.x-- : focusLocation.x++;
        focusManage.setFocusLocation(focusLocation);
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }
}

//播放信息屏显
class playInfoScreenView extends AbstractListView{
    constructor() {
        super("screen_info");
        this.viewScreenData = null;
    }
    viewUpdateData(){
        let data = model.getScreenData();
        let playInfo = window.WebApp.Nav.getNavParams(sceneIds.SCREEN_SCENE_ID);
        if(!playInfo) {
            return;
        }
        this.viewScreenData = {channelNo: "", channelName: "", startTime:"", endTime: "", curName: "", nextName:"", maxWidth: 298, width: ""};
        let type = playInfo.type;
        if(type === mediaType.LIVE || type == mediaType.SCH) {
            this.processLiveScreenData(type, data);   //回顾的屏显的直播一致(回顾节目的数据，需设置成和直播一致)
        } else if(type == mediaType.JX){
            this.processSchScreenData(data);
        }
    }

    viewPage() {
        super.viewPage();
        let payEntryEle = document.getElementById("pay_entry");
        if(ChannelPay.isNeedPay) {
            payEntryEle.style.display = "block";
        } else {
            payEntryEle.style.display = "none";
        }
        let programEntryEle = document.getElementById("program_entry");
        if(OTTConfig.showLiveReviewList()) {
            programEntryEle.style.display = "block";
        } else {
            programEntryEle.style.display = "none";
        }
        let playInfo = window.WebApp.Nav.getNavParams(sceneIds.SCREEN_SCENE_ID);
        let type = playInfo.type;
        if(type === mediaType.LIVE || type == mediaType.SCH) {   //直播或回顾
            if(!OTTConfig.showProgressFlag()) {
                document.getElementById("live_progress").style.display = "none";
            }
            let imgOb = document.getElementById("screen_scene_collection_img_id");
            let labelOb = document.getElementById("screen_scene_collection_label_id");
            if(Collection.isCollected(playInfo.channelCode)){
                imgOb.src = exit_menu_collection_icon;
                labelOb.innerHTML = "已收藏";
                labelOb.style.marginLeft = "44px";
            }else{
                imgOb.src = exit_menu_uncollection_icon;
                labelOb.innerHTML = "收藏";
                labelOb.style.marginLeft = "62px";
            }
        } else {
            let nextEle = document.getElementById("next_tip_info");
            if(nextEle) {
                nextEle.style.display = "none";
            }
        }
        if(this.viewScreenData.width > 0) {
            document.getElementById("progress_mid").style.width = this.viewScreenData.width + "px";
        }
        if(this.viewScreenData.width == this.viewScreenData.maxWidth) {
            document.getElementById("progress_right").style.display = "block";
        }
    }

    //处理直播的屏显数据
    processLiveScreenData(type, data) {
        if(!data) return;
        this.viewScreenData.channelNo = data.ChannelNo;
        this.viewScreenData.channelName = data.ChannelName;
        if(data.CurrentSchedule && OTTConfig.showCoverLiveTime()) {
            if(data.CurrentSchedule.StartTime){
                this.viewScreenData.startTime = data.CurrentSchedule.StartTime.substr(8, 2) + ":" + data.CurrentSchedule.StartTime.substr(10, 2);
            }
            if(data.CurrentSchedule.EndTime) {
                this.viewScreenData.endTime = data.CurrentSchedule.EndTime.substr(8, 2) + ":" + data.CurrentSchedule.EndTime.substr(10, 2);
            }
        }
        if(type == mediaType.LIVE) {
            this.viewScreenData.curName = "当前："+data.PlayProgramName;
        } else {
            this.viewScreenData.curName = "回看："+data.PlayProgramName;
        }
        if(data.NextSchedule && data.NextSchedule.Name) {
            this.viewScreenData.nextName = "后续："+data.NextSchedule.Name;
        } else {
            this.viewScreenData.nextName = "后续：暂无节目名称";
        }
        this.viewScreenData.width = this.computeProgramProgress(data, this.viewScreenData.maxWidth);
    }

    updatePlayerBarProgress(current, total) {
        let progress = 0;
        if(total > 0) {
            progress = current/total;
        }
        document.getElementById("progress_mid").style.width = (progress.toFixed(2) * 100) + "%";
    }

    //处理回看的屏显数据
    processSchScreenData(data) {
        if(!data) return;
        this.viewScreenData.channelName = data.ChannelName;
        this.viewScreenData.curName = "回看："+data.programName + " "+ data.schDetail.Name;
        if(data.schDetail.NamePostfix) {
            this.viewScreenData.curName += data.schDetail.NamePostfix;
        }
        this.viewScreenData.startTime = data.schDetail.StartTime.substr(8, 2) + ":" + data.schDetail.StartTime.substr(10, 2);
        this.viewScreenData.endTime = data.schDetail.EndTime.substr(8, 2) + ":" + data.schDetail.EndTime.substr(10, 2);
        this.viewScreenData.width = 0;
        let next = PlayerDataAccess.getNextSchProgram(data.categoryCode, data.schDetail.ScheduleCode);
        if(next) {
            let nextDetail = PlayerDataAccess.getSchDetailByCategorySchedule(next.categoryCode, next.scheduleCode);
            this.viewScreenData.nextName = "后续："+nextDetail.programName + " "+ nextDetail.schDetail.Name + (nextDetail.schDetail.NamePostfix || "");
        }
    }

    //计算进度条长度
    computeProgramProgress(data, maxWidth) {
        let width = 0;
        if(data && data.CurrentSchedule != undefined) {
            let starttime = Date.parse(new Date().parseExt(data.CurrentSchedule.StartTime));
            let endtime = Date.parse(new Date().parseExt(data.CurrentSchedule.EndTime));
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
}

//推荐列表
class recListView extends AbstractListView {
    constructor() {
        super("rec_info");
        this.contentSize = 3;
        this.offset = 0;
        this.recList = [];
        this.itemIdPrefix = "rec_item_";
        this.selectedRec = null;
    }
    viewUpdateData() {
        if(ChannelPay.isNeedPay) {
            this.contentSize = 2;
        } else {
            this.contentSize = 3;
        }
        this.recList = [];
        let recList = this.getShowRecListByOffset();
        this.setRecList(recList);
        if(this.selectedRec === null) {
            this.selectedRec = this.recList[0];
        }
    }
    viewPage() {
        super.viewPage();
        this.viewPageImg();
    }
    viewPageImg(){
        for(let i=0; i<this.recList.length; i++) {
            imageLoad.setBackgroundImg("rec_item_"+i, this.recList[i].poster, default_vertical_icon);
        }
    }
    setOffset(offset) {
        this.offset = offset;
    }
    getShowRecListByOffset() {
        let recList = [];
        let allRecList = model.getRecList();
        if(allRecList) {
            for (let i = this.offset; i < (this.offset + this.contentSize); i++) {
                if (i < allRecList.length) {
                    recList.push(allRecList[i]);
                }
            }
        }
        return recList;
    }
    getRecList() {
        return this.recList;
    }
    setRecList(info) {
        this.recList = info;
    }
    getItemListCount() {
        return this.recList.length;
    }
    setSelectedItem(rec) {
        this.selectedRec = rec;
    }
    getSelectItemLocation() {
        let recList = this.getRecList();
        if(this.selectedRec) {
            for(let i=0; i<recList.length; i++) {
                if(recList[i].code == this.selectedRec.code) {
                    return i;
                }
            }
        }
        return 0;
    }
    getSelectedItem() {
        return this.selectedRec;
    }
    getNextItem(){
        let recList = this.getRecList();
        for(let i=0; i<recList.length; i++){
            if(recList[i].code == this.selectedRec.code){
                if(i == (recList.length - 1)) {
                    return null;
                }
                return recList[i+1];
            }
        }
        return null;
    }
    getPreItem() {
        let recList = this.getRecList();
        for (let i = 0; i < recList.length; i++) {
            if (recList[i].code == this.selectedRec.code) {
                if(i == 0) {
                    return null;
                }
                return recList[i - 1];
            }
        }
        return null;
    }
}

export const view = new View();
export default {view}