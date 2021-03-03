import {AbstractView, AbstractListView} from "../../../Abstract/scene/AbstractView";
import OTTConfig from "../../../common/CmsSwitch";
import {seekButtonType, eventType} from "../../../common/GlobalConst";
import PlayerDataAccess from "../../../common/PlayerDataAccess";
import {PlayerControllerStatic} from "../../../common/OttPlayer";
import {sysTime} from "../../../common/TimeUtils";
import {model} from "./Model";

class View extends AbstractView {
    constructor() {
        super();
        this.seekView = new seekView();
    }
    viewUpdateData() {
        super.viewUpdateData();
        this.seekView.viewUpdateData();
    }

    viewPage() {
        super.viewPage();
        this.seekView.viewPage();
    }

    destroy() {
        super.destroy();
        this.seekView.destroy();
    }
}

//精选-回看播控显示信息
class seekView extends AbstractListView {
    constructor() {
        super("seek_scene_show");
        this.viewSeekData = {channelNo: "", channelName: "", programName: "", currentTime: "", startTime: "", endTime: "", iconUrl: "play"};  //展示进度条的数据（频道、节目信息）
        this.startTime = null;       //节目的开始时间
        this.endTime = null;          //节目的结束时间
        this.iconState = null;
        this.mPlayerBarData = {time: '', progress: 0};//更新进度条的数据
        this.mLastScheduleCode = null;
        this.stateIconEle = null;    //状态按钮元素
        this.playTimeEle = null;     //正在播放时间元素
        this.progressEle = null;    //进度条宽度元素
    }
    viewUpdateData() {
        let data = model.getSeekData();
        this.viewSeekData.currentTime = new Date(sysTime.now() * 1000).Format("hh:mm");
        if (data && data.CurrentSchedule) {
            let curPlaySch = data.CurrentSchedule;
            this.startTime = curPlaySch.StartTime;
            this.viewSeekData.startTime = this.startTime.substr(8, 2) + ":" + this.startTime.substr(10, 2) + ":" + this.startTime.substr(12, 2);
            this.endTime = curPlaySch.EndTime;
            this.viewSeekData.endTime = this.endTime.substr(8, 2) + ":" + this.endTime.substr(10, 2) + ":" + this.endTime.substr(12, 2);
            if (data.PlayProgramName) {
                this.viewSeekData.programName = data.PlayProgramName;
            }
        }
        if (data && OTTConfig.showChannelNo()) {
            this.viewSeekData.channelNo = data.ChannelNo;
        }
        if (data && OTTConfig.showChannelName()) {
            this.viewSeekData.channelName = data.ChannelName;
        }
        this.setFirstPlayerBarData();
    }
    viewPage() {
        super.viewPage();
        this.stateIconEle = document.getElementById("show_icon");
        this.playTimeEle = document.getElementById("play_time");
        this.progressEle = document.getElementById("seek_progress_mid");
        this.stateIconEle.className = this.viewSeekData.iconUrl;
        this.updatePlayerBarView();
        if(this.iconState) {
            this.updateIcon(this.iconState);
        }
        let param = model.getSeekParam();
        if(param.keyEvent && param.keyEvent.type != eventType.CLICK) {
            PlayerControllerStatic.getInstance().seek(eventType.FIRST_DOWN, param.keyEvent.keyCode);
        }
    }
    setLastScheduleCode(scheduleCode) {
        this.mLastScheduleCode = scheduleCode;
    }


    //设置初始的进度条数据
    setFirstPlayerBarData(){
        let param = model.getSeekParam();
        if(!this.mLastScheduleCode && param.playInfo.bookMark) {    //是从恢复上下文进入（断点续播更新进度条和当前播放时间）
            this.setPlayTimeAndProgress(param.playInfo.progress, 2000);
            this.setLastScheduleCode(param.playInfo.scheduleCode);
        } else {      //从节目单列表进入
            if(param.playInfo.scheduleCode != this.mLastScheduleCode) {   //新的节目,重置进度条和当前播放时间
                this.setPlayTimeAndProgress(0);
                this.setLastScheduleCode(param.playInfo.scheduleCode);
            } else {
                let data = PlayerDataAccess.mSchSeekInfo;
                let percent = data.total>0 ? data.current/data.total : 0;
                this.setPlayTimeAndProgress(percent);
            }
        }
    }

    //根据进度百分比,interval设置进度条、正在播放时间
    setPlayTimeAndProgress(percent, interval=0) {
        if(percent == 0) {
            this.mPlayerBarData.progress = 0;
            this.mPlayerBarData.time = this.viewSeekData.startTime;
        } else {
            this.mPlayerBarData.progress = (percent * 100).toFixed(2);
            let s = Date.parse(new Date().parseExt(this.startTime));
            let e = Date.parse(new Date().parseExt(this.endTime));
            let time = parseInt((e - s) * percent) + s - interval;
            let currentFmt = new Date(time).Format();
            if(currentFmt < this.startTime) {
                this.mPlayerBarData.time = this.viewSeekData.startTime;
            } else {
                this.mPlayerBarData.time = new Date().parseExt(currentFmt).Format('hh:mm:ss');
            }
        }
    }
    //seeking的holding更新进度条、时间的数据
    updatePlayerBarProgress(current, total) {
        let progress = total > 0 ? current/total : 0;
        this.setPlayTimeAndProgress(progress);
    }

    //seeking的first_down开始，定时更新进度条、时间的view
    updatePlayerBarView() {
        let data = this.mPlayerBarData;
        if (data.time != undefined) {
            this.playTimeEle.innerHTML = data.time;
        }
        if (data.progress != undefined) {
            this.progressEle.style.width = data.progress + "%";
        }
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
}
export const view = new View();
export default { view }