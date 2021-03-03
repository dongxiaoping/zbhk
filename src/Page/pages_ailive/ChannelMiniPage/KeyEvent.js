import {AbstractKeyEvent} from "../../../Abstract/scene/AbstractKeyEvent"
import {KeyCode} from "../../../common/FocusModule"
import {laterShowType, eventType, mediaType,defaultLiveCode, LogType} from "../../../common/GlobalConst"
import {removeClass, addClass, hiddenChannelPayTips} from "../../../common/CommonUtils"
import JxLog from "../../../common/Log"
import lazyLoadData from "../../../App/app_ailive/LazyLoadData"
import {OTTConfig} from "../../../common/CmsSwitch";
import Collection from "../../../common/UserCollection";
import {sceneIds} from "../../../App/app_ailive/AppGlobal";
import ChannelPay from "../../../App/app_ailive/ChannelPay";
import {sysTime} from '../../../common/TimeUtils.js'
import {focusManage} from "./Focus"
import {view} from "./View"
import Config from "../../../common/Config";
import {model} from "./Model"
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
        switch(keyCode) {
            case KeyCode.KEY_BACK:
            case KeyCode.KEY_BACK2:
                if(ChannelPay.isNeedPay) {   //迷你菜单页面返回键到达退出页面
                    let backParams = [];
                    backParams[sceneIds.EXIT_SCENE_ID] = mediaType.LIVE;
                    window.WebApp.switchScene(sceneIds.EXIT_SCENE_ID, backParams, [null, null, sceneIds.PLAYER_SCENE_ID]);
                } else {
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
        if(theKeyCode===KeyCode.KEY_LEFT||theKeyCode===KeyCode.KEY_RIGHT||theKeyCode===KeyCode.KEY_UP){
            if(type === eventType.FIRST_DOWN||type === eventType.HOLD_BEGIN||
                type === eventType.HOLDING){
                JxLog.i([LogType.PAGE], "KeyEvent/isKeyEventNeedResponseByFocus", ["keyEventDebugger 响应事件"]);
                return true;
            }
        }else if(theKeyCode===KeyCode.KEY_DOWN){
            if(type === eventType.CLICK||type===eventType.HOLD_END){
                JxLog.i([LogType.PAGE], "KeyEvent/isKeyEventNeedResponseByFocus",
                    ["keyEventDebugger 响应事件", type, nowTimestamp]);
                return true;
            }
        }else if(theKeyCode===KeyCode.KEY_OKey){
            let location = focusManage.getFocusLocation();
            let pageType = view.getPageElementTypeByLocation(location);
            if(pageType===view.pageElementType.CHANNEL&&view.isCollection()){
                if(type===eventType.CLICK||type===eventType.HOLD_BEGIN){
                    JxLog.i([LogType.PAGE], "KeyEvent/isKeyEventNeedResponseByFocus",
                        ["keyEventDebugger 响应事件", type, nowTimestamp]);
                    return true;
                }
            }else{
                if(type===eventType.CLICK){
                    JxLog.i([LogType.PAGE], "KeyEvent/isKeyEventNeedResponseByFocus",
                        ["keyEventDebugger 响应事件", type, nowTimestamp]);
                    return true;
                }
            }
        }else{
            if(type===eventType.FIRST_DOWN){
                JxLog.i([LogType.PAGE], "KeyEvent/isKeyEventNeedResponseByFocus",
                    ["keyEventDebugger 响应事件", type, nowTimestamp]);
                return true;
            }
        }
        return false;
    };
}

export const longTouchOKey = function() {
    let location = focusManage.getFocusLocation();
    let type = view.getPageElementTypeByLocation(location);
    if(type===view.pageElementType.CHANNEL&&view.isCollection()){
        view.openEdited();
    }
};

function okOperateEvent() {
    let focusLocation = focusManage.getFocusLocation();
    let id = view.getIdByLocation(focusLocation);
    let ob = document.getElementById(id);
    let isEdit = view.isEdited;

    addClass(ob, "unFocus");
    removeClass(ob, "focus");
    try {
        ob.getElementsByClassName("shadow")[0].style.display = "block";
    } catch (e) {}
    if (focusLocation.x === 0) {
        Collection.removeAll();
        model.setSubscribeList([]);
        focusManage.setFocusLocation({ x: 1, y: 1 });
        view.closeEdited();
        view.windowListView.viewUpdateData();
        view.windowListView.viewPage();
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
        return;
    } else {

    }
    view.closeEdited();
    focusManage.setFocusLocation({ x: 0, y: 0 });
    focusManage.nodeUpdate();
    focusManage.nodeFocus();
}

//迷你频道窗口响应事件
export const eventResponse = {
    on() {
        let that = this;
        focusManage.on(that);
        let location = focusManage.getFocusLocation();
        let paramType = view.getPageElementTypeByLocation(location);
        let obId = view.getIdByLocation(location);
        let ob = document.getElementById(obId);
        if(paramType===view.pageElementType.CHANNEL){
            addClass(ob, "focus");
            addClass(ob, "picFocusDiv");
            let barId = "channel_mini_scene_pic_windows_id_bar_"+location.x;
            ob = document.getElementById(barId);
            if(OTTConfig.isShowMinProgramTab()){
                ob.style.display = "block";
            }
            if(window.WebApp.Nav.getSceneById(sceneIds.PLAYER_SCENE_ID)===false){
                return ;
            }
            let info = view.getDataByLocation(location);
            let theCategoryCode = model.getSelectedCategory().Code;
            theCategoryCode = theCategoryCode===Config.mCollectionCode?defaultLiveCode:theCategoryCode;
            let playInfo = {type: mediaType.LIVE,categoryCode:theCategoryCode, channelCode: info.ChannelCode};
            if(typeof (view.switchPlayTimer)!=="undefined"&&view.switchPlayTimer){
                clearTimeout(view.switchPlayTimer);
            }
            let nowPlayInfo = window.WebApp.getNowPlayInfo();
            if(nowPlayInfo.type===playInfo.type&&nowPlayInfo.channelCode===playInfo.channelCode){
                return;
            }
            if(!(view.isCollection()&&view.isEdited)){
                view.switchPlayTimer = setTimeout(function() {
                    ChannelPay.laterShowSceneType = null;
                    playManage.switchPlay(playInfo);
                }, 600);
            }
        }else if(paramType===view.pageElementType.CATEGORY){
            addClass(ob, "focus");
            removeClass(ob, "selected");
            let info = view.getDataByLocation(location);
            let categoryCode = info.Code;
            let selectedCategory = model.getCategoryByCode(categoryCode);
            model.setSelectedCategory(selectedCategory);
            let playListLocationInfo = view.getPlayListLocationInfo();
            if(categoryCode === playListLocationInfo.categoryCode){
                 view.windowListView.setOffset(playListLocationInfo.offset);
            }else{
                view.windowListView.setOffset(0);
            }
            let lostPageType = focusManage.getLostPageType();
            if(lostPageType!==view.pageElementType.CHANNEL){
                view.windowListView.viewUpdateData();
                view.windowListView.viewPage();
            }
            if(!view.isCollection()){
                view.closeEdited();
            }
        }else{
            removeClass(ob, "unFocus");
            addClass(ob, "focus");
        }
    },
    lost() {
        let that = this;
        focusManage.lost(that);
        let location = focusManage.getFocusLocation();
        let paramType = view.getPageElementTypeByLocation(location);
        focusManage.setLostPageType(paramType);
        let obId = view.getIdByLocation(location);
        let ob = document.getElementById(obId);
        if(paramType===view.pageElementType.CHANNEL){
            removeClass(ob, "picFocusDiv");
            removeClass(ob, "focus");
            let barId = "channel_mini_scene_pic_windows_id_bar_"+location.x;
            let barOb = document.getElementById(barId);
            barOb.style.display = "none";
        }else if(paramType===view.pageElementType.CATEGORY){
            removeClass(ob, "focus");
        }else{
            removeClass(ob, "focus");
            addClass(ob, "unFocus");
        }
    },
    ok() {
        clearTimeout(view.switchPlayTimer);
        let location = focusManage.getFocusLocation();
        let paramType = view.getPageElementTypeByLocation(location);
        if(paramType===view.pageElementType.CHANNEL){
            if(view.isCollection()&&view.isEdited){
                let info = view.getDataByLocation(location);
                let selectedChannelCode =info.ChannelCode;
                Collection.unColleciton(selectedChannelCode);
                let index = model.delCollectionByChannelCode(selectedChannelCode);
                view.windowListView.setOffset(0);
                if(model.getChannelListCount()<=0){
                    location.y=1;
                    location.x=1;
                }else{
                    location.x=0;
                }
                focusManage.setFocusLocation(location);
                view.windowListView.viewUpdateData();
                view.windowListView.viewPage();
                view.openEdited();
                focusManage.nodeUpdate();
                focusManage.nodeFocus();
                return ;
            }
            if(typeof (view.switchPlayTimer)!=="undefined"&&view.switchPlayTimer){
                clearTimeout(view.switchPlayTimer);
            }
            ChannelPay.laterShowSceneType = laterShowType.LIVE_OPERATION_TIPS;
            let info = view.getDataByLocation(location);
            let params = [];
            let theCategoryCode = model.getSelectedCategory().Code;
            theCategoryCode = theCategoryCode===Config.mCollectionCode?defaultLiveCode:theCategoryCode;
            params[sceneIds.PLAYER_SCENE_ID] = {type:mediaType.LIVE, categoryCode:theCategoryCode, channelCode:info.ChannelCode};
            window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID, params);
        }else if(paramType===view.pageElementType.CATEGORY){

        }else{
            okOperateEvent();
            return;
        }


    },
    onTopBorder() {
        let location = focusManage.getFocusLocation();
        let paramType = view.getPageElementTypeByLocation(location);
        if(paramType===view.pageElementType.CHANNEL){
            focusManage.lostNotice();
            view.updatePlayListLocationInfo();
            location.y++;
            location.x= view.categoryListView.getLocationInShowByCategoryCode(model.getSelectedCategory().Code);
            focusManage.setFocusLocation(location);
            focusManage.nodeUpdate();
            focusManage.nodeFocus();
        }else if(paramType===view.pageElementType.OPERATE){
            focusManage.lostNotice();
            location.y++;
            location.x= 0;
            focusManage.setFocusLocation(location);
            focusManage.nodeUpdate();
            focusManage.nodeFocus();
        }
    },
    onBottomBorder() {
        let location = focusManage.getFocusLocation();
        let paramType = view.getPageElementTypeByLocation(location);
        if(paramType===view.pageElementType.CHANNEL){
            if(view.isCollection()&&view.isEdited){
                focusManage.lostNotice();
                location.y--;
                location.x = 0;
                focusManage.setFocusLocation(location);
                focusManage.nodeUpdate();
                focusManage.nodeFocus();
                return;
            }
            if(typeof (view.switchPlayTimer)!=="undefined"&&view.switchPlayTimer){
                clearTimeout(view.switchPlayTimer);
            }
            if(lazyLoadData.isPageLazyLoadRightForShow(sceneIds.JX_CATEGORY_SCENE_ID)){
                hiddenChannelPayTips();
                window.WebApp.switchScene(sceneIds.JX_CATEGORY_SCENE_ID,null,[null,null,sceneIds.PLAYER_SCENE_ID]);
            }else{
                window.Loading.showPageLoadingCircle(()=>{
                    JxLog.d([LogType.PAGE], "KeyEvent/onBottomBorder", ["加载中"]);
                });
            }
        }else if(paramType===view.pageElementType.CATEGORY){
            if(view.windowListView.channelList.length<=0){
                if(lazyLoadData.isPageLazyLoadRightForShow(sceneIds.JX_CATEGORY_SCENE_ID)){
                    window.WebApp.switchScene(sceneIds.JX_CATEGORY_SCENE_ID,null,[null,null,sceneIds.PLAYER_SCENE_ID]);
                }else{
                    window.Loading.showPageLoadingCircle(()=>{
                        JxLog.d([LogType.PAGE], "KeyEvent/onBottomBorder",
                            ["加载中"]);
                    });
                }
                return;
            }
            focusManage.lostNotice();
            let selectedCategoryCode = model.selectedCategory.Code;
            let playListLocationInfo = view.getPlayListLocationInfo();
            if(selectedCategoryCode === playListLocationInfo.categoryCode){
                location = playListLocationInfo.location;
            }else{
                location.y--;
                location.x = 0;
            }
            focusManage.setFocusLocation(location);
            focusManage.nodeUpdate();
            focusManage.nodeFocus();
            let theId = view.getIdByCategoryCode(selectedCategoryCode);
            let theOb = document.getElementById(theId);
            addClass(theOb, "selected");
        }else{

        }


    },
    onLeftBorder(){
        let that = this;
        focusManage.onLeftBorder(that);
        view.onLeftBorder();
    },

    onRightBorder(){
        let that = this;
        focusManage.onRightBorder(that);
        view.onRightBorder();
    }
};

export const keyEvent = new KeyEvent();
export default {keyEvent,eventResponse}