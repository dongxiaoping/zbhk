import {AbstractKeyEvent} from "../../../Abstract/scene/AbstractKeyEvent";
import {KeyCode} from "../../../common/FocusModule";
import {eventType, keyUpDownOperation} from "../../../common/GlobalConst";
import OTTConfig from "../../../common/CmsSwitch";
import {OTT} from "../../../common/OttMiddle";
import {PlayerControllerStatic} from "../../../common/OttPlayer";
import PlayerDataAccess from "../../../common/PlayerDataAccess"
import {sceneIds} from "../../../App/app_zbhk/AppGlobal.js";
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
            case KeyCode.KEY_RIGHT:
                PlayerControllerStatic.getInstance().seek(type, keyCode);
                break;
            case KeyCode.KEY_UP:
            case KeyCode.KEY_DOWN:
                if(!(type===eventType.CLICK||type===eventType.HOLD_END)){
                    return;
                }
                this.upDownResponse(keyCode);
                break;
            case KeyCode.KEY_OKey:    //播放、暂停
                if (!(type === eventType.FIRST_DOWN)) {
                    return;
                }
                if (state == PlayerControllerStatic.BE_MEDIA_PLAYER_PLAY) {
                    PlayerControllerStatic.getInstance().pausePlay();
                } else if (state == PlayerControllerStatic.BE_MEDIA_PLAYER_PAUSE) {
                    PlayerControllerStatic.getInstance().resumePlay();
                }
                break;
            default:
        }
    }

    //上下键：直播根据不同的配置，有不同的交互
    upDownResponse(keyCode) {
        let supportUDC = OTTConfig.supportUDC();
        if(supportUDC == keyUpDownOperation.SWITCH_CHANNEL_PROGRAM_ADD || supportUDC == keyUpDownOperation.SWITCH_CHANNEL_PROGRAM_SUB) {
            this.processLiveSwitchChannel(keyCode, supportUDC);
        } else if(supportUDC == keyUpDownOperation.SHOW_MENU) {
            this.processLiveShowMenu();
        }
    }

    //上下键切台
    processLiveSwitchChannel(keyCode, supportUDC) {
        let newPlayInfo = {};
        if(supportUDC == keyUpDownOperation.SWITCH_CHANNEL_PROGRAM_ADD) {  //上键减频道，下键加频道
            newPlayInfo = keyCode == KeyCode.KEY_UP ? PlayerDataAccess.getPrevChannel() : PlayerDataAccess.getNextChannel();
        } else if(supportUDC == keyUpDownOperation.SWITCH_CHANNEL_PROGRAM_SUB) {  //上键加频道，下键减频道
            newPlayInfo = keyCode == KeyCode.KEY_UP ? PlayerDataAccess.getNextChannel() : PlayerDataAccess.getPrevChannel();
        }
        let param = [];
        param[sceneIds.PLAYER_SCENE_ID] = newPlayInfo;
        window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID, param);
    }

    //上下键呼出菜单
    processLiveShowMenu() {
        let param = [];
        param[sceneIds.CHANNEL_PLAY_MENU_ID] = {"categoryCode":null,"channelCode":null};
        window.WebApp.switchScene(sceneIds.CHANNEL_PLAY_MENU_ID, param, [null, null, sceneIds.PLAYER_SCENE_ID]);
    }
}
export const eventResponse = {};

export const keyEvent = new KeyEvent();
export default {keyEvent}