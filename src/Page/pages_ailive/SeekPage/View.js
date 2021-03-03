import {AbstractView, AbstractListView} from "../../../Abstract/scene/AbstractView";
import OTTConfig from "../../../common/CmsSwitch";
import {seekButtonType, mediaType,eventType} from "../../../common/GlobalConst";
import { sceneIds } from "../../../App/app_ailive/AppGlobal.js";
import {addClass, removeClass} from "../../../common/CommonUtils";
import DataAccess from "../../../common/DataAccess";
import PlayerDataAccess from "../../../common/PlayerDataAccess";
import {PlayerControllerStatic} from "../../../common/OttPlayer";
import {model} from "./Model";
import playIcon from "../../../images/pages_ailive/play_icon.png";
import pauseIcon from "../../../images/pages_ailive/pause_icon.png";
import forwardIcon from "../../../images/pages_ailive/forward_icon.png";
import backwardIcon from "../../../images/pages_ailive/backward_icon.png";

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
        super("seek_info");
        this.viewSeekData = {curCate: "", programName: "", startTime: "", endTime: ""};  //展示进度条的数据（频道、节目信息）
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
        let param = model.getSeekParam();
        let playInfo = param.playInfo;
        let data = model.getSeekData();
        if(playInfo.type == mediaType.JX) {
            this.processJxPlayData(data);
        } else {
            this.processSchPlayData(data);
        }
        this.setFirstPlayerBarData();
    }
    viewPage() {
        super.viewPage();
        this.stateIconEle = document.getElementById("show_icon");
        this.playTimeEle = document.getElementById("play_time");
        this.progressEle = document.getElementById("seek_progress_mid");
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
    //精选播控页面需要展现的数据
    processJxPlayData(data) {
        if (data && data.schDetail) {
            let curPlaySch = data.schDetail;
            this.startTime = curPlaySch.StartTime;
            this.viewSeekData.startTime = this.startTime.substr(8, 2) + ":" + this.startTime.substr(10, 2) + ":" + this.startTime.substr(12, 2);
            this.endTime = curPlaySch.EndTime;
            this.viewSeekData.endTime = this.endTime.substr(8, 2) + ":" + this.endTime.substr(10, 2) + ":" + this.endTime.substr(12, 2);
            this.viewSeekData.curCate = DataAccess.getCateInfo(data.categoryCode);
            let programName = "";
            if (data.programName) {
                programName += data.programName + " ";
            }
            if (curPlaySch.Name) {
                programName += curPlaySch.Name;
            }
            if (curPlaySch.NamePostfix) {
                programName += curPlaySch.NamePostfix;
            }
            this.viewSeekData.curCate += "&nbsp;:&nbsp;"+programName;
            this.viewSeekData.programName = "";
        }
    }
    //回看播控页面需要展现的数据
    processSchPlayData(data) {
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
            this.viewSeekData.curCate = data.ChannelNo + "&nbsp;&nbsp;&nbsp;";
        }
        if (data && OTTConfig.showChannelName()) {
            this.viewSeekData.curCate = data.ChannelName;
        }
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
                this.stateIconEle.style.backgroundImage = "url("+forwardIcon+")";
                break;
            case seekButtonType.BACKWARD:
                this.stateIconEle.style.backgroundImage = "url("+backwardIcon+")";
                break;
            case seekButtonType.PLAY:
                this.stateIconEle.style.backgroundImage = "url("+playIcon+")";
                break;
            case seekButtonType.PAUSE:
                this.stateIconEle.style.backgroundImage = "url("+pauseIcon+")";
                break;
            default:
        }
    }
}
export const view = new View();
export default { view }