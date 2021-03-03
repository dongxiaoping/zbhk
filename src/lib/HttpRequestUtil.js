import JxLog from "../common/Log"
import {LogType} from "../common/GlobalConst"
var HttpRequestUtilStatic = window.HttpRequestUtilStatic ||{};
//cocos设置rendermode为RENDERMODE_WHEN_DIRTY时，js代码就不会执行了
//所以http请求超时时间需要小于10秒钟（自动设置rendermode为RENDERMODE_WHEN_DIRTY的间隔）
HttpRequestUtilStatic.DEFAULT_TIMEOUT = 4000;

class HttpRequestUtil{
    constructor(){
        this.mHandler = null;
        this.mDebug = false;
        this.mTimeoutHandler = null;
        this.mUrl = null;
        this.mCallback = null;
        this.mResult = null;

        this.readyState = {
            UN_INIT: 0,//请求未初始化
            CONNECTED: 1,// 服务器连接已建立
            RECEIVED:2,// 请求已接收
            DEALING:3,//请求处理中
            FINISHED:4 //请求已完成，且响应已就绪
        };
        //创建发送请求
        this.mHandler = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP'); //兼容ie
    }

    open(method , url , isAsync){
        if(this.mHandler != null){
            this.mUrl=url;
            this.mHandler.open(method , url , isAsync);
        }
    }

    send(p){
        JxLog.d([LogType.INTERFACE], "lib/HttpRequestUtil/send",
            ["begin:HttpRequestUtil.send", this.mUrl]);
        if(!this.mHandler) return;
        var that = this;
        this.mHandler.onreadystatechange = function(){
            JxLog.d([LogType.INTERFACE], "lib/HttpRequestUtil/send",
                ["HttpRequestUtil.readyState", that.mHandler.readyState, that.mHandler.status]);
            if(parseInt(that.mHandler.readyState) !==that.readyState.FINISHED ){
                return ;
            }
            if(parseInt(that.mHandler.status) == 200){
                if(that.mTimeoutHandler != null){
                    clearTimeout(that.mTimeoutHandler);
                }
                if(that.mCallback != null && that.mCallback.onDataLoaderEnd != null){
                    var obj = null;
                    let isJsonString = true;
                    try {
                        if (!window.JSON || JSON.parse == 'undefined') {
                            obj = eval(that.mHandler.responseText);
                        } else {
                            obj = JSON.parse(that.mHandler.responseText)
                        }
                    } catch (e) {
                        isJsonString = false;
                        that.mCallback.onDataLoaderError.call(that);
                        JxLog.e([LogType.INTERFACE], "lib/HttpRequestUtil/send",
                            ["ERROR:接口", that.mUrl, "数据不是有效JSON字符串！"]);
                    }
                    if(isJsonString){
                        that.mCallback.onDataLoaderEnd.call(that,obj);
                    }
                }
            }else{
                if(that.mCallback != null && that.mCallback.onDataLoaderError != null){
                    that.mCallback.onDataLoaderError.call(that);
                }
                if(that.mTimeoutHandler != null){
                    clearTimeout(that.mTimeoutHandler);
                }
                JxLog.e([LogType.INTERFACE], "lib/HttpRequestUtil/send",
                    [that.mUrl, "错误:返回状态非200"]);
            }
        };
        if(this.mResult != null){
            if(this.mCallback != null && this.mCallback.onDataLoaderBegin != null){
                this.mCallback.onDataLoaderBegin.call(this);
            }
            if(that.mCallback != null && that.mCallback.onDataLoaderEnd != null){
                that.mCallback.onDataLoaderEnd.call(this,this.mResult);
            }
        } else {
            this.setRequestTimeout(HttpRequestUtilStatic.DEFAULT_TIMEOUT);
            this.mHandler.send(p);
            if(this.mCallback != null && this.mCallback.onDataLoaderBegin != null){
                this.mCallback.onDataLoaderBegin.call(this);
            }
        }
        JxLog.d([LogType.INTERFACE], "lib/HttpRequestUtil/send",
            ["end:HttpRequestUtil.send()"]);
    }

    abort(){
        JxLog.i([LogType.INTERFACE], "lib/HttpRequestUtil/abort", ["begin"]);
        if(this.mHandler != null){
            JxLog.e([LogType.INTERFACE], "lib/HttpRequestUtil/abort",
                ["error:interface timeout of", this.mUrl]);
            this.mHandler.abort();
        }
        if(this.mTimeoutHandler != null){
            clearTimeout(this.mTimeoutHandler);
        }
        JxLog.i([LogType.INTERFACE], "lib/HttpRequestUtil/abort", ["end"]);
    }

    setRequestHeader(p,t){
        if(this.mHandler != null){
            this.mHandler.setRequestHeader(p,t);
        }
    }

    setRequestTimeout(timeInMilliSecond){
        var that = this;
        var time = 0;
        try{
            time = parseInt(timeInMilliSecond);
        }catch(e){

        }
        if(time > 0){
            if(this.mTimeoutHandler != null){
                clearTimeout(this.mTimeoutHandler);
            }
            this.mTimeoutHandler = setTimeout(function(){
                that.onTimeout(that);
            } , timeInMilliSecond);
        }else{
            JxLog.e([LogType.INTERFACE], "lib/HttpRequestUtil/setRequestTimeout",
                ["invalid interval"]);
        }
    }

    onTimeout(target){
        JxLog.e([LogType.INTERFACE], "lib/HttpRequestUtil/onTimeout",
            ["接口超时", target.mUrl]);
        if(this.mHandler !== null){
            this.mHandler.abort();
        }
    }

    setCallback(cb){
        this.mCallback = cb;
    }

}

//创建http封装
export const http = window.http || function () { };
http.prototype = {
    mXMLHttp: null,
    request: function (options) {//options =  {url:'',method:'',data:'',callback:'',async:''}
        //默认参数
        options.url = options.url || '',
            options.method = options.method || 'get',
            options.data = options.data || null,
            options.async = options.async || true;
        options.error = options.error || function () { };
        options.success = options.success || function () { };
        options.timeout = options.timeout || function () { };
        options.loading = options.loading || function () { };
        //get请求-拼接url
        if (options.method.toLowerCase() == 'get') {
            if (typeof options.data == 'object' && options.data != undefined) {
                let params = [];
                for (var k in options.data) {
                    params.push(k + '=' + options.data[k]);
                }
                options.data = params.join('&');
            }
            if (options.data != undefined && options.data.length > 0) {
                options.url += ( (options.url.indexOf('?') == -1) ? '?' : '') + options.data;
            }
        }
        //post请求-转换字符串
        if (options.method.toLowerCase() == 'post') {
            if (typeof options.data == 'object' && options.data != undefined) {
                options.data = JSON.stringify(options.data);
            }
        }

        //创建发送请求
        var xhr = new HttpRequestUtil();
        xhr.setCallback({
            onDataLoaderBegin: onDataLoaderBegin,
            onDataLoaderEnd: onDataLoaderEnd,
            onDataLoaderError: onDataLoaderError,
            onDataLoaderTimeout: onDataLoaderTimeout
        });
        options.url = encodeURI(options.url);
        xhr.open(options.method, options.url, options.async);
        if(options.method.toLowerCase() == 'post'){
            xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");  //设置请求头信息
        }
        xhr.send(options.data);

        this.mXMLHttp = xhr;

        function onDataLoaderBegin() {
            if (options.loading)
                options.loading();
        }
        function onDataLoaderEnd(data) {
            options.success && data && data["Response"] && options.success(data["Response"]);
        }
        function onDataLoaderError() {
            if (options.error)
                options.error();
        }
        function onDataLoaderTimeout() {
            JxLog.e([LogType.INTERFACE], "lib/HttpRequestUtil/onDataLoaderTimeout",
                ["http onDataLoaderTimeout"]);
            if (options.timeout)
                options.timeout();
        }
    },
    abort: function () {
        if (this.mXMLHttp) {
            this.mXMLHttp.abort();
        }
    }
};

export default {http}