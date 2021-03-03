// +----------------------------------------------------------------------
// | Copyright (js), BestTV.
// +----------------------------------------------------------------------
// | Author: karl.dong
// +----------------------------------------------------------------------
// | Date：2018/6/8
// +----------------------------------------------------------------------
// | Description: 
// +----------------------------------------------------------------------
import Config from "./Config"
import {sysTime} from "./TimeUtils";
import {webCookie} from "./LocalStorage";

class LogManage {
    constructor() {
        this.levels = {e:4,w:3,i:2,d:1};
        this.level = this.getLevel();
        this.logNum = 1;
    }

    openDebuggerForApp(){
        this.level = this.levels.d;
    }

    openDebuggerForCookie(){
        webCookie.setItem("D_M", this.levels.d);
    }

    isNeedDebuggerByCookie(){
        let flag = webCookie.getItem("D_M");
        if(flag&&flag==="1"){
            return true;
        }
        return false;
    }

    closeDebuggerForCookie(){
        webCookie.setItem("D_M", 0);
        webCookie.removeItem("D_M");
    }

    closeDebuggerForApp(){
        this.level = this.getLevel();
    }

    random(min,max){
        return Math.floor(min+Math.random()*(max-min));
    }

    getLevel(){
        switch(Config.logLevel){
            case "ERROR":
                return this.levels.e;
            case "WARN":
                return this.levels.w;
            case "INFO":
                return this.levels.i;
            case "DEBUG":
                return this.levels.d;
            default:
                return this.levels.i;
        }
    }

    consoleShow(types, path, descs, v){
        let descString = JSON.stringify(descs)
        console.log(
            'the-flash:' + v + '(time:' +
            sysTime.secondToStr(sysTime.nowSecond()) +
            ',   num:' +
            this.logNum++ +
            ',   type:' +
            JSON.stringify(types) +
            ',   path:' +
            path +
            ',   _desc:' +
            descString +
            ')'
        )
    }

    e(types, path, descs) {
        if (this.level<=this.levels.e) {
            this.consoleShow(types, path, descs, 'e')
        }
    }

    w(types, path, descs) {
        if (this.level<=this.levels.w) {
            this.consoleShow(types, path, descs, 'w')
        }
    }

    i(types, path, descs) {
        if (this.level<=this.levels.i) {
            this.consoleShow(types, path, descs, 'i')
        }
    }

    d(types, path, descs) {
        if (this.level<=this.levels.d) {
            this.consoleShow(types, path, descs, 'd')
        }
    }
}
let JxLog = new LogManage();
export default JxLog;