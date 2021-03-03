import JxLog from "./Log"
export const webStorage = {
    setItem: function (key,value) {
        try{
            value = JSON.stringify(value);
            window.sessionStorage.setItem(key,value);
            return true;
        }catch(e){
            window.sessionStorage.setItem(key,value);
            return true;
        }
    },

    getItem: function (key) {
        let value = window.sessionStorage.getItem(key);
        try {
            return JSON.parse(value);
        }catch(e){
            return value;
        }
    },

    removeItem: function (key) {
        window.sessionStorage.removeItem(key);
        return true;
    },

    clear: function () {
        try{
            window.sessionStorage.clear();
        }catch (e) {
            JxLog.e([], "common/LocalStorage/clear",["sessionStorage.clear函数异常", e.toLocaleString ()]);
        }
    }
};

/*
 *document.cookie 持久化数据
 */
export const webCookie = {
    setItem: function (name, value) {
        var Days = 30;
        var exp = new Date();
        exp.setTime(exp.getTime() + Days * 24 * 60 * 60 * 1000);
        document.cookie = name + "=" + escape(value) + ";expires=" + exp.toGMTString() + "; path=/";
    },

    //读取cookies
    getItem: function (name) {
        var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
        if (arr = document.cookie.match(reg)) {
            var value = unescape(arr[2]);
            //先删除，避免相同的key不同的路径的情况出现
            let del_exp = new Date();
            del_exp.setTime(del_exp.getTime() - 1);
            document.cookie = name + "=" + value + ";expires=" + del_exp.toGMTString();
            this.setItem(name, value);    //使用cookie数据的同时，重新设置一遍cookie值，延长其有效时间
            return value;
        } else {
            return null;
        }
    },

    //删除cookies
    removeItem: function (name,path="/") {
        let exp = new Date();
        let exp_time = exp.getTime();
        let new_time = exp_time - 1;
        exp.setTime(new_time);
        let exp_string = exp.toGMTString();
        let arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
        if (arr = document.cookie.match(reg)) {
            let value = unescape(arr[2]);
            document.cookie = name + "=" + value + ";expires=" + exp_string+ "; path="+path;
        }
    }
};

export default {
    webStorage, //应用退出会删除，存储容量大
    webCookie //应用退出不会删除，存储容量小，每次网络请求会附带上，不要轻易使用
}