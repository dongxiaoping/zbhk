import OTT from './OttMiddle'
import OTTConfig from './CmsSwitch'
import {KeyCode} from "./FocusModule"
import {sysTime } from "./TimeUtils"
import PlayerDataAccess from  "./PlayerDataAccess"
import {eventType, LogType} from "./GlobalConst"
import {DataReportModel} from "./DataReport";
import {addUrlParam, modUrlParam, getUrlParam} from "./CommonUtils";
import JxLog from "./Log"
let MediaPlayer = window.MediaPlayer;
let BestvAuth  = window.BestvAuth;

OTT.MediaPlayer = OTT.MediaPlayer || {};
OTT.MediaPlayer.setPlayUrl = function (url, header) {
    if (typeof (MediaPlayer) != "undefined") {
        if (typeof (header) != "undefined") {
            MediaPlayer.setPlayUrl(url, header);
        } else {
            MediaPlayer.setPlayUrl(url);
        }
    }
}
OTT.MediaPlayer.setPlayParams = function (parmasObj) {
    let jsonStr = JSON.stringify(parmasObj);
    let ret = -1;
    if (typeof (MediaPlayer) != "undefined" && OTTConfig.SupportMultiCDN()) {
        ret = MediaPlayer.setPlayParams(jsonStr);
    }
}

//开始播放
OTT.MediaPlayer.play = function () {
    if (typeof (MediaPlayer) != "undefined") {
        MediaPlayer.play();
    }
}

OTT.MediaPlayer.pause = function () {
    if (typeof (MediaPlayer) != "undefined") {
        MediaPlayer.pause();
    }
}

OTT.MediaPlayer.resume = function () {
    if (typeof (MediaPlayer) != "undefined") {
        MediaPlayer.unpause();
    }
}

//结束播放
OTT.MediaPlayer.stop = function () {
    if (typeof (MediaPlayer) != "undefined") {
        MediaPlayer.stop();
    }
}

OTT.MediaPlayer.close = function () {
    if (typeof (MediaPlayer) != "undefined") {
        MediaPlayer.close();
    }
}

OTT.MediaPlayer.setFullScreen = function () {
    if (typeof (MediaPlayer) != "undefined") {
        MediaPlayer.setFullScreen();
    }
}

OTT.MediaPlayer.setMediaPlayerWin = function (x, y, w, h) {
    if (typeof (MediaPlayer) != "undefined") {
        MediaPlayer.setMediaPlayerWin(x, y, w, h);
    }
}

OTT.MediaPlayer.setSeekTime = function (time) {
    if (typeof (MediaPlayer) != "undefined") {
        MediaPlayer.setSeekTime("" + time);
    }
}

OTT.MediaPlayer.setSeekTimeEx = function (ms) {
    if (typeof (MediaPlayer) != "undefined") {
        MediaPlayer.setSeekTimeEx(ms);
    }
}

OTT.MediaPlayer.setSeekPosition = function (percent) {
    if (typeof (MediaPlayer) != "undefined") {
        MediaPlayer.setSeekPosition(percent);
    }
}

//获取播放总时间
OTT.MediaPlayer.getTotalTime = function () {
    let time = 0;
    if (typeof (MediaPlayer) != "undefined") {
        time = MediaPlayer.getTotalTime();
    }
    return time;
}

//获取当前播放时间
OTT.MediaPlayer.getCurrentTime = function () {
    let time = 0;
    if (typeof (MediaPlayer) != "undefined") {
        time = MediaPlayer.getCurrentTime();
    }
    return time;
}

OTT.MediaPlayer.getBufferPercent = function () {
    if (typeof (MediaPlayer) != "undefined") {
        return MediaPlayer.getBufferPercent();
    }
}

OTT.MediaPlayer.getPlayState = function () {
    if (typeof (MediaPlayer) != "undefined") {
        return MediaPlayer.getPlayState();
    }
}

OTT.MediaPlayer.set3DMode = function (mode) {
    if (typeof (MediaPlayer) != "undefined") {
        MediaPlayer.set3DMode(mode);
    }
}

export const PlayerParamStatic = window.PlayerParamStatic || {};
PlayerParamStatic.TYPE_VOD = "";
PlayerParamStatic.TYPE_LIVE = "2";
PlayerParamStatic.TYPE_SCH = "3";

export class PlayerParam {
    constructor(obj) {
        this.mType = obj.itemType;
        this.mItemCode = obj.itemCode;
        this.mClipCode = obj.clipCode;        //非点播节目，clipCode为ChannelCode
        this.mStartTime = obj.startTime;
        this.mEndTime = obj.endTime;
        this.mCategoryCode = obj.categoryCode;
        //为了兼容咪咕多屏播放，setPlayParams函数，必须要传递ItemInfo参数
        this.mPlayParam = {Urls: [], IsLive: false, ItemInfo: {}, Bookmark: obj.bookMark ? obj.bookMark : 0};     //播放直播，调用setPlayParams函数不能传递TimeShift参数
        this.mSeekPlayParam = {Urls: [], IsLive: true, ItemInfo: {}, TimeShift: {}};                              //直播时移的时候，调用setPlayParams函数需要传递TimeShift参数
        this.mExtendParam = JSON.stringify({channelCode: obj.clipCode});
        this.mLocalAuthKey = this.mClipCode+"_"+this.mType;
        this.mLocalSeekAuthKey = this.mClipCode+"_timeShift";
    }

    isLive() {
        if (this.mType == PlayerParamStatic.TYPE_LIVE) {
            return true;
        }
        return false;
    }

    getPlayUrl() {
        if (OTT.isAndroid()) {
            if(OTTConfig.supportCacheAuthResult()) {
                let localAuthResult = PlayerDataAccess.getAuthResultFromLocal(this.mLocalAuthKey);
                if(localAuthResult) {
                    this.processLocalAuthPlayUrl(localAuthResult);
                } else {
                    this.getPlayUrlByAuth();
                }
            } else {
                this.getPlayUrlByAuth();
            }
        }
    }

    //通过鉴权的方式获取播放地址
    getPlayUrlByAuth() {
        JxLog.i([LogType.PLAY], "common/OttPlayer/getPlayUrlByAuth",
            ["Server play auth"]);
        if (this.mType == PlayerParamStatic.TYPE_VOD) {
            BestvAuth.auth("", this.mType, this.mItemCode, this.mClipCode, "", "");
            JxLog.i ([LogType.PLAY], 'common/OttPlayer/getPlayUrlByAuth', ['Vod play auth which param is ', {
                mType: this.mType,
                mItemCode: this.mItemCode,
                mClipCode: this.mClipCode
            }]);
        } else {
            if(OTTConfig.supportChannelPay()) {
                BestvAuth.auth("", this.mType, this.mItemCode, "", "", "", this.mExtendParam);
                JxLog.i ([LogType.PLAY], 'common/OttPlayer/getPlayUrlByAuth', ['Pay play auth which param is ', {
                    mType: this.mType,
                    mItemCode: this.mItemCode,
                    mExtendParam: this.mExtendParam
                }]);
            } else {
                BestvAuth.auth("", this.mType, this.mItemCode, "", "", "");
                JxLog.i ([LogType.PLAY], 'common/OttPlayer/getPlayUrlByAuth', ['Living play auth which param is ', {
                    mType: this.mType,
                    mItemCode: this.mItemCode
                }]);
            }
        }
    }

    //不再次走鉴权流程，从本地取播放地址并播放，此函数实现auth回调handleAuthEvent的功能
    processLocalAuthPlayUrl(localAuthResult) {
        JxLog.i ([LogType.PLAY], 'common/OttPlayer/processLocalAuthPlayUrl',
            ['exec local play auth', localAuthResult]);
        if(this.mType ==  PlayerParamStatic.TYPE_LIVE && OTTConfig.supportLiveSeek()) {       //直播且支持时移,进行时移参数的设置
            this.setSeekPlayParamsFromLocal();
        }
        let playerInstance = PlayerControllerStatic.getInstance();
        if(localAuthResult instanceof Array) {
            let playParamObj = this.getMultiCDNPlayParams(localAuthResult);
            JxLog.i([LogType.PLAY], 'common/OttPlayer/processLocalAuthPlayUrl',
                ['multiple cdn, set play param and start play which param is ', playParamObj]);
            OTT.MediaPlayer.setPlayParams(playParamObj);
            DataReportModel.tplay_info.CDNFlag = playerInstance.getCdnUrlIp(localAuthResult[0]);
        } else {
            let appendUrl = this.appendPlayUrl(localAuthResult);
            JxLog.i([LogType.PLAY], 'common/OttPlayer/processLocalAuthPlayUrl',
                ['single cdn, set play param and start play which param is ', appendUrl]);
            OTT.MediaPlayer.setPlayUrl(appendUrl);
            DataReportModel.tplay_info.CDNFlag = playerInstance.getCdnUrlIp(localAuthResult);
        }
        playerInstance.setPlayingState(PlayerControllerStatic.STATE_PLAYING);
        OTT.MediaPlayer.play();
    }

    //单个播放地址：回看节目需要进行时间拼接
    appendPlayUrl(url) {
        var result = null;
        if (this.mType == PlayerParamStatic.TYPE_SCH) {     //回看、回顾
            result = OTTConfig.isSchProgramContactPlayUrl() ? this.contactSchProgramPlayUrl(url) : url;
        } else {
            result = url;
        }
        if (OTTConfig.isPlayUrlWithUserGroup()) {
            result = result + "&UserGroup=" + OTT.UserProfile.getUserGroup();
        }
        return result;
    }

    //多cdn：回看地址拼接
    getMultiCDNPlayParams(obj) {
        let result = null;
        if (this.mType == PlayerParamStatic.TYPE_SCH) {  //回看、回顾
            if (OTTConfig.isSchProgramContactPlayUrl()) {
                var that = this;
                result = [];
                obj.forEach(function (url) {
                    url = that.contactSchProgramPlayUrl(url);
                    result.push(url);
                });
            } else {
                result = obj;
            }
        } else {
            result = obj;
            this.mPlayParam.IsLive = true;
        }
        this.mPlayParam.ItemInfo = {
            playType: this.mType, itemCode: this.mItemCode, channelCode: this.mClipCode, videoClipCode: this.mClipCode,
            startDuration: this.mStartTime, endDuration: this.mEndTime, categoryCode: this.mCategoryCode};
        if (OTTConfig.isPlayUrlWithUserGroup()) {
            let userGroup = OTT.UserProfile.getUserGroup();
            let len = result.length;
            for (let i = 0; i < len; i++) {
                result[i] = result[i] + "&UserGroup=" + userGroup;
            }
        }
        this.mPlayParam.Urls = result;
             return this.mPlayParam;
    }

    setSeekPlayParamsFromLocal() {
        this.mSeekPlayParam.Urls = PlayerDataAccess.getAuthResultFromLocal(this.mLocalSeekAuthKey);
        this.mSeekPlayParam.ItemInfo = {
            playType: this.mType, itemCode: this.mItemCode, channelCode: this.mClipCode, videoClipCode: this.mClipCode,
            startDuration: this.mStartTime, endDuration: this.mEndTime, categoryCode: this.mCategoryCode
        };
    }

    setSeekPlayParamsFromAuth(param) {
        let timeShiftUrlArr = param["param4"]["playURLs"];
        let urlArray = param["param4"]["PlayURLMultyCDN"];
        let playUrl = param["param4"]["PlayURL"];
        let url = null;
        let result = null;
        if (timeShiftUrlArr && timeShiftUrlArr.length > 0 && timeShiftUrlArr[0] != "" && timeShiftUrlArr[0] != null) {
            url = timeShiftUrlArr;
        } else if (urlArray && urlArray.length > 0 && urlArray[0] != "" && OTTConfig.SupportMultiCDN()) {
            url = urlArray;
        } else if ((playUrl) != null && (playUrl.length) > 0) {
            url = playUrl;
        }
        if (url instanceof Array) {
            result = url;
        } else {
            result = [url];
        }
        this.mSeekPlayParam.Urls = result;
        this.mSeekPlayParam.ItemInfo = {
            playType: this.mType, itemCode: this.mItemCode, channelCode: this.mClipCode, videoClipCode: this.mClipCode,
            startDuration: this.mStartTime, endDuration: this.mEndTime, categoryCode: this.mCategoryCode};
        PlayerDataAccess.setAuthResultToLocal(this.mLocalSeekAuthKey, result);
    }

    //拼接回看地址
    contactSchProgramPlayUrl(url) {
        if(this.mCategoryCode == "live_new") {   //回顾节目
            this.processReviewProgramDelay();
        }
        let startTime = this.timeFormat(this.mStartTime);
        let endTime = this.timeFormat(this.mEndTime);
        return this.processUrlTimeFormat(url, startTime, endTime);
    }

    /*
     回顾节目：处理延迟
     说明：因为回顾节目的下发是按照直播延迟处理的，播放鉴权是按照回看节目处理，当直播延迟和回看延迟时间配置不一样的时候，会有偏差
     */
    processReviewProgramDelay() {
        let timeDiff = OTTConfig.reviewProgramDelayTime();
        if(timeDiff) {
            let start = sysTime.strToTimeStamp(this.mStartTime);
            this.mStartTime = sysTime.timeStampToStr(start - timeDiff);
            let end = sysTime.strToTimeStamp(this.mEndTime);
            this.mEndTime = sysTime.timeStampToStr(end - timeDiff);
        }
    }

    //ps返回的播放地址中，回看节目的starttime和endtime的替换或添加
    processUrlTimeFormat (url, startTime, endTime) {
        JxLog.d ([LogType.PLAY], 'common/OttPlayer/processUrlTimeFormat',
            ['回看播放地址拼接', url, startTime, endTime]);
        if (!url) {
            JxLog.e ([LogType.PLAY], 'common/OttPlayer/processUrlTimeFormat',
                ['播放地址异常']);
            return url
        }
        if (getUrlParam (url, "startTime")) {
            JxLog.w ([LogType.PLAY], 'common/OttPlayer/processUrlTimeFormat',
                ['播放地址存在拼接参数startTime', url]);
            url = modUrlParam (url, "startTime", startTime)
        }
        if (getUrlParam (url, "endTime")) {
            JxLog.w ([LogType.PLAY], 'common/OttPlayer/processUrlTimeFormat',
                ['播放地址存在拼接参数endTime', url]);
            url = modUrlParam (url, "endTime", endTime)
        }
        url = addUrlParam (url, "starttime", startTime)
        url = addUrlParam (url, "endtime", endTime)
        url = addUrlParam (url, "playseek", this.mStartTime + "-" + this.mEndTime)
        JxLog.d ([LogType.PLAY], 'common/OttPlayer/processUrlTimeFormat',
            ['拼接完毕后回看地址', url]);
        return url
    }

    /*
     默认：把形如20161212222222 (2016年12月12日 22时22分22秒)格式的字符串转化为类似1481552542的字符串
     当OTTConfig.schTimeFormatType() == 1：把形如20161212222222 (2016年12月12日 22时22分22秒)格式的字符串转化为类似20161212T222222.00Z的字符串
     */
    timeFormat(time) {
        var result = "";
        if(OTTConfig.schTimeFormatType() == 1) {
            var timeDate = new Date().parseExt(time);
            result = timeDate.Format("yyyyMMddThhmmss.00Z");
        } else {
            result = sysTime.strToTimeStamp(time);
        }
        return result;
    }

    //判断参数有效性
    checkParam() {
        if (this.mType == PlayerParamStatic.TYPE_VOD ||
            this.mType == PlayerParamStatic.TYPE_LIVE ||
            this.mType == PlayerParamStatic.TYPE_SCH) {
            if (this.mType == PlayerParamStatic.TYPE_VOD) {
                if ((this.mItemCode != null && this.mItemCode.length > 0) &&
                    (this.mClipCode != null && this.mClipCode.length > 0)) {
                    return true;
                }
                return false;
            } else if (this.mType == PlayerParamStatic.TYPE_LIVE) {
                if ((this.mItemCode != null && this.mItemCode.length > 0)) {
                    return true;
                }
                return false;
            } else if (this.mType == PlayerParamStatic.TYPE_SCH) {
                if ((this.mItemCode != null && this.mItemCode.length > 0) &&
                    (this.mStartTime != null && this.mStartTime.length > 0) &&
                    (this.mEndTime != null && this.mEndTime.length > 0)) {
                    return true;
                }
                return false;
            }
        }
        return false;
    }
}

export const PlayerControllerStatic = window.PlayerControllerStatic || {};
PlayerControllerStatic.BE_SYSTEM = 1;
PlayerControllerStatic.BE_MEDIA = 2;
PlayerControllerStatic.BE_AUTH = 3;
PlayerControllerStatic.BE_DOWNLOAD = 4;
PlayerControllerStatic.BE_VOICE = 11;       //语音搜索
PlayerControllerStatic.BE_INFO = 21;        //页面生命期信息

PlayerControllerStatic.BE_MEDIA_PLAYER_CLOSE = 0;   //关闭状态,暂不处理 *
PlayerControllerStatic.BE_MEDIA_PLAYER_CONNECT = 1; //连接媒体服务器中,暂不处理 *
PlayerControllerStatic.BE_MEDIA_PLAYER_BUFFER = 2;  //缓冲中
PlayerControllerStatic.BE_MEDIA_PLAYER_PLAY = 3;    //播放中
PlayerControllerStatic.BE_MEDIA_PLAYER_PAUSE = 4;   //已暂停
PlayerControllerStatic.BE_MEDIA_PLAYER_STOP = 5;    //已停止
PlayerControllerStatic.BE_MEDIA_PLAYER_END = 6;     //播放结束
PlayerControllerStatic.BE_MEDIA_PLAYER_SEEKING = 7; //Seeking中
PlayerControllerStatic.BE_MEDIA_PLAYER_BUFFER_END = 8;//暂不处理 *
PlayerControllerStatic.BE_MEDIA_PLAYER_ERROR = 9;   //播放出错

PlayerControllerStatic.ES_AUTH_RESULT = 1;         //鉴权结果
PlayerControllerStatic.ES_ORDER_RESULT = 11;       //订购结果
PlayerControllerStatic.ES_CANCEL_SUBSCRIBE_RESULT = 31;        //退订结果

//鉴权结果分类
PlayerControllerStatic.AUTH_RESULT_NERWORK_ERROR = -1;   //网络异常
PlayerControllerStatic.AUTH_RESULT_FAIL = 0;             //鉴权失败/没有订购
PlayerControllerStatic.AUTH_RESULT_SUCCESS = 1;          //鉴权成功
PlayerControllerStatic.AUTH_RESULT_EXCEPTION = 4;        //鉴权信息异常
PlayerControllerStatic.AUTH_RESULT_PLATFORM_FAIL = 10;   //运营商平台鉴权失败

//订购结果分类
PlayerControllerStatic.ORDER_RESULT_NERWORK_ERROR =  -1;    //网络异常
PlayerControllerStatic.ORDER_RESULT_FAIL = 0;               //鉴权失败/没有订购
PlayerControllerStatic.ORDER_RESULT_SUCCESS = 2;            //订购成功
PlayerControllerStatic.ORDER_RESULT_NO_MONEY = 3;           //余额不足
PlayerControllerStatic.ORDER_RESULT_EXCEPTION = 5;          //订购支付异常
PlayerControllerStatic.ORDER_RESULT_PLATFORM_FAIL = 10;     //运营商平台订购失败

PlayerControllerStatic.ES_VOICE_PLAY = 1;     //根据语音返回的code打开指定频道
PlayerControllerStatic.ES_VOICE_SEARCH = 2;   //语音搜索，用关键字
PlayerControllerStatic.ES_VOICE_CTRL = 3;     //上一频道，下一频道

PlayerControllerStatic.ES_VOICE_PLAY_VOD = 0;    //点播
PlayerControllerStatic.ES_VOICE_PLAY_LIVE = 1;   //直播
PlayerControllerStatic.ES_VOICE_PLAY_SCH = 2;    //直播回看
PlayerControllerStatic.ES_VOICE_CTRL_PREV = 0;   //上一节目
PlayerControllerStatic.ES_VOICE_CTRL_NEXT = 1;   //下一节目

PlayerControllerStatic.ES_LIFECYCLE = 1;
PlayerControllerStatic.ES_INFO_ON_START = 0;
PlayerControllerStatic.ES_INFO_ON_RESUME = 1;
PlayerControllerStatic.ES_INFO_ON_PAUSE = 2;
PlayerControllerStatic.ES_INFO_ON_STOP = 3;

PlayerControllerStatic._instance = null;
PlayerControllerStatic.getInstance = function () {
    if (PlayerControllerStatic._instance == null) {
        PlayerControllerStatic._instance = new PlayerController();
    }
    return PlayerControllerStatic._instance;
}

PlayerControllerStatic.STATE_IDLE = 0;
PlayerControllerStatic.STATE_LOADING = 1;
PlayerControllerStatic.STATE_BUFFERING = 2;
PlayerControllerStatic.STATE_PLAYING = 3;
PlayerControllerStatic.STATE_SEEKING = 4;
PlayerControllerStatic.STATE_PLAYEND = 5;
PlayerControllerStatic.STATE_PAUSED = 6;

export class PlayerController{
    constructor(){
        this.mState= PlayerControllerStatic.BE_MEDIA_PLAYER_CLOSE;
        this.mPlayingParam= null;
        this.mPlayStateListener= null;
        this.mPlayingCurrent= 0;  //当前播放时长
        this.mPlayingTotal= -1;    //当前节目总时长
        this.mSeekCurrent= -1;
        this.mSeekRepeatCount= 0;//记录一次Seek过程中，连续按键的次数
        this.mHasDoSeek = false;   //进行了seek操作
        this.adjustSeekTimer = null;              //seek过程中，调整进度条位置的定时器
        this.adjustSeekIntervalTime = 250;        //调整进度条的频率控制
        this.adjustPlayingTimer = null;           //playing过程中，调整进度条位置的计时器
        this.adjustPlayingIntervalTime = 800;     //调整进度条的频率控制
        this.lockSeek = true;                       //是否锁定seek操作（回看节目loading时候不响应seek）
        this.orderParam = {serviceCodes: "", productCode: "", itemName: "", paramStr: ""};         //订购参数
        this.onInfoFlag = true;      //是否响应info的回调（若有发送onPause回调，就响应onPause回调，不响应onStop；若没有发送onPause回调，则响应onStop回调）
        this.preEventPara = null;
    }

    onBesTVEvent (param) {
        let obj = null;
        try{
            if (!window.JSON || JSON.parse === 'undefined') {
                obj = eval (param);
            } else {
                obj = JSON.parse (param);
            }
            if (this.preEventPara === null || this.preEventPara.type !== obj.type || this.preEventPara.id !== obj.id || this.preEventPara.param1 !== obj.param1) {
                JxLog.i ([LogType.EVENT, LogType.PLAY, LogType.PLAY_EVENT], 'common/OttPlayer/onBesTVEvent', ['BestvAuth callback info', param]);
            }
            this.preEventPara = obj;
        }catch (e) {
            obj = null;
            JxLog.e ([LogType.EVENT, LogType.PLAY, LogType.PLAY_EVENT], 'common/OttPlayer/onBesTVEvent', ['On BesTVEvent of player callback error，invalid json string which is ' + param]);
        }
        if (obj != null) {
            let type = parseInt(obj["type"]);    //EventType，默认值为2，表示常规媒体播放方面的事件
            switch(type) {
                case PlayerControllerStatic.BE_SYSTEM:
                    break;
                case PlayerControllerStatic.BE_MEDIA:
                    this.handlePlayerEvent(obj);
                    break;
                case PlayerControllerStatic.BE_AUTH:
                    this.handleAuthEvent(obj);
                    break;
                case PlayerControllerStatic.BE_DOWNLOAD:
                    break;
                case PlayerControllerStatic.BE_VOICE:
                    if(OTTConfig.supportVoiceSearch()) {
                        this.handleVoiceEvent(obj);
                    }
                    break;
                case PlayerControllerStatic.BE_INFO:
                    this.handleInfoEvent(obj);
                    break;
                default:
            }
        }
    }

    //日志上报相关
    playEventForLogRecord(param){
        var callbackState = parseInt(param["param1"]);
        if (callbackState === PlayerControllerStatic.BE_MEDIA_PLAYER_BUFFER){
            if(DataReportModel.callbackState===PlayerControllerStatic.BE_MEDIA_PLAYER_PLAY){
                DataReportModel.tplay_info.loadingCount++;//加载次数
                DataReportModel.startLoadingTime = sysTime.nowMill();
            }
        }
        if (callbackState === PlayerControllerStatic.BE_MEDIA_PLAYER_PLAY){
            DataReportModel.tplay_info.loadSuccessFlag = 1;
            var nowTime = sysTime.nowMill();
            if(DataReportModel.tplay_info.firstLoadingTime===null&&DataReportModel.startMillisecond!==null){ //首次缓冲时长
                DataReportModel.tplay_info.firstLoadingTime = nowTime - DataReportModel.startMillisecond;
                DataReportModel.tplay_info.firstLoadingTime = parseFloat(DataReportModel.tplay_info.firstLoadingTime).toFixed(3);
            }
            if(DataReportModel.callbackState===PlayerControllerStatic.BE_MEDIA_PLAYER_BUFFER&&DataReportModel.startLoadingTime!==null){
                DataReportModel.tplay_info.loadingTime+=(nowTime - DataReportModel.startLoadingTime); //加载总时长
                DataReportModel.startLoadingTime = null;
            }
        }
        DataReportModel.callbackState = callbackState;
    }

    //1. 处理播放器的回调
    handlePlayerEvent (param) {
        JxLog.d([LogType.PLAY], "common/OttPlayer/handlePlayerEvent",
            ["begin:handlePlayerEvent", param]);
        this.playEventForLogRecord(param);
        let playingState = this.getPlayingState();
        if (playingState == PlayerControllerStatic.STATE_IDLE || playingState == PlayerControllerStatic.STATE_LOADING ||
            playingState == PlayerControllerStatic.STATE_PLAYEND) {
            //这种情况下，不处理播放器回调
        } else {
            let callbackState = parseInt(param["param1"]);
            let total = parseInt(param["param2"]);
            let current = parseInt(param["param3"]);
            if(this.isLivePlaying() && OTTConfig.supportLiveSeek()) {   //直播节目，param2和param3为空，需要重新赋值
                total = OTTConfig.getMaxSeekTime();           //总时长
                current = PlayerDataAccess.mSeekCurrent;     //当前播放时间
            }
            if (playingState == PlayerControllerStatic.STATE_PLAYING) {
                if (callbackState == PlayerControllerStatic.BE_MEDIA_PLAYER_BUFFER) {
                    this.setPlayingState(PlayerControllerStatic.STATE_BUFFERING);
                    if (this.mPlayStateListener != null && this.mPlayStateListener.onPlayerBuffering != null) {
                        this.mPlayStateListener.onPlayerBuffering();
                    }
                    this.stopAdjustPlayingPosition();
                } else if (callbackState == PlayerControllerStatic.BE_MEDIA_PLAYER_PLAY) {
                    this.setPlayingTime(current, total);
                    if (this.mSeekCurrent != -1 && Math.abs(parseInt(this.mSeekCurrent) - current) >= 3) {
                        this.mSeekCurrent = -1;
                    }
                    if(this.lockSeek) {
                        this.lockSeek = false;
                    }
                    if(this.mHasDoSeek && !this.isNeedPlayerPlaying(current)) {
                        return;
                    }
                    if(!this.adjustPlayingTimer) {
                        this.beginAdjustPlayingPosition();
                    }
                } else if (callbackState == PlayerControllerStatic.BE_MEDIA_PLAYER_ERROR) {
                    JxLog.e ([LogType.PLAY], 'common/OttPlayer/handlePlayerEvent', ['Play error']);
                    if (this.mPlayStateListener != null && this.mPlayStateListener.onPlayerError != null) {
                        this.mPlayStateListener.onPlayerError(total);
                    }
                    this.stopAdjustPlayingPosition();
                } else if (callbackState == PlayerControllerStatic.BE_MEDIA_PLAYER_STOP) {
                    if(this.mPlayStateListener != null && this.mPlayStateListener.onStopPlay() != null) {
                        this.mPlayStateListener.onStopPlay();
                    }
                    this.stopAdjustPlayingPosition();
                } else if (callbackState == PlayerControllerStatic.BE_MEDIA_PLAYER_END) {
                    if (this.mPlayStateListener != null && this.mPlayStateListener.onPlayerStoped != null) {
                        this.mPlayStateListener.onPlayerStoped(current, total);
                    }
                    this.stopAdjustPlayingPosition();
                }
            } else if (playingState == PlayerControllerStatic.STATE_BUFFERING) {
                if (callbackState == PlayerControllerStatic.BE_MEDIA_PLAYER_BUFFER) {
                    //已经在buffering状态，再重复发送(因为buffer的回调监听有延迟清除loading的操作，故要在buffer的时候，一直发送buffer回调监听)
                    this.setPlayingState(PlayerControllerStatic.STATE_BUFFERING);
                    if (this.mPlayStateListener != null && this.mPlayStateListener.onPlayerBuffering != null) {
                        this.mPlayStateListener.onPlayerBuffering();
                    }
                    this.stopAdjustPlayingPosition();
                } else if (callbackState == PlayerControllerStatic.BE_MEDIA_PLAYER_PLAY) {
                    this.setPlayingState(PlayerControllerStatic.STATE_PLAYING);
                    this.setPlayingTime(current, total);
                    if(this.mHasDoSeek && !this.isNeedPlayerPlaying(current)) {
                        return;
                    }
                    if(this.lockSeek) {
                        this.lockSeek = false;
                    }
                    if(!this.adjustPlayingTimer) {
                        this.beginAdjustPlayingPosition();
                    }
                } else if (callbackState == PlayerControllerStatic.BE_MEDIA_PLAYER_ERROR) {
                    JxLog.e ([LogType.PLAY], 'common/OttPlayer/handlePlayerEvent', ['Play error']);
                    if (this.mPlayStateListener != null && this.mPlayStateListener.onPlayerError != null) {
                        this.mPlayStateListener.onPlayerError(total);
                    }
                    if(this.mHasDoSeek && !this.isNeedPlayerPlaying(current)) {
                        return;
                    }
                    this.stopAdjustPlayingPosition();
                }
            } else if (playingState == PlayerControllerStatic.STATE_SEEKING) {
                //当前正在快进快退，不用发送播放回调
                this.setPlayingTime(current, total);
            } else if (playingState == PlayerControllerStatic.STATE_PAUSED) {
                this.stopAdjustPlayingPosition();
            }
        }
        JxLog.d([LogType.PLAY], "common/OttPlayer/handlePlayerEvent",
            ["end:handlePlayerEvent"]);
    }

    getCdnUrlIp(cdnUrl){
        cdnUrl = cdnUrl.replace("http://", "");
        cdnUrl = cdnUrl.replace("https://", "");
        cdnUrl = cdnUrl.split("/");
        cdnUrl = cdnUrl[0];
        return cdnUrl;
    }

    getTaskId(cdnUrl){
        let cdnUrlList = cdnUrl.split("&");
        for(let i=0;i<cdnUrlList.length;i++){
            let setString = cdnUrlList[i];
            if(setString.indexOf("_taskId")>=0){
                setString = setString.replace("_taskId=", "");
                return setString;
            }
        }
        return ""
    }

    //2. 处理鉴权、订购的回调
    handleAuthEvent(param) {
        JxLog.i([LogType.PLAY], 'common/OttPlayer/handleAuthEvent', ['Auth success, callback info is ', param]);
        if(this.isLivePlaying() && OTTConfig.supportLiveSeek()) {       //直播且支持时移,进行时移参数的设置
            this.mPlayingParam.setSeekPlayParamsFromAuth(param);
        }
        let type = parseInt(param['id']);
        let result = parseInt(param['param1']);
        switch (type) {
            case PlayerControllerStatic.ES_AUTH_RESULT:
                if(this.mPlayStateListener != null && this.mPlayStateListener.onAuthPayNotify != null) {
                    this.mPlayStateListener.onAuthPayNotify(result);
                }
                if(result == PlayerControllerStatic.AUTH_RESULT_FAIL) {
                    this.setOrderParam(param);
                }
                this.processAuthOrderRes(param);
                break;
            case PlayerControllerStatic.ES_ORDER_RESULT:
                if(this.mPlayStateListener != null && this.mPlayStateListener.onAuthPayNotify != null) {
                    this.mPlayStateListener.onOrderNotify(result);
                }
                break;
            case PlayerControllerStatic.ES_CANCEL_SUBSCRIBE_RESULT:
                break;
            default:

        }
    }

    //处理鉴权，返回播放地址的结果
    processAuthOrderRes(param) {
        JxLog.d([LogType.PLAY], "common/OttPlayer/processAuthOrderRes",
            ["begin:param", param]);
        let url = param["param4"]["PlayURL"];     //单个播放地址(String)
        let urlArray = param["param4"]["PlayURLMultyCDN"];  //同一播放的多个cdn地址(List<String>)
        if(urlArray && urlArray.length > 0 && urlArray[0] != "" && OTTConfig.SupportMultiCDN()) {   //多cdn
            JxLog.d([LogType.PLAY], "common/OttPlayer/processAuthOrderRes",
                ["handleAuthEvent SupportMultiCDN setPlayParams"]);
            if(this.mPlayStateListener != null && this.mPlayStateListener.onPlayerLoadingEnd != null) {
                this.mPlayStateListener.onPlayerLoadingEnd(0, "");
            }
            if(OTTConfig.supportCacheAuthResult()) {
                PlayerDataAccess.setAuthResultToLocal(this.mPlayingParam.mLocalAuthKey, urlArray);
            }
            let playParamObj = this.mPlayingParam.getMultiCDNPlayParams(urlArray);
            JxLog.i([LogType.PLAY], 'common/OttPlayer/processAuthOrderRes',
                ['Multiple cdn, set play param and start play which param is ', playParamObj]);
            OTT.MediaPlayer.setPlayParams(playParamObj);
            OTT.MediaPlayer.play();
            this.setPlayingState(PlayerControllerStatic.STATE_PLAYING);
            DataReportModel.tplay_info.CDNFlag = this.getCdnUrlIp(urlArray[0]);
        } else if((url) != null && (url.length) > 0) {   //单cdn
            JxLog.d([LogType.PLAY], "common/OttPlayer/processAuthOrderRes",
                ["handleAuthEvent not SupportMultiCDN setPlayUrl"]);
            if(this.mPlayStateListener != null && this.mPlayStateListener.onPlayerLoadingEnd != null) {
                this.mPlayStateListener.onPlayerLoadingEnd(0, "");
            }
            if(OTTConfig.supportCacheAuthResult()) {
                PlayerDataAccess.setAuthResultToLocal(this.mPlayingParam.mLocalAuthKey, url);
            }
            let appendUrl = this.mPlayingParam.appendPlayUrl(url);
            JxLog.i([LogType.PLAY], 'common/OttPlayer/processAuthOrderRes',
                ['Single cdn, set play param and start play which param is ', appendUrl]);
            OTT.MediaPlayer.setPlayUrl(appendUrl);
            OTT.MediaPlayer.play();
            this.setPlayingState(PlayerControllerStatic.STATE_PLAYING);
            DataReportModel.tplay_info.CDNFlag = this.getCdnUrlIp(url);
        } else {
            JxLog.e ([LogType.PLAY], 'common/OttPlayer/processAuthOrderRes', ['Play address error', 'PlayURL:', url, 'PlayURLMultyCDN:', urlArray, 'data：', param]);
            if(this.mPlayStateListener != null && this.mPlayStateListener.onPlayerLoadingEnd != null) {
                this.mPlayStateListener.onPlayerLoadingEnd(-1, " 获取播放地址异常,暂时无法播放");
                DataReportModel.createPlayBeginTime();
            }
            DataReportModel.tplay_info.CDNFlag = "xxxxxx";
            this.setPlayingState(PlayerControllerStatic.STATE_IDLE);
            this.stopPlay();
        }
        JxLog.d([LogType.PLAY], "common/OttPlayer/processAuthOrderRes",
            ["end"]);
    }

    //3. 处理语音的回调
    handleVoiceEvent(param) {
        JxLog.i([LogType.PLAY], 'common/OttPlayer/handleVoiceEvent', ['Deal voice callback event which param is ', param]);
        var operationType = parseInt(param["id"]);
        if(operationType == PlayerControllerStatic.ES_VOICE_PLAY) {
            JxLog.i([LogType.PLAY], "common/OttPlayer/handleVoiceEvent", ["语音回调：ES_VOICE_PLAY_LIVE"]);
            if(parseInt(param["param1"]) == PlayerControllerStatic.ES_VOICE_PLAY_LIVE) {
                var channelCode = param["param2"];
                PlayerDataAccess.playByVoiceChannelCode(channelCode);
            }
        } else if(operationType == PlayerControllerStatic.ES_VOICE_SEARCH) {
            JxLog.i([LogType.PLAY], 'common/OttPlayer/handleVoiceEvent', ['Voice callback：ES_VOICE_SEARCH,deal nothing']);
            //do nothing
        } else if(operationType == PlayerControllerStatic.ES_VOICE_CTRL) {
            JxLog.i([LogType.PLAY], "common/OttPlayer/handleVoiceEvent",
                ["语音回调：ES_VOICE_CTRL"]);
            var ctrlType = parseInt(param["param1"]);
            if(ctrlType == PlayerControllerStatic.ES_VOICE_CTRL_PREV || ctrlType == PlayerControllerStatic.ES_VOICE_CTRL_NEXT) {
                PlayerDataAccess.playByVoiceCtrl(ctrlType);
            }
        }
        JxLog.i([LogType.PLAY], "common/OttPlayer/handleVoiceEvent", ["end"]);
    }

    //4. home键的处理(若home键不产生回调，则不会上报最后一次播放的直播频道信息)
    handleInfoEvent(param) {
        JxLog.i([LogType.EVENT, LogType.PLAY, LogType.PLAY_EVENT], 'common/OttPlayer/handleInfoEvent', ['Response home event which param is ', param]);
        let operationType = parseInt(param["id"]);
        if(operationType == PlayerControllerStatic.ES_LIFECYCLE) {
            let callbackState = parseInt(param["param1"]);
            switch(callbackState){
                case PlayerControllerStatic.ES_INFO_ON_START:        //页面从全遮住界面back时回调
                    if(OTT.App.lifecycleIsSupported() && !parseInt(param['param2'])) {
                       WebApp.appOnStart();
                    }
                    break;
                case PlayerControllerStatic.ES_INFO_ON_RESUME:      //页面从半遮住界面back时回调
                    break;
                case PlayerControllerStatic.ES_INFO_ON_PAUSE:       //在页面半遮的时候回调（例如弹个非全屏的框）
                    this.onInfoFlag = false
                    WebApp.appOnStop();
                    break;
                case PlayerControllerStatic.ES_INFO_ON_STOP:        //页面全遮住时候回调（例如进入设置界面,进入点播详情页）
                    if(this.onInfoFlag){
                        WebApp.appOnStop();
                    }
                    break;
                case PlayerControllerStatic.ES_INFO_ON_RESTART:     //重新进入应用
                    break;
                case PlayerControllerStatic.EX_INFO_ON_DESTROY:
                    break;
                default:
            }
        }
        JxLog.i([LogType.PLAY], "common/OttPlayer/handleInfoEvent", ["end"]);
    }

    //设置订购参数
    setOrderParam(param) {
        let that = this;
        that.orderParam.paramStr = JSON.stringify(param['param3']);
        let orderProduct = param['param4']['OrderProduct'];
        if (orderProduct instanceof Array) {
            orderProduct.forEach(function (item) {
                that.orderParam.serviceCodes = item['serviceCodes'];
                that.orderParam.productCode = item['code'];
                that.orderParam.itemName = item['name'];
            })
        } else {
            that.orderParam.serviceCodes = orderProduct['serviceCodes'];
            that.orderParam.productCode = orderProduct['code'];
            that.orderParam.itemName = orderProduct['name'];
        }
    }

    /*订购操作,参数说明如下
        String categoryCode //分类栏目
        String itemType, //内容类型
        String itemCode, //内容CODE
        String clipCode,
        String serviceCodes,//服务CODE列表
        String productCode, //产品code
        String itemName //内容名称
        String paramStr, //调用auth后，通过onBesTVEvent回调的Params3的值，WAG通过此值，显示产品列表
        String extParam //扩展字段，保留使用
    */
    order() {
        if (OTT.isAndroid()) {
            if (this.mPlayingParam.mType == PlayerParamStatic.TYPE_VOD) {

            } else {
                BestvAuth.order("", this.mPlayingParam.mType, this.mPlayingParam.mItemCode, "", this.orderParam.serviceCodes,
                    this.orderParam.productCode, this.orderParam.itemName, this.orderParam.paramStr, this.mPlayingParam.mExtendParam);
            }
        }
    }

    setPlayingState (state) {
        this.mState = state;
    }
    getPlayingState () {
        return this.mState;
    }
    setPlayingTime (c, t) {
        JxLog.d([LogType.PLAY], "common/OttPlayer/setPlayingTime",
            ["setPlayingTime", c, t]);
        this.mPlayingCurrent = c;
        if(t>0){
            this.mPlayingTotal = t;
        }
    }
    isLivePlaying () {
        let live = false;
        if(this.mPlayingParam) {
            live = this.mPlayingParam.isLive();
        }
        return live;
    }
    //当前播放节目的总时长
    getPlayingTotalTime () {
        if(this.isLivePlaying()) {
            return OTTConfig.getMaxSeekTime();
        } else {
            return OTT.MediaPlayer.getTotalTime();
        }
    }
    //当前播放节目的播放时间(seek之后，getCurrentTime返回值没有更新)目的播放时间(seek之后，getCurrentTime返回值没有更新)
    getPlayingCurrentTime () {
        if(this.isLivePlaying()) {
            return 100;
        } else {
            return OTT.MediaPlayer.getCurrentTime();
        }
    }

    setPlayStateListener (listener) {
        this.mPlayStateListener = listener;
    }

    doCheckAndRequestPlayUrl () {
        let valid = this.mPlayingParam.checkParam();
        if (valid) {
            JxLog.d ([LogType.PLAY], 'common/OttPlayer/doCheckAndRequestPlayUrl', ['Play param verify，right param']);
            this.mPlayingParam.getPlayUrl();
            if (this.mPlayStateListener != null && this.mPlayStateListener.onPlayerLoadingBegin != null) {
                this.mPlayStateListener.onPlayerLoadingBegin();
            }
        } else {
            if (this.mPlayStateListener != null && this.mPlayStateListener.onPlayerLoadingBegin != null) {
                this.mPlayStateListener.onPlayerLoadingBegin();
            }
            if (this.mPlayStateListener != null && this.mPlayStateListener.onPlayerLoadingEnd != null) {
                this.mPlayStateListener.onPlayerLoadingEnd(-1, "请求参数错误");
            }
            JxLog.e ([LogType.PLAY], 'common/OttPlayer/doCheckAndRequestPlayUrl', ['Play param verify，error param']);
        }
    }

    //是否需要调用播放器正在播放的回调(刚seek之后，2，6，3的回调中，正在播放时间还未设置正确，不处理onPlayerPlaying的回调)
    isNeedPlayerPlaying(current) {
        JxLog.d([LogType.PLAY], 'common/OttPlayer/isNeedPlayerPlaying',
            [this.mSeekCurrent + "/" + current]);
        if(Math.abs(this.mSeekCurrent - current) > 10) {
            return false;
        }
        this.mHasDoSeek = false;
        return true;
    }

    isNeedStop(){
        let playingState = this.getPlayingState();
        if(playingState == PlayerControllerStatic.STATE_IDLE || playingState == PlayerControllerStatic.STATE_PLAYEND ||
           playingState == PlayerControllerStatic.STATE_LOADING) {
            return false;
        } else {
            return true;
        }
    }

    startPlay (playParam) {
        JxLog.i([LogType.PLAY], 'common/OttPlayer/startPlay', ['Start new play which param is', playParam]);
        this.setNewPlayProgramFlag();
        this.notifyLiveStatus(true);
        PlayerDataAccess.setLastLiveChannelInfo(playParam);
        if (this.mPlayStateListener != null && this.mPlayStateListener.onStartPlay != null) {
            this.mPlayStateListener.onStartPlay();
        }
        if((this.getPlayingState() == PlayerControllerStatic.STATE_IDLE) ||
            (this.getPlayingState() == PlayerControllerStatic.STATE_PLAYEND)) {
            this.mPlayingParam = playParam;
            this.setPlayingState(PlayerControllerStatic.STATE_LOADING);
            this.doCheckAndRequestPlayUrl();
        } else if(this.getPlayingState() == PlayerControllerStatic.STATE_LOADING) {
            if(this.mPlayStateListener != null && this.mPlayStateListener.onPlayerError != null) {
                this.mPlayStateListener.onPlayerError("不支持同时请求两个播放地址");
            }
            return;
        }else{
            this.mPlayingParam = playParam;
            this.setPlayingState(PlayerControllerStatic.STATE_LOADING);
            this.doCheckAndRequestPlayUrl();
        }
    }

    //设置新播放节目的一些标志位
    setNewPlayProgramFlag() {
        this.mHasDoSeek = false;
        this.lockSeek = true;
        let maxSeekTime = OTTConfig.getMaxSeekTime();
        PlayerDataAccess.mPlayingTime = maxSeekTime;
        PlayerDataAccess.mSeekCurrent = maxSeekTime;
        PlayerDataAccess.mLiveSeekOffset = 0;
    }

    stopPlay() {
        this.setPlayingState(PlayerControllerStatic.STATE_PLAYEND);
        if(this.mPlayStateListener != null && this.mPlayStateListener.onStopPlay != null) {
            this.mPlayStateListener.onStopPlay();
        }
        OTT.MediaPlayer.stop();
        OTT.MediaPlayer.close();
        this.stopAdjustPlayingPosition();
    }

    //正在播放时候，调整进度条（清除掉seek过程中的调整进度条）
    beginAdjustPlayingPosition() {
        JxLog.d([LogType.PLAY], "common/OttPlayer/beginAdjustPlayingPosition", ["begin"]);
        let that = this;
        that.stopAdjustSeekPosition();
        if (that.mPlayStateListener != null && that.mPlayStateListener.onPlayerPlaying != null) {
            that.mPlayStateListener.onPlayerPlaying(that.mPlayingCurrent, that.mPlayingTotal);
        }
        that.adjustPlayingTimer = setInterval(function() {
            JxLog.d([LogType.PLAY], "common/OttPlayer/beginAdjustPlayingPosition",
                ["PlayerControllerStatic.beginAdjustPlayingPosition", that.mPlayingCurrent, that.mPlayingTotal]);
            if (that.mPlayStateListener != null && that.mPlayStateListener.onPlayerPlaying != null) {
                that.mPlayStateListener.onPlayerPlaying(that.mPlayingCurrent, that.mPlayingTotal);
            }
        }, that.adjustPlayingIntervalTime);
        JxLog.d([LogType.PLAY], "common/OttPlayer/beginAdjustPlayingPosition",
            ["end"]);
    }

    //没有播放的时候，停止调整进度条（buffering、pause、stop等情况）
    stopAdjustPlayingPosition() {
        JxLog.d([LogType.PLAY], "common/OttPlayer/stopAdjustPlayingPosition", ["begin"]);
        if(this.adjustPlayingTimer) {
            clearInterval(this.adjustPlayingTimer);
            this.adjustPlayingTimer = null;
        }
        JxLog.d([LogType.PLAY], "common/OttPlayer/stopAdjustPlayingPosition", ["end"]);
    }

    /**
     * 当播放器处于 PlayerControllerStatic.BE_MEDIA_PLAYER_PLAY|PlayerControllerStatic.BE_MEDIA_PLAYER_BUFFER
     * 时外部把按键传递给播控，播控处理快进/快退逻辑，通知界面更新进度条，播控并调用播放器接口真正进行seek操作
     * @param presss
     * @param keyCode
     */
    seek (type, keyCode) {
        JxLog.i([LogType.PLAY], 'common/OttPlayer/seek', ["the playingTotal is ", this.mPlayingTotal]);
        if (this.mPlayingTotal <= 0) {  //获取播放时长前按键无效
            return;
        }
        let interval = this.mPlayingTotal - this.mPlayingCurrent;
        if(keyCode == KeyCode.KEY_RIGHT) {
            let isLive = this.isLivePlaying();
            let schCondition = (!isLive) && (interval <= 5);  //回看：节目在距离结束还有5秒，不响应快进操作（为避免5s前开启的定时器，需要清除）
            let liveCondition = isLive && interval <= 0 && (!PlayerDataAccess.mLiveSeekOffset);      //直播：正在直播的时候，不响应快进操作
            if(schCondition || liveCondition) {
                this.stopAdjustSeekPosition();
                this.mSeekRepeatCount = 0;
                JxLog.i([LogType.PLAY], 'common/OttPlayer/seek', ["seek return, the offset is ", PlayerDataAccess.mLiveSeekOffset]);
                return;
            }
        }
        //以下状态不处理按键的下压loading操作，只处理click，hold_end
        var state = this.getPlayingState();
        if (this.lockSeek || state == PlayerControllerStatic.STATE_IDLE || state == PlayerControllerStatic.STATE_LOADING ||
            state == PlayerControllerStatic.STATE_PLAYEND || state == PlayerControllerStatic.STATE_BUFFERING) {
            if(type == eventType.CLICK || type == eventType.HOLD_END) {
                this.stopAdjustSeekPosition();
                this.mSeekRepeatCount = 0;
                JxLog.i([LogType.PLAY], 'common/OttPlayer/seek', ["seek return, the state is ", state]);
                //this.doSeek(this);
            }
            return;
        }
        this.setPlayingState(PlayerControllerStatic.STATE_SEEKING);
        switch(type) {
            //打开渲染进度条的计时器,更新进度条数据（解决点按click没有更新进度）
            case eventType.FIRST_DOWN:
                this.beginAdjustSeekPosition(keyCode);
                this.updateSeekProgressData(keyCode);
                break;
            //关闭渲染进度条的计时器
            case eventType.CLICK:
            case eventType.HOLD_END:
                this.stopAdjustSeekPosition(keyCode);
                this.doSeek(this);
                break;
            //更新进度条数据
            case eventType.HOLD_BEGIN:
            case eventType.HOLDING:
                this.updateSeekProgressData(keyCode);
                break;
            default:
        }
    }

    //开始调整进度条位置（清除playing过程中的调整进度条）
    beginAdjustSeekPosition(keyCode) {
        JxLog.d([LogType.PLAY], "common/OttPlayer/beginAdjustSeekPosition", ["end"]);
        let that = this;
        that.stopAdjustPlayingPosition();
        if (that.mSeekCurrent == -1) {
            that.mSeekCurrent = that.mPlayingCurrent;   //记录现在播放的位子作为起点
            that.mSeekRepeatCount = 0;
        }
        if (that.mPlayStateListener != null && that.mPlayStateListener.onPlayerSeekingUpdateView != null) {
            that.mPlayStateListener.onPlayerSeekingUpdateView(keyCode);
        }
        that.adjustSeekTimer = setInterval(function(){
            JxLog.d([LogType.PLAY], "common/OttPlayer/beginAdjustSeekPosition",
                ["PlayerControllerStatic.beginAdjustSeekPosition", that.mPlayingCurrent, that.mPlayingTotal]);
            if (that.mPlayStateListener != null && that.mPlayStateListener.onPlayerSeekingUpdateView != null) {
                that.mPlayStateListener.onPlayerSeekingUpdateView(keyCode);
            }
        }, that.adjustSeekIntervalTime);
        JxLog.d([LogType.PLAY], "common/OttPlayer/beginAdjustSeekPosition",
            ["end"]);
    }

    //停止调整进度条位置，并执行播放器seek操作
    stopAdjustSeekPosition(keyCode=null) {
        JxLog.d([LogType.PLAY], "common/OttPlayer/stopAdjustSeekPosition", ["begin"]);
        let that = this;
        if(that.adjustSeekTimer) {
            clearInterval(that.adjustSeekTimer);
            that.adjustSeekTimer = null;
        }
	//停止调整之前，需要更新一次view的操作，防止按键松开后的跳动现象
        if (that.mPlayStateListener != null && that.mPlayStateListener.onPlayerSeekingUpdateView != null) {
            that.mPlayStateListener.onPlayerSeekingUpdateView(keyCode);
        }
        JxLog.d([LogType.PLAY], "common/OttPlayer/stopAdjustSeekPosition", ["end"]);
    }

    //更新进度条数据
    updateSeekProgressData(keyCode) {
        if(this.adjustSeekTimer) {
            let that = this;
            that.mSeekRepeatCount++;
            JxLog.d([LogType.PLAY], "common/OttPlayer/updateSeekProgressData",
                ["mSeekRepeatCount", that.mSeekRepeatCount]);
            var step = that.getStepByRepeatCount();
            that.updateSeekCurrentByStep(step, keyCode);
            if (that.mPlayStateListener != null && that.mPlayStateListener.onPlayerSeekingUpdateData != null) {
                that.mPlayStateListener.onPlayerSeekingUpdateData(parseInt(that.mSeekCurrent), that.mPlayingTotal);
            }
        }
    }

    //根据重复次数计算更新进度条的步长
    getStepByRepeatCount() {
        var step = parseInt(this.mPlayingTotal * 3) / 1000;
        if (step <= 10) {
            step = 10;//时间片最小10
        }
        if (this.mSeekRepeatCount <= 6) {
            return step;
        } else if (this.mSeekRepeatCount <= 12) {
            return step * 2;
        } else if((this.mSeekRepeatCount <= 18)){
            return step * 4;
        } else {
            return step * 6;
        }
    }

    //根据步长更新seekCurrent
    updateSeekCurrentByStep(step, keyCode) {
        if (keyCode == KeyCode.KEY_LEFT) {
            this.mSeekCurrent -= step;
            if (this.mSeekCurrent <= 1) {
                this.mSeekCurrent = 0;
            }
        } else if (keyCode == KeyCode.KEY_RIGHT) {
            this.mSeekCurrent += step;
            if(this.isLivePlaying()) {   //直播
                if(this.mSeekCurrent > this.mPlayingTotal) {
                    this.mSeekCurrent = this.mPlayingTotal;
                }
            } else {   //回看
                if (this.mPlayingTotal > 5) {
                    if (this.mSeekCurrent >= (this.mPlayingTotal - 5)) {
                        this.mSeekCurrent = this.mPlayingTotal - 5;
                    }
                } else {
                    this.mSeekCurrent = this.mPlayingTotal;
                    if (this.mSeekCurrent >= (this.mPlayingTotal - 1)) {
                        this.mSeekCurrent = this.mPlayingTotal - 1;
                    }
                }
            }
        }
    }

    //内部接口，调用seek，避免频繁调用
    doSeek (target) {
        let that = target;
        JxLog.i([LogType.PLAY], 'common/OttPlayer/doSeek', ["the mSeekCurrent is "+that.mSeekCurrent]);
        if(that.mSeekCurrent < 0) {
            that.mSeekCurrent = 0;
        }
        if(!this.isLivePlaying()) {   //回看
            if(that.mSeekCurrent < 0) {
                that.setPlayingState(PlayerControllerStatic.STATE_PLAYING);
                return;
            }
            window.Loading.showLoading();
            OTT.MediaPlayer.setSeekTimeEx(that.mSeekCurrent);
            that.setPlayingState(PlayerControllerStatic.STATE_BUFFERING);
            JxLog.i([LogType.PLAY], 'common/OttPlayer/doSeek', ["Not live doSeek to "+that.mSeekCurrent]);
        } else {    //直播
            let offset = OTTConfig.getMaxSeekTime() - parseInt(that.mSeekCurrent);
            if(offset < 0) {
                that.setPlayingState(PlayerControllerStatic.STATE_PLAYING);
                return;
            }
            that.liveSeekOperation(offset);
        }
        //不清空seek的进度，保存至播放回调返回，判断播放的进度和seek进度之间的差异大到一定程度才回调play
        //that.mSeekCurrent = -1;
        that.mSeekRepeatCount = 0;
        that.mHasDoSeek = true;
    }

    liveSeekOperation(offset) {
        window.Loading.showLoading();
        PlayerDataAccess.mLiveSeekOffset = offset;
        let absoluteStartTime = sysTime.now() - offset;
        let absoluteStartTimeFmt = new Date(absoluteStartTime * 1000).Format();
        let TimeShift = { StartTime: absoluteStartTimeFmt, Offset: offset };
        this.mPlayingParam.mSeekPlayParam.TimeShift = TimeShift;
        JxLog.i([LogType.PLAY], 'common/OttPlayer/doSeek', ["Live doSeek to ", this.mPlayingParam.mSeekPlayParam]);
        OTT.MediaPlayer.close();
        OTT.MediaPlayer.setPlayParams(this.mPlayingParam.mSeekPlayParam);
        OTT.MediaPlayer.play();
        this.mPlayingParam.mSeekPlayParam.TimeShift = {};
        this.setPlayingState(PlayerControllerStatic.STATE_BUFFERING);
    }

    pausePlay () {
        if(this.getPlayingState() == PlayerControllerStatic.STATE_PLAYING) {
            if(!this.isLivePlaying() || OTTConfig.supportLiveSeek()) {   //非直播，或者支持直播时移，解决直播调用pause发非法请求的问题
                this.setPlayingState(PlayerControllerStatic.STATE_PAUSED);
                this.stopAdjustPlayingPosition();
                DataReportModel.pauseTime = sysTime.nowMill();
                DataReportModel.tplay_info.pauseCount++;
                OTT.MediaPlayer.pause();
                if (this.mPlayStateListener != null && this.mPlayStateListener.onPlayerPaused != null) {
                    this.mPlayStateListener.onPlayerPaused();
                }
            }
        }
    }

    resumePlay () {
        var now = sysTime.nowMill();
        if(DataReportModel.pauseTime!==null){
            DataReportModel.tplay_info.pauseSumTime += (now-DataReportModel.pauseTime);
            DataReportModel.pauseTime = null;
        }
        this.notifyLiveStatus(true);
        if(this.getPlayingState() == PlayerControllerStatic.STATE_BUFFERING) {
            if(this.mPlayStateListener != null && this.mPlayStateListener.onPlayerBuffering()) {
                this.mPlayStateListener.onPlayerBuffering();
            }
        }
        let maxSeekTime = OTTConfig.getMaxSeekTime();
        if (this.mPlayingParam.isLive() && PlayerDataAccess.mLiveSeekOffset >= maxSeekTime) {
            this.liveSeekOperation(maxSeekTime);
        } else {
            this.setPlayingState(PlayerControllerStatic.STATE_PLAYING);
            OTT.MediaPlayer.resume();
        }
        if (this.mPlayStateListener != null && this.mPlayStateListener.onPlayerResumed != null) {
            this.mPlayStateListener.onPlayerResumed();
        }
    }

    notifyLiveStatus(isLive) {
        if (OTT.isAndroid()) {
            if(OTTConfig.supportVoiceSearch()) {   //支持语音搜索才需要发广播
                var action = "com.iflytek.xiri.action.LIVE.status";
                var param = {"cp": "bestv", "live": isLive};
                param = JSON.stringify(param);
                OTT.App.sendBroadcast(action, param);
            }
        }
    }
}

export default {PlayerControllerStatic, PlayerParamStatic, PlayerParam, PlayerController}