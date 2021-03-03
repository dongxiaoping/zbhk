//播放相关数据设置及更新
import DataAccess from "./DataAccess";
import {OTTConfig} from "./CmsSwitch";
import Config from "./Config";
import {PlayerParamStatic, PlayerControllerStatic} from "./OttPlayer"
import {liveInfo, mediaType, defaultLiveCode} from "./GlobalConst";
import {processNotExistTips} from "./CommonUtils";
import {sysTime } from "./TimeUtils";
import {webStorage} from './LocalStorage'
import JxLog from "./Log"

let PlayerDataAccess = {
    mPlayInfo: null,
    mLastLiveInfo: null,
    channelNum: "",               //数字键选台的频道号
    showChannelNumTimer: null,    //显示频道号的计时器
    mSchSeekInfo: {current: 0, total: 0},          //回看节目，进度条的计算
    mSeekCurrent: 0,       //seek到的时间，计算并更新进度条
    mPlayingTime: 0,       //正在播放的时间,每次seek的时候，设置当前播放时间
    mBookMark: {bookMark: 0, progress: 0},   //回看-精选节目播放到的时间点/进度/节目（单位为秒），用于断点续播
    mLiveSeekOffset: 0,                      //直播节目的时移（为0表示没有时移，正在直播）
    mAuthResultMap: {},
    mSwitchChannels: null,         //上下键切台的切台频道范围
    mSwitchCategoryCode: null,     //上下键切台后的播放频道的分类code

    //设置播放信息,严格按照以下形式设置
    //说明：频道付费需要channelCode，所以回看和精选节目的播放参数也带上channelCode
    //直播：{type:mediaType.LIVE,categoryCode: xxx,channelCode:xxx }
    //精选：{type:mediaType.JX,  categoryCode: xxx,channelCode:xxx, scheduleCode:xxx, startTime:xxx, endTime:xxx}
    //回看：{type:mediaType.SCH, categoryCode: xxx,channelCode:xxx, scheduleCode:xxx, startTime:xxx, endTime:xxx}
    setPlayInfo: function(playInfo) {
        this.mPlayInfo = playInfo;
    },

    setInitSeekTime: function() {
        let maxTime = OTTConfig.getMaxSeekTime();
        this.mSeekCurrent = maxTime;
        this.mPlayingTime = maxTime;
    },

    //获取播放信息
    getPlayInfo: function() {
        return this.mPlayInfo;
    },

    //获取上一频道
    getPrevChannel: function() {
        let playInfo = window.WebApp.getNowPlayInfo();
        this.setSwitchChannelInfo();
        let prevChannelCode = "";
        if(this.mSwitchChannels) {
            let allChannel = this.mSwitchChannels.Channels;
            if(playInfo.channelCode) {
                let i = 0;
                for(; i<allChannel.length; i++) {
                    if(allChannel[i] == playInfo.channelCode) {
                        break;
                    }
                }
                if(i > 0 && i < allChannel.length) {
                    i--;
                } else {
                    i = allChannel.length - 1;
                }
                prevChannelCode = allChannel[i];
            } else {
                prevChannelCode = allChannel[0];
            }
        }
        let newPlayInfo = {type: playInfo.type, categoryCode: this.mSwitchCategoryCode, channelCode: prevChannelCode};
        return newPlayInfo;
    },

    //获取下一频道
    getNextChannel: function() {
        let playInfo = window.WebApp.getNowPlayInfo();
        this.setSwitchChannelInfo();
        let nextChannelCode = "";
        if(this.mSwitchChannels) {
            let allChannel = this.mSwitchChannels.Channels;
            if(playInfo.channelCode) {
                let i = 0;
                for (; i < allChannel.length; i++) {
                    if (allChannel[i] == playInfo.channelCode) {
                        break;
                    }
                }
                if (i >= 0 && i < allChannel.length - 1) {
                    i++;
                } else {
                    i = 0;
                }
                nextChannelCode = allChannel[i];
            } else {
                nextChannelCode = allChannel[0];
            }
        }
        let newPlayInfo = {type: playInfo.type, categoryCode: this.mSwitchCategoryCode, channelCode: nextChannelCode};
        return newPlayInfo;
    },

    setSwitchChannelInfo() {
        let playInfo = window.WebApp.getNowPlayInfo();
        if(!OTTConfig.channelUDCRange()) {
            this.mSwitchChannels = this.getCategoryChannels(playInfo);
            this.mSwitchCategoryCode = playInfo.categoryCode;
        } else {
            this.mSwitchChannels = DataAccess.getAllLiveChannelFromCache();
            this.mSwitchCategoryCode = this.mSwitchChannels.Code;
        }
    },

    getCategoryChannels: function(playInfo) {
        let allCategoryChannel = DataAccess.getCategoryLiveChannelFromCache();
        if(!playInfo.categoryCode) {
            playInfo.categoryCode = defaultLiveCode;          //没有传递分类code，默认使用全部分类
        }
        let categoryChannel = null;
        if(allCategoryChannel) {
            for(let k=0; k<allCategoryChannel.length; k++) {
                if(allCategoryChannel[k].Code == playInfo.categoryCode) {
                    categoryChannel = allCategoryChannel[k];
                    break;
                }
            }
        }
        return categoryChannel;
    },

    //根据categoryCode，scheduleCode获取节目剧集详情(回看节目屏显、快进快退剧集显示)
    getSchDetailByCategorySchedule: function(categoryCode, scheduleCode) {
        let detailInfo = {categoryCode: categoryCode, programName: null, schDetail: null, allSchedules: null};
        let cateObj = webStorage.getItem(categoryCode);
        if(!cateObj || cateObj.Count <= 0) return null;
        let programs = cateObj.keys;
        for(let i=0; i<programs.length; i++) {
            let item = programs[i];
            for(let j=0; j<item.schedules.length; j++) {
                if(item.schedules[j].ScheduleCode == scheduleCode) {
                    detailInfo.programName = item.keyname;
                    detailInfo.schDetail = item.schedules[j];   //当前正在播放的剧集详情
                    detailInfo.allSchedules = item.schedules;   //当前节目的所有剧集
                    return detailInfo;
                }
            }
        }
        return null;
    },

    //根据categoryCode、scheduleCode查找上一节目(crossProgramFlag：切换节目时，是否跨节目的标志)
    getPrevSchProgram: function(categoryCode, scheduleCode, crossProgramFlag=true) {
        let res = {categoryCode:categoryCode, channelCode: "", scheduleCode: "", startTime: "", endTime: ""};
        let cateObj = webStorage.getItem(categoryCode);
        if(!cateObj || cateObj.Count <= 0) {
            return;
        }
        let selectProgram = null;
        let programs = cateObj.keys;
        let programsLen = programs.length;
        for(let i=0; i<programsLen; i++) {
            let item = programs[i];
            let j=0;
            for(; j<item.schedules.length; j++) {
                if(item.schedules[j].ScheduleCode == scheduleCode) {
                    break;
                }
            }
            if(j < item.schedules.length -1) {     //该剧集在该节目中不是最老一集，可以下键切换到老的一集
                let next = item.schedules[j+1];
                res.channelCode = next.ChannelCode;
                res.scheduleCode = next.ScheduleCode;
                res.startTime = next.StartTime;
                res.endTime = next.EndTime;
                return res;
            } else if(j == item.schedules.length -1) {      //该剧集在该节目中是最老一集
                if(crossProgramFlag) {
                    if (i == 0) {    //该节目是分类下第一个节目，取该分类最后一个节目
                        selectProgram = programs[programsLen - 1];
                    } else {    //取该节目的上一个节目
                        selectProgram = programs[i - 1];
                    }
                    let next = selectProgram.schedules[0];   //最新一集
                    res.channelCode = next.ChannelCode;
                    res.scheduleCode = next.ScheduleCode;
                    res.startTime = next.StartTime;
                    res.endTime = next.EndTime;
                    return res;
                } else {   //该剧集在该节目中是最老一集,不跨节目，找不到prevSchProgram
                    return null;
                }
            }
        }
    },

    /* 根据JX节目的播放信息，获取下一个回看节目的信息
     * @categoryCode 当前JX节目的分类
     * @scheduleCode 当前JX节目的节目code
     * @crossProgramFlag 切换节目时，是否跨节目的标志
     * @return 下一个JX节目的播放信息
     * */
    getNextSchProgram: function(categoryCode, scheduleCode, crossProgramFlag=true) {
        let res = {categoryCode: categoryCode, channelCode: "", scheduleCode: "", startTime: "", endTime: ""};
        let cateObj = webStorage.getItem(categoryCode);
        if(!cateObj || cateObj.Count <= 0) {
            return;
        }
        let selectProgram = null;
        let programs = cateObj.keys;
        let programsLen = programs.length;
        for(let i=0; i<programsLen; i++) {
            let item = programs[i];
            let j=0;
            for(; j<item.schedules.length; j++) {
                if(item.schedules[j].ScheduleCode == scheduleCode) {
                    break;
                }
            }
            if(j > 0 && j<item.schedules.length) {     //该剧集在该节目中不是最新一集，可以下键切换到新的一集
                let next = item.schedules[j - 1];
                res.channelCode = next.ChannelCode;
                res.scheduleCode = next.ScheduleCode;
                res.startTime = next.StartTime;
                res.endTime = next.EndTime;
                return res;
            } else if(j == 0) {      //该剧集在该节目中是最新一集
                if(crossProgramFlag) {
                    if (i == programsLen - 1) {    //该节目是分类下最后一个节目，取该分类第一个节目
                        selectProgram = programs[0];
                    } else {    //取该节目的下一个节目
                        selectProgram = programs[i + 1];
                    }
                    let next = selectProgram.schedules[selectProgram.schedules.length - 1];   //最老一集
                    res.channelCode = next.ChannelCode;
                    res.scheduleCode = next.ScheduleCode;
                    res.startTime = next.StartTime;
                    res.endTime = next.EndTime;
                    return res;
                } else {   //该剧集在该节目中是最新一集，不跨节目，找不到nextSchProgram
                    return null;
                }
            }
        }
    },

    //根据channelCode, scheduleCode, time等信息获取节目剧集详情(包括频道信息、当前回顾节目、下一回顾节目)
    getReviewDetailByChannelSchedule: function(playInfo) {
        let res = null;
        if(playInfo && playInfo.channelCode) {
            res = DataAccess.getChannelInfo(playInfo.channelCode);
            if(!res) {
                setTimeout(PlayerDataAccess.getReviewDetailByChannelSchedule, 100);
                return;
            }
        }
        if(res.CurrentSchedule) {
            res.CurrentSchedule = null;
        }
        if(res.NextSchedule) {
            res.NextSchedule = null;
        }
        let startTime = playInfo.startTime;    //以startTime为标准，取一天的节目单
        let fmStartTime = startTime.substr(0, 4) + "-" + startTime.substr(4, 2) + "-" + startTime.substr(6, 2);
        let cacheKey = playInfo.channelCode+"_"+fmStartTime;
        let channelProgram = webStorage.getItem(cacheKey);
        if(channelProgram) {
            if(channelProgram.Schedule) {
                let programs = channelProgram.Schedule;
                let len = programs.length;
                for(let i=0; i<len; i++) {
                    if(programs[i].ScheduleCode == playInfo.scheduleCode) {
                        res.CurrentSchedule = programs[i];
                        res['PlayProgramName'] = res.CurrentSchedule ? res.CurrentSchedule['Name'] : "暂无节目名称";
                        if((i+1) < len) {
                            res.NextSchedule = programs[i+1];
                        } else {    //当前播的是这天的最后一个节目
                            let next = sysTime.timeStampToStr(sysTime.strToTimeStamp(playInfo.startTime)+24*3600);
                            let nextDate = next.substr(0, 4) + "-" + next.substr(4, 2) + "-" + next.substr(6, 2);
                            let nextKey = playInfo.channelCode+"_"+nextDate;
                            let nextDayProgram = webStorage.getItem(nextKey);
                            if(nextDayProgram && nextDayProgram.Schedule) {          //下一天的节目单在缓存中有数据，下一个节目为下一天的第一条节目
                                res.NextSchedule = nextDayProgram.Schedule[0];
                            } else {        //下一天的节目单在缓存中没有数据，下一个节目为这一天第一个节目
                                res.NextSchedule = programs[0];
                            }
                        }
                        return res;
                    }
                }
            }
        }
        return res;
    },

    //根据channelCode, scheduleCode, time等信息查找上一节目
    getPrevReviewProgram: function(playInfo) {
        let prevReviewProgram = {categoryCode: playInfo.categoryCode, channelCode: playInfo.channelCode, scheduleCode: "", startTime: "", endTime: ""};
        let time = playInfo.startTime;
        let fmTime = time.substr(0, 4) + "-" + time.substr(4, 2) + "-" + time.substr(6, 2);
        let cacheKey = playInfo.channelCode+"_"+fmTime;
        let channelProgram = webStorage.getItem(cacheKey);
        if(channelProgram && channelProgram.Schedule) {
            let programs = channelProgram.Schedule;
            let i = 0;
            for(; i<programs.length; i++) {
                if(programs[i].ScheduleCode == playInfo.scheduleCode) {
                    break;
                }
            }
            if(i == 0) {
                i = programs.length - 1;
            } else {
                i--;
            }
            prevReviewProgram.type = mediaType.SCH;
            prevReviewProgram.scheduleCode = programs[i].ScheduleCode;
            prevReviewProgram.startTime = programs[i].StartTime;
            prevReviewProgram.endTime = programs[i].EndTime;
            prevReviewProgram.detail = programs[i];
        }
        return prevReviewProgram;
    },

    /* 根据回看节目的播放信息，获取下一个回看节目的信息
     * @playInfo 当前回看节目的播放信息
     * @return 下一个回看节目的播放信息
     * */
    getNextReviewProgram: function(playInfo) {
        let nextReviewProgram = {categoryCode: playInfo.categoryCode, channelCode: playInfo.channelCode};
        let time = playInfo.startTime;
        let fmTime = time.substr(0, 4) + "-" + time.substr(4, 2) + "-" + time.substr(6, 2);
        let cacheKey = playInfo.channelCode+"_"+fmTime;
        let channelProgram = webStorage.getItem(cacheKey);
        if(channelProgram && channelProgram.Schedule) {
            let nextProgram = null;
            let programs = channelProgram.Schedule;
            let i = 0;
            for(; i<programs.length; i++) {
                if(programs[i].ScheduleCode == playInfo.scheduleCode) {
                    break;
                }
            }
            if(i == programs.length - 1) {      //当前播的是这天的最后一个节目
                let next = sysTime.timeStampToStr(sysTime.strToTimeStamp(playInfo.startTime)+24*3600);
                let nextDate = next.substr(0, 4) + "-" + next.substr(4, 2) + "-" + next.substr(6, 2);
                let nextKey = playInfo.channelCode+"_"+nextDate;
                let nextDayProgram = webStorage.getItem(nextKey);
                if(nextDayProgram && nextDayProgram.Schedule) {          //下一天的节目单在缓存中有数据，续播下一天的第一条节目
                    nextProgram = nextDayProgram.Schedule[0];
                } else {        //下一天的节目单在缓存中没有数据，续播这一天第一个节目
                    nextProgram = programs[0];
                }
            } else {
                nextProgram = programs[i+1];
            }
            let now = sysTime.date().Format();   //回顾节目的续播为直播
            if(nextProgram.StartTime <= now && now <= nextProgram.EndTime) {
                nextReviewProgram.type = mediaType.LIVE;
            } else {
                nextReviewProgram.type = mediaType.SCH;
                nextReviewProgram.scheduleCode = nextProgram.ScheduleCode;
                nextReviewProgram.startTime = nextProgram.StartTime;
                nextReviewProgram.endTime = nextProgram.EndTime;
            }
            nextReviewProgram.detail = nextProgram;
        }
        return nextReviewProgram;
    },

    //获取频道的当前直播节目
    getChannelCurrentProgram(channelCode) {
        let currentProgram = {};
        let cacheKey = channelCode + "_" + sysTime.date().Format("yyyy-MM-dd");
        let channelProgram = webStorage.getItem(cacheKey);
        if(channelProgram && channelProgram.Schedule) {
            let programs = channelProgram.Schedule;
            let now = sysTime.date().Format();
            for(let i = 0; i<programs.length; i++) {
                if(programs[i].StartTime <= now && now <= programs[i].EndTime) {
                    currentProgram = programs[i];
                }
            }
        }
        return currentProgram;
    },

    //根据设置的播放信息组装成调用播放需要的参数
    setPlayParamByPlayInfo: function(playInfo) {
        let playParam = {itemType: "", itemCode: "", clipCode: "", startTime: "", endTime: "", channelCode: ""};
        if(playInfo.type == mediaType.LIVE) {     //直播
            playParam = {itemType: PlayerParamStatic.TYPE_LIVE, itemCode: playInfo.channelCode, clipCode: playInfo.channelCode,
                         startTime: "", endTime: "", channelCode: playInfo.channelCode, categoryCode: liveInfo.CODE};
        } else if(playInfo.type == mediaType.SCH || playInfo.type == mediaType.JX) {    //回看或精选
            playParam = {itemType: PlayerParamStatic.TYPE_SCH, itemCode: playInfo.scheduleCode, clipCode: playInfo.channelCode,
                         startTime: playInfo.startTime, endTime: playInfo.endTime, channelCode: playInfo.scheduleCode};
            playParam.categoryCode = playInfo.categoryCode ? playInfo.categoryCode : "";
            playParam.bookMark = playInfo.bookMark ? playInfo.bookMark : 0;
        }
        return playParam;
    },

    //调用播放器startPlay函数的时候，设置最后一次播放的直播信息(直播、回看存储频道信息；精选不存储)
    setLastLiveChannelInfo(playParam) {
        let channelCode = "";
        if(playParam.mType == PlayerParamStatic.TYPE_LIVE) {
            channelCode = playParam.mItemCode;
        } else {
            if(!playParam.mCategoryCode) {
                channelCode = playParam.mClipCode;
            }
        }
        if(channelCode) {
            let param = {channelCode: channelCode, playTime: sysTime.now() * 1000};
            this.mLastLiveInfo = param;
        }
    },

    onKeyEvent(keyCode) {
        let num = (keyCode - 48).toString();
        let that = this;
        if(that.channelNum == ""){
            that.channelNum = num;
        }else{
            if(that.channelNum.length >= 4){
                that.channelNum = that.channelNum.substr(1,3);
            }
            that.channelNum = that.channelNum + num;
        }
        //在屏幕上显示频道号
        let channelEle = document.getElementById("channel-number-id");
        channelEle.innerHTML = that.channelNum;
        channelEle.style.display = "block";
        clearTimeout(that.showChannelNumTimer);
        that.showChannelNumTimer = setTimeout(function(){
            that.getChannelInfoByChannelNum(that.channelNum);
            that.channelNum = "";
            channelEle.style.display="none";
        }, 2 * 1000);
        return false;
    },

    getBLen(str) {
        if (str == null) return 0;
        if (typeof str != "string"){
            str += "";
        }
        return str.replace(/[^\x00-\xff]/g,"01").length;
    },

    getChannelInfoByChannelNum(channelNo){
        let playChannelCode = null;
        let allInfo = DataAccess.getAllLiveChannelFromCache();
        if (allInfo) {
            while (channelNo.substr(0, 1) == '0') {
                let len = this.getBLen(channelNo);
                channelNo = channelNo.substr(1, len - 1);
            }
            let allLiveChannels = allInfo.Channels;
            let len = allLiveChannels.length;
            for (let i = 0; i < len; i++) {
                let itemInfo = DataAccess.getChannelInfo(allLiveChannels[i]);
                let thisChannelNo = itemInfo.OriginChannelNo;
                while (thisChannelNo.substr(0, 1) == '0') {   //去掉开头的0
                    let len = thisChannelNo.length;
                    thisChannelNo = thisChannelNo.substr(1, len - 1);
                }
                if (thisChannelNo == channelNo) {
                    playChannelCode = itemInfo.ChannelCode;
                    break;
                }else{
                }
            }
            if (playChannelCode) { //输入的频道号对应的频道存在
                if (OTTConfig.supportDSZbhk()) {
                    window.WebApp.playByChannelCode(playChannelCode);
                }
            } else {  //输入的频道号对应的频道不存在,给出提示
                if(channelNo==="2378"||channelNo==="8732"){//彩蛋切换成debugger模式
                    JxLog.openDebuggerForApp();
                    JxLog.openDebuggerForCookie();
                    let tips = "已开启debugger模式";
                    processNotExistTips(tips);
                    JxLog.i([], "common/PlayerDataAccess/onKeyEvent",
                        ["开启debugger模式"]);
                }else{
                    if (OTTConfig.supportDSZbhk()) {
                        let tips = "该频道不存在，请选择其他频道";
                        processNotExistTips(tips);
                    }
                }
            }
        }
    },

    //语音根据channelcode播放
    playByVoiceChannelCode(channelCode) {
        let that = this;
        channelCode = decodeURIComponent(channelCode);
        DataAccess.requestLiveCategoryChannel({callback: function(data) {
            let allChannels = data.Channels;
            if(allChannels) {
                let len = allChannels.length;
                for(let i = 0; i<len; i++) {
                    if(allChannels[i] == channelCode) {
                        window.WebApp.playByChannelCode(channelCode);
                        return;
                    }
                }
                processNotExistTips("该频道不存在，请选择其他频道");
            }
        }});
    },

    //语音上一频道、下一频道(应用内部的回调,存在playerScene)
    playByVoiceCtrl(ctrlType) {
        // todo 若后期语音搜索上一频道、下一频道，需要播放同时展示其他页面，需要调整
        let playerScene = window.WebApp.getSceneById('player_scene');
        if(playerScene) {
            let newPlayInfo = ctrlType === PlayerControllerStatic.ES_VOICE_CTRL_PREV ? this.getPrevChannel() : this.getNextChannel();
            let upDownParams = [];
            upDownParams['player_scene'] = newPlayInfo;
            window.WebApp.switchScene('player_scene', upDownParams);
        }
    },

    //设置鉴权结果至本地
    setAuthResultToLocal(key, value) {
        if(!this.mAuthResultMap[key]) {
            this.mAuthResultMap[key] = {authResult: value, expireTime: sysTime.now()};
        }
    },

    //从本地获取鉴权结果
    getAuthResultFromLocal(key) {
        let result = this.mAuthResultMap[key];
        if(result) {
            if((sysTime.now() - result.expireTime) < Config.authResultCacheTime) {
                return result.authResult;
            } else {       //缓存的已经鉴权结果已经过期
                delete this.mAuthResultMap[key];
                return null;
            }
        } else {
            return null;
        }
    }
}

export default PlayerDataAccess