// +----------------------------------------------------------------------
// | Copyright (js), BestTV.
// +----------------------------------------------------------------------
// | Author: karl.dong
// +----------------------------------------------------------------------
// | Date：2018/7/2
// +----------------------------------------------------------------------
// | Description: 
// +----------------------------------------------------------------------
import JxLog from "./Log"
import {sysTime} from './TimeUtils.js'
import {eventType, LogType} from "./GlobalConst"

class KeyManage {
    constructor() {
        this.supportOnKeyUpList = [];
        this.T_EmitHold = 100;//hold事件产生的间隔时间ms
        this.T_HoldIgnore = 100;

        this.continue_down_without_up = {time:null,key_code:null,count:0};
        this.hold_setinterval_ob_without_up = null;
        this.T_CL_WithoutUp = 550; //第一次down事件和第二次down事件的间隔时间ms 取值范围大于500
        this.T_EmitClick_WithoutUp = this.T_CL_WithoutUp + 10; //down事件产生后，发出up事件的间隔时间ms
        this.T_EventOpInter_WithoutUp = 280; //两次遥控器操作事件之间的间隔判定时间ms

        this.continue_down_own_up = {time:null,key_code:null,count:0};
        this.hold_setinterval_ob_own_up = null;
        this.hold_timer_own_up = null; //第一个down事件发生，定时T_CL_OwnUp ms开始发出hold
        this.T_CL_OwnUp = 420; //有up事件的hold和click判断的间隔时间ms  取值范围大于0
    }

    //遥控器有up事件情况下的遥控器事件转化
    dispatchEventSupportUp (isKeyDown, keyCode){
        let that = this;
        if(this.continue_down_without_up.count!==0){
            this.dealWithFirstUpForKeyCode(keyCode);
            return ;
        }
        let nowTimestamp = sysTime.nowMillisecondsFormat();
        if(isKeyDown){
            if(this.continue_down_own_up.count===0){ //收到第一个下压事件
                JxLog.i([LogType.EVENT, LogType.KEY_EVENT], "common/KeyManage/dispatchEventSupportUp", ["产生有起first_down事件"]);
                window.Event.dispatchEvent(eventType.FIRST_DOWN, keyCode);
                if(this.hold_timer_own_up !== null) {
                    clearTimeout(this.hold_timer_own_up);
                    this.hold_timer_own_up = null;
                }
                this.hold_timer_own_up = setTimeout(function() {
                    that.holdTimerOwnUp(keyCode);
                }, that.T_CL_OwnUp);
            }
            this.continue_down_own_up.count++;
            this.continue_down_own_up.time = nowTimestamp;
        }else{
            clearTimeout(that.hold_timer_own_up);
            that.hold_timer_own_up = null;
            if(this.hold_setinterval_ob_own_up ===null){
                window.Event.dispatchEvent(eventType.CLICK, keyCode);
                JxLog.i([LogType.EVENT, LogType.KEY_EVENT], "common/KeyManage/dispatchEventSupportUp", ["产生有起click事件"]);
            }else{
                JxLog.i([LogType.EVENT, LogType.KEY_EVENT], "common/KeyManage/dispatchEventSupportUp", ["产生有起hold_end事件"]);
                window.Event.dispatchEvent(eventType.HOLD_END, keyCode);
            }
            this.eventCleanOwnUp();
        }
    };

    //遥控器无up事件情况下的遥控器事件转化
    dispatchEventWithOutUp(isKeyDown, keyCode){
        let that = this;
        if(that.continue_down_without_up.key_code!==null&&that.continue_down_without_up.key_code!==keyCode){
            that.dealWithFirstUpForKeyCode(keyCode);
        }
        let nowTimestamp = sysTime.nowMillisecondsFormat();
        if( this.continue_down_without_up.count===0){ //收到的第一个向下压事件
            JxLog.i([LogType.EVENT, LogType.KEY_EVENT], "common/KeyManage/dispatchEventWithOutUp", ["产生无起first_down事件"]);
            window.Event.dispatchEvent(eventType.FIRST_DOWN, keyCode);
            if(this.click_timer_without_up!==null){
                clearTimeout(this.click_timer_without_up);
                this.click_timer_without_up = null;
            }
            this.click_timer_without_up = setTimeout(function(){
                that.createClickTimerForWithOutUp(keyCode)
            }, that.T_CL_WithoutUp);
        }
        this.continue_down_without_up.count++;
        this.continue_down_without_up.time = nowTimestamp;
        this.continue_down_without_up.key_code = keyCode;
    };

    holdTimerOwnUp(keyCode){
        let that = this;
        that.hold_timer_own_up = null;
        let nowTimestamp = sysTime.nowMillisecondsFormat();
        if(that.hold_setinterval_ob_own_up !== null) {
            clearInterval(that.hold_setinterval_ob_own_up);
            that.hold_setinterval_ob_own_up = null;
        }
        JxLog.i([LogType.EVENT, LogType.KEY_EVENT], "common/KeyManage/holdTimerOwnUp", ["产生有起hold_begin事件"]);
        window.Event.dispatchEvent(eventType.HOLD_BEGIN, keyCode);
        that.hold_setinterval_ob_own_up = setInterval(function() {
            let nowTimestamp = sysTime.nowMillisecondsFormat();
            //这是一种特殊情况，防止up事件时序异常了导致holding事件无法关闭
            if ((nowTimestamp - that.continue_down_own_up.time) >= that.T_EventOpInter_WithoutUp) {
                window.Event.dispatchEvent(eventType.HOLD_END, keyCode);
                that.eventCleanOwnUp();
                JxLog.e([LogType.EVENT, LogType.KEY_EVENT], "common/KeyManage/holdTimerOwnUp", ["事件时序异常了!"]);
                return ;
            }
            JxLog.i([LogType.EVENT, LogType.KEY_EVENT], "common/KeyManage/holdTimerOwnUp", ["产生有起holding事件"]);
            window.Event.dispatchEvent(eventType.HOLDING, keyCode);
        }, that.T_EmitHold);
    };

    eventCleanOwnUp(){
        this.continue_down_own_up.count = 0;
        this.continue_down_own_up.time = null;
        this.continue_down_own_up.key_code = null;
        if(this.hold_timer_own_up!==null){
            clearTimeout(this.hold_timer_own_up);
            this.hold_timer_own_up = null;
        }
        if(this.hold_setinterval_ob_own_up!==null){
            clearInterval(this.hold_setinterval_ob_own_up);
            this.hold_setinterval_ob_own_up = null;
        }
    };

    /* 开启无up按键的click定时器
 * interTime 当前down和下一个down之间的间隔时间
 * */
    createClickTimerForWithOutUp (keyCode){
        let that = this;
        let nowTimestamp = sysTime.nowMillisecondsFormat();
        if ((nowTimestamp - this.continue_down_without_up.time) >= that.T_EventOpInter_WithoutUp) {
            JxLog.i([LogType.EVENT, LogType.KEY_EVENT], "common/KeyManage/createClickTimerForWithOutUp", ["产生无起click事件"]);
            window.Event.dispatchEvent(eventType.CLICK, keyCode);
            this.eventCleanWithoutUp();
        } else {
            JxLog.i([LogType.EVENT, LogType.KEY_EVENT], "common/KeyManage/createClickTimerForWithOutUp", ["产生无起hold_begin事件"]);
            window.Event.dispatchEvent(eventType.HOLD_BEGIN, keyCode);
            this.hold_setinterval_ob_without_up = setInterval(function(){
                let nowTimestamp = sysTime.nowMillisecondsFormat();
                if(nowTimestamp - that.continue_down_without_up.time>= that.T_EventOpInter_WithoutUp){
                    JxLog.i([LogType.EVENT, LogType.KEY_EVENT], "common/KeyManage/createClickTimerForWithOutUp", ["产生无起hold_end事件"]);
                    window.Event.dispatchEvent(eventType.HOLD_END, keyCode);
                    that.eventCleanWithoutUp();
                }else if(nowTimestamp - that.continue_down_without_up.time<that.T_HoldIgnore){
                    JxLog.i([LogType.EVENT, LogType.KEY_EVENT], "common/KeyManage/createClickTimerForWithOutUp", ["产生无起holding事件"]);
                    window.Event.dispatchEvent(eventType.HOLDING, keyCode);
                }else{
                    JxLog.i([LogType.EVENT, LogType.KEY_EVENT], "common/KeyManage/createClickTimerForWithOutUp", [that.T_HoldIgnore,that.T_EventOpInter_WithoutUp,"不产生事件"]);
                }
            }, that.T_EmitHold);
        }
    };

    eventCleanWithoutUp(){
        this.continue_down_without_up.count=0;
        this.continue_down_without_up.time = null;
        this.continue_down_without_up.key_code = null;

        if(this.hold_setinterval_ob_without_up!==null){
            clearInterval(this.hold_setinterval_ob_without_up);
            this.hold_setinterval_ob_without_up = null;
        }

        if(this.click_timer_without_up!==null){
            clearTimeout(this.click_timer_without_up);
            this.click_timer_without_up = null;
        }
    };

    /* 一个按键第一次识别到up事件的处理
    * */
    dealWithFirstUpForKeyCode(keyCode){
        let nowTimestamp = sysTime.nowMillisecondsFormat();
        if(this.hold_setinterval_ob_without_up!==null){ //处于holding状态
            JxLog.i([LogType.EVENT, LogType.KEY_EVENT], "common/KeyManage/dealWithFirstUpForKeyCode", ["产生有起hold_end事件"]);
            window.Event.dispatchEvent(eventType.HOLD_END,this.continue_down_without_up.key_code);
        }else{
            JxLog.i([LogType.EVENT, LogType.KEY_EVENT], "common/KeyManage/dealWithFirstUpForKeyCode", ["产生有起click事件"]);
            window.Event.dispatchEvent(eventType.CLICK, this.continue_down_without_up.key_code);
        }
        this.eventCleanWithoutUp();
    };
}

export const keyManage = new KeyManage();
export default keyManage;