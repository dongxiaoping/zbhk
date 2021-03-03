import {AbstractKeyEvent} from "../../../Abstract/scene/AbstractKeyEvent";
import {sceneIds} from "../../../App/app_zbhk/AppGlobal.js";
import {KeyCode} from "../../../common/FocusModule";
import {eventType, keyUpDownOperation, mediaType} from "../../../common/GlobalConst";
import OTTConfig from "../../../common/CmsSwitch";
import {OTT} from "../../../common/OttMiddle";
import {PlayerControllerStatic} from "../../../common/OttPlayer";
import DataAccess from "../../../common/DataAccess";
import PlayerDataAccess from "../../../common/PlayerDataAccess";
import {showPauseIcon, processNotExistTips} from "../../../common/CommonUtils";
import {focusManage} from "./Focus";
import {view} from "./View";

class KeyEvent extends AbstractKeyEvent {
    constructor() {
        super(focusManage);
    }

    onKeyEvent(type, keyCode) {
        view.clearTimingHideToPlayPage();
        let state = OTT.MediaPlayer.getPlayState();
        if (state != PlayerControllerStatic.BE_MEDIA_PLAYER_PAUSE) {    //暂停状态下，进度条不消失
            view.timingHideToPlayPage(5000);
        }
        super.onKeyEvent(type, keyCode);
        switch (keyCode) {
            case KeyCode.KEY_BACK:
            case KeyCode.KEY_BACK2:
                if (!(type === eventType.FIRST_DOWN)) {
                    return;
                }
                if (state == PlayerControllerStatic.BE_MEDIA_PLAYER_PAUSE) {
                    PlayerControllerStatic.getInstance().resumePlay();
                }
                window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID);
                break;
            case KeyCode.KEY_LEFT:
            case KeyCode.KEY_RIGHT:   //快进、快退
                PlayerControllerStatic.getInstance().seek(type, keyCode);
                break;
            case KeyCode.KEY_UP:
            case KeyCode.KEY_DOWN:
                if(!(type===eventType.CLICK||type===eventType.HOLD_END)){
                    return;
                }
                this.upDownResponse(keyCode);
                break;
            case KeyCode.KEY_OKey:    //暂停,呼出频道列表菜单且常显,右下角显示暂停按钮
                if (!(type === eventType.FIRST_DOWN)) {
                    return;
                }
                if (state == PlayerControllerStatic.BE_MEDIA_PLAYER_PLAY) {
                    PlayerControllerStatic.getInstance().pausePlay();
                    showPauseIcon();
                    let params = [];
                    params[sceneIds.CHANNEL_PLAY_MENU_ID] = {"categoryCode":null,"channelCode":null};
                    window.WebApp.switchScene(sceneIds.CHANNEL_PLAY_MENU_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
                }
                break;
            default:
        }
    }

    //上下键：回看节目根据不同的配置，各自有不同的交互
    upDownResponse(keyCode) {
        let supportSchUDC = OTTConfig.supportSchUDC();
        if(supportSchUDC == keyUpDownOperation.SWITCH_CHANNEL_PROGRAM_ADD) {
            this.processSchSwitchProgram(keyCode);
        } else if(supportSchUDC == keyUpDownOperation.SHOW_MENU) {
            this.processSchShowMenu();
        }
    }

    //上下键切换节目
    processSchSwitchProgram(keyCode) {
        let newPlayInfo = {};
        let upDownParams = [];
        let playInfo = window.WebApp.getNowPlayInfo();
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
        window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID, upDownParams);
    }

    //上下键呼出频道节目单
    processSchShowMenu() {
        let param = [];
        param[sceneIds.CHANNEL_PLAY_MENU_ID] =  {"categoryCode":null,"channelCode":null};
        window.WebApp.switchScene(sceneIds.CHANNEL_PLAY_MENU_ID, param, [null, null, sceneIds.PLAYER_SCENE_ID]);
    }
}

export const keyEvent = new KeyEvent();
export default {keyEvent}