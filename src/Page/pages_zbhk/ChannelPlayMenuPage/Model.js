import {AbstractModel} from "../../../Abstract/scene/AbstractModel"
import DataAccess from "../../../common/DataAccess";
import {getChannelCollectionInfo,getMergeCategoryList,getWeekShowByDate} from "../../../common/CommonUtils"
import { sceneIds } from "../../../App/app_zbhk/AppGlobal";
import JxLog from "../../../common/Log"
import { sysTime } from '../../../common/TimeUtils';
import {focusManage} from "./Focus";
import {programTimeType,mediaType, LogType} from "../../../common/GlobalConst"
import {view} from "./View";
class Model extends AbstractModel {
    constructor() {
        super();
        this.categoryInfo = null;
        this.channelDateSchedule = null;
        this.channelScheduleInfo = null;
    }

    modelUpdateData(args){
        let that = this;
        this.initChannelDateSchedule();
        let categoryLiveList =  DataAccess.getCategoryLiveChannelFromCache();
        let colList  = getChannelCollectionInfo(DataAccess.getCollectedChannel());
        this.categoryList = getMergeCategoryList(categoryLiveList,colList,0);
        let categoryCode = this.getSelectedCategoryCode();
        let theCategoryInfo = model.getCategoryInfoByCode(categoryCode);
        this.setCategoryInfo(theCategoryInfo);

        let selectedChannelCode = this.getSelectedChannelCode();
        let channelInfo = DataAccess.getChannelInfo(selectedChannelCode);
        if(channelInfo.ShowProgram) {
            let selectedDay = this.getSelectedDay();
            let reqArgs = {
                channelCode: selectedChannelCode,
                startDate:selectedDay + " 00:00:00",
                endDate: selectedDay + " 23:59:59",
                callback: function(programData) {
                    let info = model.getFormatProgramSchedule(programData);
                    model.setProgramScheduleByDay(info);
                    args.callback();
                }
            };
            DataAccess.requestChannelSchedule(reqArgs);
        } else {
            model.setProgramScheduleByDay([]);
            args.callback();
        }
    }

    getCategoryInfoByCode(code){
        for(let i=0;i<this.categoryList.length;i++){
            if(this.categoryList[i].Code ===code){
                return this.categoryList[i];
            }
        }
        JxLog.e([LogType.PAGE], "Page/pages_zbhk/ChannelPlayMenuPage/getCategoryInfoByCode",
            ["找不到指定的分类数据", code]);
        return null;
    }

    getSelectedCategoryCode(){
        let param = window.WebApp.Nav.getNavParams(sceneIds.CHANNEL_PLAY_MENU_ID);
        if(param.categoryCode){
            return param.categoryCode;
        }
        let playInfo = window.WebApp.getNowPlayInfo();
        return playInfo.categoryCode;
    }

    getSelectedChannelCode(){
        let selectedLocation = focusManage.getFocusLocation();
        if(selectedLocation){
            let type  = view.getPageElementTypeByLocation(selectedLocation);
            if(type === view.pageElementType.CHANNEL){
                let info = view.getDataByLocation(selectedLocation);
                return info.ChannelCode;
            }
            selectedLocation = view.channelListView.getLostLocation();
            if(selectedLocation){
                let info = view.getDataByLocation(selectedLocation);
                return info.ChannelCode;
            }
        }

        let param = window.WebApp.Nav.getNavParams(sceneIds.CHANNEL_PLAY_MENU_ID);
        if(param&&param.channelCode){
            return param.channelCode;
        }
        let playInfo = window.WebApp.getNowPlayInfo();
        return playInfo.channelCode;
    }

    getSelectedDay(){
        let param = window.WebApp.Nav.getNavParams(sceneIds.CHANNEL_PLAY_MENU_ID);
        if(param.categoryCode){
            return model.getNowDay();
        }
        let playInfo = window.WebApp.getNowPlayInfo();
        if(playInfo.type === mediaType.LIVE){
            return model.getNowDay();
        }else{
            let timeSet = playInfo.startTime;
            return this.getDayTab(timeSet);
        }
    }

    getDayTab(dayTime){
        let year = dayTime.substr(0, 4);
        let moth = dayTime.substr(4, 2);
        let day = dayTime.substr(6, 2);
        return year+"-"+moth+"-"+day;
    }

    getSelectedScheduleCode(){
        let param = window.WebApp.Nav.getNavParams(sceneIds.CHANNEL_PLAY_MENU_ID);
        if(param.categoryCode){
            return null;
        }
        let playInfo = window.WebApp.getNowPlayInfo();
        if(playInfo.type === mediaType.LIVE){
            let programInfo =  this.getLiveProgramInfo();
            return programInfo?programInfo.ScheduleCode:null;
        }else{
            return playInfo.scheduleCode;
        }

    }

    setCategoryInfo(info){
        this.categoryInfo = info;
    }

    getCategoryInfo(){
        return this.categoryInfo;
    }

    getCategoryCode(){
        return this.categoryInfo.Code;
    }

    //设置节目日期单
    initChannelDateSchedule(){
        let json = DataAccess.getProgramShowDate();
        function formatChannelDateSchedule(json){
            let items = [];
            let month;
            let day;
            let len = json.length;
            for(let i=len-1;i>=0;i--){
                let arr=json[i].split("-");
                month = arr[1];
                day = arr[2];
                let item ={date:json[i],showName:null};
                item.showName = getWeekShowByDate(item.date);
                item.showName = month+"/"+day+" "+item.showName;
                items.push(item);
            }
            return items;
        }
        this.channelDateSchedule = formatChannelDateSchedule(json);
    }

    getChannelDateSchedule(){
        return this.channelDateSchedule;
    }

    getNowDay(){
        return this.channelDateSchedule[0].date;
    }

    changeChannelScheduleInfo(channelCode,dayTime){
        let channelInfo = DataAccess.getChannelInfo(channelCode);
        if(!channelInfo.ShowProgram) {    //屏蔽回看的频道，不请求节目单
            model.setProgramScheduleByDay([]);
            return;
        }
        let reqArgs = {
            channelCode: channelCode,
            startDate:dayTime + " 00:00:00",
            endDate: dayTime + " 23:59:59",
            callback: function(programData) {
                let info = model.getFormatProgramSchedule(programData);
                model.setProgramScheduleByDay(info);
            }
        };
        DataAccess.requestChannelSchedule(reqArgs);
    }

    //获取节目单页面展示需要的格式化节目单数据
    getFormatProgramSchedule (channelScheduleInfo) {
        try {
            if (typeof (channelScheduleInfo) == "undefined" || typeof (channelScheduleInfo.Schedule) == "undefined") {
                JxLog.e ([], 'Page/pages_zbhk/ChannelPlayMenuPage/getFormatProgramSchedule',
                    ["数据格式错误", channelScheduleInfo]);
                return [];
            }
            let list = channelScheduleInfo.Schedule;
            let hour;
            let minute;
            let nowTime = sysTime.nowFormat ();
            let i = 0;
            for (; i < list.length; i++) {
                if (nowTime > list[i].EndTime) {
                    list[i].programType = programTimeType.IS_LOOK_BACK;
                } else if (nowTime < list[i].StartTime) {
                    list[i].programType = programTimeType.IS_FORE_SHOW;
                } else {
                    list[i].programType = programTimeType.IS_LIVE;
                }
                hour = list[i].StartTime.substr (8, 2);
                minute = list[i].StartTime.substr (10, 2);
                list[i].timeName = hour + ":" + minute;
                list[i].showName = list[i].Name;
            }
            //对跨天的情况进行处理
            let startDate = sysTime.strToDate (list[0].StartTime).Format ("yyyy-MM-dd");
            let endDate = sysTime.strToDate (list[0].EndTime).Format ("yyyy-MM-dd");
            if (startDate !== endDate) {
                list.splice (0, 1)
            }
            return list;
        } catch (e) {
            JxLog.e ([], 'Page/pages_zbhk/ChannelPlayMenuPage/getFormatProgramSchedule', [e.toLocaleString ()]);
            return []
        }
    }

    setProgramScheduleByDay(info) {
        let isInit = this.channelScheduleInfo ===null;
        this.channelScheduleInfo = info;
        if(!isInit){
            view.programListView.channelScheduleInfoUpdatedNotice();
        }
    }

    getChannelScheduleInfo(){
        return this.channelScheduleInfo;
    }

    getLiveProgramInfo(){
        let list = this.getChannelScheduleInfo();
        for(let i=0;i<list.length;i++){
            if(list[i].programType===programTimeType.IS_LIVE){
                return list[i];
            }
        }
        return null;
    }

    isChannelInCollection(channelCode){
        let collectList = DataAccess.getCollectedChannel();
        for(let j=0;j<collectList.length;j++){
            if(channelCode === collectList[j].channelCode){
                return true;
            }
        }
        return false;
    }
}

export const model = new Model();
export default {model}