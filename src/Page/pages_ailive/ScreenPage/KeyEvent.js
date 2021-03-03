import {AbstractKeyEvent} from "../../../Abstract/scene/AbstractKeyEvent";
import {KeyCode} from "../../../common/FocusModule";
import OTTConfig from "../../../common/CmsSwitch";
import {addClass, removeClass, processNotExistTips, hiddenNotExistTips} from "../../../common/CommonUtils";
import lazyLoadData from "../../../App/app_ailive/LazyLoadData"
import {keyUpDownOperation,mediaType,interfaceBackStatus, screenEntryType,eventType, laterShowType} from "../../../common/GlobalConst"
import { sceneIds } from "../../../App/app_ailive/AppGlobal.js";
import PlayerDataAccess from "../../../common/PlayerDataAccess";
import ChannelPay from "../../../App/app_ailive/ChannelPay";
import {PlayerControllerStatic} from '../../../common/OttPlayer';
import {focusManage} from "./Focus"
import {view} from "./View"
import JxLog from "../../../common/Log"
import {model} from "./Model"
import DataAccess from "../../../common/DataAccess";
import Collection from "../../../common/UserCollection"
import exit_menu_collection_icon from "../../../images/pages_ailive/exit_menu_collection_icon.png"
import exit_menu_uncollection_icon from "../../../images/pages_ailive/exit_menu_uncollection_icon.png"
import {sysTime} from '../../../common/TimeUtils.js'
import {playManage} from "../../../App/app_ailive/PlayManage"

class KeyEvent extends AbstractKeyEvent {
    constructor() {
        super(focusManage);
    }

    onKeyEvent(type, keyCode) {
        view.clearTimingHideToPlayPage();
        if(!ChannelPay.isNeedPay) {      //非付费频道，屏显页面才会自动消失
            view.timingHideToPlayPage(5000);
        }
        if(!ChannelPay.processResponseBack(type, keyCode)) {
            return;
        }
        if(!this.isKeyEventNeedResponseByFocus(type, keyCode)) {
            return ;
        }
        super.onKeyEvent(type, keyCode);
        let playInfo = window.WebApp.getNowPlayInfo();
        let playMediaType = playInfo.type;
        switch (keyCode) {
            case KeyCode.KEY_BACK:
            case KeyCode.KEY_BACK2:
                this.backResponse(playInfo);
                break;
            case KeyCode.KEY_UP:
            case KeyCode.KEY_DOWN:
                this.upDownResponse(playMediaType, playInfo, keyCode);
                break;
            case KeyCode.KEY_MENU:
                this.menuResponse(playMediaType, playInfo);
                break;
            default:
        }
        //hiddenNotExistTips();     //对于切换到节目最新、最老一集的节目，给出的提示，再次按按键时候，隐藏该提示
    }

    isKeyEventNeedResponseByFocus (type,theKeyCode){
        let nowTimestamp = sysTime.nowMillisecondsFormat();
        if(theKeyCode===KeyCode.KEY_LEFT||theKeyCode===KeyCode.KEY_RIGHT){
            if(type === eventType.FIRST_DOWN||type === eventType.HOLD_BEGIN||
                type === eventType.HOLDING){
                return true;
            }
        }else if(theKeyCode===KeyCode.KEY_UP||theKeyCode===KeyCode.KEY_DOWN){
            if(type === eventType.CLICK||type === eventType.HOLD_END){
                return true;
            }
        }else if(theKeyCode===KeyCode.KEY_OKey){
            if(type===eventType.FIRST_DOWN){
                return true;
            }
        }else{
            if(type===eventType.FIRST_DOWN){
                return true;
            }
        }
        return false;
    };

    backResponse(playInfo) {
        if(ChannelPay.isNeedPay) {   //付费频道屏显界面按back键到达迷你菜单常显页面
            let params = [];
            params[sceneIds.CHANNEL_MINI_SCENE_ID] = {"categoryCode":null,"channelCode":playInfo.channelCode};
            window.WebApp.switchScene(sceneIds.CHANNEL_MINI_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
        } else {
            window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID);
        }
    }

    //上下键：直播和回看节目根据不同的配置，各自有不同的交互
    upDownResponse(playMediaType, playInfo, keyCode) {
        if(playMediaType == mediaType.LIVE) {
            let supportUDC = OTTConfig.supportUDC();
            if(supportUDC == keyUpDownOperation.SWITCH_CHANNEL_PROGRAM_ADD || supportUDC == keyUpDownOperation.SWITCH_CHANNEL_PROGRAM_SUB) {
                this.processLiveSwitchChannel(keyCode, supportUDC);
            } else if(supportUDC == keyUpDownOperation.SHOW_MENU) {
                this.processLiveShowMenu(playInfo);
            }
        } else {
            let supportSchUDC = OTTConfig.supportSchUDC();
            if(supportSchUDC == keyUpDownOperation.SWITCH_CHANNEL_PROGRAM_ADD) {
                this.processSchSwitchProgram(playMediaType, playInfo, keyCode);
            } else if(supportSchUDC == keyUpDownOperation.SHOW_MENU) {
                this.processSchShowMenu(playMediaType, playInfo, keyCode);
            }
        }
    }

    //menu菜单按键的响应
    menuResponse(playMediaType, playInfo){
        if(playMediaType == mediaType.LIVE) {
            if(OTTConfig.showLiveReviewList()){
                this.processLiveShowMenu(playInfo);
            }
        } else {
            this.processSchShowMenu(playMediaType, playInfo);
        }
    }

    //直播节目上下键切台
    processLiveSwitchChannel(keyCode, supportUDC) {
        ChannelPay.laterShowSceneType = laterShowType.SCREEN_SCENE;
        let newPlayInfo = {};
        if(supportUDC == keyUpDownOperation.SWITCH_CHANNEL_PROGRAM_ADD) {  //上键减频道，下键加频道
            newPlayInfo = keyCode == KeyCode.KEY_UP ? PlayerDataAccess.getPrevChannel() : PlayerDataAccess.getNextChannel();
        } else if(supportUDC == keyUpDownOperation.SWITCH_CHANNEL_PROGRAM_SUB) {  //上键加频道，下键减频道
            newPlayInfo = keyCode == KeyCode.KEY_UP ? PlayerDataAccess.getNextChannel() : PlayerDataAccess.getPrevChannel();
        }
        playManage.switchPlay(newPlayInfo);
    }

    //直播节目上下键呼出菜单
    processLiveShowMenu(playInfo) {
        let params = [];
        if(lazyLoadData.getLazyLoadState("requestLiveCategoryChannel") === interfaceBackStatus.SUCCESS){
            params[sceneIds.CHANNEL_MINI_SCENE_ID] ={"categoryCode":null,"channelCode":playInfo.channelCode};
            window.WebApp.switchScene(sceneIds.CHANNEL_MINI_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
        }else{
            window.Loading.showPageLoadingCircle(()=>{
                JxLog.i([], "Page/pages_ailive/ScreenPage/processLiveShowMenu",
                    ["加载中"]);
            });
        }
    }

    //回看节目上下键切换节目
    processSchSwitchProgram(playMediaType, playInfo, keyCode) {
        let newPlayInfo = {};
        let upDownParams = [];
        if(playMediaType == mediaType.JX) {   //精选
            if (keyCode == KeyCode.KEY_UP) {
                newPlayInfo = PlayerDataAccess.getPrevSchProgram(playInfo.categoryCode, playInfo.scheduleCode, false);
                if(!newPlayInfo) {
                    processNotExistTips("该节目已经是最早一集！");
                    return;
                }
            } else {
                newPlayInfo = PlayerDataAccess.getNextSchProgram(playInfo.categoryCode, playInfo.scheduleCode, false);
                if(!newPlayInfo) {
                    processNotExistTips("该节目已经是最新一集！");
                    return;
                }
            }
            newPlayInfo.type = playInfo.type;
            upDownParams[sceneIds.PLAYER_SCENE_ID] = newPlayInfo;
            upDownParams[sceneIds.JX_SERIES_SCENE_ID] = newPlayInfo;
            window.WebApp.switchScene(sceneIds.JX_SERIES_SCENE_ID, upDownParams, [null, null, sceneIds.PLAYER_SCENE_ID]);
        } else if(playMediaType == mediaType.SCH){     //回看(回看下键切换，可能切换到直播)
            if (keyCode == KeyCode.KEY_UP) {
                newPlayInfo = PlayerDataAccess.getPrevReviewProgram(playInfo);
                let startDate = newPlayInfo.startTime;
                let startDataFmt = startDate.substr(0, 4)+"-"+startDate.substr(4, 2)+"-"+startDate.substr(6, 2);
                let allSchDate = DataAccess.getProgramShowDate();
                if(startDataFmt < allSchDate[0]) {
                    processNotExistTips("该节目已经是该频道回看节目单中最早一集！");
                    return;
                }
            } else {
                newPlayInfo = PlayerDataAccess.getNextReviewProgram(playInfo);
            }
            upDownParams[sceneIds.PLAYER_SCENE_ID] = newPlayInfo;
            if(newPlayInfo.type == mediaType.LIVE) {
                ChannelPay.laterShowSceneType = laterShowType.SCREEN_SCENE;
                playManage.switchPlay(newPlayInfo);
            } else {
                upDownParams[sceneIds.SCH_PROGRAM_SCENE_ID] = newPlayInfo;
                window.WebApp.switchScene(sceneIds.SCH_PROGRAM_SCENE_ID, upDownParams, [null, null, sceneIds.PLAYER_SCENE_ID]);
            }
        }
    }

    //上键：精选呼出精选分类大菜单；回看呼出频道节目单大菜单
    //下键：精选呼出剧集列表；回看呼出节目列表
    processSchShowMenu(playMediaType, playInfo, keyCode) {
        if(keyCode == KeyCode.KEY_UP) {
            if (playMediaType == mediaType.JX) { //精选分类大菜单
                let categoryCode = playInfo.categoryCode;
                let scheduleCode = playInfo.scheduleCode;
                let programInfo = DataAccess.getProgramInfoByCategoryAndScheduleCode(categoryCode,scheduleCode);
                if(programInfo===null){
                    window.WebApp.switchScene(sceneIds.JX_CATEGORY_SCENE_ID, null, [null, null, sceneIds.PLAYER_SCENE_ID]);
                }else{
                    let programName = programInfo.keyname;
                    let params = [];
                    params[sceneIds.JX_CATEGORY_SCENE_ID] =  {categoryCode:categoryCode,programName:programName};
                    window.WebApp.switchScene(sceneIds.JX_CATEGORY_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
                }
            } else { //回看频道节目单大菜单
                let params = [];
                params[sceneIds.CHANNEL_PROGRAM_SCENE_ID] = playInfo;
                window.WebApp.switchScene(sceneIds.CHANNEL_PROGRAM_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
            }
        } else if(keyCode == KeyCode.KEY_DOWN) {
            let params = [];
            if (playMediaType == mediaType.JX) { //精选剧集列表
                params[sceneIds.JX_SERIES_SCENE_ID] = playInfo;
                window.WebApp.switchScene(sceneIds.JX_SERIES_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
            } else {   //回看节目列表
                params[sceneIds.SCH_PROGRAM_SCENE_ID] = playInfo;
                window.WebApp.switchScene(sceneIds.SCH_PROGRAM_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
            }
        }
    }

    //节目单按钮点击事件
    programKeyEvent() {
        let playInfo = window.WebApp.Nav.getNavParams(sceneIds.SCREEN_SCENE_ID);
        let params = [];
        params[sceneIds.CHANNEL_PROGRAM_SCENE_ID] = playInfo;
        window.WebApp.switchScene(sceneIds.CHANNEL_PROGRAM_SCENE_ID, params, [null,null,sceneIds.PLAYER_SCENE_ID]);
    }
    //收藏按钮点击事件
    collectKeyEvent(){
        let playInfo = window.WebApp.Nav.getNavParams(sceneIds.SCREEN_SCENE_ID);
        let imgOb = document.getElementById("screen_scene_collection_img_id");
        let labelOb = document.getElementById("screen_scene_collection_label_id");
        if(Collection.exec(playInfo.channelCode)){
            imgOb.src = exit_menu_collection_icon;
            labelOb.innerHTML = "已收藏";
            labelOb.style.marginLeft = "44px";
        }else{
            imgOb.src = exit_menu_uncollection_icon;
            labelOb.innerHTML = "收藏";
            labelOb.style.marginLeft = "62px";
        }
    }

    //点播推荐点击事件
    vodRecommendKeyEvent() {
        let focusLocation = focusManage.getFocusLocation();
        let buttonNum = 1;
        if(OTTConfig.showLiveReviewList()) {
            buttonNum++;
        }
        if(ChannelPay.isNeedPay) {
            buttonNum++;
        }
        let x = focusLocation.x - buttonNum;
        let data = model.getRecList();
        if(data && data[x]) {
            window.WebApp.appToVod(data[x]);
        }
    }
}

//屏显信息响应事件
export const eventResponse = {
    on() {
        let focusLocation = focusManage.getFocusLocation();
        let id = view.getIdByLocation(focusLocation);
        let ele = document.getElementById(id);
        if(ele) {
           addClass(ele, "focus");
        }
    },
    lost() {
        let focusLocation = focusManage.getFocusLocation();
        let id = view.getIdByLocation(focusLocation);
        let ele = document.getElementById(id);
        if(ele) {
            removeClass(ele, "focus");
        }
    },
    ok() {
        let focusLocation = focusManage.getFocusLocation();
        let type = view.getFocusTypeByLocation(focusLocation);
        if(type == screenEntryType.PAY_ENTRY) {
            ChannelPay.processOrderOperation();
        } else if(type == screenEntryType.PROGRAM_ENTRY) {
            keyEvent.programKeyEvent();
        } else if(type == screenEntryType.COLLECTION_ENTRY) {
            keyEvent.collectKeyEvent();
        } else if(type == screenEntryType.REC_ENTRY) {
            keyEvent.vodRecommendKeyEvent();
        }
    },
    onRightBorder() {
        view.prevNextOne(KeyCode.KEY_RIGHT);
    },
    onLeftBorder() {
        view.prevNextOne(KeyCode.KEY_LEFT);
    }
};

export const keyEvent = new KeyEvent();
export default {keyEvent}