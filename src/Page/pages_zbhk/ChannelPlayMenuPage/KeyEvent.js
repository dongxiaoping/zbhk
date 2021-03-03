import {AbstractKeyEvent} from "../../../Abstract/scene/AbstractKeyEvent"
import {KeyCode} from "../../../common/FocusModule"
import {eventType, programTimeType, mediaType, defaultLiveCode, interfaceType} from "../../../common/GlobalConst"
import Collection from "../../../common/UserCollection";
import {OTT} from "../../../common/OttMiddle";
import {PlayerControllerStatic} from "../../../common/OttPlayer";
import CommonConfig from "../../../common/Config"
import {removeClass, addClass, showCoverBottomTips} from "../../../common/CommonUtils"
import {playManage} from "../../../App/app_zbhk/PlayManage";
import {sceneIds} from "../../../App/app_zbhk/AppGlobal";
import {focusManage} from "./Focus";
import {view} from "./View"
import {model} from "./Model"
import modelManage from "../../../App/app_zbhk/ModelManage";
import {pageKeyResponse} from "../../../App/app_zbhk/app.component";
import Book from "../../../common/UserBook";
import OTTConfig from "../../../common/CmsSwitch";

class KeyEvent extends AbstractKeyEvent {
    constructor() {
        super(focusManage);
    }

    onKeyEvent(type, keyCode) {
        view.clearTimingHideToPlayPage();
        let state = OTT.MediaPlayer.getPlayState();
        if(state != PlayerControllerStatic.BE_MEDIA_PLAYER_PAUSE) {    //暂停时候，常显菜单
            view.timingHideToPlayPage(10000);
        }
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
                if(type===eventType.HOLD_BEGIN){
                    return ;
                }
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

export const eventResponse = {
    on() {
        let location = focusManage.getFocusLocation();
        let obId = view.getIdByLocation(location);
        let ob = document.getElementById(obId);
        let info = view.getDataByLocation(location);
        let elementType = view.getPageElementTypeByLocation(location);
        if(elementType===view.pageElementType.DATE){
            addClass(ob, "focus");
            removeClass(ob, "select");
            let lostLocation = focusManage.getLostLocation();
            if(lostLocation){
                let lostType  = view.getPageElementTypeByLocation(lostLocation);
                if(lostType ===view.pageElementType.CHANNEL||lostType ===view.pageElementType.PROGRAM){
                    let setObId = view.getIdByLocation(lostLocation);
                    let setOb = document.getElementById(setObId);
                    addClass(setOb, "select");
                }
                if(lostType ===view.pageElementType.DATE){
                    view.programListView.lostLocation = null;
                    let selectedChannelCode = model.getSelectedChannelCode();
                    let selectedDay = info.date;
                    model.changeChannelScheduleInfo(selectedChannelCode,selectedDay);
                }
            }
        }else if(elementType===view.pageElementType.COLLECT){
            addClass(ob, "focus");
        }else if(elementType===view.pageElementType.CHANNEL){
            OnOfChannel();
        }else if(elementType===view.pageElementType.PROGRAM){
            let showNameId = obId+"_name";
            document.getElementById(showNameId).style.display="block";
            addClass(ob, "focus");
            let notBook = !Book.isBooked(info.ChannelCode, info.Name, info.ScheduleCode)
            let modeType = modelManage.getModeType();
            if (OTTConfig.showBook() && notBook &&  modeType != interfaceType.ACTION_LIVE_CHANNEL_LOCK) {
                let typeOb = document.getElementById(obId+"_type");
                typeOb.style.display = "block";
            }
            let lostLocation = focusManage.getLostLocation();
            if(lostLocation){
                let lostType  = view.getPageElementTypeByLocation(lostLocation);
                if(lostType ===view.pageElementType.DATE){
                    let obId = view.getIdByLocation(lostLocation);
                    let ob = document.getElementById(obId);
                    addClass(ob, "select");
                }
            }
        }
    },

    lost() {
        let that = this;
        focusManage.lost(that);
        let location = focusManage.getFocusLocation();
        let obId = view.getIdByLocation(location);
        let ob = document.getElementById(obId);
        let elementType = view.getPageElementTypeByLocation(location);
        if(elementType===view.pageElementType.DATE||elementType===view.pageElementType.COLLECT){
            removeClass(ob, "focus");
        }else if(elementType===view.pageElementType.CHANNEL){
            removeClass(ob, "focus");
            let showNameId = obId+"_name";
            document.getElementById(showNameId).style.display="block";
        }else{
            removeClass(ob, "focus");
            let typeObId = obId+"_type";
            let typeOb = document.getElementById(typeObId);
            typeOb.style.display = "none";
        }
    },

    ok() {
        let location = focusManage.getFocusLocation();
        let info = view.getDataByLocation(location);
        let elementType = view.getPageElementTypeByLocation(location);
        let selectedCategoryCode =  model.getSelectedCategoryCode();
        selectedCategoryCode = selectedCategoryCode === CommonConfig.mCollectionCode ? defaultLiveCode :selectedCategoryCode;
        if(elementType===view.pageElementType.COLLECT){
            okOfCollection();
        }else if(elementType===view.pageElementType.PROGRAM){
            let programType = info.programType;
            let playInfo = "";
            if(programType===programTimeType.IS_FORE_SHOW){
                let modeType = modelManage.getModeType();
                if (OTTConfig.showBook() && interfaceType.ACTION_LIVE_CHANNEL_LOCK != modeType) {
                    if(Book.isBooked(info.ChannelCode, info.Name, info.ScheduleCode)) {
                        view.programListView.onBookOk(false);
                        Book.unBook(info.ChannelCode, info.Name, info.ScheduleCode, info.StartTime, info.EndTime);
                    } else {
                        view.programListView.onBookOk(true);
                        Book.book(info.ChannelCode, info.Name, info.ScheduleCode, info.StartTime, info.EndTime);
                    }
                } else {
                    showCoverBottomTips("节目暂未开始");
                }
                return;
            }else if(programType===programTimeType.IS_LIVE){
                playInfo={type:mediaType.LIVE,categoryCode:selectedCategoryCode,channelCode:info.ChannelCode };
            }else{
                playInfo={type:mediaType.SCH,categoryCode: selectedCategoryCode,channelCode:info.ChannelCode, scheduleCode:info.ScheduleCode,startTime:info.StartTime ,endTime:info.EndTime };
            }
            window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID);
            playManage.switchPlay(playInfo);
        }else if(elementType===view.pageElementType.CHANNEL){
            let params = [];
            params[sceneIds.PLAYER_SCENE_ID] = {type: mediaType.LIVE, categoryCode:selectedCategoryCode,channelCode: info.ChannelCode};
            window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID, params);
        }
    },

    onTopBorder() {
        let location = focusManage.getFocusLocation();
        let obId = view.getIdByLocation(location);
        let ob = document.getElementById(obId);
        let elementType = view.getPageElementTypeByLocation(location);
        if(elementType===view.pageElementType.DATE){
            view.dateListView.onTopBorder();
        }else if(elementType===view.pageElementType.CHANNEL){
            view.channelListView.onTopBorder();
        }else if(elementType===view.pageElementType.PROGRAM){
            view.programListView.onTopBorder();
        }
    },

    onBottomBorder() {
        let location = focusManage.getFocusLocation();
        let obId = view.getIdByLocation(location);
        let ob = document.getElementById(obId);
        let elementType = view.getPageElementTypeByLocation(location);
        if(elementType===view.pageElementType.DATE||elementType===view.pageElementType.COLLECT){
            view.dateListView.onBottomBorder();
        }else if(elementType===view.pageElementType.CHANNEL){
            view.channelListView.onBottomBorder();
        }else if(elementType===view.pageElementType.PROGRAM){
            view.programListView.onBottomBorder();
        }
    },

    onLeftBorder(){
        let location = focusManage.getFocusLocation();
        let obId = view.getIdByLocation(location);
        let ob = document.getElementById(obId);
        let info = view.getDataByLocation(location);
        let elementType = view.getPageElementTypeByLocation(location);
        if(elementType===view.pageElementType.DATE||elementType===view.pageElementType.COLLECT){
            let modeType = modelManage.getModeType();
            if(interfaceType.ACTION_LIVE_CHANNEL_LOCK == modeType){
                return
            }
            let lostLocation = view.channelListView.getLostLocation();
            focusManage.lostNotice();
            focusManage.setFocusLocation(lostLocation);
            focusManage.nodeUpdate();
            focusManage.nodeFocus();
        }else if(elementType===view.pageElementType.PROGRAM){
            let tipEle = document.getElementById("book_operation_tip_"+location.y);
            tipEle.style.display = "none";
            let lostLocation = view.dateListView.getLostLocation();
            focusManage.lostNotice();
            focusManage.setFocusLocation(lostLocation);
            focusManage.nodeUpdate();
            focusManage.nodeFocus();
        }else{
            let modeType = modelManage.getModeType();
            if(interfaceType.ACTION_LIVE_CHANNEL_LOCK == modeType){
                return
            }
            let categoryCode = model.getCategoryCode();
            let channelCode = info.ChannelCode;
            let params = [];
            params[sceneIds.CATEGORY_PLAY_MENU_ID] = {"categoryCode":categoryCode,"channelCode":channelCode};
            window.WebApp.switchScene(sceneIds.CATEGORY_PLAY_MENU_ID,params, [null,null,sceneIds.PLAYER_SCENE_ID]);
        }
    },

    onRightBorder(){
        let location = focusManage.getFocusLocation();
        let obId = view.getIdByLocation(location);
        let ob = document.getElementById(obId);
        let elementType = view.getPageElementTypeByLocation(location);
        if(elementType===view.pageElementType.CHANNEL){
            let lostLocation = focusManage.getLostLocation();
            let elementType = view.getPageElementTypeByLocation(lostLocation);
            focusManage.lostNotice();
            if(elementType===view.pageElementType.DATE){
                focusManage.setFocusLocation(lostLocation);
            }else{
                focusManage.setFocusLocation({x:1,y:0});
            }
            focusManage.nodeUpdate();
            focusManage.nodeFocus();
        }else if(elementType===view.pageElementType.DATE){
            let count = view.programListView.getShowListCount();
            if(count<=0){
                return ;
            }
            let lostLocation = focusManage.getLostLocation();
            let lostType = view.getPageElementTypeByLocation(lostLocation);
            focusManage.lostNotice();
            if(lostType===view.pageElementType.DATE){
                let list = view.programListView.getShowList();
                let setY = view.programListView.getSelectedIndexMoveFromDate(list);
                focusManage.setFocusLocation({x:2,y:setY});
            }else{
                let programLostLocation = view.programListView.getLostLocation();
                if(!programLostLocation){
                    let list = view.programListView.getShowList();
                    let setY = view.programListView.getSelectedIndexMoveFromDate(list);
                    focusManage.setFocusLocation({x:2,y:setY});
                }else{
                    focusManage.setFocusLocation(programLostLocation);
                }
            }
            focusManage.nodeUpdate();
            focusManage.nodeFocus();
        }
    }
};

function okOfCollection(){
    let location = focusManage.getFocusLocation();
    let obId = view.getIdByLocation(location);
    let ob = document.getElementById(obId);
    let channelCode = model.getSelectedChannelCode();
    let isCollected = Collection.isCollected(channelCode);
    Collection.exec(channelCode);
    if(isCollected&&model.getSelectedCategoryCode()===CommonConfig.mCollectionCode){
        reShowPageByCollect(channelCode)
    }
    view.dateListView.collectViewUpdate(channelCode);
}

function reShowPageByCollect(channelCode){
    let theCategoryInfo = model.getCategoryInfoByCode(CommonConfig.mCollectionCode);
    let list = theCategoryInfo.Channels;
    let len = list.length;
    for(let i=0;i<len;i++){
        if(list[i].ChannelCode!==channelCode){
            //跳转到该收藏频道
            let params = [];
            params[sceneIds.CHANNEL_PLAY_MENU_ID] = {"categoryCode":CommonConfig.mCollectionCode,"channelCode":channelCode};
            window.WebApp.switchScene(sceneIds.CHANNEL_PLAY_MENU_ID,params, [null,null,sceneIds.PLAYER_SCENE_ID]);
            return ;
        }
    }
    //收藏已无数据
    let params = [];
    let nowPlayInfo = window.WebApp.getNowPlayInfo();
    params[sceneIds.CATEGORY_PLAY_MENU_ID] = {"categoryCode":nowPlayInfo.categoryCode,"channelCode":nowPlayInfo.channelCode};
    window.WebApp.switchScene(sceneIds.CATEGORY_PLAY_MENU_ID,params, [null,null,sceneIds.PLAYER_SCENE_ID]);
}

function OnOfChannel(){
    let location = focusManage.getFocusLocation();
    let obId = view.getIdByLocation(location);
    let ob = document.getElementById(obId);
    let info = view.getDataByLocation(location);
    let channelCode = info.ChannelCode;
    view.dateListView.collectViewUpdate(channelCode);
    addClass(ob, "focus");
    removeClass(ob, "select");
    let showNameId = obId+"_name";
    document.getElementById(showNameId).style.display="block";
    let lostLocation = focusManage.getLostLocation();
    if(lostLocation){
        let lostType  = view.getPageElementTypeByLocation(lostLocation);
        if(lostType ===view.pageElementType.CHANNEL){
            view.programListView.lostLocation = null;
        }
        if(lostType ===view.pageElementType.DATE){
            let obId = view.getIdByLocation(lostLocation);
            let ob = document.getElementById(obId);
            addClass(ob, "select");
        }else{
            view.dateListView.viewPage();
            let lostLocation = view.dateListView.getLostLocation();
            if(lostLocation){
                let obId = view.getIdByLocation(lostLocation);
                let ob = document.getElementById(obId);
                removeClass(ob, "select");
                lostLocation = {x:1,y:0};
                view.dateListView.setLostLocation(lostLocation);
                obId = view.getIdByLocation(lostLocation);
                ob = document.getElementById(obId);
                addClass(ob, "select");
            }
            let channelCode = info.ChannelCode;
            model.changeChannelScheduleInfo(channelCode,model.getNowDay());
        }
    }
}

export const keyEvent = new KeyEvent();
export default {keyEvent,eventResponse}