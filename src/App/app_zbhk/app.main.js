import {OTT} from '../../common/OttMiddle';
import DataAccess from "../../common/DataAccess";
import PlayerDataAccess from "../../common/PlayerDataAccess";
import NavManage from "../../common/app.nav";
import StackManage from "../../common/app.stack";
import {AbstractMain} from "../../Abstract/app/AbstractMain";
import JxLog from "../../common/Log";
import {PlayerControllerStatic} from "../../common/OttPlayer";
import {localPersistentStorage} from "../../common/LocalPersistentStorage";
import {appSetLastUrl, channelLockPageDeal} from "../../common/CommonUtils";
import modelManage from "./ModelManage";
import {sceneIds, scenesMap} from "./AppGlobal";
import {playManage} from "./PlayManage";
import lazyLoadData from "./LazyLoadData";
import {EventManage} from "./app.event";
import {interfaceBackStatus, interfaceType, mediaType, defaultLiveCode} from "../../common/GlobalConst";
import OTTConfig from "../../common/CmsSwitch";
import {sysTime} from "../../common/TimeUtils";

class AppMain extends AbstractMain {
    constructor() {
        super(scenesMap,NavManage,StackManage);
        this.showTimer = null; //页面定时消失定时器
    }

    appStart() {
        super.appStart();
        window.Event = new EventManage();
        this.appInit();
    }

    //应用启动入口
    appInit() {
        super.appInit();
        modelManage.setModeNoInterface();
        if(!OTT.App.lifecycleIsSupported()) {   //apk不支持生命周期，才需要用url的方式恢复播放
            appSetLastUrl();
        }
        this.loading()
    }

    loading () {
        this.switchScene (sceneIds.LOADING_SCENE_ID);
        let that = this;
        let modeType = modelManage.getModeType ();
        //频道锁定
        if (interfaceType.ACTION_LIVE_CHANNEL_LOCK == modeType) {
            channelLockPageDeal ()
            DataAccess.queryChannelLauncherInfo ({
                channelCode: modelManage.getModeParam ().channelCode,
                callback: function (data, status) {
                    if (status === interfaceBackStatus.SUCCESS) {
                        try {
                            sysTime.init (data.CurrentDateTime); //对时
                            DataAccess.setChannelLockSwitch (data.Config); //根据单一频道需求设置开关
                            let modeParam = modelManage.getModeParam ()
                            if (modeParam.channelCode != data.Channel.ChannelCode) {//使前后端的频道code保持一致
                                modeParam.channelCode = data.Channel.ChannelCode
                                modelManage.setModeParam (modeParam)
                            }
                            DataAccess.setChannelInfoInLock (data); //设置单一频道数据
                            PlayerDataAccess.setInitSeekTime ();
                            modelManage.loadingDataByMode ();
                        } catch (e) {
                            JxLog.e ([], 'App/app_zbhk/app.main/loading',
                                [e.toLocaleString ()]);
                        }
                    } else {
                        let params = [];
                        params[sceneIds.ERROR_SCENE_ID] = {code: "008", describe: "频道不存在"};
                        window.WebApp.switchScene (sceneIds.ERROR_SCENE_ID, params);
                    }
                }
            });
            return;
        }
        //普通模式
        DataAccess.requestOptionData ({
            callback: function (data, status) {
                if (status === interfaceBackStatus.SUCCESS) {
                    OTTConfig.setConfig (data);
                    PlayerDataAccess.setInitSeekTime ();
                    modelManage.setModeByUrlAndSwitch ();
                    modelManage.loadingDataByMode ();
                } else {
                    let params = [];
                    params[sceneIds.ERROR_SCENE_ID] = {code: "002", describe: "requestOptionData" + "请求异常"};
                    window.WebApp.switchScene (sceneIds.ERROR_SCENE_ID, params);
                }
            }
        });
    }
    //应用初始化完毕回调入口
    appInitFinished() {
        super.appInitFinished();
        modelManage.switchSceneByMode(); //首次页面跳转
        lazyLoadData.start(); //执行延迟加载数据请求
    }

    //应用退出
    appExit() {
        super.appExit();
        JxLog.i([], "App/app_zbhk/app.main/appExit", ["call OTT.App.exit!"]);
        DataAccess.uploadLastLiveInfoToServer(PlayerDataAccess.mLastLiveInfo);
        localPersistentStorage.saveRestoreInfoToCookie();
        playManage.stopPlay();
        PlayerControllerStatic.getInstance().notifyLiveStatus(false);
        OTT.App.exit(true);
    }

    //onStop回调：只记录播放信息并关闭播放器，不退出应用
    appOnStop() {
        localPersistentStorage.saveRestoreInfoToCookie();
        playManage.stopPlay();
    }

    //onStart回调：若回调onStop的时候是在播放，则继续播放；
    //若回调onStop的时候是没有播放（在封套），则不用处理；
    appOnStart() {
        let playInfo = localPersistentStorage.getRestoreInfoFromCookie();
        if(playInfo) {
            if(playInfo.mode) {   //从单一模式下恢复上下文，还是到单一模式下播放直播
                let lockChannel = {type: mediaType.LIVE, channelCode: playInfo.channelCode, categoryCode: defaultLiveCode};
                let param = [];
                param[sceneIds.PLAYER_SCENE_ID] = lockChannel;
                window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID, param);
            } else {   //普通模式恢复上下文
                playManage.switchPlay(playInfo);
            }
            localPersistentStorage.clearRestoreInfo();
        }
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
        JxLog.d([], "App/app_zbhk/app.main/timingHideToPlayPage", ["begin"]);
        this.showTimer = setTimeout(function() {
            let playScene = window.WebApp.Nav.getSceneById(sceneIds.PLAYER_SCENE_ID);
            if(!playScene){
                JxLog.e([], "App/app_zbhk/app.main/timingHideToPlayPage",
                    ["播放页面不存在，无法隐藏当前页面"]);
                return;
            }
            let navHistory = window.WebApp.Nav.getTheNavHistory(1);
            let topId = navHistory.id;
            let hidList = navHistory.hideSceneIds;
            hidList.push(topId);
            window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID, null, null,hidList);
        }, time);
        JxLog.d([], "App/app_zbhk/app.main/timingHideToPlayPage", ["end"]);
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