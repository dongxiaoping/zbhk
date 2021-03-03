import {OTT} from '../../common/OttMiddle';
import DataAccess from "../../common/DataAccess";
import PlayerDataAccess from "../../common/PlayerDataAccess";
import NavManage from "../../common/app.nav";
import StackManage from "../../common/app.stack";
import {AbstractMain} from "../../Abstract/app/AbstractMain";
import {PlayerControllerStatic} from '../../common/OttPlayer';
import {appSetLastUrl, appStartApp} from "../../common/CommonUtils";
import {localPersistentStorage} from "../../common/LocalPersistentStorage";
import modelManage from "./ModelManage";
import ChannelPay from "./ChannelPay";
import JxLog from "../../common/Log";
import {sceneIds, scenesMap} from "./AppGlobal";
import {playManage} from "./PlayManage";
import lazyLoadData from "./LazyLoadData";
import {EventManage} from "./app.event";

class AppMain extends AbstractMain{
    constructor() {
        super(scenesMap,NavManage,StackManage);
        this.showTimer = null; //页面定时消失定时器
    }

    //应用启动入口
    appStart() {
        super.appStart();
        window.Event = new EventManage();
        this.appInit();
    }

    //应用初始化
    appInit(){
        super.appInit();
        this.switchScene(sceneIds.LOADING_SCENE_ID);
        appSetLastUrl();
    }

    //应用初始化完毕回调入口
    appInitFinished() {
        super.appInitFinished();
        modelManage.switchSceneByMode();
        lazyLoadData.start();
    }

    /* 应用退出（点击退出按钮，按Home键）需要做的事情：
    1. 停止播放；
    2. 上报最后一次播放的直播信息；（用于下次进入应用，如果有最后一次直播信息，则播放最后一次直播频道）
    3. 调用中间件的App.exit退出应用。
    */
    appExit() {
        super.appExit();
        DataAccess.uploadLastLiveInfoToServer(PlayerDataAccess.mLastLiveInfo);
        playManage.stopPlay();
        PlayerControllerStatic.getInstance().notifyLiveStatus(false);
        OTT.App.exit(true);
    }

    //onStop回调：只记录播放信息并关闭播放器，不退出应用
    appOnStop() {
        localPersistentStorage.saveRestoreInfoToCookie();
        playManage.stopPlay();
    }

    //onStart回调：若回调onStop的时候是在播放，则继续播放；若回调onStop的时候是没有播放（在封套），则不用处理；
    appOnStart() {
        let playInfo = localPersistentStorage.getRestoreInfoFromCookie();
        if(playInfo) {
            playManage.switchPlay(playInfo);
            localPersistentStorage.clearRestoreInfo();
        }
    }

    /* 直播跳转到点播，需要做的事情
        1.cookie持久化存储恢复上下文需要的信息；
        2.cookie持久化存储回看节目断点续播需要的信息;
        2.调中间件的App.startApp，调起点播播放。
    */
    appToVod(recData) {
        localPersistentStorage.saveLastSwitchHistoryToCookie();
        localPersistentStorage.setBookMarkToCookie();
        appStartApp(recData);
    }

    /* 获取某个已销毁的页面的数据记录
     * @sceneId 指定页面的ID
     * @return 返回的页面数据记录
     * */
    getDestroyScenesDataInfo(sceneId){
        return this.Nav.getDestroyScenesDataInfo(sceneId);
    }

    /* 消息广播
     * type 消息类型
     * message 消息内容
     * */
    messageBroadcast(type,message){
        this.Stack.messageBroadcast(type,message);
        playManage.receiveBroadcast(type,message);
    }

    //清除定时隐藏页面的定时器
    clearTimingHideToPlayPage(){
        let that = this;
        clearTimeout(that.showTimer);
    }

    /* 指定的秒数之后隐藏当前页面，跳转到播放页面
     * @time 毫秒为单位
     * */
    timingHideToPlayPage(time) {
        JxLog.d([], "App/app_ailive/app.main/timingHideToPlayPage",
            ["begin"]);
        this.showTimer = setTimeout(function() {
            let playScene = window.WebApp.Nav.getSceneById(sceneIds.PLAYER_SCENE_ID);
            if(!playScene){
                JxLog.e([], "App_app_ailive/app.main/timingHideToPlayPage",
                    ["播放页面不存在，无法隐藏当前页面"]);
                return;
            }
            let navHistory = window.WebApp.Nav.getTheNavHistory(1);
            let topId = navHistory.id;
            if(ChannelPay.isNeedPay) {       //正在播放的视频流为付费节目：指定的秒数之后自动跳转到屏显+海报提示+播放页面
                if(topId !== sceneIds.SCREEN_SCENE_ID) {
                    ChannelPay.processAutoToScreen(playScene);
                }
            } else {        //正在播放的视频流为非付费节目：指定的秒数之后自动跳转到播放页
                let hidList = navHistory.hideSceneIds;
                hidList.push(topId);
                window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID, null, null,hidList);
            }
        }, time);
        JxLog.d([], "App/app_ailive/app.main/timingHideToPlayPage",
            ["end"]);
    }

    getNowPlayInfo(){
        return playManage.getNowPlayInfo();
    }

    //根据channelCode播放：1.数字键选台；2.语音某一频道播放
    playByChannelCode(channelCode) {
        return playManage.playByChannelCode(channelCode);
    }
}

export const App = new AppMain();
export default App