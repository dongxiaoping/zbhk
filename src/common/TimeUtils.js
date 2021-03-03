import JxLog from "./Log"
//日期、时间的函数封装
Date.prototype.Format = function (fmt) {
    if (fmt == undefined) {
        fmt = 'yyyyMMddhhmmss';
    }
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}
Date.prototype.parseExt = function (str) {
    if (str == undefined) {
        return null;
    } else if (str.length == 14) {
        try {
            var j = 0;
            var y = str.substr(j, 4);
            j = 4;
            var M = str.substr(j, 2);
            j++; j++;
            var d = str.substr(j, 2);
            j++; j++;
            var h = str.substr(j, 2);
            j++; j++;
            var mm = str.substr(j, 2);
            j++; j++;
            var s = str.substr(j, 2);
            //var date = new Date(y, M, d, h, mm, s);

            return new Date(y + '-' + M + '-' + d + ' ' + h + ':' + mm + ':' + s);
        } catch (e) {
            return null;
        }
    } else {
        return str;
    }
}

/*
*本地与系统对时
*/
export const sysTime = window.sysTime || {
    diff: 0,
    isOk:false,
    singularTimePoint:6*3600,//单位秒
    serverTime: null,          //服务器时间
    init: function (time) {
        if (time != undefined) {
            this.serverTime = time;
            var curr = Date.parse(new Date()) / 1000;
            this.diff = time - curr;
            this.isOk=true;
        }
    },
    hasInit:function(){
        return this.isOk;
    },
    convert: function (time) {
        if (time != undefined) {
            return this.diff + time;
        }
    },
    now: function () {
        let now = this.diff + Date.parse(new Date()) / 1000;
        return now;
    },
    isTimeAllRight:function(){
        JxLog.i([], "common/TimeUtilsUtils/isTimeAllRight", ["tag-singularLogRecord begin"]);
        if(!this.isOk){
            JxLog.i([], "common/TimeUtils/isTimeAllRight", ["tag-singularLogRecord result false"]);
            return false;
        }
        let now = this.diff + Date.parse(new Date()) / 1000;
        if(this.serverTime && Math.abs(now - this.serverTime) > this.singularTimePoint) {
            JxLog.i([], "common/TimeUtils/isTimeAllRight", ["tag-singularLogRecord result false"]);
            return false;
        }
        JxLog.i([], "common/TimeUtils/isTimeAllRight", ["tag-singularLogRecord result true"]);
        return true;
    },
    //时间戳保留三位小数
    nowMill:function(){
        return parseFloat((this.diff*1000 + (new Date()).valueOf())/1000);
    },

    nowFormat: function() {
        return new Date(parseInt(this.now())*1000).Format();
    },

    /**
     * 时间戳秒
     */
    nowSecond:function() {
        return Math.round((this.diff + new Date().getTime()) / 1000)
    },

    /**
     * 把形如1534344300的时间戳转换成形如20180815224500 (2018年8月15日 22时45分00秒)格式的字符串
     * @param timeStamp
     */
    secondToStr:function(second){
        return new Date(second * 1000).Format()
    },

    //年月日时分秒毫秒
    nowMillisecondsFormat:function(){
        var d = new Date();
        return  this.nowFormat() * 1000 + d.getMilliseconds();
    },
        
    date:function(){
        return new Date(this.now()*1000);
    },

    getYesterdayDay:function(){
        var t = this.now() - 24*60*60;
        return new Date(t * 1000).Format("yyyy-MM-dd");
    },

    getTodayDay: function() {
        return new Date(this.now() * 1000).Format("yyyy-MM-dd");
    },

    getTomorrowDay:function(){
        var t = this.now() + 24*60*60;
        return new Date(t * 1000).Format("yyyy-MM-dd");
    },

    strToDate: function(dateStr){
        let y = dateStr.substr(0, 4);
        let m = dateStr.substr(4, 2) - 1;
        let d = dateStr.substr(6, 2);
        let h = dateStr.substr(8, 2);
        let i = dateStr.substr(10, 2);
        let s = dateStr.substr(12, 2);
        return new Date(y, m, d, h, i, s); 
    },

    //把形如20180815224500 (2018年8月15日 22时45分00秒)格式的字符串转化为  1534344300
    strToTimeStamp(dateStr) {
        let milSeconds = Date.parse(new Date().parseExt(dateStr));
        return milSeconds/1000;
    },

    //把形如1534344300的时间戳转换成形如20180815224500 (2018年8月15日 22时45分00秒)格式的字符串
    timeStampToStr(timeStamp) {
        return new Date(parseInt(timeStamp)*1000).Format();
    }
};

export default {sysTime}