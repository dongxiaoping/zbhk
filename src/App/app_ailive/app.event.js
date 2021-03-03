import {msgType,eventType, LogType} from "../../common/GlobalConst";
import {OTTConfig} from '../../common/CmsSwitch';
import PlayerDataAccess from "../../common/PlayerDataAccess"
import JxLog from "../../common/Log"
import keyManage from "../../common/KeyManage"
import {sceneIds} from "./AppGlobal.js";
import App from "./app.main"

export class EventManage {
    constructor(){
        this.init();
        this.lockOb = null;
    }

    init(){
        //盒子遥控器事件监听
        window.document.onkeydown = function (e) {
            JxLog.i([LogType.EVENT, LogType.KEY_EVENT], "App/app_ailive/app.event/onkeydown", ["begin:遥控器下压事件", e.keyCode]);
            if(keyManage.supportOnKeyUpList[e.keyCode]){
                keyManage.dispatchEventSupportUp(true, e.keyCode);
            }else{
                keyManage.dispatchEventWithOutUp(true, e.keyCode);
            }
            JxLog.i([LogType.EVENT, LogType.KEY_EVENT], "App/app_ailive/app.event/onkeydown", ["end:遥控器下压事件", e.keyCode]);
        };
        window.document.onkeyup = function (e) {
            JxLog.d([LogType.EVENT, LogType.KEY_EVENT], "App/app_ailive/app.event/onkeyup", ["begin:遥控器抬起事件", e.keyCode]);
            keyManage.supportOnKeyUpList[e.keyCode] = true;
            keyManage.dispatchEventSupportUp(false, e.keyCode);
            JxLog.d([LogType.EVENT, LogType.KEY_EVENT], "App/app_ailive/app.event/onkeyup", ["end:遥控器抬起事件", e.keyCode])
        };
    }

    dispatchEvent(type,keyCode){
        let newestNavHistory = App.Nav.getTheNavHistory(1);
        if(newestNavHistory===false){
            JxLog.e([LogType.EVENT, LogType.KEY_EVENT], "App/app_ailive/app.event/EventManage/dispatchEvent", ["无效操作,找不到可接收事件的页面对象"]);
            return false;
        }
        let topSceneId = newestNavHistory.id;
        let ob = App.Stack.getSceneInStackById(topSceneId);
        if(!App.isInitFinished()){
            if(topSceneId!==sceneIds.ERROR_SCENE_ID){
                JxLog.e([LogType.EVENT, LogType.KEY_EVENT], "App/app_ailive/app.event/EventManage/dispatchEvent", ["无效操作,应用未初始化完毕"]);
                return;
            }
        }

        if(ob===false){
            JxLog.e([LogType.EVENT, LogType.KEY_EVENT], "App/app_ailive/app.event/EventManage/dispatchEvent", ["未找到实例化的scene对象"]);
            let navHis =  App.Nav.getNavHistory();
            if(navHis.length>=2){
                let params = [];
                params[sceneIds.ERROR_SCENE_ID] = {code:"003",describe:"未找到实例化的页面"};
               // Nav.switchScene(sceneIds.ERROR_SCENE_ID,params);
            }
        }else{
            if(this.isNumKeyCode(keyCode)){
                this.channelChange(type,keyCode); //频道切台
            }else{
                ob.onKeyEvent(type,keyCode);
            }
            //this.fontAdjust(isPress,keyCode);
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
        JxLog.d([LogType.EVENT, LogType.KEY_EVENT], "App/app_ailive/app.event/EventManage/channelChange", ["begin", keyCode]);
        if(!(type===eventType.CLICK||type===eventType.HOLD_END)){
            return ;
        }
        if(OTTConfig.supportDS()) {
            PlayerDataAccess.onKeyEvent(keyCode);
        }
        JxLog.d([LogType.EVENT, LogType.KEY_EVENT], "App/app_ailive/app.event/EventManage/channelChange", []);
    }

    //字体调整
    fontAdjust(isPress,keyCode){
        if(!isPress){
            return ;
        }
        if(keyCode==56 || keyCode==55 ){
            let count = keyCode==56?"subtract":"add";
            App.messageBroadcast(msgType.FONT_ADJUST,count);
        }
    }

    /* scene 调用，将遥控器事件传播给下一层
     * @sceneId 当前scene的id
     * @isPress 遥控器按下动作为true、放开动作为false
     * @keyCode 事件编码
     * */
    eventDelivery(sceneId,isPress,keyCode){
        let newestNavHistory =  App.Nav.getTheNavHistory(1);
        if(newestNavHistory===false){
            return false;
        }
        let allIds =  App.Nav.getAllSceneIds(newestNavHistory.id,newestNavHistory.maskSceneIds,newestNavHistory.hideSceneIds,[]);
        for(let i=0;i<allIds.length;i++){
            if(allIds[i]==sceneId){
                if((i+1)<allIds.length){
                    let scenesMap =  App.Nav.getScenesMap();
                    let sceneId = allIds[i+1];
                    let ob = new scenesMap[sceneId];
                    ob.onKeyEvent(isPress,keyCode);
                    return true;
                }
            }
        }
        return false;
    }
}