import { AbstractKeyEvent } from "../../../Abstract/scene/AbstractKeyEvent"
import {KeyCode} from "../../../common/FocusModule"
import {OTT} from "../../../common/OttMiddle"
import OTTConfig from "../../../common/CmsSwitch"
import {processNotExistTips, hiddenNotExistTips, showPauseIcon, hiddenPauseIcon} from "../../../common/CommonUtils"
import {PlayerControllerStatic} from "../../../common/OttPlayer"
import {
    keyUpDownOperation,
    mediaType,
    msgType,
    playerResponse,
    eventType,
    liveOkResponse,
    interfaceType,
    coverType, LogType, defaultLiveCode
} from "../../../common/GlobalConst";
import PlayerDataAccess from "../../../common/PlayerDataAccess"
import localPersistentStorage from "../../../common/LocalPersistentStorage";
import DataAccess from "../../../common/DataAccess";
import {sceneIds} from "../../../App/app_zbhk/AppGlobal.js";
import {programPlayTipBar, bookTipBar} from "../../../App/app_zbhk/app.component";
import {focusManage} from "./Focus";
import {playManage} from "../../../App/app_zbhk/PlayManage"
import modelManage from "../../../App/app_zbhk/ModelManage";
import JxLog from "../../../common/Log"
import { sysTime } from "../../../common/TimeUtils"

class KeyEvent extends AbstractKeyEvent {
    constructor() {
        super(focusManage);
    }

    //全屏播放时候的按键响应
    onKeyEvent(keyType, keyCode) {
        if (OTTConfig.showBook() && bookTipBar.isBookTipShow()) {
            bookTipBar.clearBookTip();
            return;
        }
        let playInfo = window.WebApp.getNowPlayInfo();
        switch (keyCode) {
            case KeyCode.KEY_BACK:
            case KeyCode.KEY_BACK2:
                if(!(keyType===eventType.FIRST_DOWN)){
                    return;
                }
                this.backResponse(playInfo);
                break;
            case KeyCode.KEY_OKey:
                if(!(keyType===eventType.FIRST_DOWN)){
                    return;
                }
                try {
                    this.okResponse(playInfo);
                } catch (e) {
                    JxLog.e ([], 'Page/pages_zbhk/PlayerPage/onKeyEvent', [e.toLocaleString ()]);
                }
                break;
            case KeyCode.KEY_STAR:
                if(!(keyType===eventType.FIRST_DOWN)){
                    return;
                }
                if(OTTConfig.responseStarButton()) {
                    this.starResponse(playInfo);
                }
                break;
            case KeyCode.KEY_UP:
            case KeyCode.KEY_DOWN:
            case KeyCode.KEY_CHANNEL_ADD:
            case KeyCode.KEY_CHANNEL_SUB:
                if(!(keyType===eventType.CLICK||keyType===eventType.HOLD_END)){
                    return;
                }
                this.upDownResponse(playInfo, keyCode);
                break;
            case KeyCode.KEY_LEFT:
            case KeyCode.KEY_RIGHT:
                this.leftRightResponse(playInfo, keyCode, keyType);
                break;
            case KeyCode.KEY_MENU:
            case KeyCode.KEY_MENU2:
                if(!(keyType===eventType.FIRST_DOWN)){
                    return;
                }
                this.menuResponse(playInfo);
                break;
            case KeyCode.KEY_PREV:
            case KeyCode.KEY_NEXT:
                if(!(keyType===eventType.CLICK||keyType===eventType.HOLD_END)){
                    return;
                }
                this.prevNextLiveChannel(keyCode);
                break;
            default:
        }
        hiddenNotExistTips();     //对于切换到节目最新、最老一集的节目，给出的提示，再次按按键时候，隐藏该提示
    }

    //back键呼出退出页面
    backResponse(playInfo) {
        let state = OTT.MediaPlayer.getPlayState();
        if(state == PlayerControllerStatic.BE_MEDIA_PLAYER_PAUSE) {    //暂停状态：back键继续播放，隐藏暂停按钮
            PlayerControllerStatic.getInstance().resumePlay();
            hiddenPauseIcon();
        } else {
            if(OTTConfig.backResponseType() == 1) {      //back键: 开关至为1 有封套就退出到封套，无封套则退出应用(频道锁定的时候，也直接退出应用)
                if(OTTConfig.showEnvelopeFlag() && modelManage.getModeType() != interfaceType.ACTION_LIVE_CHANNEL_LOCK) {
                    localPersistentStorage.saveRestoreInfoToCookie();
                    playManage.stopPlay();
                    let param = [];
                    if(playManage.fromCover) {
                        param[playManage.fromCover] = playInfo;
                        window.WebApp.switchScene(playManage.fromCover, param);
                    } else {
                        let pageID = OTTConfig.showEnvelopeFlag() == coverType.CHANNEL_LIST ? sceneIds.COVER_ID : sceneIds.COVER_IMAGE_ID;
                        param[pageID] = playInfo;
                        window.WebApp.switchScene(pageID, param);
                    }
                } else {
                    window.WebApp.appExit();
                }
            } else {   //back键：开关值为0，呼出退出界面
                let backParams = [];
                backParams[sceneIds.EXIT_SCENE_ID] = playInfo;
                window.WebApp.switchScene(sceneIds.EXIT_SCENE_ID, backParams, [null, null, sceneIds.PLAYER_SCENE_ID]);
            }
        }
    }

    //ok键呼出频道节目单页面
    okResponse(playInfo) {
        if(playInfo.type == mediaType.SCH) {
            this.schOkResponse();
        } else {   //直播ok键的响应：回看节目单或直播频道单
            let channelInfo = DataAccess.getChannelInfo(playInfo.channelCode);
            if(modelManage.getModeType() == interfaceType.ACTION_LIVE_CHANNEL_LOCK && !channelInfo.ShowProgram) {
                JxLog.i([LogType.PAGE], "Page/pages_zbhk/PlayerPage/KeyEvent/okResponse",
                    ["单一模式且屏蔽回看，OK不响应"]);
                return;
            }
            let okType = OTTConfig.okResponseType();
            if((okType == liveOkResponse.PROGRAM_LIST || okType == liveOkResponse.PROGRAM_FOCUS_CHANNEL) || modelManage.getModeType() == interfaceType.ACTION_LIVE_CHANNEL_LOCK) {
                let params = [];
                params[sceneIds.CHANNEL_PLAY_MENU_ID] = {"categoryCode":null,"channelCode":null};
                window.WebApp.switchScene(sceneIds.CHANNEL_PLAY_MENU_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
            } else if(okType == liveOkResponse.CATEGORY_LIST) {
                let params = [];
                params[sceneIds.CATEGORY_PLAY_MENU_ID] = {"categoryCode":playInfo.categoryCode, "channelCode":playInfo.channelCode};
                window.WebApp.switchScene(sceneIds.CATEGORY_PLAY_MENU_ID,params, [null,null,sceneIds.PLAYER_SCENE_ID]);
            }
        }
    }

    //*键呼出频道节目单
    starResponse() {
        let params = [];
        params[sceneIds.CHANNEL_PLAY_MENU_ID] = {"categoryCode":null,"channelCode":null};
        window.WebApp.switchScene(sceneIds.CHANNEL_PLAY_MENU_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
    }

    //回看(全屏播放的时候，OK键呼出菜单并暂停)
    schOkResponse() {
        let params = [];
        params[sceneIds.CHANNEL_PLAY_MENU_ID] = {"categoryCode":null,"channelCode":null};
        window.WebApp.switchScene(sceneIds.CHANNEL_PLAY_MENU_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
        let state = OTT.MediaPlayer.getPlayState();
        if(state == PlayerControllerStatic.BE_MEDIA_PLAYER_PLAY) {
            PlayerControllerStatic.getInstance().pausePlay();
            showPauseIcon();
            programPlayTipBar.hidden();
        }
    }

    //上下键：直播和回看节目根据不同的配置，各自有不同的交互
    upDownResponse(playInfo, keyCode) {
        hiddenPauseIcon();
        if(playInfo.type == mediaType.LIVE) {
            let supportUDC = OTTConfig.supportUDC();
            if(keyCode===KeyCode.KEY_CHANNEL_ADD || keyCode===KeyCode.KEY_CHANNEL_SUB || supportUDC === keyUpDownOperation.SWITCH_CHANNEL_PROGRAM_ADD || supportUDC === keyUpDownOperation.SWITCH_CHANNEL_PROGRAM_SUB) {
                if(modelManage.getModeType() == interfaceType.ACTION_LIVE_CHANNEL_LOCK) {
                    JxLog.i([LogType.PAGE], "Page/pages_zbhk/PlayerPage/KeyEvent/upDownResponse",
                        ["单一模式上下键切台不响应！"]);
                    return;
                }
                this.processLiveSwitchChannel(keyCode, supportUDC);
            } else if(supportUDC == keyUpDownOperation.SHOW_MENU) {
                this.processLiveShowMenu();
            }
        } else if(playInfo.type == mediaType.SCH) {
            if(keyCode===KeyCode.KEY_CHANNEL_ADD || keyCode===KeyCode.KEY_CHANNEL_SUB){
                return;
            }
            let supportSchUDC = OTTConfig.supportSchUDC();
            if(supportSchUDC == keyUpDownOperation.SWITCH_CHANNEL_PROGRAM_ADD) {
                this.processSchSwitchProgram(playInfo, keyCode);
            } else if(supportSchUDC == keyUpDownOperation.SHOW_MENU) {
                this.processSchShowMenu();
            }
        }
    }

    //menu菜单按键的响应
    //直播：打开了节目单的开关，到频道节目单页面
    //回看：到频道节目单大菜单页面（等同于向上键）
    menuResponse(playInfo){
        if(playInfo.type == mediaType.LIVE) {
            if(OTTConfig.showLiveReviewList()) {
                this.processLiveShowMenu();
            }
        } else {
            this.processSchShowMenu();
        }
    }

    //直播节目上下键切台
    processLiveSwitchChannel(keyCode, supportUDC) {
        let newPlayInfo = {};
        if(keyCode===KeyCode.KEY_CHANNEL_ADD || keyCode===KeyCode.KEY_CHANNEL_SUB){
            newPlayInfo = keyCode === KeyCode.KEY_CHANNEL_SUB ? PlayerDataAccess.getPrevChannel() : PlayerDataAccess.getNextChannel();
        }else{
            if(supportUDC == keyUpDownOperation.SWITCH_CHANNEL_PROGRAM_ADD) {  //上键减频道，下键加频道
                newPlayInfo = keyCode == KeyCode.KEY_UP ? PlayerDataAccess.getPrevChannel() : PlayerDataAccess.getNextChannel();
            } else if(supportUDC == keyUpDownOperation.SWITCH_CHANNEL_PROGRAM_SUB) {  //上键加频道，下键减频道
                newPlayInfo = keyCode == KeyCode.KEY_UP ? PlayerDataAccess.getNextChannel() : PlayerDataAccess.getPrevChannel();
            }
        }
        playManage.switchPlay(newPlayInfo);
    }

    //（1）ok键呼出菜单； （2）直播上下键切台功能关闭时候，上下键呼出菜单
    //（3）直播菜单键呼出菜单频道节目单；（4）直播时移开关关闭时候，右键呼出菜单
    processLiveShowMenu() {
        let param = [];
        param[sceneIds.CHANNEL_PLAY_MENU_ID] =  {"categoryCode":null,"channelCode":null};
        window.WebApp.switchScene(sceneIds.CHANNEL_PLAY_MENU_ID, param, [null, null, sceneIds.PLAYER_SCENE_ID]);
    }

    //回看节目上下键切换节目
    processSchSwitchProgram(playInfo, keyCode) {
        let newPlayInfo = {};
        let upDownParams = [];
        if (keyCode == KeyCode.KEY_UP) {
            newPlayInfo = PlayerDataAccess.getPrevReviewProgram(playInfo);
            let startDate = newPlayInfo.startTime;
            let startDataFmt = startDate.substr(0, 4)+"-"+startDate.substr(4, 2)+"-"+startDate.substr(6, 2);
            let allSchDate = DataAccess.getProgramShowDate();
            if(startDataFmt < allSchDate[0]) {
                processNotExistTips("该节目已经是该频道回看节目单中最早一集！");
                return;
            }
            if(startDate>sysTime.nowFormat()) {  //今天第一个回看节目再向上切节目，播放该频道直播节目
                newPlayInfo = {categoryCode: defaultLiveCode, type: mediaType.LIVE, channelCode: playInfo.channelCode};
            }
        } else {
            newPlayInfo = PlayerDataAccess.getNextReviewProgram(playInfo);
        }
        upDownParams[sceneIds.PLAYER_SCENE_ID] = newPlayInfo;
        window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID, upDownParams);
    }

    //回看节目上下键呼出频道节目单
    processSchShowMenu() {
        let state = OTT.MediaPlayer.getPlayState();
        if (state == PlayerControllerStatic.BE_MEDIA_PLAYER_PAUSE) {
            showPauseIcon();
        }
        let params = [];
        params[sceneIds.CHANNEL_PLAY_MENU_ID] =  {"categoryCode":null,"channelCode":null};
        window.WebApp.switchScene(sceneIds.CHANNEL_PLAY_MENU_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
    }

    //左右键
    //直播：有直播时移，呼出直播时移页面；没有直播时移，右键呼频道节目单页面
    //回看：呼出播控页面
    leftRightResponse(playInfo, keyCode, keyType) {
        hiddenPauseIcon();
        let leftRightParams = [];
        if (playInfo.type == mediaType.LIVE) { //直播，且打开了直播时移功能开关(click操作的时候不响应first_down,否则在呼出播控页面的同时，会快进或快退一次)
            if (OTTConfig.supportLiveSeek()) {   //时移开关打开：呼出进度条
                if(!(keyType===eventType.CLICK||keyType===eventType.HOLD_BEGIN||
                    keyType===eventType.HOLDING||keyType===eventType.HOLD_END)){
                    return;
                }
                let param = {playInfo:playInfo, keyEvent:{type: keyType, keyCode: keyCode}};
                leftRightParams[sceneIds.LIVE_SEEK_SCENE_ID] = param;
                window.WebApp.switchScene(sceneIds.LIVE_SEEK_SCENE_ID, leftRightParams, [null, null, sceneIds.PLAYER_SCENE_ID]);
            } else {      //时移开关关闭：呼出菜单？
                if(!(keyType===eventType.FIRST_DOWN)) { //只响应first_down
                    return;
                }
                this.processLiveShowMenu();
            }
        } else { //回看(click操作的时候不响应first_down,否则在呼出播控页面的同时，会快进或快退一次)
            if(!(keyType===eventType.CLICK||keyType===eventType.HOLD_BEGIN||
                keyType===eventType.HOLDING||keyType===eventType.HOLD_END)){
                return;
            }
            let param = {playInfo:playInfo, keyEvent:{type: keyType, keyCode: keyCode}};
            leftRightParams[sceneIds.SEEK_SCENE_ID] = param;
            window.WebApp.switchScene(sceneIds.SEEK_SCENE_ID, leftRightParams, [null, null, sceneIds.PLAYER_SCENE_ID]);
        }
    }

    //频道+、频道-的响应(同直播节目上下键切台的处理)
    prevNextLiveChannel(keyCode) {
        let newKeyCode = keyCode == KeyCode.KEY_PREV ? KeyCode.KEY_DOWN : KeyCode.KEY_DOWN;
        let supportUDC = OTTConfig.supportUDC();
        this.processLiveSwitchChannel(newKeyCode, supportUDC);
    }
}

//播放器不同参数的回调处理
export const messageListener = {
    onPauseTimer: null, //暂停的时候，mSeekCurrent每秒减1
    onPlayingTimer: null, //播放的时候，mPlayingTime每秒加1
    //播放器关闭时回调
    onPlayerClose: function(arg) {},
    //播放器连接时回调
    onPlayerConnect: function(arg) {},
    //外部调用startPlay接口即调用此回调
    onStartPlay: function() {
        //window.Loading.hiddenLoading();
        let msg = {state: playerResponse.PLAYER_START_PLAY};
        window.WebApp.messageBroadcast(msgType.PLAYER_STATE, msg);
    },
    //外部调用stopPlay接口即调用此回调
    onStopPlay: function() {
        let msg = { state: playerResponse.PLAYER_STOP };
        window.WebApp.messageBroadcast(msgType.PLAYER_STATE, msg);
    },

    //外部调用startPlay接口后，开始调用auth接口获取播放地址时，调用此接口通知外部
    onPlayerLoadingBegin: function() {

    },
    /*
     外部调用startPlay接口后，auth接口返回播放地址时，调用此接口通知外部
     status : 0 播放地址正常,1 播放地址异常
     message: status==0 为 "",status==-1 为 错误信息
     */
    onPlayerLoadingEnd: function(status, message) {
        let msg = { state: playerResponse.PLAYER_LOAD_END, status: status, tipInfo: message};
        window.WebApp.messageBroadcast(msgType.PLAYER_STATE, msg);
    },
    /** 正在播放时的回调：进度更新，直播根据时间显示右下角下一节目提示及直播隔断
     * * 播放器正常播放时，播放器底层回调以本接口回调给上层
     * @param current   当前播放进度
     * @param total     总的播放时长
     **/
    onPlayerPlaying: function(current, total) {
        let msg = { state: playerResponse.PLAYER_PLAYING, current: current, total: total };
        window.WebApp.messageBroadcast(msgType.PLAYER_STATE, msg);
    },

    //buffering时回调：显示加载-显示提示ok键显示菜单
    onPlayerBuffering: function(arg) {
        let msg = { state: playerResponse.PLAYER_BUFFERING};
        window.WebApp.messageBroadcast(msgType.PLAYER_STATE, msg);
    },

    //播放暂停回调：直播-显示暂停按钮和快进快退进度条；回看-显示暂停按钮及菜单
    onPlayerPaused: function() {
        let msg = { state: playerResponse.PLAYER_PAUSED };
        window.WebApp.messageBroadcast(msgType.PLAYER_STATE, msg);
    },

    //继续播放回调
    onPlayerResumed: function() {
        let msg = { state: playerResponse.PLAYER_RESUMED };
        window.WebApp.messageBroadcast(msgType.PLAYER_STATE, msg);
    },

    //快进快退时的回调:更新进度条view
    onPlayerSeekingUpdateView: function(forward) {
        let msg = { state: playerResponse.PLAYER_SEEKING_VIEW, direction: forward};
        window.WebApp.messageBroadcast(msgType.PLAYER_STATE, msg);
    },

    //快进快退时的回调:更新进度条data
    onPlayerSeekingUpdateData: function (seekCurrent, playingTotal) {
        let msg = { state: playerResponse.PLAYER_SEEKING_DATA, seekCurrent: seekCurrent, playingTotal: playingTotal};
        window.WebApp.messageBroadcast(msgType.PLAYER_STATE, msg);
    },

    //播放结束时通知上层：直播-不用干预，直播流继续播放；回看-播放下一节目
    onPlayerStoped: function() {
        let playInfo = window.WebApp.getNowPlayInfo();
        if(playInfo.type == mediaType.SCH) {   //回看节目续播一天的节目单
            let newPlayInfo = PlayerDataAccess.getNextReviewProgram(playInfo);
            if(newPlayInfo.type == mediaType.LIVE) {   //回看顺播到直播
                playManage.switchPlay(newPlayInfo);
            } else if(newPlayInfo.type == mediaType.SCH) {    //回看顺播到回看
                let params = [];
                params[sceneIds.PLAYER_SCENE_ID] = newPlayInfo;
                window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID, params);
                let nextParams = [];
                nextParams[sceneIds.CHANNEL_PLAY_MENU_ID] = {"categoryCode":null,"channelCode":null};
                window.WebApp.switchScene(sceneIds.CHANNEL_PLAY_MENU_ID, nextParams, [null, null, sceneIds.PLAYER_SCENE_ID]);
            }
        }
    },
    //播放出错时候的回调：给出节目不能播放的提示，并呼出菜单
    onPlayerError: function(msg) {

    },

    //鉴权回调处理
    onAuthPayNotify(result) {

    },

    //订购回调处理
    onOrderNotify(result) {

    }
};

export const eventResponse = {};
export const keyEvent = new KeyEvent();