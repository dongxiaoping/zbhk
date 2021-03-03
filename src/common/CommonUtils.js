//通用功能的函数封装
import OTT from './OttMiddle';
import OTTConfig from './CmsSwitch';
import {channelInfoShowType, LogType, defaultBookInfo} from "./GlobalConst";
import Config from "./Config";
import {sysTime} from './TimeUtils';
import {md5Utils} from "../lib/md5.js"
import JxLog from "./Log"
import Collection from "./UserCollection";
import DataAccess from "./DataAccess";
import trash_focus from "../images/pages_ailive/trash_focus.png";
import {KeyCode} from "./FocusModule";
import {moveType} from "./GlobalConst";

export const addClass = (function() {
    if (document.body.classList) {
        return function(elem, value) {
            if (!elem) return;
            elem.classList.add(value);
        }
    } else {
        return function(elem, value) {
            if (!elem) return;
            if (hasClass(elem, value)) return;
            if (!elem.className) {
                elem.className = value;
            } else {
                var oValue = elem.className;
                oValue += " " + value;
                elem.className = oValue;
            }
        }
    }
})();

export const hasClass = (function() {
    if (document.body.classList) {
        return function(element, className) {
            element.classList.contains(className);
        }
    } else {
        return function(element, className) {
            var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
            return element.className.match(reg);
        }
    }
})();

export const removeClass = (function() {
    if (document.body.classList) {
        return function(element, className) {
            if (!element) return;
            element.classList.remove(className);
        }
    } else {
        return function() {
            if (!element) return;
            if (hasClass(element, className)) {
                var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
                element.className = element.className.replace(reg, ' ');
            }
        }
    }
})();


export const show = function(obj) {
    obj.style.display = "block";
};

export const hide = function(obj) {
    obj.style.display = "none";
};

//判断字符长度 汉字算两个字符
export const getByteLen = function(val) {
    let len = 0;
    for (let i = 0; i < val.length; i++) {
        let a = val.charAt(i);
        if (a.match(/[^\x00-\xff]/ig) != null) {
            len += 2;
        } else {
            len += 1;
        }
    }
    return len;
};
export const getByteContent = function(str, showLen) {
    let content='', len=0, i=0;
    for (i; i < str.length; i++) {
        let a = str.charAt(i);
        len += a.match(/[^\x00-\xff]/gi) != null ? 2 : 1;
        if (len>showLen) {
           break;
        }
        content += a;
    }
    if(i<str.length) {
        content += "...";
    }
    return content;
};
export const isChinese = function(temp) {
    let re = /[^\u4e00-\u9fa5]/;
    if (re.test(temp)) {
        return false;
    }
    return true;
};

//获取访问url中，参数为name的值
export const getQueryString = function(name) {
    let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    let r = window.location.search.substr(1).match(reg);
    if (r != null) {
        return decodeURIComponent(r[2]);
    }
    return null;
};


//克隆对象
export const cloneObj = function(obj) {
    let newObj = {};
    for (let prop in obj) {
        newObj[prop] = obj[prop]
    }
    return newObj
};

//合并对象
export const extendObj = function() {
    let target = arguments[0] || {},
        len = arguments.length,
        i = 1,
        item, src, key, copy;
    if (typeof target !== "object") {
        target = {};
    }
    for (; i < len; i++) {
        if ((item = arguments[i]) != null) {
            for (key in item) {
                src = target[key];
                if (src) {
                    continue;
                }
                target[key] = item[key];
            }
        }
    }
    return target;
};

//比较对象
export const compareObj = function(x, y) {
    var in1 = x instanceof Object;
    var in2 = y instanceof Object;
    if (!in1 || !in2) {
        return x === y;
    }
    if (Object.keys(x).length !== Object.keys(y).length) {
        return false;
    }
    for (var p in x) {
        var a = x[p] instanceof Object;
        var b = y[p] instanceof Object;
        if (a && b) {
            return equals(x[p], y[p]);
        } else if (x[p] !== y[p]) {
            return false;
        }
    }
    return true;
};

export const getWeekShowByDate = function(dateStr) {
    let today = sysTime.getTodayDay();
    let yesterday = sysTime.getYesterdayDay();
    if(dateStr === today) {
        return "今天";
    } else if(dateStr === yesterday) {
        return "昨天";
    } else {
        let weekDay = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
        let dateType = Date.parse(dateStr);
        let week = new Date(dateType).getDay();
        return weekDay[week];
    }
};

/* 对象top值改变来移动对象位置动画
 * @ob 对象
 * @oldTop 旧top值
 * @newTop 新top值
 * */
export const animationMove = function(ob, oldTop, newTop) {
    let perValue = (newTop - oldTop) / 5;
    let k = 1;

    function s() {
        let newTop = (perValue * k + oldTop) + "px";
        ob.style.top = newTop;
        k++;
        if (k <= 5) {
            setTimeout(s, 50);
        }
    }
    s();
};

//频道或节目不存在的提示信息
export let tipsTimer = null;
export const processNotExistTips = function(tips) {
    if(tipsTimer){
        clearTimeout(tipsTimer);
    }
    let ele = document.getElementById("channel-program-not-exit-tip");
    if (ele) {
        ele.style.display = "block";
        let imgEle = document.getElementById("play-tip-img");
        if(imgEle) {
            imgEle.style.display = "block";
        }
        let tipsEle = document.getElementById("play-tip-info");
        if (tipsEle) {
            tipsEle.innerHTML = tips;
        }
        tipsTimer = setTimeout(function() {
            ele.style.display = "none";
            imgEle.style.display = "none";
        }, 3000);
    }
};

//隐藏频道或节目不存在的提示信息
export const hiddenNotExistTips = function() {
    let ele = document.getElementById("channel-program-not-exit-tip");
    if (ele) {
        ele.style.display = "none";
    }
    let imgEle = document.getElementById("play-tip-img");
    if(imgEle) {
        imgEle.style.display = "none";
    }
};

//显示频道付费提示
export const showChannelPayTips = function() {
    let ele = document.getElementById("channel-pay-tips");
    if (ele) {
        if(ele.style.display != "block"){
            ele.style.display = "block";
        }
    }
    window.Loading.hiddenLoading();
    hiddenNotExistTips();
};

//隐藏频道付费提示
export const hiddenChannelPayTips = function () {
    let ele = document.getElementById("channel-pay-tips");
    if (ele) {
        ele.style.display = "none";
    }
};

//显示封套页面的提示（位于页面下方）
export let bottomTipsTimer = null;
export const showCoverBottomTips = function(tips) {
    if(bottomTipsTimer) {
        clearTimeout(bottomTipsTimer);
    }
    let ele = document.getElementById("bottom_tips_id");
    if(ele) {
        ele.style.display = "block";
        ele.innerHTML = tips;
        bottomTipsTimer = setTimeout(function() {
            ele.style.display = "none";
        }, 3000);
    }
};

//隐藏封套页面的提示（位于页面下方）
export const hiddenCoverBottomTips = function() {
    let ele = document.getElementById("bottom_tips_id");
    if (ele) {
        ele.style.display = "none";
    }
};

//显示暂停按钮
export const showPauseIcon = function() {
    let ele = document.getElementById("pause_icon_id");
    if(ele) {
        ele.style.display = "block";
    }
};

//隐藏暂停按钮
export const hiddenPauseIcon = function() {
    let ele = document.getElementById("pause_icon_id");
    if(ele) {
        ele.style.display = "none";
    }
};

//设置跳出flash应用后（例如：1.直播跳转到点播；2.语音遥控器跳转到点播），back键返回到flash应用的url
export const appSetLastUrl = function() {
    if (OTT.isAndroid()) {
        let reqUrl = window.location.toString();
        let idx = reqUrl.indexOf('?');
        if (idx > -1) {
            reqUrl = reqUrl.substr(0, idx);
        }
        let lastUrl = reqUrl + "?action=RestorePrevState";
        OTT.App.setLastUrl(lastUrl);
    }
};

/*直播跳转到点播，调起点播播放,参数说明如下：
 positionCode：推荐位code，目前是空字符
 itemType：节目类型
 videoClipCode：单集code
 itemCode：节目code
 categoryCode：分类code
 episodeIndex：剧集，当itemtype为1时，这个字段表明播放第几集，从0开始
 onlineVideoFlag：在线视频各种模板展示的标志，每一位为一个标志
 */
export const appStartApp = function(recData) {
    let param = "";
    if(recData) {    //智能推荐的点播数据
        let paramObj = [];
        paramObj.positionCode = "";
        paramObj.itemType = recData['type'] ? recData['type'] : "";
        paramObj.videoClipCode = "";
        paramObj.itemCode = recData['code'] ? recData['code'] : "";
        paramObj.categoryCode = recData['categoryCode'] ? recData['categoryCode'] : "";
        paramObj.episodeIndex = recData['updateEpisodeNum'] ? recData['updateEpisodeNum'] : "";
        paramObj.onlineVideoFlag = "";
        for (let key in paramObj) {
            param += paramObj[key] + "|";
        }
    }
    //param = "|1||2962369|SMG_XYSJD#XYSJD_BWCXJXQJ#";   //测试数据,可播的电视剧
    //param = "|1|6257900$18647043|2604658|SMG_1002#SMG_BSTYC#";    //测试数据,可播的电影
    OTT.App.startApp(Config.vodAction, param);
};

export const getVersion = function(){
    let version = Config.AppVersion.split("_");
    return version[2]
}


let intervalArr = [];

export const refreshDataInterval = function(fun, interval, isSoon,name) {
    intervalArr[name] = true;
    let interfun = function() {
        fun();
        if(intervalArr[name]){
            setTimeout(interfun, interval);
        }
    };
    if (isSoon) {
        interfun();
    } else {
        setTimeout(interfun, interval);
    }
};

export const stopRefreshDataInterval = function(name){
    intervalArr[name] = false;
};

//获取二进制的指定位数值
export const getBinaryFixBit = function(value, pos) {
    let binary = "0000";
    if (value) {
        binary = value.toString(2);
        while (binary.length < 4) {
            binary = "0" + binary;
        }
    }
    let idx = binary.substr(pos, 1);
    return idx==1 ? true : false;
};

//根据频道号开关、真实频道号获取显示的频道号
export const getChannelNoShow = function(realNo) {
    let channelNoSwitch = OTTConfig.showChannelNo();
    if(channelNoSwitch == channelInfoShowType.HIDDEN) {
        return "";
    } else if(channelNoSwitch == channelInfoShowType.REAL) {
        while (realNo.length < 3) {
            realNo = "0" + realNo;
        }
        return realNo;
    } else if(channelNoSwitch == channelInfoShowType.VIRTUAL) {
        let num = (parseInt(realNo) + Config.channelNoAddNum).toString();
        while (num.length < 4) {
            num = "0" + num;
        }
        num = "B"+num;
        return num;
    }
};

//根据频道名称开关、真实频道名称获取显示的频道名称
export const getChannelNameShow = function(realName, realNo) {
    let channelNameSwitch = OTTConfig.showChannelName();
    if(channelNameSwitch == channelInfoShowType.HIDDEN) {
        return "";
    } else if(channelNameSwitch == channelInfoShowType.REAL){
        return realName;
    } else if(channelNameSwitch == channelInfoShowType.VIRTUAL) {
        let num = (parseInt(realNo) + Config.channelNoAddNum).toString();
        return "电视精选"+num;
    }
};

//按照实时截图的图片命名规则拼接直播频道的显示数据
export const getLiveChannelImageUrl = function(channelInfo) {
    let nowSecond = sysTime.now();
    if(channelInfo && channelInfo.CurrentSchedule) {    //有节目单
        let currentStartTime = channelInfo.CurrentSchedule.StartTime;
        let startTimeSecond = (sysTime.strToDate(currentStartTime)).getTime()/1000;
        let scheduleCode = null;
        let timeFmt = null;
        if(nowSecond - startTimeSecond > 300) {     //直播节目开播时间大于5分钟，用直播节目截图，否则用直播前的一个回看节目截图
            scheduleCode = channelInfo.CurrentSchedule.ScheduleCode;
            timeFmt = sysTime.nowFormat();
        } else {
            scheduleCode = channelInfo.PreSchedule.ScheduleCode;
            timeFmt = channelInfo.PreSchedule.StartTime;
        }
        return getSchProgramImageUrl(channelInfo.ChannelCode, scheduleCode, timeFmt);
    } else {    //没有节目单
        JxLog.e([LogType.PAGE], "common/CommonUtils/getLiveChannelImageUrl",["picLoad频道没有节目单",channelInfo]);
        let channelImage = channelInfo.ChannelImage;
        if(channelImage===null||channelImage===""){
            JxLog.e([LogType.PAGE], "common/CommonUtils/getLiveChannelImageUrl",["picLoad直播海报底图频道没有配置",channelInfo]);
            return null;
        }else{
            JxLog.i([LogType.PAGE], "common/CommonUtils/getLiveChannelImageUrl",["picLoad 直播海报底图",channelImage]);
            return channelImage;
        }
    }
};

//按照实时截图的图片命名规则拼接回看-精选节目的截图url
export const getSchProgramImageUrl = function(channelCode, scheduleCode, startTime) {
    let imgAddr = OTT.UserProfile.getScreenIMGSrvAddress();
    let startDate = sysTime.strToDate(startTime).Format("yyyy-MM-dd");
    let url = imgAddr + Config.imgPath + startDate + "/" + channelCode.replace(/[/:]/g,"") + "/" + scheduleCode.replace(/[/:.]/g,"") + ".jpg";
    return url;
};

//点播推荐的拼接规则：时间戳，再拼接一个 1000以内随机数
export const getRecommendNonceStr = function() {
    let timeStamp = sysTime.now();
    let random = parseInt(Math.random()*1000);
    let str = timeStamp.toString()+random.toString();
    return str;
};

//点播推荐接口的签名函数
export const getRecommendSign = function(userId, nonceStr) {
    let str = "UserID=" + userId + "&NonceStr=" + nonceStr;
    let strSignTemp = str + "&Key=BesTV@2017";
    let signValue = md5Utils.md5(strSignTemp);
    return signValue;
};

/* @function 重载指定的文件
 * @param id为文件名称
 * @param url为文件的地址，如果有参数，带在后面
 * @return
 * */
export const reloadAbleJSFn = function(id, url) {
    try {
        let oldJs = document.getElementById(id);
        if(oldJs) oldJs.parentNode.removeChild(oldJs);
        let scriptObj = document.createElement("img");
        scriptObj.src = url;
        scriptObj.type = "text/javascript";
        scriptObj.id = id;
        document.getElementsByTagName("head")[0].appendChild(scriptObj);
    } catch(e) {

    }
};

export const getChannelCollectionInfo = function(channelCodeList) {
    let info = {
        "Code": Config.mCollectionCode,
        "Name": "收藏",
        "Icon1": "",
        "sequence": 4,
        "UpdateTime": 1515727669,
        "Channels": []
    };
    if(channelCodeList==null||channelCodeList.length<=0){
        return info;
    }
    for(let i=0;i<channelCodeList.length;i++){
        let channelCode = channelCodeList[i].channelCode;
        let channelInfo = DataAccess.getChannelInfo(channelCode);
        if(channelInfo){
            channelInfo.CategoryCode = info.Code;
            channelInfo.img = trash_focus;
            info.Channels.push(channelInfo);
        }else{
            Collection.unColleciton(channelCode);
        }
    }
    return info;
};

export const getMergeCategoryList = function(categoryList,colList,location=0){
    for(let i=0;i<categoryList.length;i++){
        for(let j=0;j<categoryList[i].Channels.length;j++){
            categoryList[i].Channels[j] = DataAccess.getChannelInfo(categoryList[i].Channels[j]);
            categoryList[i].Channels[j].CategoryCode = categoryList[i].Code;
        }
    }

    let rightCategoryList = [];
    for(let i=0;i<categoryList.length;i++){
        if(categoryList[i].Channels.length>0){
            rightCategoryList.push(categoryList[i]);
        }
    }
    rightCategoryList.splice(location,0,colList);
    if(OTTConfig.showBook()) {
        let bookCategory = defaultBookInfo;
        rightCategoryList.unshift (bookCategory);
    }
    return rightCategoryList;
};

/* 获取显示列表中，显示数据相对于总数据的偏移量
 * @param list 总数据列表
 * @param keyWord 对比关键字
 * @param keyValue 对比关键字的值
 * @param showListCount 显示列表的长度
 * */
export const getOffsetValue = function (list,keyWord,keyValue,showListCount){
    let myOffset = 0;
    let len = list.length;
    let theValue = "";
    for(let i=0;i<len;i++){
        theValue = list[i][keyWord];
        if(theValue===keyValue){
            myOffset = getOffsetByIndex(i, len, showListCount);
            return myOffset;
        }
    }
    return myOffset;
};

//从一天节目单列表中二分查找获取当前正播节目所在位置，未找到返回-1
export const getPlayingScheduleLocation = function (scheduleList) {
    let start = 0;
    let end = scheduleList.length - 1
    let now = sysTime.date ().Format ()
    while (start <= end) {
        let mid = parseInt (start + (end - start) / 2)
        if (typeof (scheduleList[mid].StartTime) == "undefined"
            || typeof (scheduleList[mid].EndTime) == "undefined") {
            return -1
        }
        if (scheduleList[mid].StartTime <= now && now <= scheduleList[mid].EndTime) {
            return mid
        } else if (now > scheduleList[mid].StartTime) {
            start = mid + 1
        } else {
            end = mid - 1;
        }
    }
    return -1
}

//直播节目，光标不定位在中间，而是最右边
export const getOffsetByIndex = function(index, totalLen, contentSize, flag=false) {
    let offset = 0;
    if(contentSize>=totalLen){
        return offset;
    }
    if(index > 2){
        if(index >= (totalLen - contentSize)){
            offset = (totalLen - contentSize);
        } else {
            offset = flag ? index-5 : index - 2;
        }
    } else{
        offset = 0;
    }
    return offset;
};

/* 获取页面列表移动方式
 * @param location:当前光标所在列表的位置，从0算起（0至pageSize-1）
 * @param pageSize:列表一页显示的个数
 * @param direction：遥控器切换方向，左右
 */
export const getListSwitchMode = function(location, pageSize, direction) {
    if(location>0 && location<pageSize-1) {
        return moveType.FOCUS_MOVE;
    } else if(location === 0) {
        return direction === KeyCode.KEY_LEFT ? moveType.LIST_MOVE : moveType.FOCUS_MOVE;
    } else{
        return direction === KeyCode.KEY_RIGHT ? moveType.LIST_MOVE : moveType.FOCUS_MOVE;
    }
};

export const prefixIntrger = function (num,length){
    return (Array(length).join('0')+num).slice(-length);
};

//频道锁定场景下，页面样式的预处理，如果调用迟了，会造成页面闪动
export const  channelLockPageDeal = function () {
    try{
        document.getElementById("channel_play_menu_scene").style.width = "500px"
        document.getElementById("p_d_p_0").style.display = "none"
        document.getElementById("channel_play_menu_part_name_2").style.display = "none"
        document.getElementById("channel_play_menu_part_name_1").style.display = "none"
        document.getElementById("channel_play_menu_part_channel_name").style.display="block"
        document.getElementById("select-category-name-show-id").style.display = "none"
        document.getElementById("channel_play_menu_arrow_left_id").style.display = "none"
    }catch (e) {
        console.log(e)
    }
};

export const getShowListByOffset = function (viewOb) {
    let list = [];
    let allList = viewOb.getAllList ();
    let limitLen = allList.length < (viewOb.offset + 1) * viewOb.contentSize ? allList.length : (viewOb.offset + 1) * viewOb.contentSize;
    for (let i = viewOb.offset * viewOb.contentSize; i < limitLen; i++) {
        list.push (allList[i]);
    }
    try {
        for (let i = 0; i < list.length; i++) {
            let schedule = list[i].schedules[0];
            list[i].latestSeriesName = schedule.Name;
            let channelCode = schedule.ChannelCode;
            let scheduleCode = schedule.ScheduleCode;
            let startTime = schedule.StartTime;
            list[i].ImageUrl = getSchProgramImageUrl (channelCode, scheduleCode, startTime);
        }
    } catch (e) {

    }
    return list;
};

//读取url中的指定参数值，参数不存在返回null
export const getUrlParam = function (url, name) {
    if (url.indexOf ('?'+name+"=") > -1) {
        return url.split('?'+name+"=")[1].split("&")[0]
    }
    let reg = new RegExp ("(^|&)" + name + "=([^&]*)(&|$)",  "g");
    let r = url.substr (1).match (reg);
    if (r != null) {
        return unescape (r[2]);
    }
    return null;
}

//修改参数值，没有不执行操作，返回url
export const modUrlParam = function  (url, paramName, replaceWith) {
    let re = eval ('/(' + paramName + '=)([^&]*)/g')
    url = url.replace (re, paramName + '=' + replaceWith)
    return url
}

/**
 * Add a URL parameter (or changing it if it already exists)
 * @param {url} string  this is typically document.location.search
 * @param {key}    string  the key to set
 * @param {val}    string  value
 */
export const addUrlParam = function (url, key, val) {
    if (url.indexOf ('?') == -1) {
        return url + "?" + key + "=" + val
    }
    let newParam = key + '=' + val,
        params = '?' + newParam;
    if (url) {
        params = url.replace (new RegExp ('([?&])' + key + '[^&]*',"g"), '$1' + newParam);
        if (params === url) {
            params += '&' + newParam;
        }
    }
    return params;
};