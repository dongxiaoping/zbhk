//应用的不同模式的响应
import DataAccess from "../../common/DataAccess";
import LocalPersistentStorage from "../../common/LocalPersistentStorage";
import {processNotExistTips, getVersion} from "../../common/CommonUtils";
import {defaultLiveCode,interfaceType, paramType, liveInfo, notExistTips, interfaceBackStatus, interfaceCacheKey, mediaType, laterShowType} from "../../common/GlobalConst";
import { sceneIds} from "./AppGlobal.js";
import {OTTConfig} from "../../common/CmsSwitch";
import JxLog from "../../common/Log"
import jxDataManage from "../../common/JxDatasManage";
import {sysTime} from "../../common/TimeUtils";
import App from "./app.main";
import {getQueryString} from "../../common/CommonUtils";
import {webStorage} from "../../common/LocalStorage";
import lazyLoadData from "./LazyLoadData"
import ChannelPay from "./ChannelPay"

class ModelManage {
    constructor() {
        this.modeParam = "";
        this.reqCount = 0;//当前模式需要加载的接口数量
        this.loadingDateInfo = [];
    }

    getModeParam(){
        return this.modeParam;
    }

    setModeParam(modeParam){
        this.modeParam = modeParam;
    }

    setModeByUrlAndSwitch() {
        let action = getQueryString("action");
        let showCover = parseInt(getQueryString("showCover")) ? true : false;
        let showMenu = parseInt(getQueryString("showMenu")) ? true : false;
        let categoryCode = getQueryString("categoryCode");
        let type = parseInt(getQueryString("type"));
        let data = getQueryString("data");
        let bookMarkStr = getQueryString("bookMark");
        let bookMark = bookMarkStr ? parseInt(bookMarkStr) : 0;
        let modeData = this.setModeByParam(action, categoryCode, type);
        let mode = modeData.mode;
        if(mode == interfaceType.ACTION_RESTORE_PREV_STATE_LIVE || mode == interfaceType.ACTION_RESTORE_PREV_STATE_SCH || mode == interfaceType.ACTION_RESTORE_PREV_STATE_JX) {
            data = modeData.data;
        }
        let modeParam = {showCover: showCover, showMenu: showMenu, categoryCode: categoryCode, type: type, data: data, mode: mode, bookMark: bookMark};
        this.setModeParam(modeParam);
    }

    //根据参数，进行mode的转化
     setModeByParam(mode, categoryCode, type){
        let data = null;
        if(mode === null){
            mode = interfaceType.ACTION_OPEN_APP;
        }
        if(mode == 'RestorePrevState') {    //恢复上下文接口，又可细分为三种模式
            mode = interfaceType.ACTION_OPEN_APP;
            let lastSwitchHistory = LocalPersistentStorage.getLastSwitchHistoryFromCookie();
            if(lastSwitchHistory) {
                lastSwitchHistory = JSON.parse(lastSwitchHistory);
                let params = lastSwitchHistory.param;
                let newParams = [];
                for (let i = 0; i < params.length; i++) {
                    newParams[params[i].t] = params[i].v;
                }
                lastSwitchHistory.param = newParams;
                let playInfo = newParams[sceneIds.PLAYER_SCENE_ID];
                data = playInfo;
                if(playInfo.type == mediaType.LIVE) {   //直播
                    mode = interfaceType.ACTION_RESTORE_PREV_STATE_LIVE;
                } else if(playInfo.type == mediaType.JX) {   //精选
                    mode = interfaceType.ACTION_RESTORE_PREV_STATE_JX;
                } else if(playInfo.type == mediaType.SCH) {   //回看
                    mode = interfaceType.ACTION_RESTORE_PREV_STATE_SCH;
                }
            }
        }
        if(mode == 'PlayByParam') {     //根据参数进行播放的接口，又可细分为五种模式
            mode = interfaceType.ACTION_OPEN_APP;
            if(categoryCode == liveInfo.CODE) {
                if(type == paramType.BY_CHANNEL_CODE) {
                    mode = interfaceType.ACTION_PLAY_BY_CHANNEL_CODE;
                } else if(type == paramType.BY_PROJ_CHANNEL) {
                    mode = interfaceType.ACTION_PLAY_BY_PROJECT_CODE;
                }
            } else {
                if(type == paramType.BY_PROGRAM_KEY) {
                    mode = interfaceType.ACTION_PLAY_BY_PROGRAM_KEY;
                } else if(type == paramType.BY_PROGRAM_INDEX) {
                    mode = interfaceType.ACTION_PLAY_BY_PROGRAM_INDEX;
                } else if(type == paramType.BY_SCHEDULE_CODE) {
                    mode = interfaceType.ACTION_PLAY_BY_PROGRAM_SCHEDULE_CODE;
                }
            }
        }
         //直播开关关闭的时候，模式转换
         if(!OTTConfig.liveSwitch()&& (mode === interfaceType.ACTION_OPEN_APP || mode === interfaceType.ACTION_RESTORE_PREV_STATE_LIVE || mode === interfaceType.ACTION_RESTORE_PREV_STATE_SCH)) {
             mode = interfaceType.ACTION_OPEN_APP_WITHOUT_LIVE;
         }
        return {mode: mode, data: data};
    }

    switchSceneByMode(){
        let param = this.getModeParam();
        switch(param.mode) {
            case interfaceType.ACTION_OPEN_APP:
                let newestNavHistory = window.WebApp.getTheNavHistory(1);
                let topSceneId = newestNavHistory.id;
                if(topSceneId===sceneIds.PLAYER_SCENE_ID){
                    let nowPlayInfo = window.WebApp.getNowPlayInfo();
                    if (nowPlayInfo.type === mediaType.LIVE) {
                        let params = [];
                        params[sceneIds.CHANNEL_MINI_SCENE_ID] = {"categoryCode":nowPlayInfo.categoryCode,"channelCode":nowPlayInfo.channelCode};
                        window.WebApp.switchScene(sceneIds.CHANNEL_MINI_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
                    } else {
                        window.WebApp.switchScene(sceneIds.CHANNEL_MINI_SCENE_ID, null, [null, null, sceneIds.PLAYER_SCENE_ID]);
                    }
                }
                break;
            case interfaceType.ACTION_OPEN_APP_WITHOUT_LIVE:
                this.appOpenAppWithoutLive();
                break;
            case interfaceType.ACTION_RESTORE_PREV_STATE_LIVE:
                this.appRestorePrevStateLive(param.data);
                break;
            case interfaceType.ACTION_RESTORE_PREV_STATE_SCH:
                this.appRestorePrevStateSch(param.data);
                break;
            case interfaceType.ACTION_RESTORE_PREV_STATE_JX:
                this.appRestorePrevStateJx(param.data);
                break;
            case interfaceType.ACTION_PLAY_BY_CHANNEL_CODE:
                if (OTTConfig.supportInterfacePlay()) {
                    this.processInterfaceByChannelCode(param);
                } else {
                    this.appOpenAppWithoutData();
                }
                break;
            case interfaceType.ACTION_PLAY_BY_PROJECT_CODE:
                if (OTTConfig.supportInterfacePlay()) {
                    this.processInterfaceByProjChannel(param);
                } else {
                    this.appOpenAppWithoutData();
                }
                break;
            case interfaceType.ACTION_PLAY_BY_PROGRAM_KEY:
            case interfaceType.ACTION_PLAY_BY_PROGRAM_INDEX:
            case interfaceType.ACTION_PLAY_BY_PROGRAM_SCHEDULE_CODE:
                if (OTTConfig.supportInterfacePlay()) {
                    this.processInterfaceByProgramData(param);
                } else {
                    this.appOpenAppWithoutData();
                }
                break;
            case interfaceType.ACTION_GET_VERSION:
                this.appGetVersion();
                break;
            default:
                this.appOpenAppWithoutData();
        }
    }

    //直播开关关闭的时候，打开应用
    appOpenAppWithoutLive() {
        let jxPlayInfoForFirstProgram = jxDataManage.getJxPlayInfoForFirstProgram();
        let params = [];
        params[sceneIds.PLAYER_SCENE_ID] = jxPlayInfoForFirstProgram;
        window.WebApp.switchScene(sceneIds.JX_CATEGORY_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
    }

    //1. 直接打开应用：获取播放信息并跳转到mini菜单
    getPlayInfoSwitchMini() {
        let liveInfo = DataAccess.getLastLiveChannelFromCache();
        let channelCode = null;
        if(liveInfo && liveInfo.channelCode) {
            channelCode = liveInfo.channelCode;
        } else {
            let allChannel = DataAccess.getAllLiveChannelFromCache();
            if(!allChannel) {
                JxLog.e([], "App/app_ailive/ModeManage/getPlayInfoSwitchMini",
                    ["没有频道数据，无法跳转页面"]);
                return;
            }
            channelCode = allChannel.Channels[0];
        }
        let playInfo = {type: mediaType.LIVE,categoryCode:defaultLiveCode, channelCode: channelCode};
        let params = [];
        params[sceneIds.PLAYER_SCENE_ID] = playInfo;
        params[sceneIds.CHANNEL_MINI_SCENE_ID] = {"categoryCode":defaultLiveCode, "channelCode":channelCode};
        window.WebApp.switchScene(sceneIds.CHANNEL_MINI_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
    }

    //指定情况数据不存在或已下线，需要重新设置mode，再走一遍流程
    appOpenAppWithoutData() {
        let param = this.getModeParam();
        param.mode = OTTConfig.liveSwitch() ? interfaceType.ACTION_OPEN_APP : interfaceType.ACTION_OPEN_APP_WITHOUT_LIVE;
        this.setModeParam(param);
        this.loadingDataByMode();
    }

    //2.1 恢复上下文-直播(全屏播放+mini菜单)
    appRestorePrevStateLive(playInfo) {
        let channelInfo = webStorage.getItem(interfaceCacheKey.ALL_LIVE_CHANNEL);
        let allChannels = channelInfo.Channels;
        let len = allChannels.length;
        let params = [];
        for(let i=0; i<len; i++) {
            if(allChannels[i] === playInfo.channelCode) {
                params[sceneIds.PLAYER_SCENE_ID] = playInfo;
                params[sceneIds.CHANNEL_MINI_SCENE_ID] = {"categoryCode":defaultLiveCode, "channelCode":playInfo.channelCode};
                window.WebApp.switchScene(sceneIds.CHANNEL_MINI_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
                return;
            }
        }
        this.appOpenAppWithoutData();
    }

    //2.2 恢复上下文-回看(全屏播放+回看节目播控页面)
    appRestorePrevStateSch(playInfo) {
        let bookMarkInfo = LocalPersistentStorage.getBookMarkFromCookie();
        if(bookMarkInfo) {
            playInfo.bookMark = bookMarkInfo.bookMark - 2;        //回看节目断点续播，向前退2s开始续播
            playInfo.progress = bookMarkInfo.progress;
        }
        let time = playInfo.startTime;
        let date = time.substr(0, 4)+"-"+time.substr(4, 2)+"-"+time.substr(6, 2);
        let cacheKey = playInfo.channelCode + '_' + date;
        let programData = webStorage.getItem(cacheKey);
        let schedules = programData.Schedule;
        let len = schedules.length;
        for(let i=0; i<len; i++) {
            if(schedules[i].ScheduleCode == playInfo.scheduleCode) {
                let params = [];
                params[sceneIds.PLAYER_SCENE_ID] = playInfo;
                params[sceneIds.SEEK_SCENE_ID] = {playInfo: playInfo};
                window.WebApp.switchScene(sceneIds.SEEK_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
                return;
            }
        }
        this.appOpenAppWithoutData();
    }

    //2.3 恢复上下文-精选（全屏播放+精选剧集播控页面）
    appRestorePrevStateJx(playInfo) {
        let bookMarkInfo = LocalPersistentStorage.getBookMarkFromCookie();
        if(bookMarkInfo) {
            playInfo.bookMark = bookMarkInfo.bookMark - 2;        //精选节目断点续播，向前退2s开始续播
            playInfo.progress = bookMarkInfo.progress;
        }
        let cateData = webStorage.getItem(interfaceCacheKey.JX_CATRGORY);
        let i = 0;
        for(; i<cateData.length; i++) {
            if(cateData[i].Code == playInfo.categoryCode) {
                break;
            }
        }
        if(i<cateData.length) {
            let programData = webStorage.getItem(playInfo.categoryCode);
            let programs = programData.keys;
            if(programs) {
                for(let i = 0; i<programs.length; i++) {
                    let schedules = programs[i].schedules;
                    let sLen = schedules.length;
                    let j = 0;
                    let params = [];
                    for(; j < sLen; j++) {
                        if(schedules[j].ScheduleCode == playInfo.scheduleCode) {
                            params[sceneIds.PLAYER_SCENE_ID] = playInfo;
                            params[sceneIds.SEEK_SCENE_ID] = {playInfo: playInfo};
                            window.WebApp.switchScene(sceneIds.SEEK_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
                            return;
                        }
                    }
                }
                this.appOpenAppWithoutData();
            } else {
                this.appOpenAppWithoutData();
            }
        } else {
            this.appOpenAppWithoutData();
        }
    }

    //3. 根据参数播放
    appPlayByParam(param) {
        let playInfo = param.playInfo;
        let sceneParams = [];
        sceneParams[sceneIds.PLAYER_SCENE_ID] = playInfo;
        if(param.showScreen) {
            if(playInfo.type == mediaType.LIVE) {    //直播：播放（是否稍后显示屏显，在auth的回调中处理，因为屏显界面按钮依赖auth的回调）
                ChannelPay.laterShowSceneType = laterShowType.SCREEN_SCENE;
                window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID, sceneParams);
            } else {
                if(playInfo.categoryCode) {   //精选：播放加精选剧集列表页面
                    sceneParams[sceneIds.JX_SERIES_SCENE_ID] = playInfo;
                    window.WebApp.switchScene(sceneIds.JX_SERIES_SCENE_ID, sceneParams, [null,null,sceneIds.PLAYER_SCENE_ID]);
                } else {   //回看：播放加回看节目列表页面
                    sceneParams[sceneIds.SCH_PROGRAM_SCENE_ID] = playInfo;
                    window.WebApp.switchScene(sceneIds.SCH_PROGRAM_SCENE_ID, sceneParams, [null,null,sceneIds.PLAYER_SCENE_ID]);
                }
            }
        } else {   //全屏播放
            window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID, sceneParams);
        }
        if(param.tips) {
            processNotExistTips(param.tips);
        }
    }

    //4. 获取应用版本（暂时写在错误页面上）
    appGetVersion() {
        let params = [];
        let version = getVersion();
        params[sceneIds.ERROR_SCENE_ID] = {code: version, describe: "该应用版本信息为："+ version};
        window.WebApp.switchScene(sceneIds.ERROR_SCENE_ID,params);
        return;
    }

    //3.1 根据channelcode处理
    processInterfaceByChannelCode(param) {
        if(param.data) {
            this.findChannelInfoByChannelCode(param.showMenu, param.data);
        } else {
            this.appOpenAppWithoutData();
        }
    }

    //3.2 根据proj|chmark处理
    processInterfaceByProjChannel(param) {
        if(param.data) {
            let channelDataMap = webStorage.getItem("QueryChannelMarkCodeMap");
            let channelcode = "";
            if (channelDataMap) {
                for (let i = 0; i < channelDataMap.Count; i++) {
                    if (channelDataMap.Items[i]["MarkName"] == chmark) {
                        channelcode = channelDataMap.Items[i]["ChannelCode"].trim();
                        break;
                    }
                }
            }
            this.findChannelInfoByChannelCode(param.showMenu, channelcode);
        } else {
            this.appOpenAppWithoutData();
        }
    }

    //根据channelcode从QueryCover分类接口中，根据是否找有效的频道信息,再结合接口参数执行相应的操作
    findChannelInfoByChannelCode(showScreen, channelCode) {
        let allLiveData = DataAccess.getAllLiveChannelFromCache();
        if(allLiveData.Channels) {
            let allChannels = allLiveData.Channels;
            let i = 0;
            for(; i<allChannels.length; i++) {
                if(allChannels[i] == channelCode) {
                    break;
                }
            }
            let tips = null;
            if(i == allChannels.length) {  //传入了data参数，但找不到对应的频道数据，播放第一个频道的直播，同时给出提示信息
                channelCode = allChannels[0];
                tips = notExistTips.CHANNEL_TIPS;
            }
            let appParam = {showScreen: showScreen, tips: tips, playInfo: {type: mediaType.LIVE,categoryCode:defaultLiveCode, channelCode: channelCode}};
            this.appPlayByParam(appParam);
        } else {   //没有直播数据
            this.appOpenAppWithoutData();
        }
    }

    //3.3 3.4 3.5根据精选节目关键字/节目下标处理/节目scheduleCode
    processInterfaceByProgramData(param) {
        let allCategory = webStorage.getItem(interfaceCacheKey.JX_CATRGORY);
        if(allCategory) {
            let i = 0, len = allCategory.length;
            for(; i<len; i++) {
                if(allCategory[i].Code == param.categoryCode) {
                    break;
                }
            }
            if(i==len) {     //该精选分类不存在
                processNotExistTips("该精选分类不存在，请使用其他分类");
                return this.appOpenAppWithoutData();
            }
        }
        let obj = webStorage.getItem(param.categoryCode);
        if(!obj || (obj && obj.keys && obj.keys.length == 0)){  //该精选分类下无数据
            processNotExistTips("该精选分类下暂无数据，请使用其他分类");
            return this.appOpenAppWithoutData();
        }
        let categoryData = obj["keys"];
        let schedule = null;
        if (param.data) {       //根据不同参数获取节目信息
            schedule = this.getProgramInfoByType(categoryData, param.type, param.data);
        } else {     //不传节目关键字或节目下标，默认取第一个节目第一集数据
            schedule = categoryData[0].schedules[0];
        }
        let tips = null;
        let bookMark = 0, progress=0;
        if(!schedule) {      //传入了data参数，但找不到对应的数据，播放该分类第一条数据，同时给出提示信息
            schedule = categoryData[0].schedules[0];
            tips = notExistTips.PROGRAM_TIPS;
        } else {          //找到了对应信息，才需要设置断点续播的数据
            bookMark = param.bookMark;
            progress = this.computeProgressByBookMark(schedule.StartTime, schedule.EndTime, bookMark);
        }
        let appParam = {showScreen: param.showMenu, tips: tips};
        appParam.playInfo = {type: mediaType.JX, categoryCode: param.categoryCode, scheduleCode: schedule.ScheduleCode,
                             startTime: schedule.StartTime, endTime: schedule.EndTime, bookMark: bookMark, progress: progress};
        this.appPlayByParam(appParam);
    }

    //根据bookMark计算进度条
    computeProgressByBookMark(startTime, endTime, bookMark) {
        let progress = 0;
        let s = sysTime.strToTimeStamp(startTime);
        let e = sysTime.strToTimeStamp(endTime);
        if(e != s) {
            progress = bookMark/(e-s);
        }
        return progress;
    }

    getProgramInfoByType(categoryData, type, data) {
        let schedule = null;
        let len = categoryData.length;
        switch(type) {
            case paramType.BY_PROGRAM_KEY:
                for (let i = 0; i < len; i++) {
                    if (categoryData[i]["keyname"].indexOf(data) > -1) {
                        schedule = categoryData[i].schedules[0];
                        return schedule;
                    }
                }
                break;
            case paramType.BY_PROGRAM_INDEX:
                let idx = parseInt(data);
                if (idx >= 0 && idx < len) {
                    schedule = categoryData[idx].schedules[0];
                    return schedule;
                }
                break;
            case paramType.BY_SCHEDULE_CODE:
                for(let i=0; i<len; i++) {
                    let schedules = categoryData[i].schedules;
                    let scheduleLen = schedules.length;
                    for(let j=0; j<scheduleLen; j++) {
                        if(schedules[j].ScheduleCode == data) {
                            schedule = schedules[j];
                            return schedule;
                        }
                    }
                }
                break;
            default:
        }
        return schedule;
    }

    toPlayScene(){
        let param = this.getModeParam();
        switch(param.mode) {
            case interfaceType.ACTION_OPEN_APP:
                let params = [];
                let liveInfo = DataAccess.getLastLiveChannelFromCache();
                let channelCode = null;
                if(liveInfo && liveInfo.channelCode) {
                    channelCode = liveInfo.channelCode;
                } else {
                    let allChannel = DataAccess.getAllLiveChannelFromCache();
                    if(!allChannel) {
                        JxLog.e([], "App/app_ailive/ModeManage/toPlayScene",
                            ["没有频道数据，无法跳转页面"]);
                        params[sceneIds.ERROR_SCENE_ID] = {code: "011", describe: "无频道数据！"};
                        return;
                    }
                    channelCode = allChannel.Channels[0];
                }
                let playInfo = {type: mediaType.LIVE, categoryCode:defaultLiveCode, channelCode: channelCode};
                params[sceneIds.PLAYER_SCENE_ID] = playInfo;
                window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID,params);
                break;
            case interfaceType.ACTION_OPEN_APP_WITHOUT_LIVE:
                //改播放在modelManage.switchSceneByMode()中
                break;
            case interfaceType.ACTION_GET_VERSION:
                break;
            default:
        }
    }

    loadingDataByMode(){
        let param = this.getModeParam();
        switch(param.mode) {
            case interfaceType.ACTION_OPEN_APP:
                this.requestServerDataOpenApp();
                break;
            case interfaceType.ACTION_OPEN_APP_WITHOUT_LIVE:
                this.requestServerDataOpenAppWithoutLive();
                break;
            case interfaceType.ACTION_RESTORE_PREV_STATE_LIVE:
                this.requestServerDataRestoreLive();
                break;
            case interfaceType.ACTION_RESTORE_PREV_STATE_SCH:
                this.requestServerDataRestoreSch(param.data);
                break;
            case interfaceType.ACTION_RESTORE_PREV_STATE_JX:
                this.requestServerDataRestoreJx(param.data);
                break;
            case interfaceType.ACTION_PLAY_BY_CHANNEL_CODE:
                if (OTTConfig.supportInterfacePlay()) {
                    this.requestServerDataByChannelCode(param);
                } else {
                    this.requestServerDataOpenApp();
                }
                break;
            case interfaceType.ACTION_PLAY_BY_PROJECT_CODE:
                if (OTTConfig.supportInterfacePlay()) {
                    this.requestServerDataByProjChannel(param);
                } else {
                    this.requestServerDataOpenApp();
                }
                break;
            case interfaceType.ACTION_PLAY_BY_PROGRAM_KEY:
            case interfaceType.ACTION_PLAY_BY_PROGRAM_INDEX:
            case interfaceType.ACTION_PLAY_BY_PROGRAM_SCHEDULE_CODE:
                if (OTTConfig.supportInterfacePlay()) {
                    this.requestServerDataByProgramData(param);
                } else {
                    this.requestServerDataOpenApp();
                }
                break;
            case interfaceType.ACTION_GET_VERSION:
                this.loadingDataRight("","");
                break;
            default:
                this.requestServerDataOpenApp();
        }
    }

    //3.3 3.4 3.5按指定精选分类的节目关键字/节目下标/scheduleCode播放需要从服务端请求的接口：（1）所有精选分类；（2）该精选分类的节目数据
    requestServerDataByProgramData(param) {
        let that = this;
        that.reqCount = 2;
        DataAccess.requestAllJxCategory({callback: function(data, status) {
            that.processRequestCallback("requestAllJxCategory", data, status, "001");
        }});
        DataAccess.requestJxCategoryProgram({categoryCode: param.categoryCode, callback: function(data, status) {
            that.processRequestCallback("requestJxCategoryProgram",data, status, "002");
        }});
    }

    //1.直接打开app需要从服务端请求的接口 (1)最后一次播放的直播频道； (2)QueryCover接口
    requestServerDataOpenApp() {
        let that = this;
        that.reqCount=1;
        that.isHasPlay = false;
        DataAccess.requestLastLiveInfo({callback: function(data, status) {
            if(status === interfaceBackStatus.SUCCESS&&data!==null&&data!==""){
                if(!that.isHasPlay) {
                    modelManage.toPlayScene();
                    that.isHasPlay = true;
                }
            }
        }});

        DataAccess.requestLiveCategoryChannel({callback: function(data, status) {
            if(!that.isHasPlay) {
                modelManage.toPlayScene();
                that.isHasPlay = true;
            }
            lazyLoadData.setLazyLoadState("QueryCover", status);
            that.processRequestCallback("QueryCover", data, status, "005");
        }})
    }

    //完成加载ACTION_OPEN_APP_WITHOUT_LIVE模式下进入首页必须的数据
    requestServerDataOpenAppWithoutLive(){
        let that = this;
        that.reqCount=2;
        jxDataManage.start({callback: function (data,status) {
            lazyLoadData.setLazyLoadState("QueryJxCateAndProgram",status);
            lazyLoadData.setLazyLoadState("QueryJxCate",status);
            that.processRequestCallback("QueryJxCate", data, status, "007");
            modelManage.toPlayScene();
            JxLog.i([], "App/app_ailive/ModeManage/requestServerDataOpenAppWithoutLive",
                ["请求精选分类以及对应节目信息接口返回完毕"]);
        }});

        DataAccess.requestSubscription({callback: function (data,status) {
            lazyLoadData.setLazyLoadState("getSubscription",status);
            that.loadingDataRight("getSubscription", data);
            JxLog.i([], "App/app_ailive/ModeManage/requestServerDataOpenAppWithoutLive", ["请求订阅信息接口返回完毕"]);
        }});

    }

    //2.1 恢复上下文需要从服务端请求的接口--直播
    //需要请求的接口：（1）QueryCover接口，需要遍历恢复播放的频道是否已经下线
    requestServerDataRestoreLive() {
        let that = this;
        that.reqCount = 1;
        DataAccess.requestLiveCategoryChannel({callback: function(data, status) {
            that.processRequestCallback("requestLiveCategoryChannel", data, status, "005");
        }});
    }

    //2.2 恢复上下文需要从服务端请求的接口--回看
    //需要请求的接口：（1）QueryCover接口（seek页面，需要用到频道名称、节目相关的信息），（2）回看节目所在频道所在日期一天的节目单，需要遍历恢复播放的节目是否已经过期
    requestServerDataRestoreSch(playInfo) {
        let that = this;
        that.reqCount = 2;
        DataAccess.requestLiveCategoryChannel({callback: function(data, status) {
            that.processRequestCallback("requestLiveCategoryChannel", data, status, "005");
        }});
        let time = playInfo.startTime;
        let date = time.substr(0, 4)+"-"+time.substr(4, 2)+"-"+time.substr(6, 2);
        let startTime = date + " 00:00:00";
        let endTime = date + " 23:59:59";
        DataAccess.requestChannelSchedule({channelCode: playInfo.channelCode, startDate: startTime, endDate: endTime, callback: function(data, status) {
            that.processRequestCallback("requestChannelSchedule", data, status, "001");
        }});
    }

    //2.3 恢复上下文需要从服务端请求的接口--精选
    //需要请求的接口：（1）所有精选分类； （2）该精选节目所在的分类节目 需要遍历恢复播放的节目所在分类时候已经下线，分类所在节目是否已经过期
    requestServerDataRestoreJx(playInfo) {
        let that = this;
        that.reqCount = 2;
        DataAccess.requestAllJxCategory({callback: function(data, status) {
            that.processRequestCallback("requestAllJxCategory", data, status, "001");
        }});
        DataAccess.requestJxCategoryProgram({categoryCode: playInfo.categoryCode, callback: function(data, status) {
            that.processRequestCallback("requestJxCategoryProgram", data, status, "002");
        }});
    }

    //3.1 按channelcode播放需要从服务端请求的接口 (1)QueryCover接口，请求所有直播频道
    requestServerDataByChannelCode() {
        let that = this;
        that.reqCount = 1;
        DataAccess.requestLiveCategoryChannel({callback: function(data,status) {
            that.processRequestCallback("requestLiveCategoryChannel",data, status, "001");
        }});
    }

    //3.2 按channelcode播放需要从服务端请求的接口（1）QueryChannelMarkCodeMap接口，获取项目标识和频道号的map关系；（2）QueryCover接口，请求所有直播频道
    requestServerDataByProjChannel(param) {
        let that = this;
        that.reqCount = 2;
        let info = param.data.split("|");
        let proj = info[0];
        DataAccess.requestChannelMarkCodeMap({proj: proj, callback: function (data, status) {
            that.processRequestCallback("requestChannelMarkCodeMap",data, status, "001");
        }});
        DataAccess.requestLiveCategoryChannel({callback: function(data,status) {
            that.processRequestCallback("requestLiveCategoryChannel",data, status, "002");
        }});
    }

    processRequestCallback(type, data, status, code) {
        if (status === interfaceBackStatus.SUCCESS) {
            this.loadingDataRight(type, data);
        } else {
            let params = [];
            params[sceneIds.ERROR_SCENE_ID] = {code: code, describe: type+"请求异常"};
            window.WebApp.switchScene(sceneIds.ERROR_SCENE_ID, params);
        }
    }

    loadingDataRight(dataType,data){
        if(dataType===""){
            App.appInitFinished();
            return ;
        }
        let that = this;
        that.loadingDateInfo[dataType] = data;
        let count = 0;
        for(let n in that.loadingDateInfo) {
            count++;
        }
        let isDataAllRight = count>=that.reqCount?true:false;
        if(isDataAllRight){
            App.appInitFinished();
        }
    }
}
export const modelManage = new ModelManage();
export default modelManage
