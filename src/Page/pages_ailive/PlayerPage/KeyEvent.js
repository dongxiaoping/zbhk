import { AbstractKeyEvent } from "../../../Abstract/scene/AbstractKeyEvent"
import {KeyCode} from "../../../common/FocusModule"
import OTT from "../../../common/OttMiddle"
import OTTConfig from "../../../common/CmsSwitch"
import {processNotExistTips, hiddenNotExistTips, showChannelPayTips, hiddenChannelPayTips} from "../../../common/CommonUtils"
import {PlayerControllerStatic} from "../../../common/OttPlayer"
import lazyLoadData from "../../../App/app_ailive/LazyLoadData"
import {keyUpDownOperation, mediaType, msgType, playerResponse,eventType, laterShowType} from "../../../common/GlobalConst"
import { sceneIds } from "../../../App/app_ailive/AppGlobal.js";
import PlayerDataAccess from "../../../common/PlayerDataAccess"
import ChannelPay from "../../../App/app_ailive/ChannelPay"
import JxLog from "../../../common/Log"
import {keyOpTipForLive,keyOpTipForLookBack} from "../../../App/app_ailive/app.component"
import DataAccess from "../../../common/DataAccess";
import {sysTime} from '../../../common/TimeUtils.js'
import {focusManage} from "./Focus"
import {model} from "./Model"
import {view} from "./View"
import {playManage} from "../../../App/app_ailive/PlayManage"

class KeyEvent extends AbstractKeyEvent {
    constructor() {
        super(focusManage);
    }

    //全屏播放时候的按键响应
    onKeyEvent(keyType, keyCode) {
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
                if(!(keyType===eventType.CLICK)){
                    return;
                }
                this.okResponse(playInfo);
                break;
            case KeyCode.KEY_UP:
            case KeyCode.KEY_DOWN:
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
        keyOpTipForLookBack.hide();
        keyOpTipForLive.hide();
        //hiddenNotExistTips();     //对于切换到节目最新、最老一集的节目，给出的提示，再次按按键时候，隐藏该提示
    }

    //back键呼出退出面板
    backResponse(playInfo) {
        let backParams = [];
        backParams[sceneIds.EXIT_SCENE_ID] = playInfo.type;
        window.WebApp.switchScene(sceneIds.EXIT_SCENE_ID, backParams, [null, null, sceneIds.PLAYER_SCENE_ID]);
    }

    //ok键响应
    // 1. 直播：呼出直播迷你菜单，并定位到正在播放的频道；
    // 2. 回看或精选：暂停，并呼出播控条
    okResponse(playInfo) {
        if (!playInfo) {
            return;
        }
        if (playInfo.type == mediaType.LIVE) { //直播
            this.processLiveShowMenu(playInfo);
        } else {
            let params = [];
            params[sceneIds.SEEK_SCENE_ID] = {playInfo: playInfo};
            window.WebApp.switchScene(sceneIds.SEEK_SCENE_ID, params, [null,null,sceneIds.PLAYER_SCENE_ID]);
            let state = OTT.MediaPlayer.getPlayState();
            if(state == PlayerControllerStatic.BE_MEDIA_PLAYER_PLAY) {
                PlayerControllerStatic.getInstance().pausePlay();
            }
        }
    }

    //上下键：直播和回看节目根据不同的配置，各自有不同的交互
    upDownResponse(playInfo, keyCode) {
        if(playInfo.type == mediaType.LIVE) {
            let supportUDC = OTTConfig.supportUDC();
            if(supportUDC == keyUpDownOperation.SWITCH_CHANNEL_PROGRAM_ADD || supportUDC == keyUpDownOperation.SWITCH_CHANNEL_PROGRAM_SUB) {
                this.processLiveSwitchChannel(keyCode, supportUDC);
            } else if(supportUDC == keyUpDownOperation.SHOW_MENU) {
                this.processLiveShowMenu(playInfo);
            }
        } else {
            let supportSchUDC = OTTConfig.supportSchUDC();
            if(supportSchUDC == keyUpDownOperation.SWITCH_CHANNEL_PROGRAM_ADD) {
                this.processSchSwitchProgram(playInfo, keyCode);
            } else if(supportSchUDC == keyUpDownOperation.SHOW_MENU) {
                this.processSchShowMenu(playInfo, keyCode);
            }
        }
    }

    //menu菜单按键的响应
    //直播：打开了节目单的开关，到频道节目单页面
    //精选：到精选分类大菜单页面；回看：到频道节目单大菜单页面（等同于向上键）
    menuResponse(playInfo){
        if(playInfo.type == mediaType.LIVE) {
            if(OTTConfig.showLiveReviewList()) {
                this.processLiveShowProgram(playInfo);
            }
        } else {
            this.processSchShowMenu(playInfo, KeyCode.KEY_UP);
        }
    }

    //直播节目上下键切台
    processLiveSwitchChannel(keyCode, supportUDC) {
        ChannelPay.laterShowSceneType = laterShowType.SCREEN_SCENE;
        let newPlayInfo = {};
        if(supportUDC == keyUpDownOperation.SWITCH_CHANNEL_PROGRAM_ADD) {  //上键减频道，下键加频道
            newPlayInfo = keyCode == KeyCode.KEY_UP ? PlayerDataAccess.getPrevChannel() : PlayerDataAccess.getNextChannel();
        } else if(supportUDC == keyUpDownOperation.SWITCH_CHANNEL_PROGRAM_SUB) {  //上键加频道，下键减频道
            newPlayInfo = keyCode == KeyCode.KEY_UP ? PlayerDataAccess.getNextChannel() : PlayerDataAccess.getPrevChannel();
        }
        playManage.switchPlay(newPlayInfo);
    }

    //（1）ok键呼出迷你菜单； （2）直播上下键切台功能关闭时候，上下键呼出菜单
    processLiveShowMenu(playInfo) {
        let params = [];
        if(lazyLoadData.isPageLazyLoadRightForShow(sceneIds.CHANNEL_MINI_SCENE_ID)){
            params[sceneIds.CHANNEL_MINI_SCENE_ID] = {"categoryCode":playInfo.categoryCode,"channelCode":playInfo.channelCode};
            window.WebApp.switchScene(sceneIds.CHANNEL_MINI_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
        }else{
            window.Loading.showPageLoadingCircle(()=>{
                JxLog.i([], "Page/pages_ailive/PlayerPage/processLiveShowMenu", ["加载中"]);
            });
        }
    }

    //（1）直播菜单键呼出频道节目单；（2）直播时移开关关闭时候，右键呼出频道节目单
    processLiveShowProgram(playInfo) {
        let param = [];
        param[sceneIds.CHANNEL_PROGRAM_SCENE_ID] = playInfo;
        window.WebApp.switchScene(sceneIds.CHANNEL_PROGRAM_SCENE_ID, param, [null, null, sceneIds.PLAYER_SCENE_ID]);
    }

    //回看节目上下键切换节目
    processSchSwitchProgram(playInfo, keyCode) {
        let newPlayInfo = {};
        let upDownParams = [];
        if(playInfo.type == mediaType.JX) {   //精选
            if (keyCode == KeyCode.KEY_UP) {
                newPlayInfo = PlayerDataAccess.getPrevSchProgram(playInfo.categoryCode, playInfo.scheduleCode, false);
                if(!newPlayInfo) {
                    processNotExistTips("该节目已经是最早一集！");
                    return;
                }
            } else {
                newPlayInfo = PlayerDataAccess.getNextSchProgram(playInfo.categoryCode, playInfo.scheduleCode, false);
                if(!newPlayInfo) {
                    processNotExistTips("该节目已经是最新一集！");
                    return;
                }
            }
            newPlayInfo.type = playInfo.type;
            playManage.switchPlay(newPlayInfo);
            upDownParams[sceneIds.JX_SERIES_SCENE_ID] = newPlayInfo;
            window.WebApp.switchScene(sceneIds.JX_SERIES_SCENE_ID, upDownParams, [null, null, sceneIds.PLAYER_SCENE_ID]);
        } else if(playInfo.type == mediaType.SCH){     //回看(回看下键切换，可能切换到直播)
            if (keyCode == KeyCode.KEY_UP) {
                newPlayInfo = PlayerDataAccess.getPrevReviewProgram(playInfo);
                let startDate = newPlayInfo.startTime;
                let startDataFmt = startDate.substr(0, 4)+"-"+startDate.substr(4, 2)+"-"+startDate.substr(6, 2);
                let allSchDate = DataAccess.getProgramShowDate();
                if(startDataFmt < allSchDate[0]) {
                    processNotExistTips("该节目已经是该频道回看节目单中最早一集！");
                    return;
                }
            } else {
                newPlayInfo = PlayerDataAccess.getNextReviewProgram(playInfo);
            }
            if(newPlayInfo.type == mediaType.LIVE) {
                ChannelPay.laterShowSceneType = laterShowType.SCREEN_SCENE;
                playManage.switchPlay(newPlayInfo);
            } else {
                playManage.switchPlay(newPlayInfo)
                upDownParams[sceneIds.SCH_PROGRAM_SCENE_ID] = newPlayInfo;
                window.WebApp.switchScene(sceneIds.SCH_PROGRAM_SCENE_ID, upDownParams, [null, null, sceneIds.PLAYER_SCENE_ID]);
            }
        }
    }

    //上键：精选呼出精选分类大菜单；回看呼出频道节目单大菜单
    //下键：精选呼出剧集列表；回看呼出节目列表
    processSchShowMenu(playInfo, keyCode) {
        if(keyCode === KeyCode.KEY_UP) {
            if (playInfo.type === mediaType.JX) { //精选分类大菜单
                let categoryCode = playInfo.categoryCode;
                let scheduleCode = playInfo.scheduleCode;
                let programInfo = DataAccess.getProgramInfoByCategoryAndScheduleCode(categoryCode,scheduleCode);
                if(programInfo===null){
                    window.WebApp.switchScene(sceneIds.JX_CATEGORY_SCENE_ID, null, [null, null, sceneIds.PLAYER_SCENE_ID]);
                }else{
                    let programName = programInfo.keyname;
                    let params = [];
                    params[sceneIds.JX_CATEGORY_SCENE_ID] =  {categoryCode:categoryCode,programName:programName};
                    window.WebApp.switchScene(sceneIds.JX_CATEGORY_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
                }
            } else { //回看频道节目单大菜单
                let params = [];
                params[sceneIds.CHANNEL_PROGRAM_SCENE_ID] = playInfo;
                window.WebApp.switchScene(sceneIds.CHANNEL_PROGRAM_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
            }
        } else if(keyCode === KeyCode.KEY_DOWN) {
            let params = [];
            if (playInfo.type === mediaType.JX) { //精选剧集列表
                params[sceneIds.JX_SERIES_SCENE_ID] = playInfo;
                window.WebApp.switchScene(sceneIds.JX_SERIES_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
            } else {   //回看节目列表
                params[sceneIds.SCH_PROGRAM_SCENE_ID] = playInfo;
                window.WebApp.switchScene(sceneIds.SCH_PROGRAM_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
            }
        }
    }

    //左右键
    //直播：有直播时移，呼出直播时移页面；没有直播时移，右键呼频道节目单页面
    //精选或回看：呼出播控页面
    leftRightResponse(playInfo, keyCode, keyType) {
        let leftRightParams = [];
        if (playInfo.type == mediaType.LIVE) { //直播，且打开了直播时移功能开关(click操作的时候不响应first_down,否则在呼出播控页面的同时，会快进或快退一次)
            if(keyCode == KeyCode.KEY_RIGHT) { //右键呼出节目单，不管时移开关是否打开
                if(!(keyType===eventType.FIRST_DOWN)) { //播放页右键呼出菜单，只响应first_down
                    return;
                }
                if(OTTConfig.showLiveReviewList()) {
                    this.processLiveShowProgram(playInfo);
                }
            } else if(keyCode == KeyCode.KEY_LEFT) { //左键：只响应时移开关打开的情况，呼出进度条
                if(!(keyType===eventType.CLICK||keyType===eventType.HOLD_BEGIN||
                    keyType===eventType.HOLDING||keyType===eventType.HOLD_END)){
                    return;
                }
                if (OTTConfig.supportLiveSeek()) {
                    let param = {playInfo:playInfo, keyEvent:{type: keyType, keyCode: keyCode}};
                    leftRightParams[sceneIds.LIVE_SEEK_SCENE_ID] = param;
                    window.WebApp.switchScene(sceneIds.LIVE_SEEK_SCENE_ID, leftRightParams, [null, null, sceneIds.PLAYER_SCENE_ID]);
                }
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
        ChannelPay.isNeedPay = false;            //开始播放的时候，把需要付费标识置为false
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

    //播放结束时通知上层：直播-不用干预，直播流继续播放；回看、精选-播放下一节目
    onPlayerStoped: function() {
        let playInfo = window.WebApp.getNowPlayInfo();
        let newPlayInfo = {};
        let nextParams = [];
        if(playInfo.type == mediaType.JX) {   //精选:播放+精选小菜单
            newPlayInfo = PlayerDataAccess.getNextSchProgram(playInfo.categoryCode, playInfo.scheduleCode);
            newPlayInfo.type = playInfo.type;
            let params = [];
            params[sceneIds.PLAYER_SCENE_ID] = newPlayInfo;
            window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID, params);
            nextParams[sceneIds.JX_SERIES_SCENE_ID] = newPlayInfo;
            window.WebApp.switchScene(sceneIds.JX_SERIES_SCENE_ID, nextParams, [null, null, sceneIds.PLAYER_SCENE_ID]);
        } else if(playInfo.type == mediaType.SCH){ //回看：回看+回看一天的节目单
            newPlayInfo = PlayerDataAccess.getNextReviewProgram(playInfo);
            if(newPlayInfo.type == mediaType.LIVE) {   //回看顺播到直播
                ChannelPay.laterShowSceneType = laterShowType.SCREEN_SCENE;
                playManage.switchPlay(newPlayInfo);
            } else if(newPlayInfo.type == mediaType.SCH ) {    //回看顺播到回看
                playManage.switchPlay(newPlayInfo,false);
                nextParams[sceneIds.SCH_PROGRAM_SCENE_ID] = newPlayInfo;
                window.WebApp.switchScene(sceneIds.SCH_PROGRAM_SCENE_ID, nextParams, [null, null, sceneIds.PLAYER_SCENE_ID]);
            }
        }

    },
    //播放出错时候的回调：给出节目不能播放的提示，并呼出菜单
    onPlayerError: function(msg) {

    },

    //鉴权回调处理
    onAuthPayNotify(result) {
        let playInfo = window.WebApp.getNowPlayInfo();
        if(result == PlayerControllerStatic.AUTH_RESULT_FAIL) {         //未订购鉴权失败,需要订购
            let type = playInfo.type;
            //鉴权回调：直播|回看且回看付费鉴权开关打开，把需要付费标识置为true
            if(type == mediaType.LIVE || (type == mediaType.SCH && OTTConfig.reviewProgramPay())) {
                showChannelPayTips();
                ChannelPay.isNeedPay = true;
            } else {
                hiddenChannelPayTips();
            }
        } else {
            hiddenChannelPayTips();
        }
        ChannelPay.processLaterShowPage(playInfo, ChannelPay.isNeedPay);
    },

    //订购回调处理
    onOrderNotify(result) {
        let playInfo = window.WebApp.getNowPlayInfo();
        if(result == PlayerControllerStatic.ORDER_RESULT_SUCCESS) {        //订购成功(去掉遮罩;更新屏显页面按钮情况,所以屏显页面会闪一下)
            hiddenChannelPayTips();
            ChannelPay.isNeedPay = false;
            let params = [];
            params[sceneIds.SCREEN_SCENE_ID] = playInfo;
            window.WebApp.switchScene(sceneIds.SCREEN_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);

        }
    }
};

export const eventResponse = {};
export const keyEvent = new KeyEvent();