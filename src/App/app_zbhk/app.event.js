import {eventType, msgType, appNode, interfaceType, LogType} from "../../common/GlobalConst";
import {OTTConfig} from '../../common/CmsSwitch';
import PlayerDataAccess from "../../common/PlayerDataAccess"
import JxLog from "../../common/Log";
import keyManage from "../../common/KeyManage";
import {sceneIds} from "./AppGlobal";
import App from "./app.main";
import modelManage from "./ModelManage";

export class EventManage {
    constructor(){
        this.init();
    }

    init(){
        //盒子遥控器事件监听
        window.document.onkeydown = function (e) {
            JxLog.d([LogType.EVENT, LogType.KEY_EVENT], "App/app_zbhk/app.event/onkeydown", ["begin:遥控器下压事件", e.keyCode]);
            App.messageBroadcast(msgType.NODE_TRIGGER,{node:appNode.KEY_EVENT,keyInfo:["down",e.keyCode]});
            if(keyManage.supportOnKeyUpList[e.keyCode]){
                keyManage.dispatchEventSupportUp(true, e.keyCode);
            }else{
                keyManage.dispatchEventWithOutUp(true, e.keyCode);
            }
            JxLog.d([LogType.EVENT, LogType.KEY_EVENT], "App/app_zbhk/app.event/onkeydown", ["end:遥控器下压事件", e.keyCode]);
        };
        window.document.onkeyup = function (e) {
            JxLog.d([LogType.EVENT, LogType.KEY_EVENT], "App/app_zbhk/app.event/onkeyup", ["begin:遥控器抬起事件", e.keyCode]);
            App.messageBroadcast(msgType.NODE_TRIGGER,{node:appNode.KEY_EVENT,keyInfo:["up",e.keyCode]});
            keyManage.supportOnKeyUpList[e.keyCode] = true;
            keyManage.dispatchEventSupportUp(false, e.keyCode);
            JxLog.d([LogType.EVENT, LogType.KEY_EVENT], "App/app_zbhk/app.event/onkeyup", ["end:遥控器抬起事件", e.keyCode]);
        };
    }

    dispatchEvent(type, keyCode, obj) {
        let newestNavHistory = App.Nav.getTheNavHistory(1);
        if(newestNavHistory===false){
            JxLog.e([LogType.EVENT, LogType.KEY_EVENT], "App/app_zbhk/app.event/EventManage/dispatchEvent", ["无效操作,找不到可接收事件的页面对象"]);
            return false;
        }
        let topSceneId = newestNavHistory.id;
        let ob = App.Stack.getSceneInStackById(topSceneId);
        if(!App.isInitFinished()){
            if(topSceneId!==sceneIds.ERROR_SCENE_ID){
                JxLog.e([LogType.EVENT, LogType.KEY_EVENT], "App/app_zbhk/app.event/EventManage/dispatchEvent", ["无效操作,应用未初始化完毕"]);
                return;
            }
        }

        if(ob===false){
            JxLog.e([LogType.EVENT, LogType.KEY_EVENT], "App/app_zbhk/app.event/EventManage/dispatchEvent", ["未找到实例化的scene对象"]);
            let navHis = App.Nav.getNavHistory();
            if(navHis.length>=2){
                let params = [];
                params[sceneIds.ERROR_SCENE_ID] = {code:"003",describe:"未找到实例化的页面"};
             //   App.switchScene(sceneIds.ERROR_SCENE_ID,params);
            }
        }else{
            if(this.isNumKeyCode(keyCode)){
                this.channelChange(type,keyCode); //频道切台
            }else{
                ob.onKeyEvent(type, keyCode, obj);
            }
        }
    }

    isNumKeyCode(keyCode){
        let num = keyCode - 48;
        if(num >= 0 && num <= 9) { //是数字键
            return true;
        }
        return false;
    }

    //频道切台
    channelChange(type,keyCode){
        JxLog.d([LogType.EVENT, LogType.KEY_EVENT], "App/app_zbhk/app.event/EventManage/channelChange", [keyCode]);
        if(!(type===eventType.CLICK||type===eventType.HOLD_END)){
            return ;
        }
        let modeType = modelManage.getModeType();
        if(interfaceType.ACTION_LIVE_CHANNEL_LOCK != modeType) {      //支持数字键选台
            PlayerDataAccess.onKeyEvent(keyCode);
        }
        JxLog.d([LogType.EVENT, LogType.KEY_EVENT], "App/app_zbhk/app.event/EventManage/channelChange", ["end"]);
    }
}
