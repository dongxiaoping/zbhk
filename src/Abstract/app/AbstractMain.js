// +----------------------------------------------------------------------
// | Copyright (js), BestTV.
// +----------------------------------------------------------------------
// | Author: karl.dong
// +----------------------------------------------------------------------
// | Date：2018/6/5
// +----------------------------------------------------------------------
// | Description: common文件里面调用的App相关函数，必须都存在于父类中
// +----------------------------------------------------------------------
import {sysTime} from "../../common/TimeUtils"
import OTT from "../../common/OttMiddle"
import {PlayerControllerStatic} from '../../common/OttPlayer';
import {DataReport} from "../../common/DataReport";
import {msgType,appNode, LogType} from "../../common/GlobalConst";
import OTTConfig from "../../common/CmsSwitch";
import JxLog from "../../common/Log";
import {webStorage} from "../../common/LocalStorage";

export class AbstractMain {
    constructor(scenesMap,NavManage,StackManage) {
        this.Stack = new StackManage(scenesMap);
        this.Nav = new NavManage(this.Stack);
        this.appStartTime = null;
        this.initFinished=false;
    }

    appStart() {
        this.appStartTime = sysTime.nowMill();
        this.messageBroadcast(msgType.NODE_TRIGGER,{node:appNode.APP_START});
        if(JxLog.isNeedDebuggerByCookie()){
            JxLog.openDebuggerForApp();
            JxLog.closeDebuggerForCookie();
        }
        webStorage.clear();
    }

    getAppStartTime(){
        return this.appStartTime;
    }

    appInitFinished(){
        this.initFinished=true;
        if(OTTConfig.supportDataReport()) {
            if(DataReport.isNeedReportBeforeAppStop()){
                DataReport.appStop(); //结束日志
            }
            DataReport.setAppBeginTimeForStopReport();
            DataReport.setAppEndTimeForStopReport();
        }
        DataReport.appStart();
    }

    isInitFinished(){
        return this.initFinished;
    }

    /* 消息广播
     * type 消息类型
     * message 消息内容
     * */
    messageBroadcast(type,message){

    }

    appInit() {
        if(OTT.isAndroid()) {   //底层回调
            window.onBesTVEvent = function onBesTVEvent(param) {
                PlayerControllerStatic.getInstance().onBesTVEvent(param);
            }
            JxLog.i ([LogType.PLAY], "Abstract/app/AbstractMain/appInit", ["Play function init finished"]);
        }else{
            JxLog.e ([LogType.PLAY], "Abstract/app/AbstractMain/appInit", ["No android platform，no play function"]);
        }
    }



    /* 应用退出
    */
    appExit() {
        DataReport.appStop();
    }

    appOnStop() {}

    appOnStart() {}


    /* 页面跳转函数
     * @sceneId 需要跳转到的页面ID
     * @param 跳转页面传参，如： param[sceneIds.PLAYER_SCENE_ID],param[sceneIds.SCREEN_SCENE_ID],
     * 可以传多个页面参数，主键为页面ID
     * @maskSceneIds 蒙层页面ID集合，依次为顶部、底部、浮层1、浮层2、...
     * @hideSceneIds 需要隐藏的页面ID集合
     * @animationModel 页面跳转动画类型
     * */
    switchScene(sceneId,param=[],maskSceneIds=[],hideSceneIds=[],animationModel=null){
        let result = this.Nav.switchScene(sceneId,param,maskSceneIds,hideSceneIds,animationModel);
        return result;
    }

    /* 获取指定的一条导航记录
     * @flag 表示导航记录的位置 1 表示顶层最新的一个
     * */
    getTheNavHistory(flag){
        let result = this.Nav.getTheNavHistory(flag);
        return result;
    }

    getSceneById(id=null){
        let result = this.Nav.getSceneById(id);
        return result;
    }
}

export default {
    AbstractMain
}
