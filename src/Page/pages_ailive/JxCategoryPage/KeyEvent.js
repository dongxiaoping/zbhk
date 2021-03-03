import { AbstractKeyEvent } from "../../../Abstract/scene/AbstractKeyEvent"
import { KeyCode } from "../../../common/FocusModule"
import { addClass, removeClass, showChannelPayTips} from "../../../common/CommonUtils";
import { focusManage } from "./Focus"
import { view } from "./View"
import { model } from "./Model";
import { jxCategoryPageParamType,sceneStatus,eventType, mediaType} from "../../../common/GlobalConst"
import { sceneIds } from "../../../App/app_ailive/AppGlobal.js";
import Subscribe from "../../../common/UserSubscribe"
import DataAccess from "../../../common/DataAccess";
import ChannelPay from "../../../App/app_ailive/ChannelPay";
import {OTTConfig} from "../../../common/CmsSwitch";
import JxLog from "../../../common/Log"
import {keyOpTipForLookBack} from "../../../App/app_ailive/app.component"
import {sysTime} from '../../../common/TimeUtils.js'
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

        switch (keyCode) {
            case KeyCode.KEY_MENU:
            case KeyCode.KEY_MENU2:
            case KeyCode.KEY_BACK:
            case KeyCode.KEY_BACK2:
                if(ChannelPay.isNeedPay) {       //需要付费的频道，back键退出到屏显加播放
                    let playInfo = window.WebApp.getNowPlayInfo();
                    showChannelPayTips();
                    let params = [];
                    params[sceneIds.SCREEN_SCENE_ID] = playInfo;
                    window.WebApp.switchScene(sceneIds.SCREEN_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
                } else {      //不需要付费的频道，back键退出到播放页面
                    window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID);
                }
                break;
            case KeyCode.KEY_OKey:
                if(type===eventType.HOLD_BEGIN){
                    longTouchOKey();
                    return ;
                }
                break;
            default:
                break;
        }
        super.onKeyEvent(type, keyCode);
    }

    isKeyEventNeedResponseByFocus (type,theKeyCode){
        let nowTimestamp = sysTime.nowMillisecondsFormat();
        if(theKeyCode===KeyCode.KEY_LEFT||theKeyCode===KeyCode.KEY_RIGHT||theKeyCode===KeyCode.KEY_DOWN){
            if(type === eventType.FIRST_DOWN||type === eventType.HOLD_BEGIN||
                type === eventType.HOLDING){
                return true;
            }
        }else if(theKeyCode===KeyCode.KEY_UP){
            if(isTopPart()){
                if(type === eventType.FIRST_DOWN){
                    return true;
                }
            }else{
                if(type === eventType.FIRST_DOWN||type === eventType.HOLD_BEGIN||
                    type === eventType.HOLDING){
                    return true;
                }
            }
        }else if(theKeyCode===KeyCode.KEY_OKey){
            let location = focusManage.getFocusLocation();
            let pageType = model.getPageParamTypeByLocation(location);
            if(pageType===jxCategoryPageParamType.SUB||pageType===jxCategoryPageParamType.OPERATE){
                if(type===eventType.CLICK||type===eventType.HOLD_BEGIN){
                    return true;
                }
            }else{
                if(type===eventType.FIRST_DOWN){
                    return true;
                }
            }
        }else{
            if(type===eventType.FIRST_DOWN){
                return true;
            }
        }
        return false;
    };
}

export const longTouchOKey = function() {
    let location = focusManage.getFocusLocation();
    let type = model.getPageParamTypeByLocation(location);
    if(type===jxCategoryPageParamType.SUB){
        view.subListView.openEdited();
    }
};

export const isTopPart = function(){
    let focusLocation = focusManage.getFocusLocation();
    if ((!view.subListView.isEdited && focusLocation.y === 0)||(view.subListView.isSubEmpty() && focusLocation.y === 1)||focusLocation.y <= -1) {
        return true;
    }
    return false;
};

function okOperateEvent() {
    let focusLocation = focusManage.getFocusLocation();
    let id = view.getIdByLocation(focusLocation);
    let ob = document.getElementById(id);
    let isEdit = view.subListView.getEditStatus();

    addClass(ob, "unFocus");
    removeClass(ob, "focus");
    try {
        ob.getElementsByClassName("shadow")[0].style.display = "block";
    } catch (e) {}
    if (!isEdit) {
        view.subListView.openEdited();
        focusManage.setFocusLocation({ x: 0, y: 0 });
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    } else {
        if (focusLocation.x === 0) {
            Subscribe.removeAll();
            model.setSubscribeList(DataAccess.upDateSubProgramList());
            focusManage.setFocusLocation({ x: 0, y: 1 });
            view.subListView.closeEdited();
            view.subListView.viewUpdateData();
            view.subListView.viewPage();
            focusManage.nodeUpdate();
            focusManage.nodeFocus();
            return;
        }
        view.subListView.closeEdited();
        focusManage.setFocusLocation({ x: 0, y: 0 });
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }
}

//判断目前正在播放的是否是同一个回看节目（剧集）
function checkIsPlaySameProgram(nowPlayInfo, info, type) {
    if(nowPlayInfo.type == mediaType.LIVE) {
        return false;
    } else if(nowPlayInfo.type == mediaType.J) {
        if(!nowPlayInfo.categoryCode) {
            return false;
        } else {
            let allSchedules = info.schedules;
            for(let i = 0; i<allSchedules.length; i++) {
                if(allSchedules[i].ScheduleCode == nowPlayInfo.scheduleCode) {
                    return true;
                }
            }
        }
    }
    return false;
}

function showOpTip(playInfo){
    try{
        let scheduleCode = playInfo.scheduleCode;
        let categoryCode = playInfo.categoryCode;
        let info = DataAccess.getProgramInfoByCategoryAndScheduleCode(categoryCode,scheduleCode);
        let keyName = info.keyname;
        keyOpTipForLookBack.show(keyName);
    }catch(e){
        JxLog.e([], "Page/pages_ailive/JxCategoryPage/KeyEvent/okOperateEvent/showOpTip",
            ["不能显示提示，当前精选节目数据获取异常"]);
    }
}

function nodeOkResponse(info) {
    let nowPlayInfo = window.WebApp.getNowPlayInfo();
    let isSame = checkIsPlaySameProgram(nowPlayInfo, info);
    let params = [];
    let scheduleInfo = info.schedules[0];
    let newPlayInfo = {type: mediaType.JX, channelCode: scheduleInfo.ChannelCode,
                       categoryCode: info.categoryCode, scheduleCode: scheduleInfo.ScheduleCode,
                       startTime: scheduleInfo.StartTime, endTime: scheduleInfo.EndTime};
    window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID, params);
    if(!isSame) {
        ChannelPay.laterShowSceneType = null;
        playManage.switchPlay(newPlayInfo);
    }
    showOpTip(newPlayInfo);
}

export const eventResponse = {
    on() {
        let focusLocation = focusManage.getFocusLocation();
        view.setPageShowByTop(focusLocation);
        let id = view.getIdByLocation(focusLocation);
        let ob = document.getElementById(id);
        let theJxCategoryPageParamType = model.getPageParamTypeByLocation(focusLocation);
        let nowScene = window.WebApp.Nav.getSceneById(sceneIds.JX_CATEGORY_SCENE_ID);
        if(nowScene.status !== sceneStatus.MASKED){
            if (theJxCategoryPageParamType === jxCategoryPageParamType.OPERATE) {
                removeClass(ob, "unFocus");
                addClass(ob, "focus");
            }else{
                addClass(ob, "picFocusDiv");
                addClass(ob, "focus");
            }
        }

        if (theJxCategoryPageParamType === jxCategoryPageParamType.SUB) {
        } else if (theJxCategoryPageParamType === jxCategoryPageParamType.CATEGORY) {
        }

        let theType = model.getPageParamTypeByLocation({ x: focusLocation.x, y: focusLocation.y-1});
        if(theType!==jxCategoryPageParamType.SUB&&theType!==jxCategoryPageParamType.OPERATE&&theType!==null){
            view.doubleListView.partialViewRefreshByFocusLocation({ x: focusLocation.x, y: focusLocation.y-1},true);
            if(focusLocation.y-2>=0){
                view.doubleListView.partialViewRefreshByFocusLocation({ x: focusLocation.x, y: focusLocation.y-2},true);
            }
        }else{
            view.doubleListView.partialViewRefreshByFocusLocation({ x: focusLocation.x, y: focusLocation.y+3},true);
        }
        view.doubleListView.partialViewRefreshByFocusLocation({ x: focusLocation.x, y: focusLocation.y+1},true);
        view.doubleListView.partialViewRefreshByFocusLocation({ x: focusLocation.x, y: focusLocation.y+2},true);
    },

    lost() {
        let focusLocation = focusManage.getFocusLocation();
        let id = view.getIdByLocation(focusLocation);
        let ob = document.getElementById(id);
        removeClass(ob, "picFocusDiv");
        removeClass(ob, "focus");
        let theJxCategoryPageParamType = model.getPageParamTypeByLocation(focusLocation);
        if (theJxCategoryPageParamType == jxCategoryPageParamType.OPERATE) {
            addClass(ob, "unFocus");
        }
    },

    ok() {
        let focusLocation = focusManage.getFocusLocation();
        let id = view.getIdByLocation(focusLocation);
        let ob = document.getElementById(id);
        let isEdit = view.subListView.getEditStatus();
        if (focusLocation.y == -1) { //操作事件
            okOperateEvent();
            return;
        }
        let theJxCategoryPageParamType = model.getPageParamTypeByLocation(focusLocation);
        if (theJxCategoryPageParamType === jxCategoryPageParamType.SUB) {
            let info = view.subListView.getDataByFocusLocation(focusLocation);
            if (isEdit) {
                Subscribe.unSubscribed({
                    "categoryCode": info.categoryCode,
                    "programName": info.keyname,
                });
                model.setSubscribeList(DataAccess.upDateSubProgramList());
                view.subListView.viewUpdateData();
                view.subListView.viewPage();
                if (view.subListView.isSubEmpty()) {
                    focusManage.setFocusLocation({ x: 0, y: 1 });
                    view.subListView.closeEdited();
                }else{
                    focusManage.setFocusLocation({ x: 0, y: 0 });
                }
                focusManage.nodeUpdate();
                focusManage.nodeFocus();
                return;
            }
            info.schedules = info.schedule;   //和回看分类结构保持一致
            nodeOkResponse(info);
        } else if (theJxCategoryPageParamType === jxCategoryPageParamType.CATEGORY) {
            let focusLocation = focusManage.getFocusLocation();
            let info = view.doubleListView.getDataByFocusLocation(focusLocation);
            let categoryInfo = model.getCategoryInfoByLocation(focusLocation);
            info.categoryCode = categoryInfo.Code;
            nodeOkResponse(info)
        }else{
            let recItem =view.doubleListView.getDataByFocusLocation(focusLocation);
            window.WebApp.appToVod(recItem);
        }
    },

    onTopBorder() {
        let focusLocation = focusManage.getFocusLocation();
        let id = view.getIdByLocation(focusLocation);
        let ob = document.getElementById(id);

        let theJxCategoryPageParamType = model.getPageParamTypeByLocation(focusLocation);
        if (isTopPart()) {
            if(OTTConfig.liveSwitch()) {
                focusManage.lostNotice();
                let nowPlayInfo = window.WebApp.getNowPlayInfo();
                let params = [];
                if (nowPlayInfo.type === mediaType.LIVE) {
                    params[sceneIds.CHANNEL_MINI_SCENE_ID] = {"categoryCode":null,"channelCode":nowPlayInfo.channelCode};
                    window.WebApp.switchScene(sceneIds.CHANNEL_MINI_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
                } else {
                    params[sceneIds.CHANNEL_MINI_SCENE_ID] = {"categoryCode":null,"channelCode":null};
                    window.WebApp.switchScene(sceneIds.CHANNEL_MINI_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
                }
            }
            return;
        }

        focusManage.lostNotice();
        focusLocation.y = focusLocation.y - 1;
        if(theJxCategoryPageParamType == jxCategoryPageParamType.SUB){
            focusLocation.x = 0;
        }else{
            let showList = view.doubleListView.getShowList(focusLocation);
            let showCount = showList.length;
            if(focusLocation.x >= (view.doubleListView.contentSize-1)||focusLocation.x >= (showCount-1)){
                focusLocation.x = showCount-1;
            }
        }
        focusManage.setFocusLocation(focusLocation);
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    },

    onBottomBorder() {
        let focusLocation = focusManage.getFocusLocation();
        let list = view.doubleListView.getInitPageDataList();
        let setLen = list.length;
        if(view.isHasRecommend()){
            if (focusLocation.y > (setLen * 2 - 1)) {
                return;
            }
        }else{
            if (focusLocation.y > (setLen - 1)) {
                return;
            }
        }
        let id = view.getIdByLocation(focusLocation);
        let ob = document.getElementById(id);
        focusManage.lostNotice();
        focusLocation.y = focusLocation.y + 1;
        let showList = view.doubleListView.getShowList(focusLocation);
        let showCount = showList.length;
        if(focusLocation.x >= (view.doubleListView.contentSize-1)||focusLocation.x >= (showCount-1)){
            focusLocation.x = showCount-1;
        }
        focusManage.setFocusLocation(focusLocation);
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    },

    onLeftBorder() {
        let focusLocation = focusManage.getFocusLocation();
        let id = view.getIdByLocation(focusLocation);
        let ob = document.getElementById(id);
        let theJxCategoryPageParamType = model.getPageParamTypeByLocation(focusLocation);
        if (theJxCategoryPageParamType === jxCategoryPageParamType.SUB || theJxCategoryPageParamType === jxCategoryPageParamType.OPERATE) {
            view.subListView.onLeftBorder(focusLocation);
        } else {
            try{
                removeClass(ob.getElementsByClassName("picFocusDiv")[0], "focus");
                addClass(ob.getElementsByClassName("picFocusDiv")[0], "unFocus");
                view.doubleListView.onLeftBorder(focusLocation);
            }catch(e){
                JxLog.e([], "Page/page_ailive/JxCategoryPage/KeyEvent/eventResponse/onLeftBorder",
                    ["错误异常抛出"]);
            }
        }
        try {
            ob.getElementsByClassName("shadow")[0].style.display = "block";
        } catch (e) {}
    },

    onRightBorder() {
        let focusLocation = focusManage.getFocusLocation();
        let id = view.getIdByLocation(focusLocation);
        let ob = document.getElementById(id);
        let theJxCategoryPageParamType = model.getPageParamTypeByLocation(focusLocation);
        if (theJxCategoryPageParamType === jxCategoryPageParamType.SUB || theJxCategoryPageParamType === jxCategoryPageParamType.OPERATE) {
            view.subListView.onRightBorder(focusLocation);
        } else {
            view.doubleListView.onRightBorder(focusLocation);
        }
        try {
            ob.getElementsByClassName("shadow")[0].style.display = "block";
        } catch (e) {}
    }
};

export const keyEvent = new KeyEvent();
export default { keyEvent, eventResponse }