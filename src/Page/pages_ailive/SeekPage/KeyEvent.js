import {AbstractKeyEvent} from "../../../Abstract/scene/AbstractKeyEvent";
import {KeyCode} from "../../../common/FocusModule";
import {eventType} from "../../../common/GlobalConst";
import { sceneIds } from "../../../App/app_ailive/AppGlobal.js";
import {OTT} from "../../../common/OttMiddle";
import {PlayerControllerStatic} from "../../../common/OttPlayer";
import {sysTime} from "../../../common/TimeUtils";
import {focusManage} from "./Focus";
import JxLog from "../../../common/Log";
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
        if (!this.isKeyEventNeedResponseByFocus(type, keyCode)) {
            return;
        }
        super.onKeyEvent(type, keyCode);
        switch (keyCode) {
            case KeyCode.KEY_BACK:
            case KeyCode.KEY_BACK2:
                if (state == PlayerControllerStatic.BE_MEDIA_PLAYER_PAUSE) {
                    PlayerControllerStatic.getInstance().resumePlay();
                }
                window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID);
                break;
            case KeyCode.KEY_LEFT:
            case KeyCode.KEY_RIGHT:   //快进、快退
                PlayerControllerStatic.getInstance().seek(type, keyCode);
                break;
            case KeyCode.KEY_OKey:    //播放、暂停
                if (state == PlayerControllerStatic.BE_MEDIA_PLAYER_PLAY) {
                    PlayerControllerStatic.getInstance().pausePlay();
                } else if (state == PlayerControllerStatic.BE_MEDIA_PLAYER_PAUSE) {
                    PlayerControllerStatic.getInstance().resumePlay();
                }
                break;
            default:
        }
    }

    isKeyEventNeedResponseByFocus (type,theKeyCode){
        let nowTimestamp = sysTime.nowMillisecondsFormat();
        if(theKeyCode===KeyCode.KEY_LEFT||theKeyCode===KeyCode.KEY_RIGHT){
            return true;
        }else{
            if(type===eventType.FIRST_DOWN){
                JxLog.i([], "SeekPage/KeyEvent",
                    ["keyEventDebugger 响应事件", type, nowTimestamp]);
                return true;
            }
        }
        return false;
    };
}

export const keyEvent = new KeyEvent();
export default {keyEvent}