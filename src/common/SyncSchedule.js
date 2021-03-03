//同步更新节目单脚本
import {sysTime} from './TimeUtils.js'
import DataAccess from './DataAccess'
import Config from './Config.js'
import JxLog from "./Log"

const refreshDataInterval = function(fun, interval, isSoon){
    let interfun = function(){
        fun();
        setTimeout(interfun, interval);
    };
    if(isSoon){
        interfun();
    }else{
        setTimeout(interfun, interval);
    }
};

const refreshScheduleChannelList = function(value){
    let updateTimes = value['UpdateTimeInfos'];
    let refreshChannels = [];
    let startDay = sysTime.date().Format("yyyy-MM-dd");
    let endDay = sysTime.getTomorrowDay();
    for (let channelCode in updateTimes) {
        let LastUpdateTime = new Date(updateTimes[channelCode]['LastUpdateTime']);
        let sch = DataAccess.getChannelSchedule({
            channelCode: channelCode,
            startDate: startDay
        });
        let newLastUpdateTime = Date.parse(LastUpdateTime);
        if(sch && sch.CurrentDateTime*1000 < newLastUpdateTime){
            refreshChannels.push(channelCode);
        }
    }
    if(refreshChannels.length <= 0 ) return;
    refreshChannelSchedule(refreshChannels, startDay,endDay);
};

const refreshChannelSchedule = function (chList, startDay, endDay = false) {
    function cycleExec () {
        try {
            if (typeof (chList) == "undefined") {
                JxLog.e([], "common/SyncSchedule/refreshChannelSchedule",
                    ["频道数据错误！"]);
                return
            }
            let refreshChannels = chList.slice (0, Config.maxChannelReqSch);
            chList = Config.maxChannelReqSch ? chList.slice (Config.maxChannelReqSch) : [];
            if (refreshChannels.length <= 0) return;
            if (refreshChannels) {
                DataAccess.requestMultiChannelSchedule (refreshChannels, startDay, endDay);
                setTimeout (cycleExec, 180 * 1000);
            }
        } catch (e) {
            console.log (e)
        }
    }
    cycleExec ();
};

const getChannelCodeList = function(channelList){
    let chCode = [];
    for(let i=0;i<channelList.length;i++){
        chCode.push(channelList[i].ChannelCode);
    }
    return chCode;
};

const getTomorrowScheduleForAllChannel = function(){
    let randTimeToGetNextSch = getRandTimeToGetNextSch();
    setTimeout(function(){
        let channelList = DataAccess.getAllLiveChannelFromCache();
        let allChannel = channelList['Channels'];
        let dateStr = sysTime.getTomorrowDay();
        refreshChannelSchedule(allChannel, dateStr);
    }, randTimeToGetNextSch*1000);
};


//返回从当前时间到一个随机可获取下一天节目单的时间之间的秒差并返回
const getRandTimeToGetNextSch = function(){
    let now = sysTime.date();
    let tomorrowDate = sysTime.getTomorrowDay();
    let endTimeStamp = Date.parse(tomorrowDate + " 00:00:00")/1000;
    let nextDayScheduleGetTimeStamp = Date.parse(now.Format('yyyy-MM-dd') + " "+ Config.nextDayScheduleGetTime)/1000;
    let nowTimeStamp = Date.parse(now)/1000;
    let xTime;
    let yTime;
    if(nowTimeStamp<=nextDayScheduleGetTimeStamp){
        xTime = nextDayScheduleGetTimeStamp - nowTimeStamp;
        yTime = endTimeStamp - nowTimeStamp;
    }else if(nowTimeStamp>nextDayScheduleGetTimeStamp){
        xTime = 1;
        yTime = endTimeStamp - nowTimeStamp;
    }
    return  Math.floor(Math.random() * (yTime - xTime)) + xTime;
}

const getUpdateTimeAndIsRefresh = function(){
    DataAccess.requestChannelScheduleUpdateTime({
        callback: refreshScheduleChannelList
    });
};

const isChannelProgramValid = function(channelInfo){
    let CurrentSchedule = channelInfo['CurrentSchedule'];
    if(!CurrentSchedule){
        return false;
    }
    let now = sysTime.nowFormat();
    let StartTime = CurrentSchedule['StartTime'];
    let EndTime = CurrentSchedule['EndTime'];
    if(StartTime <= now && now < EndTime){
        return true;
    }
    return false;
};

const refreshLiveChannelCurrentProgram = function(){
    let allChannel = getAllChannel();
    if(allChannel===null){
        JxLog.e([], "common/SyncSchedule/refreshLiveChannelCurrentProgram",
            ["无直播频道数据，无法刷新频道当前节目单！"]);
        return ;
    }
   allChannel.forEach(chCode => {
        let chInfo = DataAccess.getChannelInfo(chCode);
        if(!isChannelProgramValid(chInfo)){
            updateChannelProgramValid(chInfo);
        }
    });
};

const getAllChannel = function(){
    let newChannel = DataAccess.getAllLiveChannelFromCache();
    let catesChannelList = DataAccess.getCategoryLiveChannelFromCache();
    let channellist = newChannel && newChannel['Channels'];
    catesChannelList = catesChannelList || [];
    catesChannelList.forEach(cateChannels => {
        cateChannels['Channels'].forEach(chCode => {
            if(!channellist){
                return;
            }
            if(!~channellist.indexOf(chCode)){
                channellist.push(chCode);
            }
        });
    });
    return channellist;
}

const updateChannelProgramValid = function(channelInfo){
    let chCode = channelInfo.ChannelCode;
    let getDate = sysTime.date().Format("yyyy-MM-dd");
    let chSch = DataAccess.getChannelSchedule({
        channelCode: chCode,
        startDate: getDate
    });
    channelInfo['NextSchedule'] = null;
    if(!chSch || !chSch['Schedule']) {
        channelInfo['PlayProgramName'] = "暂无节目名称";
        channelInfo['ImageUrl'] = "";
        return;
    }
    let now = sysTime.now();
    let curSchIndex=  findCurrentScheduleIndex(chSch['Schedule'], now, 0, chSch['Schedule'].length);
    let sch = chSch['Schedule'][curSchIndex];
    if(sch && channelInfo['CurrentSchedule'] && sch['ScheduleCode'] !== channelInfo['CurrentSchedule']['ScheduleCode']) {
        channelInfo['PreSchedule'] = channelInfo['CurrentSchedule'];
        channelInfo['CurrentSchedule'] = sch;
        if(curSchIndex < chSch['Schedule'].length ){
            channelInfo['NextSchedule'] = chSch['Schedule'][curSchIndex + 1];
        }
        DataAccess.setChannelInfo(channelInfo);
    }
};


let findCurrentScheduleIndex = function(arr, now, start, end){
    if(end===(start+1)){
        return start;
    }
    let mid = Math.floor( (start + end) /2 );
    let sch = arr[mid];
    let StartTime = Date.parse(sysTime.strToDate(sch['StartTime']))/1000;
    let EndTime = Date.parse(sysTime.strToDate(sch['EndTime']))/1000;
    if(EndTime <= now){
        start = mid;
    }else if(StartTime <= now){
        return mid;
    }else if(StartTime > now){
        end = mid;
    }
    return findCurrentScheduleIndex(arr, now, start, end );
};

class SyncSchedule{
    refreshChannelScheduleData(){ //更新节目单
        refreshDataInterval(getUpdateTimeAndIsRefresh, 30*60*1000, 0);
        getTomorrowScheduleForAllChannel();//定时拉取第二天节目单
    }

    refreshChannelCurrentSch(){ //更新当前节目
        refreshDataInterval(refreshLiveChannelCurrentProgram, 45*1000);
    }

    initChannelScheduleData(){ //获取每个频道的节目单
        setTimeout(function() {
            let allChannel = getAllChannel();
            let nowDay = sysTime.getTodayDay();
            refreshChannelSchedule(allChannel,nowDay);
        },30*1000);
    }
}

const syncSchedule = new SyncSchedule();
export default syncSchedule;