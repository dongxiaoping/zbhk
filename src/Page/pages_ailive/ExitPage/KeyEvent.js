import {AbstractKeyEvent} from "../../../Abstract/scene/AbstractKeyEvent"
import {KeyCode} from "../../../common/FocusModule"
import {OTTConfig} from "../../../common/CmsSwitch"
import {mediaType,exitPageParamType,laterShowType, defaultLiveCode, LogType} from "../../../common/GlobalConst"
import JxLog from "../../../common/Log"
import Subscribe from "../../../common/UserSubscribe";
import Collection from "../../../common/UserCollection";
import {addClass, removeClass} from "../../../common/CommonUtils";
import PlayerDataAccess from "../../../common/PlayerDataAccess";
import {sceneIds} from "../../../App/app_ailive/AppGlobal.js";
import ChannelPay from "../../../App/app_ailive/ChannelPay";
import lazyLoadData from "../../../App/app_ailive/LazyLoadData"
import {focusManage} from "./Focus"
import {view} from "./View"
import {model} from "./Model"
import exit_menu_sub_icon from "../../../images/pages_ailive/exit_menu_sub_icon.png";
import exit_menu_unsub_icon from "../../../images/pages_ailive/exit_menu_unsub_icon.png";
import exit_menu_collection_icon from "../../../images/pages_ailive/exit_menu_collection_icon.png"
import exit_menu_uncollection_icon from "../../../images/pages_ailive/exit_menu_uncollection_icon.png"
import {playManage} from "../../../App/app_ailive/PlayManage"

class KeyEvent extends AbstractKeyEvent {
    constructor() {
        super(focusManage);
    }

    onKeyEvent(type, keyCode) {
        view.clearTimingHideToPlayPage();
        view.timingHideToPlayPage(5000);

        if(!ChannelPay.processResponseBack(type, keyCode)) {
            return;
        }
        if(!this.isKeyEventNeedResponseByFocus(type, keyCode)) {
            return ;
        }
        super.onKeyEvent(type, keyCode);
        switch(keyCode) {
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

    //收藏按钮点击事件
    collectKeyEvent(){
        let imgOb = document.getElementById("exit_scene_recommend_menu_img_id");
        let labelOb = document.getElementById("exit_scene_recommend_menu_label_id");
        let playInfo = window.WebApp.getNowPlayInfo();
        if(Collection.exec(playInfo.channelCode)){
            imgOb.src = exit_menu_collection_icon;
            labelOb.innerHTML = "已收藏";
        }else{
            imgOb.src = exit_menu_uncollection_icon;
            labelOb.innerHTML = "收藏";
        }       
    }

    //订阅按钮点击事件
    subKeyEvent(){
        let imgOb = document.getElementById("exit_scene_recommend_menu_img_id");
        let labelOb = document.getElementById("exit_scene_recommend_menu_label_id");
        if(Subscribe.exec()){
            imgOb.src = exit_menu_sub_icon;
            labelOb.innerHTML = "已追剧";
        }else{
            imgOb.src = exit_menu_unsub_icon;
            labelOb.innerHTML = "追剧";
        }       
    }

    //回看退出到“最新”
    schToLiveKeyEvent() {
        let playScene = window.WebApp.Nav.getSceneById(sceneIds.PLAYER_SCENE_ID);
        if(!playScene){
            JxLog.e([LogType.PAGE], "ExitPage/KeyEvent/schToLiveKeyEvent", ["ERROR:播放页面不存在"]);
            return;
        }
        let nowPlayInfo = window.WebApp.getNowPlayInfo();
        let categoryCode = nowPlayInfo.categoryCode ? nowPlayInfo.categoryCode : defaultLiveCode;
        let selectedChannelCode = nowPlayInfo.channelCode;
        ChannelPay.laterShowSceneType = laterShowType.SCREEN_SCENE;
        let playInfo = {type: mediaType.LIVE, categoryCode: categoryCode, channelCode: selectedChannelCode};
        playManage.switchPlay(playInfo);
    }

    //精选退出到“最新”
    jxToLiveKeyEvent() {
        let playScene = window.WebApp.Nav.getSceneById(sceneIds.PLAYER_SCENE_ID);
        if(!playScene){
            JxLog.e([LogType.PAGE], "ExitPage/KeyEvent/jxToLiveKeyEvent",
                ["ERROR:播放页面不存在"]);
            return;
        }
        let nowPlayInfo = window.WebApp.getNowPlayInfo();
        let info = PlayerDataAccess.getSchDetailByCategorySchedule(nowPlayInfo.categoryCode,nowPlayInfo.scheduleCode);
        let channelCode = info.schDetail.ChannelCode;
        ChannelPay.laterShowSceneType = laterShowType.SCREEN_SCENE;
        let playInfo = {type: mediaType.LIVE, categoryCode: defaultLiveCode, channelCode: channelCode};
        if(lazyLoadData.isPageLazyLoadRightForShow(sceneIds.SCREEN_SCENE_ID)){
            playManage.switchPlay(playInfo);
        }else{
            window.Loading.showPageLoadingCircle(()=>{
                JxLog.i([LogType.PAGE], "ExitPage/KeyEvent/jxToLiveKeyEvent",
                    ["加载中"]);
            });
        }
    }

    //直播时移退出到“最新”直播
    liveSeekToLiveKeyEvent() {
        let playScene = window.WebApp.Nav.getSceneById(sceneIds.PLAYER_SCENE_ID);
        if(!playScene){
            JxLog.e([LogType.PAGE], "ExitPage/KeyEvent/liveSeekToLiveKeyEvent",
                ["ERROR:播放页面不存在"]);
            return;
        }
        let nowPlayInfo = window.WebApp.getNowPlayInfo();
        let params = [];
        params[sceneIds.SCREEN_SCENE_ID] = nowPlayInfo;
        params[sceneIds.PLAYER_SCENE_ID] = nowPlayInfo;
        window.WebApp.switchScene(sceneIds.SCREEN_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
    }
}

export const eventResponse = {
    on() {
        let focusLocation = focusManage.getFocusLocation();
        let id = view.getIdByFocusLocation(focusLocation);
        let ob = document.getElementById(id);
        addClass(ob, "picFocusDiv");
        let paramType = view.getPageParamTypeByLocation(focusLocation);
        if(paramType===exitPageParamType.EXIT_BUTTON) {
            document.getElementById("exit_button_id").style.opacity=1;
        }
        if(paramType===exitPageParamType.FUNCTION_LABEL){
           document.getElementById("exit_scene_recommend_menu_img_id").style.opacity=1;
        }
        if(paramType===exitPageParamType.FUNCTION_JX_LIVE_LABEL){
            document.getElementById("exit_menu_live_img_id").style.opacity=1;
        }
        if(ChannelPay.isNeedPay) {
            if(paramType == exitPageParamType.ORDER_BUTTON) {
                document.getElementById("exit_menu_order_id").style.opacity=1;
            }
        }
    },

    lost() {

    },

    ok() {
        let focusLocation = focusManage.getFocusLocation();
        let paramType = view.getPageParamTypeByLocation(focusLocation);
        let type = window.WebApp.Nav.getNavParams(sceneIds.EXIT_SCENE_ID);
        if(paramType===exitPageParamType.EXIT_BUTTON){      //退出
            window.WebApp.appExit();
        } else if(paramType===exitPageParamType.ORDER_BUTTON) {      //订购
            ChannelPay.processOrderOperation();
        } else if(paramType===exitPageParamType.FUNCTION_LABEL){     //功能（直播的"收藏"、精选的"追剧"、回看的"最新"）
            switch(type) {
                case (mediaType.LIVE):
                    keyEvent.collectKeyEvent();
                    break;
                case (mediaType.JX):
                    keyEvent.subKeyEvent();
                    break;
                case (mediaType.SCH):
                    keyEvent.schToLiveKeyEvent();
                    break;
                default:
            }
        }else if(paramType===exitPageParamType.FUNCTION_JX_LIVE_LABEL){ //直播时移的退出界面“最新”按钮---精选的退出界面“最新”按钮
            switch(type) {
                case (mediaType.LIVE):
                    keyEvent.liveSeekToLiveKeyEvent();
                    break;
                case (mediaType.JX):
                    keyEvent.jxToLiveKeyEvent();
                    break;
                default:
            }
        } else {        //推荐列表
            let recItem = model.getRecommendDataByLocation(focusLocation,type);
            window.WebApp.appToVod(recItem);
        }
    },

    onTopBorder() {
        let that = this;
        focusManage.onTopBorder(that);

    },

    onBottomBorder() {
        let that = this;
        focusManage.onBottomBorder(that);
    },

    onLeftBorder(){
        let that = this;
        focusManage.onLeftBorder(that);
        let focusLocation = focusManage.getFocusLocation();
        let paramType = view.getPageParamTypeByLocation(focusLocation);
        if(paramType===exitPageParamType.FUNCTION_LABEL){
            document.getElementById("exit_scene_recommend_menu_img_id").style.opacity=0.4;
        }
        if(paramType===exitPageParamType.FUNCTION_JX_LIVE_LABEL){
            document.getElementById("exit_menu_live_img_id").style.opacity=0.4;
        }
        if(ChannelPay.isNeedPay) {
            if(paramType == exitPageParamType.ORDER_BUTTON) {
                document.getElementById("exit_menu_order_id").style.opacity=0.4;
            }
        }
        if(focusLocation.x>0){
            let id = view.getIdByFocusLocation(focusLocation);
            let ob = document.getElementById(id);
            removeClass(ob, "picFocusDiv");
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
        let paramType = view.getPageParamTypeByLocation(focusLocation);
        let type = window.WebApp.Nav.getNavParams(sceneIds.EXIT_SCENE_ID);
        let count = view.getButtonCount(type);
        count = count + view.recommendListView.getRecommendCount();
        if(focusLocation.x<count){
            if(paramType===exitPageParamType.EXIT_BUTTON) {
                document.getElementById("exit_button_id").style.opacity=0.4;
            }
            if(paramType===exitPageParamType.FUNCTION_LABEL){
                document.getElementById("exit_scene_recommend_menu_img_id").style.opacity=0.4;
            }
            if(paramType===exitPageParamType.FUNCTION_JX_LIVE_LABEL){
                document.getElementById("exit_menu_live_img_id").style.opacity=0.4;
            }
            if(ChannelPay.isNeedPay) {
                if(paramType == exitPageParamType.ORDER_BUTTON) {
                    document.getElementById("exit_menu_order_id").style.opacity=0.4;
                }
            }
            let id = view.getIdByFocusLocation(focusLocation);
            let ob = document.getElementById(id);
            removeClass(ob, "picFocusDiv");
            focusLocation.x++;
            focusManage.setFocusLocation(focusLocation);
            focusManage.nodeUpdate();
            focusManage.nodeFocus();
        }
    }
};

export const keyEvent = new KeyEvent();
export default {keyEvent,eventResponse}