import {AbstractKeyEvent} from "../../../Abstract/scene/AbstractKeyEvent"
import {focusManage} from "./Focus"
import {KeyCode} from "../../../common/FocusModule"
import {defaultLiveCode,eventType,mediaType, defaultBookInfo} from "../../../common/GlobalConst"
import {removeClass, addClass, showCoverBottomTips} from "../../../common/CommonUtils"
import Config from "../../../common/Config";
import { sceneIds } from "../../../App/app_zbhk/AppGlobal";
import {view} from "./View"
import {model} from "./Model"
import {pageKeyResponse, bookTipBar} from "../../../App/app_zbhk/app.component";
import DataAccess from "../../../common/DataAccess"
import OTTConfig from "../../../common/CmsSwitch"

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
        switch(keyCode) {
            case KeyCode.KEY_BACK:
            case KeyCode.KEY_BACK2:
                window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID);
                break;
            case KeyCode.KEY_OKey:
                if(type===eventType.HOLD_BEGIN){
                    return ;
                }
                break;
            case KeyCode.KEY_PAGE_UP:
            case KeyCode.KEY_PAGE_DOWN:
                if(this.isFocusChannelList()) {
                    pageKeyResponse.menuUpDownResponse(keyCode, view.channelListView, model, focusManage);
                }
                break;
            case KeyCode.KEY_STAR:
                if (type === eventType.HOLD_BEGIN) {
                    return;
                }
                if(OTTConfig.responseStarButton()) {
                    window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID);
                }
                break;
            default:
                break;
        }
        super.onKeyEvent(type, keyCode);
    }
    isFocusChannelList() {
        let location = focusManage.getFocusLocation();
        let elementType = view.getPageElementTypeByLocation(location);
        return elementType == view.pageElementType.CHANNEL
    }
}


//迷你频道窗口响应事件
export const eventResponse = {
    on() {
        let location = focusManage.getFocusLocation();
        let elementType = view.getPageElementTypeByLocation(location);
        let obId = view.getIdByLocation(location);
        let ob = document.getElementById(obId);
        let info = view.getDataByLocation(location);
        addClass(ob, "focus");
        if(elementType===view.pageElementType.CATEGORY){
            let categoryCode = info.Code;
            model.setSelectedCategoryCode(categoryCode);
            let lostLocation = focusManage.getLostLocation();
            let lostElementType = view.getPageElementTypeByLocation(lostLocation);
            if(lostElementType!==view.pageElementType.CHANNEL && categoryCode!=defaultBookInfo.Code){
                let selectedChannelCode = model.getSelectedChannelCode();
                let theOffset = view.channelListView.getOffsetBySelectedChannelCode(selectedChannelCode);
                view.channelListView.setOffset(theOffset);
                view.channelListView.viewUpdateData();
                view.channelListView.viewPage();
            }
            if(lostElementType!==view.pageElementType.BOOK && categoryCode==defaultBookInfo.Code) {
                DataAccess.requestBooking({callback: function(booklist) {
                    model.setBookList(booklist);
                    view.bookListView.setOffsetToLive();
                    view.bookListView.viewUpdateData();
                    view.bookListView.viewPage();
                }});               
            }
        }else if(elementType==view.pageElementType.CHANNEL){
            let preObId = view.getIdByLocation(location);
            let showNameId = preObId+"_name";
            document.getElementById(showNameId).style.display="block";
            let lost = view.categoryListView.getLostLocation();
            let lostLocation = lost ? lost : focusManage.getLostLocation();
            if(view.getPageElementTypeByLocation(lostLocation) != view.pageElementType.CHANNEL) {
                let obId = view.getIdByLocation(lostLocation);
                let setOb = document.getElementById(obId);
                addClass(setOb, "select");
            }
            removeClass(ob.getElementsByTagName("img")[0],"collection-1");
            addClass(ob.getElementsByTagName("img")[0],"collection-2");
        } else if(elementType==view.pageElementType.BOOK) {
            let lostLocation = focusManage.getLostLocation();
            let obId = view.getIdByLocation(lostLocation);
            let lostEle = document.getElementById(obId);
            let lostElementType = view.getPageElementTypeByLocation(lostLocation);
            if(lostElementType == view.pageElementType.CATEGORY) {
                addClass(lostEle, "select");
            }
        }
    },
    lost() {
       let that = this;
        focusManage.lost(that);
        let location = focusManage.getFocusLocation();
        let elementType = view.getPageElementTypeByLocation(location);
        let obId = view.getIdByLocation(location);
        let ob = document.getElementById(obId);
        removeClass(ob, "focus");
        if(elementType===view.pageElementType.CATEGORY){
            view.categoryListView.setLostLocation(location);
        }else if(elementType===view.pageElementType.CHANNEL){
            removeClass(ob, "select");
            view.channelListView.setLostLocation(location);
        }
    },
    ok() {
        let location = focusManage.getFocusLocation();
        let elementType = view.getPageElementTypeByLocation(location);
        let obId = view.getIdByLocation(location);
        let ob = document.getElementById(obId);
        if(elementType===view.pageElementType.CATEGORY){
            eventResponse.onRightBorder();
        }else if(elementType===view.pageElementType.CHANNEL){
            let info = view.getDataByLocation(location);
            let params = [];
            let theCategoryCode = info.CategoryCode;
            theCategoryCode = theCategoryCode===Config.mCollectionCode?defaultLiveCode:theCategoryCode;
            params[sceneIds.PLAYER_SCENE_ID] = {type: mediaType.LIVE, categoryCode:theCategoryCode,channelCode: info.ChannelCode};
            window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID, params);
        }else {
            view.bookListView.bookOkResponse();
        }
    },
    onTopBorder() {
        let location = focusManage.getFocusLocation();
        let elementType = view.getPageElementTypeByLocation(location);
        if(elementType===view.pageElementType.CATEGORY){
            view.categoryListView.onTopBorder();
        }else{
            view.channelListView.onTopBorder(elementType);
        }
    },
    onBottomBorder() {
        let location = focusManage.getFocusLocation();
        let elementType = view.getPageElementTypeByLocation(location);
        if(elementType===view.pageElementType.CATEGORY){
            view.categoryListView.onBottomBorder();
        }else{
            view.channelListView.onBottomBorder(elementType);
        }
    },
    onLeftBorder(){
        let location = focusManage.getFocusLocation();
        let elementType = view.getPageElementTypeByLocation(location);
        if(elementType===view.pageElementType.CATEGORY){
            return ;
        }else{
            view.channelListView.onLeftBorder();
        }
    },
    onRightBorder(){
        let location = focusManage.getFocusLocation();
        let elementType = view.getPageElementTypeByLocation(location);
        let info = view.getDataByLocation(location);
        let params = [];
        if(elementType===view.pageElementType.BOOK) {
            return;
        }
        if(elementType===view.pageElementType.CATEGORY){
            if(info.Code == defaultBookInfo.Code) {  //预约
                if(view.bookListView.getShowListCount()>0){
                    view.categoryListView.onRightBorder();
                    return;
                }
                return;
            } else {   //其他分类
                if(view.channelListView.getShowListCount()>0){
                    view.categoryListView.onRightBorder();
                    return ;
                }
                let nowPlayInfo = window.WebApp.getNowPlayInfo();
                params[sceneIds.CHANNEL_PLAY_MENU_ID] = {"categoryCode":nowPlayInfo.categoryCode,"channelCode":nowPlayInfo.channelCode};
                window.WebApp.switchScene(sceneIds.CHANNEL_PLAY_MENU_ID,params, [null,null,sceneIds.PLAYER_SCENE_ID]);
                return ;
            }            
        }
        params[sceneIds.CHANNEL_PLAY_MENU_ID] = {"categoryCode":model.getSelectedCategoryCode(),"channelCode":info.ChannelCode};
        window.WebApp.switchScene(sceneIds.CHANNEL_PLAY_MENU_ID,params, [null,null,sceneIds.PLAYER_SCENE_ID]);
    }
};

export const keyEvent = new KeyEvent();
export default {keyEvent,eventResponse}