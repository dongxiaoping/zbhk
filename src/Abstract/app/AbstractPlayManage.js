import {DataReport,DataReportModel, stopPlayingLogRecord} from "../../common/DataReport";
import {sysTime} from "../../common/TimeUtils";
import {PlayerControllerStatic, PlayerParam} from "../../common/OttPlayer";
import PlayerDataAccess from "../../common/PlayerDataAccess";
import JxLog from "../../common/Log"
import {msgType,playerResponse,mediaType, LogType} from "../../common/GlobalConst"
import {processNotExistTips} from "../../common/CommonUtils";
import OTTConfig from "../../common/CmsSwitch";

export class AbstractPlayManage {
    constructor() {
        this.nowPlayInfo = null; //当前正在播放的节目信息
        this.isStopPrevProgram = true; //切换节目时，上一个节目是否已停止播放的标志位,没有停止false ，已停止true
        this.isReceivePlaying = false; //节目开始播放，是否收到了第一个2.6.3回调(针对甘肃盒子在节目起播前，会发一个2.6.2的回调，然后loading圈隐藏了)
        this.startPlayTimer = null;
        this.playLoadingTimer = null;
        this.bufferLoadingTimer = null;
    }

    //获取当前正在播放的节目信息
    getNowPlayInfo(){
        return this.nowPlayInfo;
    }

    lazyPlay(playInfo){
        this.nowPlayInfo = playInfo;
        let playParamObj = PlayerDataAccess.setPlayParamByPlayInfo(playInfo);
        let playParam = new PlayerParam(playParamObj);
        DataReportModel.createPlayBeginTime();
        DataReportModel.startMillisecond = sysTime.nowMill();
        PlayerControllerStatic.getInstance().startPlay(playParam);
    }

    /* 判断节目和当前正在播放的节目是否相同
     * @playInfo 待判断的节目信息
     * @return 相同返回true 不同返回false
     * */
    isPlaySame(playInfo) {
        let nowPlayInfo = window.WebApp.getNowPlayInfo();
        if(nowPlayInfo && nowPlayInfo.type === playInfo.type) {
            //直播节目：同一个频道，且没有时移过的，才是同一个节目；时移过，就算是新的节目
            let sameLiveCondition = playInfo.type === mediaType.LIVE && nowPlayInfo.channelCode === playInfo.channelCode && (!PlayerDataAccess.mLiveSeekOffset);
            let sameSchCondition = playInfo.type !== mediaType.LIVE && nowPlayInfo.scheduleCode === playInfo.scheduleCode;
            if(sameLiveCondition || sameSchCondition) {
                return true;
            }
        }
        return false;
    }

    //停止播放
    stopPlay(isUserOpAction=true){
        let playerInstance = PlayerControllerStatic.getInstance();
        if(playerInstance.isNeedStop()){
            if(OTTConfig.supportDataReport()) {
                DataReport.stopBreakPointPlayStopRecord();
                stopPlayingLogRecord(isUserOpAction);
                DataReport.updateBreakPointPlayTaskId();
            }
            JxLog.i ([LogType.PLAY], "Abstract/app/AbstractPlayManage/stopPlay", ["Stop playing which play info is ", this.nowPlayInfo]);
            playerInstance.stopPlay();
        }
        this.nowPlayInfo = null;
    }

    /* 判断播放数据格式是否正确
     *设置播放信息,严格按照以下形式设置
     *说明：频道付费需要channelCode，所以回看和精选节目的播放参数也带上channelCode
     *直播：{type:mediaType.LIVE,categoryCode: xxx,channelCode:xxx }
     *精选：{type:mediaType.JX,  categoryCode: xxx,channelCode:xxx, scheduleCode:xxx, startTime:xxx, endTime:xxx}
     *回看：{type:mediaType.SCH, categoryCode: xxx,channelCode:xxx, scheduleCode:xxx, startTime:xxx, endTime:xxx}
     * */
    isPlayInfoFormat (playInfo) {
        if(typeof (playInfo) == "undefined" || playInfo == "") {
            return false
        }
        if (typeof (playInfo.type) == "undefined" || (playInfo.type != mediaType.LIVE && playInfo.type != mediaType.JX
            && playInfo.type != mediaType.SCH)) {
            return false
        }
        if (typeof (playInfo.channelCode) == "undefined" || playInfo.channelCode == "" || playInfo.channelCode == null) {
            return false
        }
        if ((playInfo.type == mediaType.JX || playInfo.type == mediaType.SCH) && (typeof (playInfo.scheduleCode) == "undefined")) {
            return false
        }
        return true
    }

    /* 关闭现有的播放，重新播放一个新的节目
     * @playInfo 播放信息
     * @是否是用户主动播放的行为,默认true，false表示自动播放下一个
     * */
    switchPlay(playInfo,isUserOpAction=true){
        JxLog.i ([LogType.PLAY], 'Abstract/app/AbstractPlayManage/switchPlay', ['Prepare a new play which info is', playInfo]);
        let that = this;
        let isPlaySame = this.isPlaySame(playInfo);
        if(isPlaySame) {
            return;
        }
        window.Loading.showLoading();
        let playerInstance = PlayerControllerStatic.getInstance();
        if(playerInstance.isNeedStop()){
            that.isStopPrevProgram = false;
            if(OTTConfig.supportDataReport()) {
                JxLog.i([LogType.PLAY], "Abstract/AbstractPlayManage/switchPlay",
                    ["tag-breakpoint-report 切换节目,需要做播放上报"]);
                DataReport.reStartBreakPointPlayStopRecord();
                stopPlayingLogRecord();
            }
            this.stopPlay(isUserOpAction);
        }else{
            that.isStopPrevProgram = true;
        }
        if(!DataReport.breakPointPlayStopSetInterval){//解决第一次播放没有开隔断定时器的问题
            if(OTTConfig.supportDataReport()) {
                DataReport.reStartBreakPointPlayStopRecord();
            }
        }
        if(this.startPlayTimer) {
            clearTimeout(this.startPlayTimer);
        }
        this.startPlayTimer = setTimeout(that.lazyPlay(playInfo), 300);
        if(that.playLoadingTimer ){
            clearTimeout(that.playLoadingTimer);
        }
        that.playLoadingTimer = setTimeout(function() {
            if(window.Loading.isPlayLoadingOnShow()){
                JxLog.e([LogType.PLAY], "Abstract/app/AbstractPlayManage/switchPlay",
                    ["loading圈显示超时，loading圈消失"]);
                window.Loading.hiddenLoading();
            }
        },12000);
    }

    receiveBroadcast(type,msg){
        if(type === msgType.PLAYER_STATE) {
            switch(msg.state){
                case playerResponse.PLAYER_LOAD_END:
                    if(msg.status === -1) {
                        processNotExistTips(msg.tipInfo);
                    }
                    break;
                case playerResponse.PLAYER_PLAYING:
                    this.isReceivePlaying = true;
                    JxLog.d([LogType.PLAY], "Abstract/app/AbstractPlayManage/receiveBroadcast",
                        ["播放页面播放状态接受->播放中"]);
                    if(this.isStopPrevProgram&& window.Loading.isPlayLoadingOnShow()){
                        JxLog.i ([LogType.PLAY], "Abstract/app/AbstractPlayManage/receiveBroadcast", ["Playing suceess, loading circle close"]);
                        window.Loading.hiddenLoading();
                    }
                    let nowPlayInfo = window.WebApp.getNowPlayInfo();
                    if(nowPlayInfo.type == mediaType.SCH || nowPlayInfo.type == mediaType.JX) {
                        PlayerDataAccess.mSchSeekInfo = {current: msg.current, total: msg.total};
                    }
                    break;
                case playerResponse.PLAYER_STOP:
                    JxLog.d([LogType.PLAY], "Abstract/app/AbstractPlayManage/receiveBroadcast",
                        ["播放页面播放状态接受->播放结束"]);
                    this.isStopPrevProgram = true;
                    this.isReceivePlaying = false;
                    break;
                case playerResponse.PLAYER_BUFFERING:
                    window.Loading.showLoading();
                    if(this.bufferLoadingTimer) {
                        clearTimeout(this.bufferLoadingTimer);
                    }
                    if(this.isReceivePlaying) {
                        this.bufferLoadingTimer = setTimeout(function () {
                            window.Loading.hiddenLoading();
                        }, 500);
                    }
                    break;
                default:
            }
        }
    }
}

export default {
    AbstractPlayManage
}
