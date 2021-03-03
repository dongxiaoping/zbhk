//h5调用的中间件函数
import Config from "./Config"
import JxLog from "./Log"
export const OTT = window.OTT || {};

let BestvAuth  = window.BestvAuth;
OTT.App = OTT.App || {};
OTT.App.startApp = function (action, param) {
    if (typeof (window.App) != "undefined") {
        window.App.startApp(action, param);
    }
};
OTT.App.startService = function (action, param) {
    if (typeof (window.App) != "undefined") {
        window.App.startService(action, param);
    }
};
//语音新增：进入和退出播放，发送广播
OTT.App.sendBroadcast = function (action, param) {
    if (typeof (window.App) != "undefined") {
        if(typeof (window.App.sendBroadcast) != "undefined") {
            window.App.sendBroadcast(action, param);
        }
    }
};
//语音新增：离开电视精选，上下文
OTT.App.setLastUrl = function(url) {
    if (typeof (window.App) != "undefined") {
        if(typeof (window.App.setLastUrl) != "undefined") {
            window.App.setLastUrl(url);
        }
    }
};

//根据是否存在App.lifecycleIsSupported() 这个函数，确定apk是否支持生命周期的方式
OTT.App.lifecycleIsSupported = function() {
    if(typeof (window.App) != "undefined" && typeof (window.App.lifecycleIsSupported) !== "undefined") {
        JxLog.i([], "common/OttMiddle/OTT.App.lifecycleIsSupported",
            ["window.App.lifecycleIsSupported"]);
        return true;
    } else {
        JxLog.i([], "common/OttMiddle/OTT.App.lifecycleIsSupported",
            ["window.App.lifecycleIsSupported === undefined"]);
        return false;
    }
};


OTT.App.getVersion = function () {
    if (typeof (window.App) != "undefined") {
        return window.App.getVersion();
    }
};
OTT.App.exit = function (directly) {
    if (typeof (window.App) != "undefined") {
        window.App.exit(directly);
    }
};
OTT.App.close = function () {
    if (typeof (window.App) != "undefined") {
        window.App.close();
    }
};
OTT.App.getMac = function () {
    if (typeof (window.App) != "undefined") {
        return window.App.getMac();
    }
};
OTT.App.getSysProperty = function (key) {
    if (typeof (window.App) != "undefined") {
        return window.App.getSysProperty(key);
    }
};

const OTT_STATIC_ANDROID = "android";
const OTT_STATIC_PC = "PC";
OTT.getTargetPlatform = function () {
    if (typeof (App) == "undefined") {
        return OTT_STATIC_PC;
    }
    return OTT_STATIC_ANDROID;
};
OTT.isAndroid = function () {
    if (OTT.getTargetPlatform() === OTT_STATIC_ANDROID) {
        return true;
    }
    return false;
};

//AuthConfig
OTT.AuthConfig = OTT.AuthConfig || {};
OTT.AuthConfig._instance = null;
OTT.AuthConfig.getInstance = function () {
    if (OTT.AuthConfig._instance == null) {
        if (OTT.isAndroid()) {
            try{
                if(typeof (BestvAuth.getAuthConfig())!="undefined"){
                    OTT.AuthConfig._instance = BestvAuth.getAuthConfig();
                }
            }catch(e){
                JxLog.e([], "common/OttMiddle/AuthConfig",
                    ["BestvAuth.getAuthConfig error"]);
            }
        }
    }
    return OTT.AuthConfig._instance;
};

OTT.AuthConfig.getUserAccount = function () {
    if (OTT.isAndroid()&&OTT.AuthConfig.getInstance()!=null) {
        var output = "";
        if(typeof (OTT.AuthConfig.getInstance().getUserAccount) != "undefined") {
            output = OTT.AuthConfig.getInstance().getUserAccount();
        }
        return output;
    } else {
        return "";
    }
};

//SysConfig
OTT.SysConfig = OTT.SysConfig || {};
OTT.SysConfig._instance = null;
OTT.SysConfig.getInstance = function () {
    if (OTT.SysConfig._instance == null) {
        if (OTT.isAndroid()) {
            try{
                if(typeof (BestvAuth.getSysConfig())!="undefined"){
                    OTT.SysConfig._instance = BestvAuth.getSysConfig();
                }
            }catch(e){
                JxLog.e([], "common/OttMiddle/SysConfig",
                    ["BestvAuth.getSysConfig error"]);
            }
        }
    }
    return OTT.SysConfig._instance;
};

OTT.SysConfig.getStbID = function() {
    if(OTT.isAndroid()&&OTT.SysConfig.getInstance()!=null) {
        var output = "";
        if(typeof (OTT.SysConfig.getInstance().getStbID) != "undefined") {
            output = OTT.SysConfig.getInstance().getStbID();
        }
        return output;
    } else {
        return "";
    }
};

OTT.SysConfig.getOSVersion = function() {
    if(OTT.isAndroid()&&OTT.SysConfig.getInstance()!=null) {
        var output = "";
        if(typeof (OTT.SysConfig.getInstance().getOSVersion) != "undefined") {
            output = OTT.SysConfig.getInstance().getOSVersion();
        }
        return output;
    } else {
        return "";
    }
};

OTT.SysConfig.getSn = function() {
    if(OTT.isAndroid()&&OTT.SysConfig.getInstance()!=null) {
        var output = "";
        if(typeof (OTT.SysConfig.getInstance().getSn) != "undefined") {
            output = OTT.SysConfig.getInstance().getSn();
        }
        return output;
    } else {
        return "";
    }
};

OTT.SysConfig.getTvProfile = function() {
    if(OTT.isAndroid()&&OTT.SysConfig.getInstance()!=null) {
        var output = "";
        if(typeof (OTT.SysConfig.getInstance().getTvProfile) != "undefined") {
            output = OTT.SysConfig.getInstance().getTvProfile();
        }
        return output;
    } else {
        return "";
    }
};

OTT.SysConfig.getTvID = function() {
    if(OTT.isAndroid()&&OTT.SysConfig.getInstance()!=null) {
        var output = "";
        if(typeof (OTT.SysConfig.getInstance().getTvID) != "undefined") {
            output = OTT.SysConfig.getInstance().getTvID();      //eg:"BESTVOEM$YDMGFF_BESTVINSIDE$YDMGFFccd3e20660f6"
            if(output) {
                var infoArr = output.trim().split("$");    //只是截取后面一段
                if(infoArr.length >= 3) {
                    output = infoArr[2];     //eg: "YDMGFFccd3e20660f6"
                }
            }
        }
        return output;
    } else {
        return "YDMGFFccd3e20660f6";
    }
}

//LocalConfig
OTT.LocalConfig = OTT.LocalConfig || {};
OTT.LocalConfig._instance = null;
OTT.LocalConfig.getInstance = function () {
    if (OTT.LocalConfig._instance == null) {
        if (OTT.isAndroid()) {
            try{
                if(typeof (BestvAuth.getLocalConfig())!="undefined"){
                    OTT.LocalConfig._instance = BestvAuth.getLocalConfig();
                }
            }catch(e){
                JxLog.e([], "common/OttMiddle/LocalConfig",
                    ["BestvAuth.getLocalConfig error"]);
            }
        }
    }
    return OTT.LocalConfig._instance;
};

//UserProfile
/*
    封装Android版的BestvAuth对象，提供获取UserID/UserGroup/UserToken的方法
 */
OTT.UserProfile = OTT.UserProfile || {};
OTT.UserProfile._instance = null;
OTT.UserProfile.getInstance = function () {
    if (OTT.UserProfile._instance == null) {
        if (OTT.isAndroid()) {
            try{
                if(typeof (BestvAuth.getUserProfile())!="undefined"){
                    OTT.UserProfile._instance = BestvAuth.getUserProfile();
                }
            }catch(e){
            }
        }
    }
    return OTT.UserProfile._instance;
};

OTT.UserProfile.getUserID = function () {
    if (OTT.isAndroid()) {
        return OTT.UserProfile.getInstance().getUserID();
    } else {
        return "023155000833321";
    }
};

OTT.UserProfile.getUserIdForLog = function () {
    var userId = "GUEST_TVID";
    if (OTT.isAndroid()) {
        var id = OTT.UserProfile.getInstance().getUserID();
        userId = id===""?userId:id;
    }
    return userId;
}

OTT.UserProfile.getUserGroup = function () {
    if (OTT.isAndroid()) {
        return OTT.UserProfile.getInstance().getUserGroup();
    } else {
        return "OTT_GROUP_B2C$TerOut_13680$$011$BesTV_Lite_HLJG_3.1.1611.3";
    }
};

OTT.UserProfile.getUserToken = function () {
    if (OTT.isAndroid()) {
        return OTT.UserProfile.getInstance().getUserToken();
    } else {
        return "8qF5pmbIm0RKAV8YFchgPjSq3YgJQoPf";
    }
};

OTT.UserProfile.getUserAccount = function () {
    if(OTT.isAndroid()&&OTT.AuthConfig.getInstance()!=null) {
        var output = "";
        if(typeof (OTT.AuthConfig.getInstance().getUserAccount) != "undefined") {
            output = OTT.AuthConfig.getInstance().getUserAccount();
        }
        return output;
    } else {
        return "";
    }
};

//点播推荐图片服务器地址
OTT.UserProfile.getVodIMGSrvAddress = function () {
    if (OTT.isAndroid()) {
        return OTT.UserProfile.getInstance().getIMGSrvAddress();
    } else {
        return "http://ottpic.bbtv.cn";
    }
};

//实施截图图片服务器地址、台标图片服务器地址
OTT.UserProfile.getScreenIMGSrvAddress = function () {
    if(Config.testScreenImgHost) {
        return Config.testScreenImgHost;
    }
    if (OTT.isAndroid()) {
        return OTT.UserProfile.getInstance().getIMGSrvAddress();
    } else {
        return "http://ottpic.bbtv.cn";
    }
};

OTT.UserProfile.getServiceAddress = function () {
    if (OTT.isAndroid()) {
        return OTT.UserProfile.getInstance().getModuleAddress();
    } else {
        return "http://jsydcpwag.bbtv.cn:8082/wag";
    }
};

OTT.UserProfile.getLogAddress = function() {
    if (OTT.isAndroid()) {
        return OTT.UserProfile.getInstance().getLogAddress();
    } else {
        return "http://jsydcplog.bbtv.cn:8084";
    }
};

export default OTT