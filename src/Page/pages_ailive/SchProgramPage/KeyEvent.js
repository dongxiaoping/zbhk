import {AbstractKeyEvent} from "../../../Abstract/scene/AbstractKeyEvent";
import {KeyCode} from "../../../common/FocusModule";
import {sysTime} from "../../../common/TimeUtils";
import { msgType, mediaType, laterShowType, defaultLiveCode} from "../../../common/GlobalConst";
import {addClass, removeClass, processNotExistTips} from "../../../common/CommonUtils";
import PlayerDataAccess from "../../../common/PlayerDataAccess";
import { sceneIds } from "../../../App/app_ailive/AppGlobal.js";
import ChannelPay from "../../../App/app_ailive/ChannelPay";
import {keyOpTipForLookBack} from "../../../App/app_ailive/app.component"
import Log from "../../../common/Log"
import {focusManage} from "./Focus";
import {view} from "./View";
import {model} from "./Model";
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
        switch (keyCode) {
            case KeyCode.KEY_BACK:
            case KeyCode.KEY_BACK2:
                if(ChannelPay.isNeedPay) {   //迷你节目单页面返回键到达屏显界面
                    let backParams = [];
                    backParams[sceneIds.SCREEN_SCENE_ID] = model.getPlayInfo();
                    window.WebApp.switchScene(sceneIds.SCREEN_SCENE_ID, backParams, [null, null, sceneIds.PLAYER_SCENE_ID]);
                } else {
                    window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID);
                }
                break;
            default:
        }
    }
}

export const eventResponse = {
    on() {
        let focusLocation= focusManage.getFocusLocation();
        let id = view.getIdByFocusLocation(focusLocation);
        let ele = document.getElementById(id);
        if(ele) {
            addClass(ele, "item_focus");
        }
    },
    lost() {
        let focusLocation= focusManage.getFocusLocation();
        let id = view.getIdByFocusLocation(focusLocation);
        let ele = document.getElementById(id);
        if(ele) {
            removeClass(ele, "item_focus");
        }
    },
    onLeftBorder(){
        let focusLocation= focusManage.getFocusLocation();
        view.schProgramView.prevNextOne(KeyCode.KEY_LEFT, focusLocation);
    },
    onRightBorder(){
        let focusLocation= focusManage.getFocusLocation();
        view.schProgramView.prevNextOne(KeyCode.KEY_RIGHT, focusLocation);
    },
    ok() {
        let nowPlayInfo = window.WebApp.getNowPlayInfo();
        let categoryCode = nowPlayInfo.categoryCode ? nowPlayInfo.categoryCode : defaultLiveCode;
        let focusLocation= focusManage.getFocusLocation();
        let nowTime = sysTime.nowFormat();
        let data = view.schProgramView.getDataByFocusLocation(focusLocation);
        let playInfo = null;
        if(nowTime < data.StartTime) {       //未开始的节目，不可播放
            if(ChannelPay.isNeedPay) {
                let id = "program_tips_"+focusLocation.x;
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
            view.schProgramView.changePlayingProgramStyle(focusLocation.x);
            ChannelPay.laterShowSceneType = laterShowType.LIVE_OPERATION_TIPS;
            playInfo = {type: mediaType.LIVE, categoryCode: categoryCode, channelCode: data.ChannelCode};
            playManage.switchPlay(playInfo);
        } else {   //回看ok：播放加提示界面
            view.schProgramView.changePlayingProgramStyle(focusLocation.x);
            ChannelPay.laterShowSceneType = laterShowType.SCH_OPERATION_TIPS;
            playInfo = {type:mediaType.SCH, categoryCode: categoryCode, channelCode: data.ChannelCode,
                scheduleCode:data.ScheduleCode, startTime:data.StartTime, endTime:data.EndTime};
            playManage.switchPlay(playInfo);
        }
    }
};

export const keyEvent = new KeyEvent();
export default {keyEvent}