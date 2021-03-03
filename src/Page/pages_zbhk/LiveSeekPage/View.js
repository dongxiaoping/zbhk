import {AbstractView, AbstractListView} from "../../../Abstract/scene/AbstractView";
import {sysTime} from "../../../common/TimeUtils";
import OTTConfig from "../../../common/CmsSwitch";
import PlayerDataAccess from "../../../common/PlayerDataAccess";
import {seekButtonType, eventType} from "../../../common/GlobalConst";
import {PlayerControllerStatic} from "../../../common/OttPlayer";
import {model} from "./Model";

class View extends AbstractView {
    constructor() {
        super();
        this.liveSeekView = new liveSeekView();
    }
    viewUpdateData() {
        super.viewUpdateData();
        this.liveSeekView.viewUpdateData();
    }

    viewPage() {
        super.viewPage();
        this.liveSeekView.viewPage();
    }

    destroy(){
        super.destroy();
        this.liveSeekView.destroy();
    }
}

//直播时移显示信息
class liveSeekView extends AbstractListView{
    constructor() {
        super("live_seek_scene_show");
        this.viewChannelSeekData = {channelNo: "", channelName: "", curName: "", curPlayTime: "", nowTime: "", iconUrl: "play"};
        this.mPlayerBarData = {time: '0', progress: 100};
        this.mLastChannelCode = null;
        this.onPlayingTimer = null;     //播放的时候，mPlayingTime每秒加1
        this.onPauseTimer = null;       //暂停的时候，mSeekCurrent每秒减1
        this.seekIconEle = null;     //时移标志按钮
        this.stateIconEle = null;    //状态按钮元素
        this.playTimeEle = null;     //正在播放时间元素
        this.nowTimeEle = null;      //当前时间元素
        this.progressEle = null;    //进度条宽度元素
    }
    viewUpdateData(){
        let data = model.getChannelSeekData();
        if(OTTConfig.showChannelNo()) {
            this.viewChannelSeekData.channelNo = data.ChannelNo;
        }
        if(OTTConfig.showChannelName()) {
            this.viewChannelSeekData.channelName = data.ChannelName;
        }
        if(data.CurrentSchedule) {
            let nowFmt = sysTime.date().Format('hh:mm:ss');
            this.viewChannelSeekData.curPlayTime = nowFmt;
            this.viewChannelSeekData.nowTime = nowFmt;
        }
        this.viewChannelSeekData.curName = data.PlayProgramName;
        this.setFirstPlayerBarData();
    }

    viewPage() {
        super.viewPage();
        this.seekIconEle = document.getElementById("live_seek_icon");
        this.stateIconEle = document.getElementById("live_show_icon");
        this.playTimeEle = document.getElementById("cur_play_time");
        this.nowTimeEle = document.getElementById("now_time");
        this.progressEle = document.getElementById("live_progress_mid");
        this.stateIconEle.className = this.viewChannelSeekData.iconUrl;
        if(OTTConfig.showChannelNo()) {
            document.getElementById("seek_channel_no").style.marginRight = "20px";
        }
        this.updatePlayerBarView();
        if(this.iconState) {
            this.updateIcon(this.iconState);
        }
        let param= model.getLiveSeekParam();
        if(param.keyEvent && param.keyEvent.type != eventType.CLICK) {
            PlayerControllerStatic.getInstance().seek(eventType.FIRST_DOWN, param.keyEvent.keyCode);
        }
    }

    setLastChannelCode(channelCode) {
        this.mLastChannelCode = channelCode;
    }

    //设置初始的进度条、时间数据
    setFirstPlayerBarData(){
        let param = model.getLiveSeekParam();
        this.mPlayerBarData.time = this.viewChannelSeekData.nowTime;
        //不同的节目，或同一节目但是没有时移过，时移进度条为100
        if(param.playInfo.channelCode != this.mLastChannelCode || (param.playInfo.channelCode == this.mLastChannelCode && !PlayerDataAccess.mLiveSeekOffset)) {   //新的节目
            this.mPlayerBarData.progress = 100;
            this.setLastChannelCode(param.playInfo.channelCode);
        } else {
            this.updatePlayerBarProgress(PlayerDataAccess.mSeekCurrent, OTTConfig.getMaxSeekTime());
        }
    }

    getPlayerBarData() {
        return this.mPlayerBarData;
    }

    //seeking的holding更新进度条、时间的数据
    updatePlayerBarProgress(current, total) {
        let progress = 100;
        if(total > 0) {
            progress = ((current/total) * 100).toFixed(2);
        }
        this.mPlayerBarData.progress = progress;
        let offset = total - current;
        let time = new Date((sysTime.now() - offset) * 1000).Format('hh:mm:ss');
        this.mPlayerBarData.time = time;
        PlayerDataAccess.mPlayingTime = PlayerDataAccess.mSeekCurrent = current;
    }

    //seeking的first_down开始，定时更新（时移icon/正在播放时间/当前时间/进度条）
    updatePlayerBarView() {
        var data = this.getPlayerBarData();
        var now = sysTime.date().Format('hh:mm:ss');
        if(parseInt(data.progress) >= 100) {
            this.seekIconEle.style.display = "none";
        } else {
            this.seekIconEle.style.display = "block";
        }
        this.playTimeEle.innerHTML = data.time;
        this.nowTimeEle.innerHTML = now;
        this.progressEle.style.width = data.progress+"%";
    }

    updateIcon(type) {
        this.iconState = type;
        switch(type) {
            case seekButtonType.FORWARD:
                this.stateIconEle.className = "forward"
                break;
            case seekButtonType.BACKWARD:
                this.stateIconEle.className = "backward"
                break;
            case seekButtonType.PLAY:
                this.stateIconEle.className = "play"
                break;
            case seekButtonType.PAUSE:
                this.stateIconEle.className = "pause"
                break;
            default:
        }
    }

    startUpdatePlayingTime() {
        if(OTTConfig.supportLiveSeek()) {
            if (this.onPauseTimer) {
                clearInterval(this.onPauseTimer);
            }
            if (this.onPlayingTimer) {
                clearInterval(this.onPlayingTimer);
            }
            this.onPlayingTimer = setInterval(function () {
                PlayerDataAccess.mPlayingTime++;
                let maxTime = OTTConfig.getMaxSeekTime();
                if(PlayerDataAccess.mPlayingTime > maxTime) {
                    PlayerDataAccess.mPlayingTime = maxTime;
                }
            }, 1000);
        }
    }

    stopUpdatePlayingTime() {
        if(OTTConfig.supportLiveSeek()) {
            let that = this;
            if(this.onPlayingTimer) {
                clearInterval(this.onPlayingTimer);
            }
            if(this.onPauseTimer) {
                clearInterval(this.onPauseTimer);
            }
            this.onPauseTimer = setInterval(function() {
                PlayerDataAccess.mSeekCurrent--;
                if(PlayerDataAccess.mSeekCurrent < 0) {        //已经快退到最大时移范围了
                    PlayerDataAccess.mSeekCurrent = 0;
                    clearInterval(this.onPauseTimer);
                }
                that.updatePlayerBarProgress(PlayerDataAccess.mSeekCurrent, OTTConfig.getMaxSeekTime());
                that.updatePlayerBarView();
            }, 1000);
        }
    }
}

export const view = new View();
export default {view}