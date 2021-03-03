import {KeyCode} from "../../common/FocusModule"
import {sysTime} from '../../common/TimeUtils.js'
import {eventType} from "../../common/GlobalConst"
import Log from "../../common/Log"

export class AbstractKeyEvent {
    constructor(focusManage) {
        this.focusManage = focusManage;
        this.lastKeyEventRecord = null;//最后一次事件记录
    }

    onKeyEvent(type, keyCode) {
        this.focusManage.getFocusExt().onKeyEvent({press: type, code: keyCode});
    }

    /* scene 调用，将遥控器事件传播给下一层
     * @sceneId 当前scene的id
     * @isPress 遥控器按下动作为true、放开动作为false
     * @keyCode 事件编码
     * */
    eventDelivery(sceneId,isPress,keyCode){
        window.Event.eventDelivery(sceneId,isPress,keyCode);
    }

    isKeyEventNeedResponseByFocus (type,theKeyCode){
        let nowTimestamp = sysTime.nowMillisecondsFormat();
        if(theKeyCode===KeyCode.KEY_LEFT||theKeyCode===KeyCode.KEY_RIGHT||theKeyCode===KeyCode.KEY_UP||theKeyCode===KeyCode.KEY_DOWN){
            if(type === eventType.FIRST_DOWN||type === eventType.HOLD_BEGIN||
                type === eventType.HOLDING){
                return true;
            }
        }else if(theKeyCode===KeyCode.KEY_OKey || theKeyCode == KeyCode.KEY_STAR){
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
}
export default {AbstractKeyEvent}