import {AbstractKeyEvent} from "../../../Abstract/scene/AbstractKeyEvent"
import {KeyCode} from "../../../common/FocusModule"
import {OTTConfig} from "../../../common/CmsSwitch"
import {mediaType, exitPageParamType, coverType, interfaceType} from "../../../common/GlobalConst"
import Collection from "../../../common/UserCollection";
import {addClass, removeClass} from "../../../common/CommonUtils";
import localPersistentStorage from "../../../common/LocalPersistentStorage";
import {sceneIds} from "../../../App/app_zbhk/AppGlobal.js";
import {playManage} from "../../../App/app_zbhk/PlayManage";
import {focusManage} from "./Focus"
import {view} from "./View"
import {model} from "./Model"
import modelManage from "../../../App/app_zbhk/ModelManage";
import { starTipBar } from "../../../App/app_zbhk/app.component";
import { sysTime } from "../../../common/TimeUtils";

class KeyEvent extends AbstractKeyEvent {
    constructor() {
        super(focusManage);
    }

    onKeyEvent(type, keyCode) {
        view.clearTimingHideToPlayPage();
        view.timingHideToPlayPage(5000);
        if(!this.isKeyEventNeedResponseByFocus(type, keyCode)) {
            return ;
        }
        super.onKeyEvent(type, keyCode);
        switch(keyCode) {
            case KeyCode.KEY_BACK:
            case KeyCode.KEY_BACK2:
                window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID);
                break;
            default:
                break;
        }
    }

    //收藏按钮点击事件
    collectKeyEvent(){
        let collectionEle = document.getElementById("exit_collection_btn");
        let playInfo = model.getExitSceneParam();
        let collectRes = Collection.exec(playInfo.channelCode);
        if(collectRes){
            removeClass(collectionEle, "collected_button");
            addClass(collectionEle, "collect_button");
        }else{
            removeClass(collectionEle, "collect_button");
            addClass(collectionEle, "collected_button");
        }
    }

    //退出按钮响应
    exitKeyEvent() {
        let modeType = modelManage.getModeType();
        if(interfaceType.ACTION_LIVE_CHANNEL_LOCK == modeType){
            window.WebApp.appExit();
            return;
        }
        if(OTTConfig.showEnvelopeFlag()) {
            starTipBar.hidden();
            localPersistentStorage.saveRestoreInfoToCookie();
            playManage.stopPlay();
            let playInfo = model.getExitSceneParam();
            let param = [];
            if(playManage.fromCover) {
                param[playManage.fromCover] = playInfo;
                window.WebApp.switchScene(playManage.fromCover, param);
            } else {
                let pageID = OTTConfig.showEnvelopeFlag() == coverType.CHANNEL_LIST ? sceneIds.COVER_ID : sceneIds.COVER_IMAGE_ID;
                param[pageID] = playInfo;
                window.WebApp.switchScene(pageID, param);
            }
        } else {
            window.WebApp.appExit();
        }
    }

    schRecKeyEvent(focusLocation){
        let data = view.schRecListView.schRecList[focusLocation.x];
        let param = model.getExitSceneParam();
        let playInfo = {};
        let now = sysTime.nowFormat();
        if(data.StartTime<=now && now<=data.EndTime) {  //直播
            playInfo = {categoryCode: param.categoryCode, type: mediaType.LIVE, channelCode: data.ChannelCode};
        } else {
            if(data.ChannelCode) {
                playInfo = {categoryCode: param.categoryCode, type: mediaType.SCH, channelCode: data.ChannelCode,
                    scheduleCode: data.ScheduleCode, startTime: data.StartTime, endTime: data.EndTime};
            } else {  //尚未录制的节目，不响应ok
                return;
            }
        }
        let playParam = [];
        playParam[sceneIds.PLAYER_SCENE_ID] = playInfo;
        window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID, playParam);
    }

    //直播时移退出到“最新”直播
    liveSeekToLiveKeyEvent() {
        let playScene = window.WebApp.Nav.getSceneById(sceneIds.PLAYER_SCENE_ID);
        if(!playScene){
            return;
        }
        let nowPlayInfo = window.WebApp.getNowPlayInfo();
        let params = [];
        params[sceneIds.SCREEN_SCENE_ID] = nowPlayInfo;
        window.WebApp.switchScene(sceneIds.SCREEN_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
        playManage.switchPlay(nowPlayInfo);
    }
}

export const eventResponse = {
    on() {
        let focusLocation = focusManage.getFocusLocation();
        let id = view.getIdByFocusLocation(focusLocation);
        let ob = document.getElementById(id);
        addClass(ob, "focus");
    },

    lost() {
        let focusLocation = focusManage.getFocusLocation();
        let id = view.getIdByFocusLocation(focusLocation);
        let ob = document.getElementById(id);
        removeClass(ob, "focus");
    },

    ok() {
        let focusLocation = focusManage.getFocusLocation();
        let paramType = view.getPageParamTypeByLocation(focusLocation);
        switch(paramType) {
            case exitPageParamType.FUNCTION_LABEL:       //收藏按钮
                keyEvent.collectKeyEvent();
                break;
            case exitPageParamType.EXIT_BUTTON:          //退出按钮
                keyEvent.exitKeyEvent();
                break;
            case exitPageParamType.RECOMMEND_LIST:       //回看推荐
                keyEvent.schRecKeyEvent(focusLocation);
                break;
            default:
        }
    },

    onTopBorder() {
        let playInfo = model.getExitSceneParam();
        let focusLocation = focusManage.getFocusLocation();
        if(playInfo.type == mediaType.SCH && focusLocation.y>0) {
            focusManage.lostNotice();
            focusLocation.y--;
            focusManage.setFocusLocation(focusLocation);
            focusManage.nodeUpdate();
            focusManage.nodeFocus();
        }
    },

    onBottomBorder() {
        let playInfo = model.getExitSceneParam();
        let focusLocation = focusManage.getFocusLocation();
        if(playInfo.type == mediaType.SCH && focusLocation.y<1) {
            focusManage.lostNotice();
            focusLocation.y++;
            let modeType = modelManage.getModeType();
            if(interfaceType.ACTION_LIVE_CHANNEL_LOCK == modeType){
                focusLocation.x = 1
            }
            focusManage.setFocusLocation(focusLocation);
            focusManage.nodeUpdate();
            focusManage.nodeFocus();
        }
    },

    onLeftBorder(){
        let that = this;
        let focusLocation = focusManage.getFocusLocation();
        let modeType = modelManage.getModeType();
        if (interfaceType.ACTION_LIVE_CHANNEL_LOCK == modeType) {
            try {
                let playInfo = model.getExitSceneParam ();
                if (playInfo.type == mediaType.LIVE && focusLocation.x == 1 && focusLocation.y == 0) {
                    return
                } else if (playInfo.type == mediaType.SCH && focusLocation.x == 1
                    && focusLocation.y == 1) {
                    return
                }
            } catch (e) {
                console.log (e)
            }
        }
        focusManage.onLeftBorder(that);
        if(focusLocation.x > 0){
            focusManage.lostNotice();
            focusLocation.x--;
            focusManage.setFocusLocation(focusLocation);
            focusManage.nodeUpdate();
            focusManage.nodeFocus();
        }
    },

    onRightBorder(){
        let that = this;
        focusManage.onRightBorder(that);
        let focusLocation = focusManage.getFocusLocation();
        let playInfo = model.getExitSceneParam();
        let count = 0;
        if(playInfo.type == mediaType.LIVE) {
            count = 1;
        } else {
            count = focusLocation.y > 0 ? 1 : 2;
        }
        if(focusLocation.x<count){
            focusManage.lostNotice();
            focusLocation.x++;
            focusManage.setFocusLocation(focusLocation);
            focusManage.nodeUpdate();
            focusManage.nodeFocus();
        }
    }
};

export const keyEvent = new KeyEvent();
export default {keyEvent,eventResponse}