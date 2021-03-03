import {AbstractModel} from "../../../Abstract/scene/AbstractModel";
import {sysTime} from '../../../common/TimeUtils.js';
import DataAccess from "../../../common/DataAccess";
import { sceneIds } from "../../../App/app_ailive/AppGlobal.js";
import {getWeekShowByDate, getSchProgramImageUrl} from "../../../common/CommonUtils";

class Model extends AbstractModel {
    constructor() {
        super();
        this.programList = [];
        this.dateShow = {};
    }
    modelUpdateData(args){
        let that = this;
        super.modelUpdateData(args);
        let playInfo = that.getPlayInfo();
        let time = playInfo.startTime;
        let dayTime = time.substr(0, 4)+"-"+time.substr(4, 2)+"-"+time.substr(6, 2);
        this.setDateShow(dayTime);
        let reqArgs = {
            channelCode: playInfo.channelCode,
            startDate: dayTime + " 00:00:00",
            endDate: dayTime + " 23:59:59",
            callback: function(programData) {
                that.setProgramList(programData);
                args.callback();
            }
        };
        DataAccess.requestChannelSchedule(reqArgs);
    }

    setDateShow(dayTime){
        let week = getWeekShowByDate(dayTime);
        let date = dayTime.substr(5, dayTime.length - 1);
        this.dateShow = {week: week, date: date};
    }

    getDateShow() {
        return this.dateShow;
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
                let startTime = item.StartTime.substr(8, 2) + ":" + item.StartTime.substr(10, 2);
                let endTime = item.EndTime.substr(8, 2) + ":" + item.EndTime.substr(10, 2);
                item.time = startTime + "-" + endTime;
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

    getTotalProgramListCount() {
        return this.programList.length;
    }

    getProgramByScheduleCode(scheduleCode) {
        if(this.programList) {
            for(let i=0; i<this.programList.length; i++) {
                if(this.programList[i].ScheduleCode == scheduleCode) {
                    return this.programList[i];
                }
            }
        }
        return null;
    }

    getPlayInfo() {
        return window.WebApp.Nav.getNavParams(sceneIds.SCH_PROGRAM_SCENE_ID);
    }
}

export const model = new Model();
export default {model}
