// +----------------------------------------------------------------------
// | Copyright: BestTV
// +----------------------------------------------------------------------
// | Description:数据上报
// +----------------------------------------------------------------------
// | Author: karl.dong
// +----------------------------------------------------------------------
// | Date：2016/5/18
// +----------------------------------------------------------------------
// | Mod：karl.dong 2018/5/24
// +----------------------------------------------------------------------
import { sysTime } from './TimeUtils';
import OTT from './OttMiddle';
import OTTConfig from './CmsSwitch';
import {prefixIntrger} from './CommonUtils';
import Config from "./Config";
import DataAccess from "./DataAccess";
import {mediaType,playAction, LogType} from "./GlobalConst";
import PlayerDataAccess from "./PlayerDataAccess";
import JxLog from "./Log"
import {PlayerControllerStatic} from './OttPlayer';
import {webCookie} from './LocalStorage'
import singularLogRecord from "./SingularLogRecord";

const ReportLogType ={
    START_OR_STOP:2, //应用打开或退出
    START_PLAYING:5,//起播
    STOP_PLAYING:4,//停止播放
    FAVORITE:50,//收藏
    PAGE_VISIT:21//页面访问
};

/*事件上报行为对象*/
export const DataReport = window.DataReport || {
    logAddr:"",//上报服务器地址
    breakPointPlayStopSetInterval:null,
    playTimes:0,//播放次数
    breakPointPlayTaskId:"",
    /*应用启动事件上报*/
    appStart: function() {
        let data = DataReportModel.getAppStartInfo();
        DataReportModel.initTplayInfo();
        JxLog.i([LogType.PLAY, LogType.REPORT], "common/DataReport/appStart",
            ["应用启动上报", data]);
        this.updateBreakPointPlayTaskId();
        this.send(data);
    },

    getBreakPointPlayTaskId(){
        return this.breakPointPlayTaskId;
    },

    updateBreakPointPlayTaskId(){
        let flashTag = "FLASH";
        let userTag =  OTT.UserProfile.getUserIdForLog();
        userTag = userTag==="GUEST_TVID"?DataReportModel.getTerminalStbid():userTag;
        let timeStamp = sysTime.nowFormat();
        this.breakPointPlayTaskId = flashTag+"_"+userTag+"_"+timeStamp+"_"+prefixIntrger(++this.playTimes,3);
    },

    reStartBreakPointPlayStopRecord:function(){
        JxLog.i([LogType.PLAY, LogType.REPORT], "common/DataReport/reStartBreakPointPlayStopRecord",
            ["tag-breakpoint-report begin to reStartBreakPointPlayStopRecord"]);
        if(this.breakPointPlayStopSetInterval!==null){
            clearInterval(this.breakPointPlayStopSetInterval);
        }
        let instanceOb = PlayerControllerStatic.getInstance();
        let interTime = OTTConfig.getBreakPointSetIntervalTime();
        this.breakPointPlayStopSetInterval = setInterval(()=>{
            if(instanceOb.isNeedStop()) {
                JxLog.i([LogType.PLAY, LogType.REPORT], "common/DataReport/reStartBreakPointPlayStopRecord",
                    ["tag-breakpoint-report breakpoint report again"]);
                stopPlayingLogRecord(false,true);
                return;
            }
            JxLog.i([LogType.PLAY, LogType.REPORT], "common/DataReport/reStartBreakPointPlayStopRecord",
                ["tag-breakpoint-report breakpoint report not need because of no playing"]);
        },interTime);
        JxLog.i([LogType.PLAY, LogType.REPORT], "common/DataReport/reStartBreakPointPlayStopRecord",
            ["tag-breakpoint-report end to reStartBreakPointPlayStopRecord  interTime", interTime]);
    },

    stopBreakPointPlayStopRecord:function(){
        if(this.breakPointPlayStopSetInterval!==null){
            JxLog.i([LogType.PLAY, LogType.REPORT], "common/DataReport/stopBreakPointPlayStopRecord",
                ["tag-breakpoint-report stop breakpoint setInterval"]);
            clearInterval(this.breakPointPlayStopSetInterval);
            this.breakPointPlayStopSetInterval = null;
        }
    },

    /*应用退出事件上报*/
    appStop: function() {
        let data = DataReportModel.getAppStopInfo();
        JxLog.d([LogType.PLAY, LogType.REPORT], "common/DataReport/appStop",
            ["应用退出上报", data]);
        this.send(data);
        this.clearStopReport();
    },

    /* 收藏上报
     * @param info {content_name:"节目名称",content_code:"节目code",category_code:"所属分类",favorites_status:"收藏状态 0取消 1收藏"}
     * */
    favoritesRecord:function(info){
        let data = DataReportModel.getFavoriteInfo(info);
        this.send(data);
    },

    /* 页面访问记录上报
     * @param info {page_name:"页面名称",page_type:"页面类型",page_route:"页面路径",content_type:"内容类型",
     * entry_time:"页面进入时间",leave_time:"页面退出时间",page_init_time:"页面初始化时间 ms"}
     * */
    visitPageRecord: function(info) {
        let data = DataReportModel.getVisitPageInfo(info);
        if(data.page_name!=""&&(data.entry_time != data.leave_time)){
            this.send(data);
        }
    },

    /*页面元素访问记录上报,分类点击没提留6秒以上的不上报*/
    clickPageElementRecord:function(info){
        let data = DataReportModel.getClickPageElementInfo(info);
        if((info.page_element_on_time != info.page_element_off_time)  && (info.page_element_off_time - info.page_element_on_time) <= 6) {
        } else {
            if((info.page_element_on_time == info.page_element_off_time)&&info.page_element_name.indexOf("分类")!=-1){

            }else{
                this.send(data);
            }
        }
    },

    /*播放结束记录上报*/
    playStopRecord: function() {
        if(sysTime.isTimeAllRight()){
            JxLog.d([LogType.PLAY, LogType.REPORT], "common/DataReport/playStopRecord",
                ["tag-breakpoint-report、tag-singularLogRecord 播放日志上报", DataReportModel.tplay_info]);
            this.send(DataReportModel.tplay_info);
        }else{
            singularLogRecord.setSingularData(DataReportModel.tplay_info);
            DataAccess.requestOptionData();
        }
    },

    /* 通过加载js的方式将事件日志信息发送给平台
     * @param data 日志信息数组，对应日志规范日志的一条记录
     * */
    send: function(data) {
        JxLog.d([LogType.PLAY, LogType.REPORT], "common/DataReport/send", ["tag-data-report begin"]);
        if(!OTTConfig.supportDataReport()) {
            JxLog.d([LogType.PLAY, LogType.REPORT], "common/DataReport/send",
                ["tag-data-report end  no report because of switch off"]);
            return;
        }
        data = this.transToFormatString(data);
        this.logAddr = OTT.UserProfile.getLogAddress();
        let requestUrl = this.logAddr+"/ottLogUpload?log="+data;
        JxLog.i([LogType.REPORT], "common/DataReport/send",
            ["tag-data-report data report url", requestUrl]);
        DataAccess.ottLogUpload(requestUrl);
        JxLog.d([LogType.PLAY, LogType.REPORT], "common/DataReport/send", ["ag-data-report end"]);
    },

    /* 将数组转为中间用|线隔开的字符串并返回
     * @param data 数组
     * @return 字符串
     * */
    transToFormatString: function(data) {
        let output = "";
        for(let j in data) {
            output =output==""?output + data[j]:output+"|" + data[j];
        }
        return output;
    },

    isNeedReportBeforeAppStop:function(){
        let begin_time = this.getAppBeginTimeForStopReport();
        let end_time  = this.getAppEndTimeForStopReport();
        if(begin_time&&end_time&&end_time!=="0"&&begin_time!=="0"){
            return true;
        }
        return false;
    },

    getAppBeginTimeForStopReport:function(){
        return webCookie.getItem("APP_B");
    },

    getAppEndTimeForStopReport:function(){
        return webCookie.getItem("APP_E");
    },

    setAppBeginTimeForStopReport:function(){
        let now =  sysTime.nowFormat();
        webCookie.setItem("APP_B",now);
    },

    setAppEndTimeForStopReport:function(){
        let now =  sysTime.nowFormat();
        webCookie.setItem("APP_E",now);
        this.stopInter =  setInterval(function() {
            let now =  sysTime.nowFormat();
            webCookie.setItem("APP_E",now);
        },10000)
    },

    clearStopReport:function(){
        clearInterval(this.stopInter);
        webCookie.setItem("APP_B",0);
        webCookie.setItem("APP_E",0);
        let begin_time = this.getAppBeginTimeForStopReport();
        let end_time  = this.getAppEndTimeForStopReport();
    }
};

/*上报事件数据管理对象*/
export const DataReportModel={
    log_copy: "004", //日志版本
    terminal_copy:"",//	终端业务版本  已知
    module_flag:Config.AppFlag,// 应用或应用模块标识  已知
    program_copy: Config.AppVersion,// 应用版本 已知
    program_flag: Config.ModuleAppCode,// 应用标识 已知
    terminal_system_copy:"", // 	终端系统版本 已知
    terminal_device_copy:"",//终端硬件型号 已知
    operator_user_id:"",//运营商用户标识 (无法获取 可不填)
    terminal_stbid:'',//终端串号 已知

    pauseTime:null, //暂停时的当前时间
    callbackState:null, //当前播放器回调状态
    startLoadingTime:null, //开始缓冲时间 m为单位保留3位
    startMillisecond:null,//起播时间，m为单位保留3位
    beginAction:3,//播放开始行为 3:用户主动播放;4:自动播放下一个
    endAction:2,//播放结束行为 0:播放结束;1:异常退出;2:用户主动退出

    getTerminalStbid:function(){
        this.terminal_stbid = OTT.SysConfig.getStbID();
        return this.terminal_stbid;
    },

    createPlayBeginTime(){
        this.tplay_info.begintime =  sysTime.nowFormat();
    },

    getTerminalSystemCopy:function(){
        if(typeof(BesTVSystem) != "undefined" && typeof(BesTVSystem.getSysProperty) != "undefined") {
            this.terminal_system_copy = BesTVSystem.getSysProperty("ro.build.display.id");
        }
        return  this.terminal_system_copy;
    },

    getOperatorUserId:function(){
        this.operator_user_id = OTT.UserProfile.getUserAccount();
        return  this.operator_user_id;
    },

    getTerminalCopy:function(){
        this.terminal_copy = OTT.SysConfig.getTvProfile();
        this.terminal_copy = this.terminal_copy.replace("FirmwareVersion/","");
        return this.terminal_copy;
    },

    getTerminalDeviceCopy:function(){
        if(typeof(BesTVSystem) != "undefined" && typeof(BesTVSystem.getSysProperty) != "undefined") {
            this.terminal_device_copy = BesTVSystem.getSysProperty("ro.product.model");
        }
        return this.terminal_device_copy;
    },

    page_type: { //页面类型 首次出现于页面访问日志（TVISITPAGE）
        home: 1, //首页或者推荐页
        epg: 2,//海报墙/epg
        detail: 3,//详情/内容介绍
        playControl: 4,//播控
        productSelect: 5,//产品选择
        order: 6,//订购
        search: 7,//搜索
        record: 8,//记录
        other: 99//其他
    },

    play_type: {//播放类型
        lookback: 2,// 回看
        live: 3//直播
    },

    content_type: { //内容类型
        vod: 1,//点播
        special: 2,//专题
        live: 3,//直播
        featured: 4,//精选
        other: 99//其他
    },

    favorites_type: {//收藏类型
        programFavorites: 1, //节目收藏
        channelFavorites: 2,//频道收藏
        channelSub: 3//频道追剧
    },

    tapp_info:{ //应用使用日志
        log_copy: "", //1 日志版本
        type:"",  //2 日志类型
        terminal_copy:"",//3 	终端业务版本
        user_id: "",// 4 USERID
        now_time: "",// 5当前时间
        module_flag: "",// 6 应用或应用模块标识
        program_copy: "",// 7 应用版本
        begin_time:"" ,// 8 beginTime开始时间
        end_time:"" ,// 9 endTime结束时间
        time_count:"" ,// 10 timeCount
        program_flag:"",// 11 应用标识
        terminal_system_copy:"", // 	12 终端系统版本
        TVID:"",//13
        Partneruser:"",//14
        Action:"",//15 1、启动 2、退出
        InitTime:""//16 应用初始化时间
    },

    /* 获取应用启动表记录信息 */
    getAppStartInfo:function(){
        this.tapp_info.log_copy = this.log_copy; //1
        this.tapp_info.type = ReportLogType.START_OR_STOP; //2
        this.tapp_info.terminal_copy = this.getTerminalCopy();//3
        this.tapp_info.user_id = OTT.UserProfile.getUserIdForLog(); //4
        this.tapp_info.now_time = sysTime.nowFormat(); //5
        this.tapp_info.module_flag = this.module_flag; //6
        this.tapp_info.program_copy = this.program_copy;//7
        this.tapp_info.begin_time = sysTime.nowFormat(); //8
        this.tapp_info.end_time = ""; //9 ** 填空
        this.tapp_info.time_count = ""; //10 **填空
        this.tapp_info.program_flag = this.program_flag;//11
        this.tapp_info.terminal_system_copy = this.getTerminalSystemCopy();//12
        this.tapp_info.TVID = this.getTerminalStbid(); //13
        this.tapp_info.Partneruser = this.getOperatorUserId();//14
        this.tapp_info.Action = 1;//15
        this.tapp_info.InitTime =  parseFloat(sysTime.nowMill() - window.WebApp.getAppStartTime()-sysTime.diff).toFixed(3);//16
        return this.tapp_info;
    },

    /*获取应用关闭表记录信息*/
    getAppStopInfo:function(){
        this.tapp_info.log_copy = this.log_copy; //1
        this.tapp_info.type = ReportLogType.START_OR_STOP; //2
        this.tapp_info.terminal_copy = this.getTerminalCopy();//3
        this.tapp_info.user_id = OTT.UserProfile.getUserIdForLog(); //4
        this.tapp_info.now_time = sysTime.nowFormat(); //5
        this.tapp_info.module_flag = this.module_flag; //6
        this.tapp_info.program_copy = this.program_copy;//7
        this.tapp_info.begin_time = DataReport.getAppBeginTimeForStopReport(); //8 必填 从cookie取
        this.tapp_info.end_time = DataReport.getAppEndTimeForStopReport(); //9  必填 从cookie取
        this.tapp_info.time_count = ""; //10
        this.tapp_info.program_flag = this.program_flag;//11
        this.tapp_info.terminal_system_copy = this.getTerminalSystemCopy();//12
        this.tapp_info.TVID = this.getTerminalStbid(); //13
        this.tapp_info.Partneruser = this.getOperatorUserId();//14
        this.tapp_info.Action = 2;//15
        this.tapp_info.InitTime = "";//16
        return this.tapp_info;
    },
    tplay_info:{ //播放日志
        log_copy: "", //1 日志版本
        type:"",  //2 日志类型
        terminal_copy:"",//3 	终端业务版本
        user_id: "",//4 USERID
        now_time: "",//5  当前时间
        itemCode:"",//6 节目code，仅对播放类型为点播的有效；无效时可给空值
        veidoClipCode:"",//7 File#detail，仅对播放类型为点播的有效；无效时可给空值
        begintime:"",//8 格式:（精确到秒，格式YYYYMMDDHHmmss）
        endTime:"",//9 格式:（精确到秒，格式YYYYMMDDHHmmss）
        pauseSumTime:"",//10 暂停累计时间
        pauseCount:"",//11 暂停次数
        firstLoadingTime:"",//12 首次缓冲时长
        loadingTime:"",//13 播放中缓冲累计时长
        loadingCount:"",//14 播放中缓冲累缓冲次数
        downAvgRate:"",//15 下载平均速率
        downMaxRate:"",//16 下载最大速率
        downMinRate:"",//17 下载最小速率
        downMaxShake:"",//18 速率抖动
        action:"",//19 0:播放结束;1:异常退出;2:用户主动退出
        errorCode:"",//20 错误原因
        taskID:"",//21 播放事务号
        playAvgRate:"",//22 播放平均码率
        playMaxRate:"",//23 播放最大码率
        playMinRate:"",//24 播放最小码率
        playRateShake:"",//25 播放码率抖动
        playRateShakeCount:"",//26 播放平均码流跳变次数
        netType:"",//27 网络类型
        loadSuccessFlag:0,//28 视频载入成功标识
        CDNFlag:"",//29 CDN标识
        program_flag:"",//30 应用标识
        playType:"",//31 播放类型
        channelCode:"",//32 频道代码
        start_Duration:"",//33 当前节目在节目单中的起始时间
        SSID:"",//34 AP的SSID
        categroyCode:"",//35 播放内容对应CategroyCode（多级）
        recID:"",//36 智能推荐ID，仅对智能推荐进入不为空，其它为空
        terminal_system_copy:"",//37 终端系统版本
        terminal_device_copy:"",//38 终端硬件型号
        program_copy: "",//39 应用版本
        playSource:"",//40 播放来源
        channelName:"",//41	频道名称[ChannelName]
        programmeID:"",//42 节目单ID
        programName:"",//43	节目单名称[programName]
        appcode: "",//44	应用code
        isorder:"",//45 收费类型 0：不收费；1：收费
        productcode:"",//46 产品code
        IsPay:"",//	47 当收费类型为1时，该字段必填
        ItemType:"",//48 根据播放类型来确认内容类型
        ADCount:"",//49
        ADContentCode:"",//50
        ADPlayTime:"",//51
        ADBackType:"",//52
        TVID:"",//53
        Partneruser:"",//54
        channelpackagescode:""//55 	频道包code
    },

    /*获取结束播放信息*/
    initTplayInfo: function() {
        //需要计算获取的字段
        this.tplay_info.now_time = "";//5  OK
        DataReportModel.createPlayBeginTime();//8* OK
        this.tplay_info.endTime = "";//9* OK
        this.tplay_info.pauseSumTime = 0;//10* OK
        this.tplay_info.pauseCount = 0;//11  OK
        this.tplay_info.firstLoadingTime = null;//12* OK
        this.tplay_info.loadingTime = 0;//13*  OK
        this.tplay_info.loadingCount = 0;//14* OK
        this.tplay_info.action = this.beginAction+":"+this.endAction;//19*  OK
        this.tplay_info.channelCode = "";//32* OK
        this.tplay_info.start_Duration = "";//33 ???
        this.tplay_info.categroyCode = "";//35* OK
        this.tplay_info.channelName = "";//41* ??
        this.tplay_info.programmeID = "";//42 ??
        this.tplay_info.programName = "";//43* ??

        //不需要通过计算可以直接赋值的字段
        this.tplay_info.log_copy = this.log_copy; //1
        this.tplay_info.type = 4;  //2
        this.tplay_info.terminal_copy = this.getTerminalCopy();//3
        this.tplay_info.user_id = OTT.UserProfile.getUserIdForLog();//4
        this.tplay_info.downAvgRate = 0;//15
        this.tplay_info.downMaxRate = 0;//16
        this.tplay_info.downMinRate = 0;//17
        this.tplay_info.downMaxShake = 0;//18
        this.tplay_info.playAvgRate = 0;//22
        this.tplay_info.playMaxRate = 0;//23
        this.tplay_info.playMinRate = 0;//24
        this.tplay_info.playRateShake = 0;//25
        this.tplay_info.playRateShakeCount = 0;//26
        this.tplay_info.netType = 0;//27
        this.tplay_info.program_flag = this.program_flag;//30
        this.tplay_info.recID = "";//36* (说明：目前没有)
        this.tplay_info.terminal_system_copy = this.getTerminalSystemCopy();//37*
        this.tplay_info.terminal_device_copy = this.getTerminalDeviceCopy();//38
        this.tplay_info.program_copy = this.program_copy;//39
        this.tplay_info.playSource = "OTT";//40*
        this.tplay_info.appcode = this.program_flag;//44
        this.tplay_info.isorder = 0;//45* （说明：flash 无付费，填固定值）
        this.tplay_info.ItemType = 1;//48*（说明：讨论确认flash 填固定值）
        this.tplay_info.TVID = this.getTerminalStbid();//53*（说明：固定值）
        this.tplay_info.Partneruser = this.getOperatorUserId();//54* （说明：固定值）

        //值填空的字段
        this.tplay_info.itemCode = "";//6* (说明：讨论确认flash 填空)
        this.tplay_info.veidoClipCode = "";//7 (说明：讨论确认flash 填空)
        this.tplay_info.errorCode = "";//20
        this.tplay_info.SSID = "";//34
        this.tplay_info.productcode = "";//46*（说明：flash无付费，填空）
        this.tplay_info.IsPay = "";//47*（说明：flash无付费，填空）
        this.tplay_info.ADCount = "";//49
        this.tplay_info.ADContentCode = "";//50
        this.tplay_info.ADPlayTime = "";//51
        this.tplay_info.ADBackType = "";//52
        this.tplay_info.channelpackagescode = "";//55* （说明：讨论确认flash 填空）

        //其它变量初始化
        this.pauseTime =null;
        this.startMillisecond = null;
        this.startLoadingTime = null;
        return this.tplay_info;
    },
    tfavorites_info: {//节目收藏记录日志（TFAVORITES）
        log_copy: "", //1 日志版本
        type:"",  //2 日志类型
        terminal_copy:"",//3 	终端业务版本
        bestv_user_id: "",//4 百视通用户标识
        now_time: "",//5  日志采集时间
        terminal_system_copy:"",//6 终端系统版本
        terminal_device_copy:"",//7 终端硬件型号
        operator_user_id: "",//8 运营商用户标识
        terminal_stbid:"",//9 终端串号
        favorites_time:"",//10 节目收藏时间
        content_name:"",//11 收藏节目的名称
        content_code:"",//12 收藏节目的code
        category_code:"",//13 收藏节目栏目的路径
        favorites_status:"",//14  0 : 取消收藏 1: 收藏
        favorites_type:"",//15 收藏类型1：节目收藏 2：频道收藏 3：频道追剧
        appcode: "",//16	应用code
        RecID: ""//17	智能推荐ID
    },
    /* 获取收藏表记录信息
     * @param {content_name:"节目名称",content_code:"节目code",category_code:"所属分类",favorites_status:"收藏状态 0取消 1收藏",favorites_type:"收藏类型"}
     * @return 收藏上传信息数组
     * */
    getFavoriteInfo: function(info) {
        this.tfavorites_info.log_copy = this.log_copy; //1 日志版本
        this.tfavorites_info.type =  ReportLogType.FAVORITE;  //2 日志类型
        this.tfavorites_info.terminal_copy = this.getTerminalCopy();//3 	终端业务版本
        this.tfavorites_info.bestv_user_id = OTT.UserProfile.getUserIdForLog();//4 百视通用户标识
        this.tfavorites_info.now_time = sysTime.nowFormat();//5  日志采集时间
        this.tfavorites_info.terminal_system_copy = this.getTerminalSystemCopy();//6 终端系统版本
        this.tfavorites_info.terminal_device_copy = this.getTerminalDeviceCopy();//7 终端硬件型号
        this.tfavorites_info.operator_user_id = this.getOperatorUserId();//8 运营商用户标识
        this.tfavorites_info.terminal_stbid = this.getTerminalStbid();//9 终端串号
        this.tfavorites_info.favorites_time = sysTime.nowFormat();//10 节目收藏时间

        this.tfavorites_info.content_name = info.content_name;//11 收藏节目的名称
        this.tfavorites_info.content_code = info.content_code;//12 收藏节目的code
        this.tfavorites_info.category_code = info.category_code;//13 收藏节目栏目的路径
        this.tfavorites_info.favorites_status = info.favorites_status;//14  0 = 取消收藏 1= 收藏
        this.tfavorites_info.favorites_type = info.favorites_type;//15 收藏类型1：节目收藏 2：频道收藏 3：频道追剧
        this.tfavorites_info.appcode = this.program_flag;//16	应用code
        this.tfavorites_info.RecID = "";//17	智能推荐ID
        return this.tfavorites_info;
    },

    visit_page_info: {//页面访问日志（TVISITPAGE）
        log_copy: "", //1 日志版本
        type: "",  //2 日志类型
        terminal_copy: "",//3 	终端业务版本
        bestv_user_id: "",//4 百视通用户标识
        now_time: "",//5  日志采集时间
        terminal_system_copy: "",//6 终端系统版本
        terminal_device_copy: "",//7 终端硬件型号
        operator_user_id: "",//8 运营商用户标识
        page_name: "",//9 页面名称
        page_type: "",//10 页面类型
        page_route: "",//11 页面路径
        content_name: "",//12 内容名称
        content_type: "",//13 内容类型
        epg_code: "",//14 epg 节目code
        epg_cate: "",//15 egp 分类code
        entry_time: "",//16 页面进入时间
        leave_time: "",//17 页面退出时间
        program_copy: "",//18 应用版本
        page_index: "",//19 页码
        page_element_id:"",//20 页面元素ID
        page_element_name:"",//21 页面元素名称
        elementClickType:"",//22 元素点击类型 1、页面元素点击 2、页面退出
        page_init_time:"",//23 页面初始化时间
        TVID: "", //24	应用code
        RecID:"",//25 智能推荐ID
        Pagesource:""//26 页面来源
    },

    /* 获取页面访问记录表信息
     * @param info {page_name:"页面名称",page_type:"页面类型",page_route:"页面路径",
     * content_type:"内容类型",entry_time:"页面进入时间",leave_time:"页面退出时间",page_init_time:"页面初始化时间 ms"}
     * @return 收藏上传信息数组
     * */
    getVisitPageInfo: function(info) {
        this.visit_page_info.log_copy = this.log_copy; //1 日志版本
        this.visit_page_info.type = ReportLogType.PAGE_VISIT;  //2 日志类型
        this.visit_page_info.terminal_copy = this.getTerminalCopy();//3 	终端业务版本
        this.visit_page_info.bestv_user_id = OTT.UserProfile.getUserIdForLog();//4 百视通用户标识
        this.visit_page_info.now_time = sysTime.nowFormat();//5  日志采集时间
        this.visit_page_info.terminal_system_copy = this.getTerminalSystemCopy();//6 终端系统版本
        this.visit_page_info.terminal_device_copy = this.getTerminalDeviceCopy();//7 终端硬件型号
        this.visit_page_info.operator_user_id = this.getOperatorUserId();//8 运营商用户标识
        this.visit_page_info.page_name = info.page_name;//9 页面名称
        this.visit_page_info.page_type = info.page_type;//10 页面类型
        this.visit_page_info.page_route = info.page_route;//11 页面路径
        this.visit_page_info.content_name = "";//12 内容名称
        this.visit_page_info.content_type = info.content_type;//13 内容类型
        this.visit_page_info.epg_code = "";//14 epg 节目code
        this.visit_page_info.epg_cate = "";//15 egp 分类code
        this.visit_page_info.entry_time = info.entry_time;//16 页面进入时间
        this.visit_page_info.leave_time = info.leave_time;//17 页面退出时间
        this.visit_page_info.program_copy = this.program_copy;//18 应用版本
        this.visit_page_info.page_index = "";//19 页码
        this.visit_page_info.page_element_id = "";//20 页面元素ID
        this.visit_page_info.page_element_name = "";//21 页面元素名称
        this.visit_page_info.elementClickType = 2;//22 元素点击类型
        this.visit_page_info.page_init_time = info.page_init_time;//23 页面初始化时间
        this.visit_page_info.TVID = this.getTerminalStbid() ;//24
        this.visit_page_info.RecID = "";//25
        this.visit_page_info.Pagesource = "";//26
        return this.visit_page_info;
    },

    /* 获取页面元素点击记录信息
     * @param info {page_name:"页面名称",page_type:"页面类型",page_route:"页面路径",
     * content_type:"内容类型",page_element_id:"页面元素ID",page_element_name:"页面元素名称"}
     * */
    getClickPageElementInfo:function(info){
        this.visit_page_info.log_copy = this.log_copy; //1 日志版本
        this.visit_page_info.type = ReportLogType.PAGE_VISIT;  //2 日志类型
        this.visit_page_info.terminal_copy = this.getTerminalCopy();//3 	终端业务版本
        this.visit_page_info.bestv_user_id = OTT.UserProfile.getUserIdForLog();//4 百视通用户标识
        this.visit_page_info.now_time = sysTime.nowFormat();//5  日志采集时间
        this.visit_page_info.terminal_system_copy = this.getTerminalSystemCopy();//6 终端系统版本
        this.visit_page_info.terminal_device_copy = this.getTerminalDeviceCopy();//7 终端硬件型号
        this.visit_page_info.operator_user_id = this.getOperatorUserId();//8 运营商用户标识
        this.visit_page_info.page_name = info.page_name;//9 页面名称
        this.visit_page_info.page_type = info.page_type;//10 页面类型
        this.visit_page_info.page_route = info.page_route;//11 页面路径
        this.visit_page_info.content_name = "";//12 内容名称
        this.visit_page_info.content_type = info.content_type;//13 内容类型
        this.visit_page_info.epg_code = "";//14 epg 节目code
        this.visit_page_info.epg_cate = "";//15 egp 分类code
        this.visit_page_info.entry_time = info.page_element_on_time;//16 元素点击进入时间
        this.visit_page_info.leave_time = info.page_element_off_time;//17 元素点击退出时间
        this.visit_page_info.program_copy = this.program_copy;//18 应用版本
        this.visit_page_info.page_index = "";//19 页码
        this.visit_page_info.page_element_id = info.page_element_id;//20 页面元素ID
        this.visit_page_info.page_element_name = info.page_element_name;//21 页面元素名称
        this.visit_page_info.elementClickType = 1;//22 元素点击类型
        this.visit_page_info.page_init_time = "";//23 页面初始化时间
        this.visit_page_info.TVID = this.getTerminalStbid() ;//24
        this.visit_page_info.RecID = "";//25
        this.visit_page_info.Pagesource = "";//26
        return this.visit_page_info;
    },

    /* 将指定的表数据初始化
     * */
    dateInit:function(data){
        for(let j in data) {
            data[j] = "";
        }
    }
};

export  function stopPlayingLogRecord(isUserOpAction=true) {
    try {
        DataReportModel.tplay_info.taskID = DataReport.getBreakPointPlayTaskId();
        JxLog.d([LogType.PLAY, LogType.REPORT], "common/DataReport/stopPlayingLogRecord",
            ["begin:结束播放上报播放结束行为isUserOpAction", isUserOpAction]);
        if(isUserOpAction){
            DataReportModel.endAction = playAction.USER_EXIT;
        }else{
            DataReportModel.endAction = playAction.PLAY_OVER;
        }
        let time = sysTime.nowFormat();
        let now = sysTime.nowMill();
        DataReportModel.tplay_info.endTime = time;
        DataReportModel.tplay_info.now_time = time;
        if(parseInt(DataReportModel.tplay_info.endTime)-parseInt(DataReportModel.tplay_info.begintime)<2){
            DataReportModel.initTplayInfo();
            return ;
        }
        if(DataReportModel.pauseTime!==null){
            DataReportModel.tplay_info.pauseSumTime += (now-DataReportModel.pauseTime);
            DataReportModel.pauseTime = null;
        }
        if(DataReportModel.tplay_info.pauseSumTime!==0){
            DataReportModel.tplay_info.pauseSumTime = parseFloat(DataReportModel.tplay_info.pauseSumTime).toFixed(3);
        }
        if(DataReportModel.tplay_info.loadingTime!==0){
            DataReportModel.tplay_info.loadingTime = parseFloat(DataReportModel.tplay_info.loadingTime).toFixed(3);
        }
        let nowPlayInfo = window.WebApp.getNowPlayInfo();
        if(nowPlayInfo===null){
            JxLog.e([LogType.PLAY, LogType.REPORT], "common/DataReport/stopPlayingLogRecord",
                ["播放上报错误，未找到播放信息"]);
            DataReportModel.initTplayInfo();
            return ;
        }
        DataReportModel.tplay_info.categroyCode = nowPlayInfo.categoryCode;
        DataReportModel.tplay_info.action = DataReportModel.beginAction+":"+DataReportModel.endAction;
        let playType = nowPlayInfo.type;
        if(playType===mediaType.LIVE){ //直播
            let channelCode = nowPlayInfo.channelCode;
            let channelInfo = DataAccess.getChannelInfo(channelCode);
            if(!channelInfo){
                JxLog.e([LogType.PLAY, LogType.REPORT], "common/DataReport/stopPlayingLogRecord",
                    ["播放上报错误，未找到频道信息"]);
                DataReportModel.initTplayInfo();
                return;
            }
            let scheduleCode = "";
            let startTime ="";
            let endTime = "";
            let programName =channelInfo.PlayProgramName;
            if(channelInfo.CurrentSchedule){
                let currentSchedule = channelInfo.CurrentSchedule;
                scheduleCode = currentSchedule.ScheduleCode;
                startTime = currentSchedule.StartTime;
                endTime = currentSchedule.EndTime;
                programName = currentSchedule.Name;
            }
            let channelName = channelInfo.ChannelName;
            DataReportModel.tplay_info.playType = DataReportModel.play_type.live;
            DataReportModel.tplay_info.channelCode = channelCode;
            DataReportModel.tplay_info.channelName = channelName;
            DataReportModel.tplay_info.programmeID = scheduleCode;
            DataReportModel.tplay_info.start_Duration = startTime+","+endTime;
            DataReportModel.tplay_info.programName =  programName;
        }else if(playType===mediaType.SCH){ //回看
            let reviewDetail = PlayerDataAccess.getReviewDetailByChannelSchedule(nowPlayInfo);
            let channelCode = "";
            let scheduleCode = "";
            let startTime = "";
            let endTime = "";
            let programName = "";
            let channelName = "";
            if(reviewDetail.ChannelCode){
                channelCode = reviewDetail.ChannelCode;
                channelName = reviewDetail.ChannelName;
            }
            if(reviewDetail.CurrentSchedule){
                scheduleCode = reviewDetail.CurrentSchedule.ScheduleCode;
                startTime = reviewDetail.CurrentSchedule.StartTime;
                endTime = reviewDetail.CurrentSchedule.EndTime;
                programName = reviewDetail.CurrentSchedule.Name;
            }
            DataReportModel.tplay_info.playType = DataReportModel.play_type.lookback;
            DataReportModel.tplay_info.channelCode = channelCode;
            DataReportModel.tplay_info.channelName = channelName;
            DataReportModel.tplay_info.programmeID = scheduleCode;
            DataReportModel.tplay_info.start_Duration = startTime+","+endTime;
            DataReportModel.tplay_info.programName =  programName;
        }else{ //精选
            let channelCode = "";
            let channelName = "";
            let channelInfo = "";
            let programName = "";
            let categoryCode = nowPlayInfo.categoryCode;
            let scheduleCode = nowPlayInfo.scheduleCode;
            let startTime = nowPlayInfo.startTime;
            let endTime = nowPlayInfo.endTime;
            let programInfo = DataAccess.getProgramInfoByCategoryAndScheduleCode(categoryCode,scheduleCode);
            if(!programInfo){
                JxLog.e([LogType.PLAY, LogType.REPORT], "common/DataReport/stopPlayingLogRecord", ["播放上报错误，未获取到节目信息"]);
                DataReportModel.initTplayInfo();
                return ;
            }
            let schedules = [];
            if(programInfo.schedules){
                schedules = programInfo.schedules;
            }
            let theSch = null;
            let series = "";
            for(let i=0;i<schedules.length;i++){
                if(schedules[i].ScheduleCode === scheduleCode){
                    theSch = schedules[i];
                    series = schedules[i].Name;
                    break;
                }
            }
            if(theSch!==null){
                channelCode = theSch.ChannelCode;
                channelInfo = DataAccess.getChannelInfo(channelCode);
                if(channelInfo.ChannelName){
                    channelName = channelInfo.ChannelName;
                }
            }
            if(programInfo.keyname){
                programName = programInfo.keyname;
            }
            DataReportModel.tplay_info.playType = DataReportModel.play_type.lookback;
            DataReportModel.tplay_info.channelCode = channelCode;
            DataReportModel.tplay_info.channelName = channelName;
            DataReportModel.tplay_info.programmeID = scheduleCode;
            DataReportModel.tplay_info.start_Duration = startTime+","+endTime;
            DataReportModel.tplay_info.programName =  programName+series;
        }
        DataReportModel.tplay_info.firstLoadingTime = DataReportModel.tplay_info.firstLoadingTime
        ===null?0:DataReportModel.tplay_info.firstLoadingTime;
        DataReport.playStopRecord();
        DataReportModel.initTplayInfo();
        if(isUserOpAction){
            DataReportModel.beginAction = playAction.USER_PLAY;
        }else{
            DataReportModel.beginAction = playAction.AUTO_PLAY_NEXT;
        }
    }catch(e) {
        DataReportModel.initTplayInfo();
        JxLog.e([LogType.PLAY, LogType.REPORT], "common/DataReport/stopPlayingLogRecord",
            ["播放上报错误，上报数据获取异常"]);
    }
    JxLog.d([LogType.PLAY, LogType.REPORT], "common/DataReport/stopPlayingLogRecord", ["end"]);
}

export default {DataReport,DataReportModel,stopPlayingLogRecord}