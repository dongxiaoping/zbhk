import Config from "../../../App/app_ailive/app.config";
import {OTT} from "../../../common/OttMiddle";
import {sysTime} from '../../../common/TimeUtils.js'
import {AbstractModel} from "../../../Abstract/scene/AbstractModel";
import {getWeekShowByDate, getSchProgramImageUrl} from "../../../common/CommonUtils";
import {programUpdateDataType, mediaType} from "../../../common/GlobalConst";
import DataAccess from "../../../common/DataAccess";
import { sceneIds } from "../../../App/app_ailive/AppGlobal.js";
import {view} from "./View";

class Model extends AbstractModel {
    constructor() {
        super();
        this.channelInfo = null; //频道信息
        this.dateList = [];    //频道节目单日期列表
        this.programList = []; //频道按天的节目单列表
    }

    modelUpdateData(args){
        super.modelUpdateData(args);
        let that = this;
        that.setChannelInfo();
        that.setDateList();
        let programParam = that.getProgramParamByPlayInfo();
        let startTime = programParam.time + " 00:00:00";
        let endTime = programParam.time + " 23:59:59";
        let reqArgs = {
            channelCode: programParam.channelCode,
            startDate: startTime,
            endDate: endTime,
            callback: function(programData) {
                that.setProgramList(programData);
                args.callback();
            }
        };
        DataAccess.requestChannelSchedule(reqArgs);
    }

    //根据播放信息，获取进入页面需要请求节目单的参数
    getProgramParamByPlayInfo() {
        let res = {channelCode: null, time: null};
        let playInfo = this.getPlayInfo();
        this.channelList = model.getChannelInfo();
        this.dateList = model.getDateList();
        res.channelCode = (playInfo.channelCode) ? playInfo.channelCode : this.channelInfo.ChannelCode;
        if(playInfo.type == mediaType.LIVE) {
            let len = this.dateList.length;
            res.time = this.dateList[len - 1].date;
        } else if(playInfo.type == mediaType.SCH) {
            let startTime = playInfo.startTime;
            res.time = startTime.substr(0, 4)+"-"+startTime.substr(4, 2)+"-"+startTime.substr(6, 2);
        }
        return res;
    }

    setChannelInfo() {
        let playInfo = this.getPlayInfo();
        let channelCode = playInfo.channelCode;
        this.channelInfo = DataAccess.getChannelInfo(channelCode);
    }

    getChannelInfo() {
        return this.channelInfo;
    }

    setDateList() {
        let showDate = DataAccess.getProgramShowDate();
        let dateList = [];
        let len = showDate.length;
        for(let i=0; i<len; i++) {
            let weekShow = getWeekShowByDate(showDate[i]);
            let dateShow = showDate[i].substr(5, 5);
            let item = {weekShow: weekShow, date: showDate[i], dateShow: dateShow, idx: i};
            dateList.push(item);
        }
        this.dateList = dateList;
    }

    getDateList() {
        return this.dateList;
    }

    setProgramList(programData) {
        this.programList = [];
        let programList = null;
        if(programData.Schedule) {
            programList = programData.Schedule;
        }
        if(programList) {
            for(let i=0; i<programList.length; i++) {
                let item = programList[i];
                let endDate = sysTime.strToDate(item.EndTime).Format("yyyy-MM-dd");
                let startDate = sysTime.strToDate(item.StartTime).Format("yyyy-MM-dd");
                item.programImgUrl = getSchProgramImageUrl(item.ChannelCode, item.ScheduleCode, item.StartTime);
                item.startTimeFmt = item.StartTime.substr(8, 2) + ":" + item.StartTime.substr(10, 2);
                if(i == 0) {     //按天取的节目单中，第一个是跨天的节目，就过滤掉该跨天的节目
                    if(startDate == endDate)  {
                        this.programList.push(item);
                    }
                } else {
                    this.programList.push(item);
                }
            }
        }
    }

    getProgramList() {
        return this.programList;
    }

    updateDataAndNode(obj) {
        obj.destroyView();
        obj.viewUpdateData(programUpdateDataType.BY_DATE);
        obj.viewPage();
        obj.updateNode();
    }

    //光标在日期上面移动，根据channelcode+date更新节目单列表
    updateProgramList(channelCode, dateIdx) {
        if(dateIdx === null) {
            dateIdx = 0;
        }
        let startTime = this.dateList[dateIdx].date+" 00:00:00";
        let endTime = this.dateList[dateIdx].date+" 23:59:59";
        let that = this;
        let reqArgs = {
            channelCode: channelCode,
            startDate: startTime,
            endDate: endTime,
            callback: function(programData) {
                that.setProgramList(programData);
                that.updateDataAndNode(view.programListView);
                view.programListView.addSelectedProgramStyle();
            }
        };
        DataAccess.requestChannelSchedule(reqArgs);
    }

    getPlayInfo() {
        return window.WebApp.Nav.getNavParams(sceneIds.CHANNEL_PROGRAM_SCENE_ID);
    }
}

export const model = new Model();
export default {model}
