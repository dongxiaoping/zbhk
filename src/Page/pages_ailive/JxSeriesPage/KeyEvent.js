import {AbstractKeyEvent} from "../../../Abstract/scene/AbstractKeyEvent";
import {KeyCode} from "../../../common/FocusModule"
import {addClass, removeClass} from "../../../common/CommonUtils";
import Subscribe from "../../../common/UserSubscribe";
import DataAccess from "../../../common/DataAccess";
import JxLog from "../../../common/Log"
import {keyOpTipForLookBack} from "../../../App/app_ailive/app.component";
import {sceneIds} from "../../../App/app_ailive/AppGlobal.js";
import {focusManage} from "./Focus";
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

        switch (keyCode) {
            case KeyCode.KEY_BACK:
            case KeyCode.KEY_BACK2:
                window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID);
                break;
            default:
        }
    }

    processSubOk() {
        let subOb = document.getElementById("subscribe_show");
        let labelOb = document.getElementById("jx_series_sub_tip");
        if(Subscribe.exec()){
            labelOb.innerHTML = "已追剧";
            addClass(subOb, "has_sub");
        }else{
            labelOb.innerHTML = "追剧";
            removeClass(subOb, "has_sub");
        }
        window.WebApp.messageBroadcast(msgType.SUBSCRIPTION_CHANGE, null);
    }

    processSeriesOk(focusLocation) {
        let playInfo = window.WebApp.getNowPlayInfo();
        let thisNodeData = view.jxSeriesView.getDataByFocusLocation(focusLocation);
        window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID, []);
        let newPlayInfo = {type: playInfo.type, channelCode: thisNodeData.ChannelCode, categoryCode: playInfo.categoryCode,
            scheduleCode:thisNodeData.ScheduleCode, startTime:thisNodeData.StartTime, endTime:thisNodeData.EndTime};
        if(playInfo.scheduleCode != thisNodeData.ScheduleCode) {
            playManage.switchPlay(newPlayInfo);
        }
        showOpTip(newPlayInfo);
    }
}

function showOpTip(playInfo){
    try{
        let scheduleCode = playInfo.scheduleCode;
        let categoryCode = playInfo.categoryCode;
        let info = DataAccess.getProgramInfoByCategoryAndScheduleCode(categoryCode,scheduleCode);
        let keyName = info.keyname;
        keyOpTipForLookBack.show(keyName);
    }catch(e){
        JxLog.e([], "Pages_ailive/JxSeriesPage/KeyEvent/KeyEvent/showOpTip",
            ["不能显示提示，当前精选节目数据获取异常"]);
    }
}

export const eventResponse = {
    on() {
        let focusLocation= focusManage.getFocusLocation();
        let id = view.getIdByFocusLocation(focusLocation);
        let ele = document.getElementById(id);
        if(ele){
            let paramType = view.getPageParamTypeByLocation(focusLocation);
            if(paramType===view.pageParamType.SERIES_LIST){
                addClass(ele, "series_item_focus");
            }else if(paramType===view.pageParamType.SUB){
                addClass(ele, "sub_focus");
            }
        }
    },
    lost() {
        let focusLocation= focusManage.getFocusLocation();
        let id = view.getIdByFocusLocation(focusLocation);
        let ele = document.getElementById(id);
        if(ele) {
            let paramType = view.getPageParamTypeByLocation(focusLocation);
            if(paramType===view.pageParamType.SERIES_LIST){
                removeClass(ele, "series_item_focus");
            }else if(paramType===view.pageParamType.SUB){
                removeClass(ele, "sub_focus");
            }
        }
    },
    onTopBorder() {
        let focusLocation= focusManage.getFocusLocation();
        let paramType = view.getPageParamTypeByLocation(focusLocation);
        if(paramType===view.pageParamType.SERIES_LIST){
            focusManage.lostNotice();
            focusLocation.y=0;
            focusManage.setFocusLocation(focusLocation);
            focusManage.nodeUpdate();
            focusManage.nodeFocus();
        }
    },
    onBottomBorder() {
        let focusLocation= focusManage.getFocusLocation();
        let paramType = view.getPageParamTypeByLocation(focusLocation);
        if(paramType===view.pageParamType.SUB){
            focusManage.lostNotice();
            focusLocation.y=1;
            focusManage.setFocusLocation(focusLocation);
            focusManage.nodeUpdate();
            focusManage.nodeFocus();
        }
    },
    onLeftBorder(){
        let focusLocation= focusManage.getFocusLocation();
        let paramType = view.getPageParamTypeByLocation(focusLocation);
        if(paramType===view.pageParamType.SERIES_LIST){
            view.jxSeriesView.prevNextOne(KeyCode.KEY_LEFT, focusLocation);
        }
    },
    onRightBorder(){
        let focusLocation= focusManage.getFocusLocation();
        let paramType = view.getPageParamTypeByLocation(focusLocation);
        if(paramType===view.pageParamType.SERIES_LIST){
            view.jxSeriesView.prevNextOne(KeyCode.KEY_RIGHT, focusLocation);
        }
    },
    ok() {
        let focusLocation= focusManage.getFocusLocation();
        let paramType = view.getPageParamTypeByLocation(focusLocation);
        if(paramType===view.pageParamType.SUB){
            keyEvent.processSubOk();
        }else if(paramType===view.pageParamType.SERIES_LIST){
            keyEvent.processSeriesOk(focusLocation);
        }
    }
};
export const keyEvent = new KeyEvent();
export default {keyEvent}