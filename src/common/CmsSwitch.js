//appcms中配置的开关数据
import {getBinaryFixBit} from "./CommonUtils"
import {vodRecommendSwitch} from "./GlobalConst"
import Config from "./Config"

export const OTTConfig = window.OTTConfig || {};
OTTConfig.config = null;
OTTConfig.setConfig = function (c) {
    OTTConfig.config = c;
};

/*
 对于大部分，只有0/1开关的值，改为false/true
 */
OTTConfig.getValueStatus = function (key) {
    if (OTTConfig.config != null) {
        if (parseInt(OTTConfig.config[key]) == 1) {
            return true;
        }
    }
    return false;
};

OTTConfig.getValue = function (key) {
    if (OTTConfig.config != null) {
        if(OTTConfig.config[key]) {
            return OTTConfig.config[key];
        }
    }
    return "";
};

//是否显示频道号（AiLive、直播回看）
//0:不显示频道号； 1:显示真实频道号； 2:显示虚拟频道号
OTTConfig.showChannelNo = function () {
    return parseInt(OTTConfig.config["showChannelNumberFlag"]);
};
//是否显示频道名称（AiLive、直播回看）
//0:不显示频道名称；1:显示真实频道名称；2:显示虚拟频道名称
OTTConfig.showChannelName = function () {
    return parseInt(OTTConfig.config["showNameFlag"]);
};

//zbhk中频道页面箭头样式 0 表示向右单箭头 1表示向右双箭头
OTTConfig.pageArrowFlag = function () {
    let info = OTTConfig.getValue ("pageArrowFlag");
    info = info == '' ? 0 : parseInt(info);
    return info;
};

//是否显示台标（直播回看）
OTTConfig.showChannelIcon = function () {
    return OTTConfig.getValueStatus("showIconFlag");
};
//是否显示进度条（AiLive）
OTTConfig.showProgressFlag = function () {
    return OTTConfig.getValueStatus("showProgressFlag");
};
//是否显示mini菜单页面的节目单TAB（AiLive）
OTTConfig.isShowMinProgramTab = function () {
    return false;
};
//是否显示直播节目时间（AiLive、直播回看）
OTTConfig.showCoverLiveTime = function() {
    return OTTConfig.getValueStatus("showProgressFlag") && OTTConfig.getValueStatus("showCoverLiveTime");
};
//是否显示点播推荐(总开关)（AiLive）
OTTConfig.showVodRecommend = function(type=vodRecommendSwitch.TOTAL_VOD_RECOMMEND) {
    let value = OTTConfig.getValue("tvodRecommendFlag");
    if(type == vodRecommendSwitch.TOTAL_VOD_RECOMMEND) {
        if(value > 0) {    //只要有一个开关是打开的，就需要请求推荐数据
            return true;
        } else {
            return false;
        }
    }
    return getBinaryFixBit(value, type);
};
//是否显示直播（AiLive）
OTTConfig.liveSwitch = function() {
    return OTTConfig.getValueStatus("liveSwitch");
};
//是否开启接口访问直接播放的功能（AiLive、直播回看）
OTTConfig.supportInterfacePlay = function() {
    return OTTConfig.getValueStatus("supportInterfacePlay");
};
//不显示直播频道名称的时候，后台配置的名称（AiLive、直播回看）
OTTConfig.fakeChannelName = function() {
    return OTTConfig.getValue("fakeChannelName");
};
/*直播节目上下方向键响应模式（AiLive、直播回看）
 0.不响应；
 1.上下键切台（上键减频道，下键加频道）
 2.上下键呼出迷你菜单
 3.上下键切台（上键加频道，下键减频道）
 */
OTTConfig.supportUDC = function () {
    return parseInt(OTTConfig.config["supportUDC"]);
};

/*直播频道上下键切台的切换范围（AiLive、直播回看）
 0.在播放频道所在分类里面循环切台
 1.在全部频道里面循环切台
 */
OTTConfig.channelUDCRange = function () {
    return parseInt(OTTConfig.config["channelUDCRange"]);
};

/*回看节目上下方向键响应模式（AiLive、直播回看）
 0.不响应；
 1.上下键切换节目：（1）回看在一天的节目单切换；（2）精选切换该节目下的剧集；
 2.上下键呼出菜单：（1）回看上键呼出频道节目大菜单，下键呼出一天的节目小菜单；（2）精选上键呼出精选分类大菜单，下键呼出节目剧集小菜单；
 */
OTTConfig.supportSchUDC = function () {
    return parseInt(OTTConfig.config["supportSchUDC"]);
};
//是否开启日志上报功能（AiLive、直播回看）
OTTConfig.supportDataReport = function() {
    return OTTConfig.getValueStatus("supportLogRecord");
};
//是否支持UDS（AiLive、直播回看）
OTTConfig.getUDSUrl = function() {
    let info = OTTConfig.getValue("liveUDSServer");
    info = info===null?"":info;
    return info;
};
//直播时移支持的最大时移时长，单位为秒（AiLive、直播回看）:若AppService没有下发该字段，则从配置文件中读取
OTTConfig.getMaxSeekTime = function() {
    let time = OTTConfig.getValue("supportMaxSeekTime");
    if(!time) {
        time = Config.supportMaxSeekTime;
    }
    return time;
};
//是否支持数字选台（AiLive）
OTTConfig.supportDS = function () {
    return OTTConfig.getValueStatus("supportDS");
};
//是否支持数字选台（直播回看）
OTTConfig.supportDSZbhk = function () {
    return OTTConfig.getValueStatus("supportDSZbhk");
};
//回看节目单的天数（AiLive、直播回看）
OTTConfig.getTvodDays = function() {
    return parseInt(OTTConfig.config["tvodDays"]);
};
//直播封套名称(AiLive)
OTTConfig.getLiveCoverName = function() {
    return OTTConfig.getValue("liveCoverName");
};
//是否开启直播节目回看列表功能（AiLive、直播回看）
OTTConfig.showLiveReviewList = function() {
    return OTTConfig.getValueStatus("showLiveProgramList");
};
//是否开启直播时移功能（AiLive、直播回看）
OTTConfig.supportLiveSeek = function() {
    return OTTConfig.getValueStatus("supportLiveSeek");
};
//是否开启讯飞语音搜索功能（AiLive、直播回看）
OTTConfig.supportVoiceSearch = function() {
    return OTTConfig.getValueStatus("supportVoiceSearch");
};
//是否支持频道付费的功能（AiLive）
OTTConfig.supportChannelPay = function() {
    return OTTConfig.getValueStatus("supportChannelPay");
};
//频道回看节目的付费开关（AiLive）
OTTConfig.reviewProgramPay = function() {
    return OTTConfig.getValueStatus("reviewProgramPay");
};
//是否显示封套（直播回看）
//0：不显示封套；1：显示频道列表封套；2：显示九宫格频道封套
OTTConfig.showEnvelopeFlag = function () {
    return OTTConfig.getValue("showEnvelopeFlag");
};
//全屏播放直播节目时ok键的响应（直播回看）
//0(默认)：OK呼出节目单列表菜单，并且焦点定位在直播节目上；
//1：OK呼出分类列表菜单，并焦点定位在正播频道上；
//2: OK呼出频道节目单菜单，并且焦点定位在正播频道上；
OTTConfig.okResponseType = function () {
    return OTTConfig.getValue("okResponseType");
};
//全屏播放直播节目时back键的响应（直播回看）
//0(默认)：back键呼出退出界面；1：back键直接退出到封套界面
OTTConfig.backResponseType = function () {
    return OTTConfig.getValue("backResponseType");
};
//是否显示"收藏"(暂未使用)
OTTConfig.showCollection = function() {
    return OTTConfig.getValueStatus("showCollectionFlag");
};
//是否显示"追剧"(暂未使用)
OTTConfig.showSubscription = function() {
    return OTTConfig.getValueStatus("showSubscriptionFlag");
};
//是否显示"预约"
OTTConfig.showBook = function() {
    return OTTConfig.getValueStatus("showBook");
};
/*
 回看时间格式要求
 0: 默认（starttime=1514080860&endtime=1514098860）
 1：例如咪咕（starttime=20171224T090100.00Z&endtime=20171224T140100.00Z）
 */
OTTConfig.schTimeFormatType = function() {
    if(OTTConfig.config["schTimeFormatType"]) {
        return parseInt(OTTConfig.config["schTimeFormatType"]);
    }
    return 0;
};
//回顾节目时间延迟计算（原节目单时间-(liveShiftTime-tvodShiftTime)）
OTTConfig.reviewProgramDelayTime = function() {
    let liveShiftTime = parseInt(OTTConfig.getValue("liveShiftTime"));
    let tvodShiftTime = parseInt(OTTConfig.getValue("tvodShiftTime"));
    return liveShiftTime - tvodShiftTime;
};
//是否缓存鉴权播放地址：开关默认开启 （已经播放过的的直播节目，同一频道回看节目的切换，包括顺播）
OTTConfig.supportCacheAuthResult = function () {
    if (typeof (OTTConfig.config['supportCacheAuthResult']) != "undefined") {
        return parseInt(OTTConfig.config['supportCacheAuthResult']) == 1 ? true : false;
    } else {
        return Config.supportCacheAuthResult;
    }
};
//隔断上报间隔时间
OTTConfig.getBreakPointSetIntervalTime = function() {
    if(OTTConfig.config['breakPointSetTime']) {
        return OTTConfig.config['breakPointSetTime'];
    } else {
        return Config.breakPointSetIntervalTime;
    }
};
//播控页是否响应*按钮（直播回看）
//0：不响应（默认）；1：响应--同时在播控页显示提示
OTTConfig.responseStarButton = function () {
    return parseInt(OTTConfig.config["responseStarButton"]);
};
//是否需要轮翻（第一个频道向上到最后一个频道，最后一个频道向下到第一个频道）
//默认不支持
OTTConfig.isUpDownLoop = function() {
    return OTTConfig.getValueStatus("isUpDownLoop");
};
//无封套进应用的响应
//0(默认)：全屏播放+分类菜单； 1：全屏播放+右下角屏显
OTTConfig.noCoverAppResponse = function() {
    return parseInt(OTTConfig.config["noCoverAppResponse"]);
};
//回看节目是否拼接播放地址
OTTConfig.isSchProgramContactPlayUrl = function() {
    if (typeof OTTConfig.config["schProgramContactPlayUrl"] != "undefined") {
        return parseInt(OTTConfig.config["schProgramContactPlayUrl"]) == 1 ? true : false;
    } else {
        return Config.schProgramContactPlayUrl;
    }
};
//播放地址是否拼接UserGroup
OTTConfig.isPlayUrlWithUserGroup = function () {
    return OTTConfig.getValueStatus("playurlWithUsergroup");
};
OTTConfig.isOK = function (header) {
    if(header != null && header['RC'] == 0){
        return true;
    }
    return false;
};

/**
 * 函数：SupportMultiCDN
 * 功能：是否支持多CDN播放
 */
OTTConfig.SupportMultiCDN = function () {
    if (typeof (MediaPlayer) != "undefined") {
        if (typeof (MediaPlayer.setPlayParams) != "undefined") {
            return true;
        }
    }
    return false;
};

/**
 * 函数：SupportAuthByScheduleCode
 * 功能：是否支持ScheduleCode鉴权
 */
OTTConfig.SupportAuthByScheduleCode = function () {
    return true;
};

export default OTTConfig