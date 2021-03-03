//应用的不同模式的响应
import DataAccess from "../../common/DataAccess";
import LocalPersistentStorage from "../../common/LocalPersistentStorage";
import {processNotExistTips, getVersion} from "../../common/CommonUtils";
import {interfaceType, paramType, liveInfo, notExistTips, interfaceBackStatus, interfaceCacheKey, mediaType, defaultLiveCode, coverType} from "../../common/GlobalConst";
import {OTTConfig} from "../../common/CmsSwitch";
import JxLog from "../../common/Log"
import {webStorage} from '../../common/LocalStorage'
import {getQueryString} from "../../common/CommonUtils";
import {sceneIds} from "./AppGlobal.js";
import App from "./app.main";
import {webCookie} from "../../common/LocalStorage";
import { starTipBar } from "./app.component";
import OTT from "../../common/OttMiddle";

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

    getModeType(){
        let modeParam = modelManage.getModeParam()
        if(modeParam != "" && typeof (modeParam.mode)!="undefined"){
            return modeParam.mode
        }
        return null
    }

    /* 对不需要请求接口（配置接口等）就可以确定的应用进入模式进行设置
     * 仅通过url信息或者cookie信息就可以确定进入应用的模式
     * */
    setModeNoInterface () {
        let channelLockeMode = this.isChannelLockMode ()
        if (channelLockeMode) {
            this.setModeParam (channelLockeMode)
            return
        }
        let RePreChannelLockMode = this.isRePreChannelLockMode ()
        if (RePreChannelLockMode) {
            this.setModeParam (RePreChannelLockMode)
            return
        }
    }

    /* 判断应用进入的模式是不是单一频道模式，是返回模式数据，不是返回false
    * */
    isChannelLockMode () {
        let type = parseInt (getQueryString ("type"))
        let isChannelLock = parseInt (getQueryString ("lockChannel")) ? true : false
        let data = getQueryString ("data")
        if (isChannelLock && type == 1 && data != "null" && data != "") {
            return {mode: interfaceType.ACTION_LIVE_CHANNEL_LOCK, channelCode: data}
        }
        return false
    }

    /* 判断应用进入的模式是不是单频道模式下的，恢复上下文场景的应用进入模式，如果是返回模式数据，
     * 如果不是返回false
     * */
    isRePreChannelLockMode () {
        let action = getQueryString ("action")
        let restoreInfo = LocalPersistentStorage.getRestoreInfoFromCookie ()
        if (action == 'RestorePrevState' && restoreInfo && restoreInfo.mode && restoreInfo.channelCode) {
            return {mode: interfaceType.ACTION_LIVE_CHANNEL_LOCK, channelCode: restoreInfo.channelCode}
        }
        return false
    }


    setModeByUrlAndSwitch() {
        let modeType = this.getModeType();
        if(interfaceType.ACTION_LIVE_CHANNEL_LOCK == modeType){
            return
        }
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
        if(mode == interfaceType.ACTION_RESTORE_PREV_STATE_LIVE || mode == interfaceType.ACTION_RESTORE_PREV_STATE_SCH) {
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
        if(mode == 'RestorePrevState') {    //恢复上下文接口，又可细分为两种模式
            mode = interfaceType.ACTION_OPEN_APP;
            let restoreInfo = LocalPersistentStorage.getRestoreInfoFromCookie();
            if(restoreInfo && !restoreInfo.mode) {   //不是从单一模式恢复的
                data = restoreInfo;
                mode = data.type == mediaType.LIVE ? interfaceType.ACTION_RESTORE_PREV_STATE_LIVE : interfaceType.ACTION_RESTORE_PREV_STATE_SCH;
            }
        }
        if(mode == 'PlayByParam') {     //根据参数进行播放的接口，只处理直播，没有精选
            mode = interfaceType.ACTION_OPEN_APP;
            if(categoryCode == liveInfo.CODE) {
                if(type == paramType.BY_CHANNEL_CODE) {
                    mode = interfaceType.ACTION_PLAY_BY_CHANNEL_CODE;
                } else if(type == paramType.BY_PROJ_CHANNEL) {
                    mode = interfaceType.ACTION_PLAY_BY_PROJECT_CODE;
                }
            }
        }
        //直播开关关闭的时候，模式转换
        if(!OTTConfig.liveSwitch()&& (mode === interfaceType.ACTION_OPEN_APP || mode === interfaceType.ACTION_RESTORE_PREV_STATE_LIVE || mode === interfaceType.ACTION_RESTORE_PREV_STATE_SCH)) {
            mode = interfaceType.ACTION_OPEN_APP_WITHOUT_LIVE;
        }
        return {mode: mode, data: data};
    }

    //首次页面跳转
    switchSceneByMode(){
        let param = this.getModeParam();
        switch(param.mode) {
            case interfaceType.ACTION_OPEN_APP:
                this.appOpenApp();
                break;
            case interfaceType.ACTION_RESTORE_PREV_STATE_LIVE:
                this.appRestorePrevStateLive(param.data);
                break;
            case interfaceType.ACTION_RESTORE_PREV_STATE_SCH:
                this.appRestorePrevStateSch(param.data);
                break;
            case interfaceType.ACTION_PLAY_BY_CHANNEL_CODE:
                if (OTTConfig.supportInterfacePlay()) {
                    this.processInterfaceByChannelCode(param);
                } else {
                    this.appOpenAppWithoutData();
                }
                break;
            case interfaceType.ACTION_GET_VERSION:
                this.appGetVersion();
                break;
            case interfaceType.ACTION_LIVE_CHANNEL_LOCK:
                this.appOpenWithLiveChannelLock();
                break;
            default:
                this.appOpenAppWithoutData();
        }
    }

    //1. 直接打开应用：根据封套开关的不同，跳转到不同页面
    appOpenApp() {
        let cover = OTTConfig.showEnvelopeFlag();
        if(cover == coverType.CHANNEL_LIST) {
            let lastLiveCode = DataAccess.getLastLiveCodeFromCookie()
            if(lastLiveCode === null){
                window.WebApp.switchScene(sceneIds.COVER_ID);
            }else{
                let param = [];
                param[sceneIds.COVER_ID] = {type: mediaType.LIVE, categoryCode: defaultLiveCode, channelCode: lastLiveCode};
                window.WebApp.switchScene(sceneIds.COVER_ID, param);
            }
        } else if(cover == coverType.CHANNEL_IMAGE) {
            window.WebApp.switchScene(sceneIds.COVER_IMAGE_ID);
        } else {  //无封套
            let playInfo = window.WebApp.getNowPlayInfo();
            let params = [];
            if(!OTTConfig.noCoverAppResponse()) {   //全屏播放+分类菜单
                params[sceneIds.CATEGORY_PLAY_MENU_ID] = {"categoryCode":playInfo.categoryCode, "channelCode":playInfo.channelCode};
                window.WebApp.switchScene(sceneIds.CATEGORY_PLAY_MENU_ID,params, [null,null,sceneIds.PLAYER_SCENE_ID]);
            } else {   //全屏播放+右下角屏显
                params[sceneIds.PLAYER_SCENE_ID] = playInfo;
                window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID);
                starTipBar.show();
            }
        }
    }

    //指定情况数据不存在或已下线, 需要重新设置mode，再走一遍流程
    appOpenAppWithoutData() {
        let param = this.getModeParam();
        param.mode = interfaceType.ACTION_OPEN_APP;
        this.setModeParam(param);
        this.loadingDataByMode();
    }

    //频道锁定执行的页面初始化跳转
    appOpenWithLiveChannelLock() {
        let modeParam = this.getModeParam();
        let playInfo = {type: mediaType.LIVE, channelCode: modeParam.channelCode, categoryCode: defaultLiveCode};
        let param = [];
        param[sceneIds.PLAYER_SCENE_ID] = playInfo;
        window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID, param);
    }

    //2.1 恢复上下文-直播(全屏播放+分类菜单)
    appRestorePrevStateLive(playInfo) {
        let channelInfo = webStorage.getItem(interfaceCacheKey.ALL_LIVE_CHANNEL);
        let allChannels = channelInfo.Channels;
        let len = allChannels.length;
        let params = [];
        for(let i=0; i<len; i++) {
            if(allChannels[i] === playInfo.channelCode) {
                params[sceneIds.PLAYER_SCENE_ID] = playInfo;
                params[sceneIds.CATEGORY_PLAY_MENU_ID] = {"categoryCode":playInfo.categoryCode, "channelCode":playInfo.channelCode};
                window.WebApp.switchScene(sceneIds.CATEGORY_PLAY_MENU_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
                return;
            }
        }
        this.appOpenAppWithoutData();
    }

    //2.2 恢复上下文-回看(全屏播放+频道节目菜单)
    appRestorePrevStateSch(playInfo) {
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
                window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID, params);
                let channelParam = [];
                channelParam[sceneIds.CHANNEL_PLAY_MENU_ID] = {"categoryCode":null,"channelCode":null};
                window.WebApp.switchScene(sceneIds.CHANNEL_PLAY_MENU_ID, channelParam, [null, null, sceneIds.PLAYER_SCENE_ID]);
                return;
            }
        }
        this.appOpenAppWithoutData();
    }

    //3. 根据参数播放(showCover和showMenu的各种组合情况)
    appPlayByParam(param) {
        let playInfo = param.playInfo;
        let params = [];
        if(param.showCover) {
            let cover = OTTConfig.showEnvelopeFlag();
            if(cover === coverType.CHANNEL_LIST) {
                params[sceneIds.COVER_ID] = playInfo;
                window.WebApp.switchScene(sceneIds.COVER_ID, params);
            } else if(cover === coverType.CHANNEL_IMAGE) {
                params[sceneIds.COVER_IMAGE_ID] = playInfo;
                window.WebApp.switchScene(sceneIds.COVER_IMAGE_ID, params);
            } else{
                params[sceneIds.CATEGORY_PLAY_MENU_ID] = {"categoryCode":playInfo.categoryCode, "channelCode":playInfo.channelCode};
                window.WebApp.switchScene(sceneIds.CATEGORY_PLAY_MENU_ID,params, [null,null,sceneIds.PLAYER_SCENE_ID]);
            }
        } else {
            if(param.showMenu) {
                params[sceneIds.PLAYER_SCENE_ID] = playInfo;
                params[sceneIds.CATEGORY_PLAY_MENU_ID] = {"categoryCode":playInfo.categoryCode, "channelCode":playInfo.channelCode};
                window.WebApp.switchScene(sceneIds.CATEGORY_PLAY_MENU_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
            } else {
                params[sceneIds.PLAYER_SCENE_ID] = playInfo;
                window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID, params);
            }
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
            this.findChannelInfoByChannelCode(param.showCover, param.showMenu, param.data);
        } else {
            this.appOpenAppWithoutData();
        }
    }

    //根据channelcode从QueryCover分类接口中，根据是否找有效的频道信息,再结合接口参数执行相应的操作
    findChannelInfoByChannelCode(showCover, showMenu, channelCode) {
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
            let appParam = {showCover: showCover, showMenu: showMenu, tips: tips, playInfo: {type: mediaType.LIVE, categoryCode: defaultLiveCode, channelCode: channelCode}};
            this.appPlayByParam(appParam);
        } else {   //没有直播数据
            this.appOpenAppWithoutData();
        }
    }

    toPlayScene(){
        let param = this.getModeParam();
        switch(param.mode) {
            case interfaceType.ACTION_OPEN_APP:
                let params = [];
                let channelCode = DataAccess.getLastLiveCodeFromCookie();
                if(channelCode != null && (!DataAccess.getChannelInfo(channelCode))){
                    channelCode = null//说明改频道已下架
                }
                if(channelCode === null) {
                    let allChannel = DataAccess.getAllLiveChannelFromCache();
                    if(!allChannel) {
                        JxLog.e([], "App/app_zbhk/ModeManage/toPlayScene", ["没有频道数据，无法跳转页面"]);
                        params[sceneIds.ERROR_SCENE_ID] = {code: "011", describe: "无频道数据！"};
                        return;
                    }
                    channelCode = allChannel.Channels[0];
                }
                let playInfo = {type: mediaType.LIVE,categoryCode: defaultLiveCode,channelCode: channelCode};
                params[sceneIds.PLAYER_SCENE_ID] = playInfo;
                window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID,params);
                break;
            case interfaceType.ACTION_GET_VERSION:
                break;
            default:
        }
    }

    loadingDataByMode(){
        this.delInvalidCookie()
        let param = this.getModeParam();
        switch(param.mode) {
            case interfaceType.ACTION_OPEN_APP:
                this.requestServerDataOpenApp();
                break;
            case interfaceType.ACTION_RESTORE_PREV_STATE_LIVE:
                this.requestServerDataRestoreLive();
                break;
            case interfaceType.ACTION_RESTORE_PREV_STATE_SCH:
                this.requestServerDataRestoreSch(param.data);
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
            case interfaceType.ACTION_GET_VERSION:
                this.loadingDataRight("","");
                break;
            case interfaceType.ACTION_LIVE_CHANNEL_LOCK:
                App.appInitFinished();
                break;
            default:
                this.requestServerDataOpenApp();
        }
        this.requestCommonData();
    }

    requestCommonData() {
        let param = this.getModeParam();
        if (param.mode != interfaceType.ACTION_LIVE_CHANNEL_LOCK && OTTConfig.showBook()) {
            DataAccess.requestBooking({callback: function(bookData, bookStatus) {
                // that.processRequestCallback("requestBooking", bookData, bookStatus, "007");
            }});
        }
    }

    //删除在dsjx升级到zbhk中产生的无效cookie数据，
    delInvalidCookie () {
        try{
            let cookieData = webCookie.getItem ("subscription_items"); //追剧数据
            if (cookieData) {
                webCookie.removeItem ("subscription_items");
            }
        }catch (e) {
            JxLog.e([], "App/app_zbhk/ModeManage/delInvalidCookie", [e.toLocaleString()]);
        }
    }

    //1.直接打开app需要从服务端请求的接口 (1)liveuds最后一次播放的直播频道； (2)QueryCover接口;   (3)liveuds收藏接口
    requestServerDataOpenApp() {
        let that = this;
        that.reqCount=1;
        if(OTTConfig.showEnvelopeFlag() == coverType.CHANNEL_IMAGE) {
            DataAccess.requestLiveCategoryChannel({callback: function(coverData, coverStatus) {
                that.processRequestCallback("requestLiveCategoryChannel", coverData, coverStatus, "005");
            }});
        } else {
            DataAccess.requestLiveCategoryWeb({callback: function(coverData, coverStatus) {
                if(!OTTConfig.showEnvelopeFlag()){
                    modelManage.toPlayScene();
                }
                that.processRequestCallback("requestLiveCategoryWeb", coverData, coverStatus, "005");
            }});
        }
        DataAccess.requestCollectedChannel({callback: function(collectionData, collectionStatus) {
           // that.processRequestCallback("requestCollectedChannel", collectionData, collectionStatus, "006");
        }});
    }

    //2.1 恢复上下文需要从服务端请求的接口--直播
    //需要请求的接口：（1）QueryCover接口，需要遍历恢复播放的频道是否已经下线
    requestServerDataRestoreLive() {
        let that = this;
        that.reqCount = 1;
        that.requestDiffInterfaceByCoverType();
    }

    //2.2 恢复上下文需要从服务端请求的接口--回看
    //需要请求的接口：（1）QueryCover接口（seek页面，需要用到频道名称、节目相关的信息），（2）回看节目所在频道所在日期一天的节目单，需要遍历恢复播放的节目是否已经过期
    requestServerDataRestoreSch(playInfo) {
        let that = this;
        that.reqCount = 2;
        that.requestDiffInterfaceByCoverType();
        let time = playInfo.startTime;
        let date = time.substr(0, 4)+"-"+time.substr(4, 2)+"-"+time.substr(6, 2);
        let startTime = date + " 00:00:00";
        let endTime = date + " 23:59:59";
        DataAccess.requestChannelSchedule({channelCode: playInfo.channelCode, startDate: startTime, endDate: endTime, callback: function(data, status) {
            that.processRequestCallback("requestChannelSchedule", data, status, "001");
        }});
    }

    //3.1 按channelcode播放需要从服务端请求的接口 (1)QueryCover接口，请求所有直播频道
    requestServerDataByChannelCode() {
        let that = this;
        that.reqCount = 1;
        that.requestDiffInterfaceByCoverType();
    }

    //3.2 按projCode播放需要从服务端请求的接口（1）QueryChannelMarkCodeMap接口，获取项目标识和频道号的map关系；（2）QueryCover接口，请求所有直播频道
    requestServerDataByProjChannel(param) {
        let that = this;
        that.reqCount = 2;
        let info = param.data.split("|");
        let proj = info[0];
        DataAccess.requestChannelMarkCodeMap({proj: proj, callback: function (data, status) {
            that.processRequestCallback("requestChannelMarkCodeMap",data, status, "001");
        }});
        that.requestDiffInterfaceByCoverType();
    }

    //根据封套的不同类型，访问不同的接口
    requestDiffInterfaceByCoverType() {
        let that = this;
        if(OTTConfig.showEnvelopeFlag() == coverType.CHANNEL_IMAGE) {   //九宫格封套，访问QueryCover接口
            DataAccess.requestLiveCategoryChannel({callback: function(data,status) {
                that.processRequestCallback("requestLiveCategoryChannel",data, status, "002");
            }});
        } else {        //频道列表封套、或无封套，访问QueryLiveCategoryWeb接口
            DataAccess.requestLiveCategoryWeb({callback: function(data,status) {
                that.processRequestCallback("requestLiveCategoryWeb",data, status, "002");
            }});
        }
    }

    processRequestCallback(type, data, status, code) {
        this.loadingDataRight(type, data);
        if (status !== interfaceBackStatus.SUCCESS) {
            JxLog.e([], "App/app_zbhk/ModeManage/processRequestCallback", ["初始化必须数据请求失败", type]);
        }
    }

    loadingDataRight(dataType,data){
        let that = this;
        if(dataType===""){
            App.appInitFinished();
            return ;
        }
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