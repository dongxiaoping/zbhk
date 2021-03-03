import {AbstractKeyEvent} from "../../../Abstract/scene/AbstractKeyEvent";
import {sceneIds} from "../../../App/app_ailive/AppGlobal.js";
import {KeyCode} from "../../../common/FocusModule";
import {sysTime} from "../../../common/TimeUtils";
import {laterShowType, mediaType, defaultLiveCode} from "../../../common/GlobalConst";
import {addClass, removeClass, processNotExistTips} from "../../../common/CommonUtils";
import ChannelPay from "../../../App/app_ailive/ChannelPay";
import {focusManage} from "./Focus";
import {model} from "./Model";
import {view} from "./View";
import {playManage} from "../../../App/app_ailive/PlayManage"

class KeyEvent extends AbstractKeyEvent {
    constructor() {
        super(focusManage);
    }

    onKeyEvent(type, keyCode) {
        view.clearTimingHideToPlayPage();
        view.timingHideToPlayPage(10000);
        if(!this.isKeyEventNeedResponseByFocus(type, keyCode)) {
            return ;
        }
        super.onKeyEvent(type, keyCode);
        switch(keyCode) {
            case KeyCode.KEY_MENU:
            case KeyCode.KEY_MENU2:
                window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID);
                break;
            case KeyCode.KEY_BACK:
            case KeyCode.KEY_BACK2:
                if(ChannelPay.isNeedPay) {       //需要付费的频道，back键退出到屏显加播放
                    let playInfo = window.WebApp.getNowPlayInfo();
                    let params = [];
                    params[sceneIds.SCREEN_SCENE_ID] = playInfo;
                    window.WebApp.switchScene(sceneIds.SCREEN_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
                } else {      //不需要付费的频道，back键退出到播放页面
                    window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID);
                }
                break;
            default:
                break;
        }
    }
}
export const dateItemResponse = {
    on() {
        let ele = document.getElementById(this.id);
        if(ele) {
            addClass(ele, "item_focus");
            let dateShowEle = ele.getElementsByClassName("date_show");
            if(dateShowEle && dateShowEle[0]) {
                dateShowEle[0].style.display = "block";
            }
            let id = this.id.substr(this.id.length - 1, 1);
            let datePlayEle = document.getElementById("date_play_"+id);
            if(datePlayEle) {
                datePlayEle.style.opacity = "1";
            }
            removeClass(ele, "item_select");
        }
        if(focusManage.focusHistory == focusManage.dateNodeId) {
            model.updateProgramList(view.channelListView.selectedChannel.ChannelCode, this.data.list.idx);
        }
        focusManage.focusHistory = this.data.id;
    },
    lost() {
        let ele = document.getElementById(this.id);
        if(ele) {
            removeClass(ele, "item_focus");
            let dateShowEle = ele.getElementsByClassName("date_show");
            if(dateShowEle && dateShowEle[0]) {
                dateShowEle[0].style.display = "none";
            }
        }
    },
    ok() {

    },
    onLeftBorder(){
        view.prevNextOne(view.dateListView, KeyCode.KEY_LEFT);
    },
    onRightBorder(){
        view.prevNextOne(view.dateListView, KeyCode.KEY_RIGHT);
    },
    onBottomBorder(){
        if(view.programListView.programList.length == 0) {
            return;
        }
        view.dateListView.addSelectedDateStyle();
    },
    onTopBorder() {

    }
};
//节目单列表元素响应事件
export const programItemResponse = {
    on(){
        focusManage.focusHistory = this.data.id;
        let ele = document.getElementById(this.id);
        if(ele) {
            addClass(ele, "focus");
            removeClass(ele, "item_select");
            let idx = this.id.substr(this.id.length-1, 1);
            //节目单focus不要小箭头
            let arrowEle = document.getElementById("program_item_arrow_"+idx);
            if(arrowEle) {
                arrowEle.style.display = "none";
            }
        }
    },
    lost() {
        let ele = document.getElementById(this.id);
        if(ele) {
            removeClass(ele, "focus");
        }
    },
    ok() {
        let nowPlayInfo = window.WebApp.getNowPlayInfo();
        let categoryCode = nowPlayInfo.categoryCode ? nowPlayInfo.categoryCode : defaultLiveCode;
        let data = this.data.list;
        let nowTime = sysTime.nowFormat();
        let playInfo = null;
        let idx = this.id.substr(this.id.length-1, 1);
        if(nowTime < data.StartTime) {       //未开始的节目，不可播放（无论付费与否，都是不能播放的，不需要去鉴权）
            if(ChannelPay.isNeedPay) {
                let id = "program_tips_"+idx;
                let tipEle = document.getElementById(id);
                if(tipEle) {
                    tipEle.style.display = "block";
                    tipEle.innerHTML = "节目暂未开始";
                }
            } else {
                let tips = "该节目暂未开始，请稍后观看！";
                processNotExistTips(tips);
            }
        } else if(data.StartTime <= nowTime && nowTime <= data.EndTime) {   //直播ok：播放加提示界面
            view.programListView.changePlayingProgramStyle(idx);
            ChannelPay.laterShowSceneType = laterShowType.LIVE_OPERATION_TIPS;
            playInfo = {type: mediaType.LIVE, categoryCode: categoryCode, channelCode: data.ChannelCode};
            playManage.switchPlay(playInfo);
        } else {   //回看ok：播放加提示界面
            view.programListView.changePlayingProgramStyle(idx);
            ChannelPay.laterShowSceneType = laterShowType.SCH_OPERATION_TIPS;
            playInfo = {type:mediaType.SCH, categoryCode: categoryCode, channelCode: data.ChannelCode,
                scheduleCode:data.ScheduleCode, startTime:data.StartTime, endTime:data.EndTime};
            playManage.switchPlay(playInfo);
        }
    },
    onLeftBorder(){
        view.prevNextOne(view.programListView, KeyCode.KEY_LEFT);
    },
    onRightBorder(){
        view.prevNextOne(view.programListView, KeyCode.KEY_RIGHT);
    },
    //节目到点播推荐，节目上要横线+箭头
    onBottomBorder(){
        view.programListView.addSelectedProgramStyle();
    },

    //节目到日期，节目上要横线+箭头
    onTopBorder(){
        view.programListView.addSelectedProgramStyle();
    }
};

export const keyEvent = new KeyEvent();
export default {keyEvent}