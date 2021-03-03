//数据访问接口
import Config from "./Config"
import {
    extendObj,
    getChannelNoShow,
    getChannelNameShow,
    getSchProgramImageUrl,
    getRecommendNonceStr,
    getRecommendSign
} from "./CommonUtils"
import {webStorage, webCookie} from './LocalStorage'
import {interfaceCacheKey, interfaceBackStatus, defaultLiveCode, switchState, LogType} from "./GlobalConst"
import {http} from "../lib/HttpRequestUtil"
import OTT from './OttMiddle'
import OTTConfig from './CmsSwitch'
import {sysTime} from './TimeUtils'
import Subscribe from "./UserSubscribe";
import Book from "./UserBook";
import singularLogRecord from "./SingularLogRecord";
import localPersistentStorage from "./LocalPersistentStorage";
import JxLog from "./Log";

let DataAccess = {
    eplHost: window.global_config.eplHost || '',
    userInterfaceHost: Config.userInterfaceHost || '',
    mAsync: true,
    mHttpList: {},
    params: {
        UserID: OTT.UserProfile.getUserID (),
        UserToken: OTT.UserProfile.getUserToken (),
        UserGroup: OTT.UserProfile.getUserGroup (),
        Mac: OTT.SysConfig.getTvID (),
        controller: 'live'
    },

    //queryChannelLauncherInfo接口获取的频道相关数据，存到本地的指定位置(与普通模式保持相同的数据结构)
    setChannelInfoInLock: function (channelData) {
        let channelInfo = channelData.Channel;
        let schedules = channelData.Schedule;
        DataAccess.setBasicChannelInfo(channelInfo);    //设置频道基本信息
        let allCategoryChannel = {Code: defaultLiveCode, Name: "全部", Channels: [channelInfo.ChannelCode]};
        webStorage.setItem(interfaceCacheKey.ALL_LIVE_CHANNEL, allCategoryChannel);  //设置全部分类信息
        webStorage.setItem(interfaceCacheKey.CATEGORY_LIVE_CHANNEL, [allCategoryChannel]); //设置全部分类信息
        let today = sysTime.date ().Format ("yyyy-MM-dd");
        let startDate = today.concat (" 00:00:00");
        let cacheKey = channelInfo.ChannelCode + '_' + startDate.substr (0, 10);
        if (schedules && schedules.length > 0) {
            let resData = {Schedule: schedules, CurrentDateTime: channelData.CurrentDateTime};
            webStorage.setItem (cacheKey, resData);
        } else {
            JxLog.w([LogType.INTERFACE], "common/DataAccess/setChannelInfoInLock",
                ["节目单为空，频道号", channelData.Channel.ChannelCode]);
        }
    },

    /* 检查QueryChannelLauncherInfo返回的数据接口格式是否正确
     * */
    isLauncherDataFormat (checkData) {
        if (typeof (checkData.Body) == "undefined") {
            return false
        }
        if (typeof (checkData.Body.Channel) == "undefined"
            || typeof (checkData.Body.Config) == "undefined"
            || typeof (checkData.Body.Schedule) == "undefined"
            || typeof (checkData.Body.CurrentDateTime) == "undefined") {
            return false
        }
        return true
    },

    //频道锁定整合接口，包括配置信息，指定频道信息，指定频道节目单信息，校时信息
    queryChannelLauncherInfo: function (args) {
        let channelCode = args.channelCode ? args.channelCode : '';
        let callback = null;
        if (args != undefined) {
            callback = args.callback;
        }
        let action = "QueryChannelLauncherInfo";
        let that = this;
        let reqArgs = {
            data: {
                action: action,
                ChannelCode: channelCode
            },
            async: that.mAsync,
            success: function (result) {
                if (!that.isLauncherDataFormat (result)) {
                    callback && callback ([], interfaceBackStatus.FAIL)
                    JxLog.e ([LogType.INTERFACE], "common/DataAccess/queryChannelLauncherInfo",
                        ["queryChannelLauncherInfo interface 数据格式不正确!"]);
                    return
                }
                callback && callback (result['Body'], interfaceBackStatus.SUCCESS);
            },
            error: function () {
                callback && callback ([], interfaceBackStatus.FAIL);
                JxLog.e([LogType.INTERFACE], "common/DataAccess/queryChannelLauncherInfo",
                    ["queryChannelLauncherInfo interface request error!"]);
            },
            timeout: function () {
                callback && callback ([], interfaceBackStatus.TIMEOUT);
            }
        };
        this.request (reqArgs, action);
    },

    //在单一模式下，有些开关需要强制设置开关（避免普通模式下打开的开关，但是单一模式该开关必须关闭）
    setChannelLockSwitch(Config) {
        Config.showCollectionFlag = switchState.off; //关闭收藏
        Config.supportUDC = switchState.off;         //关闭上下键切台
        Config.supportDSZbhk = switchState.off;      //关闭数字键选台
        Config.showEnvelopeFlag = switchState.off;   //关闭封套
        Config.showProgressFlag = switchState.off;   //关闭进度条
        Config.supportVoiceSearch = switchState.off; //关闭语音搜索
        Config.isUseMarquee = switchState.off;  //不使用跑马灯
        Config.getUDSUrl = switchState.off;    //不需要uds
        Config.okResponseType = switchState.on; //全屏播放直播节目时ok键的响应(OK呼出频道列表菜单)
        Config.liveSwitch = switchState.on;     //直播开关打开
        Config.showBook = switchState.off;      //预约开关关闭
        OTTConfig.setConfig(Config);
    },
    
    /*
     * 进入应用：请求一次
     * 请求所有开关的接口，不需要做缓存
     */
    requestOptionData: function (args) {
        let callback = null;
        if (args != undefined) {
            callback = args.callback;
        }
        let action = "QueryCtrlOpts";
        let that = this;
        let reqArgs = {
            data: {action: action},
            async: that.mAsync,
            success: function (result) {//返回数据根据结果进行相应的处理
                if (!result) return;
                let obj = result['Body'] || null;
                sysTime.init (obj.CurrentDateTime);
                singularLogRecord.broadcastTimingFinished ();
                callback && callback (obj, interfaceBackStatus.SUCCESS);
            },
            error: function () {
                callback && callback ([], interfaceBackStatus.FAIL);
                JxLog.e([LogType.INTERFACE], "common/DataAccess/requestOptionData",
                    ["requestOptionData interface request error!"]);
            },
            timeout: function () {
                callback && callback ([], interfaceBackStatus.TIMEOUT);
            }
        };
        this.request (reqArgs, action);
    },

    getChannelInfo: function (channelCode) {
        return webStorage.getItem (channelCode + "_Info");
    },

    setCurrentProgramInfoForChannelInfo (channelCode, currentSchedule) {
        try {
            let channelInfo = this.getChannelInfo (channelCode);
            channelInfo.CurrentSchedule = currentSchedule;
            channelInfo.PlayProgramName = currentSchedule['Name'];
            webStorage.setItem (channelCode + "_Info", channelInfo);
        } catch (e) {
            JxLog.e ([], 'common/DataAccess/setCurrentProgramInfoForChannelInfo',
                [e.toLocaleString ()]);
        }
    },

    setBasicChannelInfo (element) {
        let channelCode = element['ChannelCode'];
        let imgAddr = OTT.UserProfile.getScreenIMGSrvAddress ();
        let currentSchedule = element['CurrentSchedule'] || null;
        element['OriginChannelNo'] = element['ChannelNo'];
        let icon = element['ChannelIcon'];
        element['ChannelName'] = getChannelNameShow (element['ChannelName'], element['ChannelNo']);
        element['ChannelNo'] = getChannelNoShow (element['ChannelNo']);
        if (OTTConfig.showChannelIcon () && icon) {
            element['ChannelIcon'] = imgAddr + icon;
        } else {
            element['ChannelIcon'] = "";
        }
        element['ChannelImage'] = element['ChannelImage'] ? (imgAddr + element['ChannelImage']) : "";
        element['PlayProgramName'] = currentSchedule ? currentSchedule['Name'] : "暂无节目名称";
        if(element.ShowProgram) {    //兼容没有该字段的情况
            element.ShowProgram = parseInt(element.ShowProgram) ? true : false;
        } else {
            element.ShowProgram = true;
        }
        webStorage.setItem (channelCode + "_Info", element);
    },

    setChannelInfo: function (element) {
        let channelCode = element['ChannelCode'];
        let currentSchedule = element['CurrentSchedule'] || null;
        element['PlayProgramName'] = currentSchedule ? currentSchedule['Name'] : "暂无节目名称";
        webStorage.setItem (channelCode + "_Info", element);
    },

    /*
    进入应用：请求一次QueryCover:包含CurrentSchedule、NextSchedule、PreSchedule，数据量较大
    获取直播分类及其频道数据（全部、央视、卫视、少儿等）
    第一个分类：拆分出来，作为“全部频道”，cacheKey：ALL_LIVE_CHANNEL
    剩余分类：倒序排列, cacheKey:CATEGORY_LIVE_CHANNEL
     */
    requestLiveCategoryChannel: function (args) {
        let cacheKey = "QueryCover";
        let params = {
            "action": cacheKey,
            "PageSize": 200
        };
        let callback = args.callback || null;
        let mdata = webStorage.getItem (interfaceCacheKey.ALL_LIVE_CHANNEL);
        if (mdata) {
            callback && callback (mdata, interfaceBackStatus.SUCCESS);
            return;
        }
        let that = this;
        let reqArgs = {
            async: that.mAsync,
            data: params,
            success: function (result) {//返回数据根据结果进行相应的处理
                if (!result || !result['Body']) return;
                let allCategorys = result['Body'].Categorys;
                for (let i = 0, len = allCategorys.length; i < len; i++) {
                    let cate = allCategorys[i];
                    let cateChannel = [];
                    cate["Channels"].forEach (element => {
                        cateChannel.push (element['ChannelCode']);
                        that.setBasicChannelInfo (element);
                    });
                    cate["Channels"] = cateChannel;
                    if (i === 0) {
                        webStorage.setItem (interfaceCacheKey.ALL_LIVE_CHANNEL, allCategorys[i]);
                    }
                }
                webStorage.setItem (interfaceCacheKey.CATEGORY_LIVE_CHANNEL, allCategorys);
                callback (allCategorys[0], interfaceBackStatus.SUCCESS);
            },
            error: function () {
                callback && callback ([], interfaceBackStatus.FAIL);
                JxLog.e([LogType.INTERFACE], "common/DataAccess/requestLiveCategoryChannel",
                    ["requestLiveCategoryChannel interface request error!"]);
            },
            timeout: function () {
                callback && callback ([], interfaceBackStatus.TIMEOUT);
            }
        };
        this.request (reqArgs, "QueryCover");
    },

    /*
     进入应用：请求一次QueryLiveCategoryWeb，不包含CurrentSchedule、NextSchedule、PreSchedule，数据量较小
     获取直播分类及其频道数据（全部、央视、卫视、少儿等）
     第一个分类：拆分出来，作为“全部频道”，cacheKey：ALL_LIVE_CHANNEL
     剩余分类：倒序排列, cacheKey:CATEGORY_LIVE_CHANNEL
     */
    requestLiveCategoryWeb: function (args) {
        let cacheKey = "QueryLiveCategoryWeb";
        let params = {
            "action": cacheKey,
            "PageSize": 200,
            "version": "v4"
        };
        let callback = args.callback || null;
        let mdata = webStorage.getItem (interfaceCacheKey.ALL_LIVE_CHANNEL);
        if (mdata) {
            callback && callback (mdata, interfaceBackStatus.SUCCESS);
            return;
        }
        let that = this;
        let reqArgs = {
            async: that.mAsync,
            data: params,
            success: function (result) {//返回数据根据结果进行相应的处理
                if (!result || !result['Body']) return;
                let allCategorys = result['Body'].Categorys;
                for (let i = 0, len = allCategorys.length; i < len; i++) {
                    let cate = allCategorys[i];
                    let cateChannel = [];
                    cate["Channels"].forEach (element => {
                        cateChannel.push (element['ChannelCode']);
                        that.setBasicChannelInfo (element);
                    });
                    cate["Channels"] = cateChannel;
                    if (i === 0) {
                        webStorage.setItem (interfaceCacheKey.ALL_LIVE_CHANNEL, allCategorys[i]);
                    }
                }
                webStorage.setItem (interfaceCacheKey.CATEGORY_LIVE_CHANNEL, allCategorys);
                callback (allCategorys[0], interfaceBackStatus.SUCCESS);
            },
            error: function () {
                callback && callback ([], interfaceBackStatus.FAIL);
                JxLog.e([LogType.INTERFACE], "common/DataAccess/requestLiveCategoryWeb",
                    ["requestLiveCategoryWeb interface request error!"]);
            },
            timeout: function () {
                callback && callback ([], interfaceBackStatus.TIMEOUT);
            }
        };
        this.request (reqArgs, cacheKey);
    },

    getAllLiveChannelFromCache: function () {
        return webStorage.getItem (interfaceCacheKey.ALL_LIVE_CHANNEL);
    },

    getCategoryLiveChannelFromCache: function () {
        return webStorage.getItem (interfaceCacheKey.CATEGORY_LIVE_CHANNEL);
    },

    //获取指定频道-指定日期一天的节目单（没有日期参数，返回当天的节目单）
    requestChannelSchedule: function (args) {
        let channelCode = args.channelCode ? args.channelCode : '';
        if (!channelCode) return;
        let today = sysTime.date ().Format ("yyyy-MM-dd");
        let startDate = args.startDate || today.concat (" 00:00:00");
        let endDate = args.endDate || today.concat (" 23:59:59");
        let params = {
            action: "QueryChannelSchedule",
            Version: "1.0",
            ChannelCode: channelCode,
            StartDate: startDate,
            EndDate: endDate
        };
        let cacheKey = channelCode + '_' + startDate.substr (0, 10);
        let callback = args.callback || null;
        let mdata = cacheKey && webStorage.getItem (cacheKey);
        if (mdata) {
            callback && callback (mdata, interfaceBackStatus.SUCCESS);
            return;
        }
        let that = this;
        let reqArgs = {
            data: params,
            async: that.mAsync,
            success: function (result) {
                if (!result) {
                    return;
                }
                if (!result['Body'] && !result['Body']['Items']) {
                    return;
                }
                let obj = result['Body']['Items'];
                let CurrentDateTime = result['Body']['CurrentDateTime'];
                let resData = {Schedule: null, CurrentDateTime: CurrentDateTime};
                if (obj[channelCode] && obj[channelCode].length > 0) {       //节目单不为空，才缓存
                    resData.Schedule = obj[channelCode];
                    webStorage.setItem (cacheKey, resData);
                }
                callback && callback (resData, interfaceBackStatus.SUCCESS);
            },
            error: function () {
                callback && callback ([]);
            }
        };
        this.request (reqArgs, cacheKey);
        //todo：预加载当前频道前一天的数据；预加载下一频道、上一频道的数据
    },

    //获取多频道-某一天的节目单（没有日期参数，返回当天的节目单）
    requestMultiChannelSchedule: function (channelList, startDay, endDay = false) {
        let that = this;
        let startDate = startDay || sysTime.date ().Format ("yyyy-MM-dd");
        let endDate = endDay || startDate;
        let multiChannels = channelList.join ("$");
        let reqArgs = {
            data: {
                action: "QueryChannelSchedule",
                Version: "1.0",
                ChannelCode: multiChannels,
                StartDate: startDate.concat (" 00:00:00"),
                EndDate: endDate.concat (" 23:59:59")
            },
            async: that.mAsync,
            success: function (result) {//返回数据根据结果进行相应的处理
                if (!result['Body']) return;
                let data = result['Body']['Items'];
                let CurrentDateTime = result['Body']['CurrentDateTime'];
                for (const key in data) {
                    let schedules = data[key];
                    if (schedules.length > 0) {         //节目单不为空，才缓存
                        let channelInfo = {"Schedule": schedules, "CurrentDateTime": CurrentDateTime};
                        webStorage.setItem (key + "_" + startDate, channelInfo);
                    }
                }
            }
        };
        this.request (reqArgs, multiChannels)
    },

    getChannelSchedule: function (args) {
        return webStorage.getItem (args.channelCode + "_" + args.startDate.substr (0, 10));
    },

    getCateInfo: function (code) {
        let cacheKey = interfaceCacheKey.JX_CATRGORY;
        let mdata = cacheKey && webStorage.getItem (cacheKey);
        if (!mdata) {
            return "";
        }
        for (let index = 0; index < mdata.length; index++) {
            const element = mdata[index];
            if (element['Code'] == code) {
                return element['Name'];
            }
        }
        return "";
    },

    //获取所有回看分类的数据（热剧、娱乐、财经等）
    requestAllJxCategory: function (args) {
        let callback = null;
        if (args.callback) {
            callback = args.callback;
        }
        let params = {
            action: "QueryJxCate",
            PageSize: 200
        };
        let cacheKey = interfaceCacheKey.JX_CATRGORY;
        let mdata = cacheKey && webStorage.getItem (cacheKey);
        if (mdata) {
            callback && callback (mdata, interfaceBackStatus.SUCCESS);
            return;
        }
        let that = this;
        let reqArgs = {
            data: params,
            async: that.mAsync,
            success: function (result) {//返回数据根据结果进行相应的处理
                if (!result || !result['Body'] || !result['Body']['Categorys']) return;
                let obj = result['Body']['Categorys'];
                webStorage.setItem (cacheKey, obj);
                callback && callback (obj, interfaceBackStatus.SUCCESS);
            }
        };
        this.request (reqArgs, cacheKey);
    },

    //获取所有频道节目单更新时间
    requestChannelScheduleUpdateTime (args) {
        let params = {
            controller: "time",
            action: "QueryChannelScheduleUpdateTime",
            Version: "1.0"
        };
        let callback = args.callback || null;
        let that = this;
        let reqArgs = {
            data: params,
            async: that.mAsync,
            success: function (result) {//返回数据根据结果进行相应的处理
                if (!result) return;
                let obj = result['Body'] || null;
                let header = result['Header'] || null;
                let isSuccess = OTTConfig.isOK (header);
                callback && callback (obj, isSuccess);
            }
        };
        this.request (reqArgs, "requestChannelScheduleUpdateTime");
    },

    //获取指定回看分类的节目数据，包括剧集(以分类code作为key存储)

    getJxCategoryProgram: function (categoryCode) {
        let mData = webStorage.getItem (categoryCode);
        return mData["keys"];
    },

    requestJxCategoryProgram: function (args) {
        if (args.categoryCode) {
            let categoryCode = args.categoryCode;
            let params = {
                action: "QueryJxCateScheduleWeb",
                CategoryCode: categoryCode
            };
            let callback = null;
            if (args.callback) {
                callback = args.callback;
            }
            let cacheKey = categoryCode;
            let mdata = cacheKey && webStorage.getItem (cacheKey);
            if (mdata) {
                callback && callback (mdata, interfaceBackStatus.SUCCESS);
                return;
            }
            let that = this;
            let reqArgs = {
                data: params,
                async: that.mAsync,
                success: function (result) {//返回数据根据结果进行相应的处理
                    if (!result || !result['Body'] || !result['Body']['Items'] || !result['Body']['Items'][0]) return;
                    let obj = result['Body']['Items'][0];
                    webStorage.setItem (cacheKey, obj);
                    callback && callback (obj, interfaceBackStatus.SUCCESS);
                }
            };
            this.request (reqArgs, cacheKey);
            //todo 查找下一个分类并预加载下一个分类的数据
        }
    },

    /*
     *requestChannelMarkCodeMap
     *参数说明args={callback:function(dataObject)}
     *args.callback为请求回调函数
     *dataObject为json对象
     *缓存cacheKey为'QueryChannelMarkCodeMap';
     */
    requestChannelMarkCodeMap: function (args) {
        var that = this;
        var cacheKey = 'QueryChannelMarkCodeMap';
        var _callback = null;
        var proj = "";
        if (args != undefined) {
            _callback = args.callback;
            proj = args.proj ? args.proj : "";
        }
        var mdata = webStorage.getItem (cacheKey);
        if (mdata) {
            _callback && _callback (mdata, interfaceBackStatus.SUCCESS);
            return;
        }
        let params = {action: "QueryChannelMarkCodeMap", projectcode: proj};
        let reqArgs = {
            data: params,
            async: this.mAsync,
            success: function (result) {
                var obj = result['Body'];
                if (obj.TotalCount > 0) {
                    webStorage.setItem (cacheKey, obj);
                }
                _callback (obj, interfaceBackStatus.SUCCESS);
            }
        };
        this.request (reqArgs, cacheKey);
    },

    request: function (reqArgs, cacheKey) {
        reqArgs.url = reqArgs.url || this.eplHost;
        reqArgs.data = extendObj (reqArgs.data, this.params);
        if (this.mHttpList[cacheKey]) {
            this.mHttpList[cacheKey].abort ();
            delete this.mHttpList[cacheKey];
        }
        this.mHttpList[cacheKey] = new http ();
        this.mHttpList[cacheKey].request (reqArgs);
    },

    getProgramShowDate: function () {
        var vodDays = OTTConfig.getTvodDays ();
        var dateArray = new Array ();
        for (let i = vodDays - 1; i >= 0; i--) {
            var time = sysTime.date ().getTime () - i * 24 * 3600 * 1000;
            dateArray.push (new Date (time).Format ("yyyy-MM-dd"));
        }
        return dateArray;
    },

    getCollectedChannel: function () {
        return webStorage.getItem ("collections") || [];
    },

    /*
     * 从服务端请求已收藏的频道
     * 收藏数据，只会请求一次接口，存入本地缓存，后续直接从缓存中取，有“添加收藏”、“取消收藏”操作，更新本地缓存
     */
    requestCollectedChannel: function (args) {
        let that = this;
        let _callback = null;
        if (args != undefined && args.callback != undefined) {
            _callback = args.callback;
        }
        let mData = webStorage.getItem ("collections");
        if (mData) {
            _callback && _callback (mData, interfaceBackStatus.SUCCESS);
            return mData;
        }
        let userInterfaceHost = OTTConfig.getUDSUrl ();
        let reqArgs = {
            url: userInterfaceHost + "/getCollection",
            async: this.mAsync,
            success: function (result) {
                let collections = result['Collections'];
                webStorage.setItem ("collections", collections);
                _callback && _callback (collections, interfaceBackStatus.SUCCESS);
            },
            error: function () {
                _callback && _callback ([]);
                JxLog.e([LogType.INTERFACE], "common/DataAccess/requestCollectedChannel",
                    ["getCollection interface request error!"]);
            },
            timeout: function () {
                _callback && _callback ([]);
            }
        };
        if (userInterfaceHost !== "") {
            this.request (reqArgs, "getCollection");
        } else {
            let collections = localPersistentStorage.requestCollectedChannel ();
            webStorage.setItem ("collections", collections);
            _callback && _callback (collections, interfaceBackStatus.SUCCESS);
        }
    },

    /*
     *设置收藏频道、取消收藏到服务端
     *操作类型 insert:新增 update:更新 delete:删除
     */
    setCollectChannel: function (args) {
        let userInterfaceHost = OTTConfig.getUDSUrl ();
        var url = userInterfaceHost + "/editCollection";
        var collections = args.collections ? args.collections : '';
        var theActionType = args.actionType ? args.actionType : '';
        var _callback = null;
        if (args != undefined && args.callback != undefined) {
            _callback = args.callback;
        }
        var reqArgs = {
            url: url,
            async: this.mAsync,
            method: 'post',
            data: {
                "Mac": DataAccess.params.Mac,
                "UserID": DataAccess.params.UserID,
                "UserGroup": DataAccess.params.UserGroup,
                "ProjectCode": window.global_config.projectCode || '',
                "ActionType": theActionType,
                "Collections": collections
            },
            success: function (result) {
                _callback && _callback (result);
            },
            error: function () {
                JxLog.e([LogType.INTERFACE], "common/DataAccess/setCollectChannel",
                    ["editCollection interface request error!"]);
            },
            timeout: function () {
            }
        };
        if (this.mHttpList.collection) {
            this.mHttpList.collection.abort ();
        }

        if (userInterfaceHost !== "") {
            this.mHttpList.collection = new http ();
            this.mHttpList.collection.request (reqArgs);
        } else {
            localPersistentStorage.setCollectChannel (args.actionType, args.collections);
        }
    },

    getSubscription: function () {
        return webStorage.getItem ("subscriptions");
    },

    /*从服务器端请求已订阅的节目信息*/
    requestSubscription: function (args) {
        let _callback = null;
        let that = this;
        if (args != undefined) {
            _callback = args.callback;
        }
        let mData = webStorage.getItem ("subscriptions");
        if (mData) {
            _callback && _callback (mData);
            return mData;
        }
        let userInterfaceHost = OTTConfig.getUDSUrl ();
        let reqArgs = {
            url: userInterfaceHost + "/getSubscription",
            async: this.mAsync,
            success: function (result) {
                var obj = result['Subscriptions'];
                webStorage.setItem ("subscriptions", obj);
                _callback && _callback (obj);
            },
            error: function () {
                JxLog.e([LogType.INTERFACE], "common/DataAccess/requestSubscription",
                    ["getSubscription interface request error!"]);
            },
            timeout: function () {

            }
        };

        if (userInterfaceHost !== "") {
            this.request (reqArgs, "getSubscription");
        } else {
            let items = localPersistentStorage.requestSubscription ();
            webStorage.setItem ("subscriptions", items);
            _callback && _callback (items);
        }
    },

    /*
      设置订阅节目信息、添加、删除、修改到服务端
      操作类型 insert:新增 update:更新 delete:删除
     */
    setSubscription: function (args) {
        let _callback = null;
        if (args != undefined) {
            _callback = args.callback;
        }
        let userInterfaceHost = OTTConfig.getUDSUrl ();
        let url = userInterfaceHost + "/editSubscription";
        let subscriptions = args.subscriptions ? args.subscriptions : '';
        let theActionType = args.actionType ? args.actionType : '';
        let reqArgs = {
            url: url,
            async: this.mAsync,
            method: 'post',
            data: {
                "Mac": DataAccess.params.Mac,
                "UserID": DataAccess.params.UserID,
                "UserGroup": DataAccess.params.UserGroup,
                "ProjectCode": window.global_config.projectCode || '',
                "ActionType": theActionType,
                "Subscriptions": subscriptions
            },
            success: function (result) {
                _callback && _callback (result);
            },
            error: function () {
                JxLog.e([LogType.INTERFACE], "common/DataAccess/setSubscription",
                    ["editSubscription interface request error!"]);
            },
            timeout: function () {

            }
        };
        if (this.mHttpList.subscription) {
            this.mHttpList.subscription.abort ();
        }
        if (userInterfaceHost !== "") {
            this.mHttpList.subscription = new http ();
            this.mHttpList.subscription.request (reqArgs);
        } else {
            localPersistentStorage.setSubscriptionNet (args.actionType, args.subscriptions);
        }
    },

    /* 从服务器获取预约节目信息
     * */
    requestBooking: function(args) {
        let _callback = null;
        if(args !== undefined && args.callback !== undefined) {
            _callback = args.callback;
        }
        if(Book.isBookListHasInit ()){
            let mData = Book.getBookingFromLocal();
            _callback && _callback(mData, interfaceBackStatus.SUCCESS);
            return mData;
        }
        let userInterfaceHost = OTTConfig.getUDSUrl();
        let reqArgs = {
            url: userInterfaceHost + "/getBooking",
            async: this.mAsync,
            success: function (result) {
                let list = result['Bookings'];
                if (!Book.isBookListHasInit ()) {
                    Book.setBookingToLocal (list);
                }
                _callback && _callback(list, interfaceBackStatus.SUCCESS);
            },
            error: function () {
                _callback && _callback([] ,interfaceBackStatus.FAIL);
            },
            timeout: function () {
                _callback && _callback([], interfaceBackStatus.TIMEOUT);
            }
        };
        if (userInterfaceHost !== ""){
            this.request (reqArgs, "getBooking");
        } else {
            let items = Book.getBookFromCookie();
            webStorage.setItem("book", items);
            if (!Book.isBookListHasInit()) {
                Book.setBookingToLocal(items);
            }
            _callback && _callback(items, interfaceBackStatus.SUCCESS);
        }
    },

    editBooking: function (bookList, actionType) {
        let userInterfaceHost = OTTConfig.getUDSUrl();
        let url = userInterfaceHost + "/editBooking";
        let reqArgs = {
            url: url,
            async: this.mAsync,
            method: 'post',
            data: {
                "Mac": DataAccess.params.Mac,
                "UserID": DataAccess.params.UserID,
                "UserGroup": DataAccess.params.UserGroup,
                "ProjectCode": window.global_config.projectCode || '',
                "ActionType": actionType,
                "Bookings": bookList
            },
            success: function (result) {

            },
            error: function () {
            },
            timeout: function () {

            }
        };
        if (this.mHttpList.editBooking) {
            this.mHttpList.editBooking.abort();
        }
        if (userInterfaceHost !== "") {
            this.mHttpList.editBooking = new http();
            this.mHttpList.editBooking.request(reqArgs);
        } else {
            Book.setBookToCookie(actionType, bookList);
        }
    },

    //根据categoryCode，scheduleCode获取节目剧集详情(回看节目屏显、快进快退剧集显示)
    getSchInfoByCategoryKey: function (categoryCode, keyname) {
        let detailInfo = {categoryCode: categoryCode, programName: null, schDetail: null, allSchedules: null};
        let cateObj = webStorage.getItem (categoryCode);
        if (!cateObj || cateObj.Count <= 0) return null;
        let programs = cateObj.keys;
        for (let i = 0; i < programs.length; i++) {
            let item = programs[i];
            if (item.keyname == keyname) {
                detailInfo.programName = item.keyname;
                detailInfo.allSchedules = item.schedules;   //当前节目的所有剧集
                return detailInfo;
            }
        }
        return null;
    },

    getProgramInfoByCategoryAndScheduleCode: function (categoryCode, scheduleCode) {
        let detailInfo = {categoryCode: categoryCode, programName: null, schDetail: null, allSchedules: null};
        let cateObj = webStorage.getItem (categoryCode);
        if (!cateObj || cateObj.Count <= 0) return null;
        let programs = cateObj.keys;
        for (let i = 0; i < programs.length; i++) {
            let schedules = programs[i].schedules;
            for (let j = 0; j < schedules.length; j++) {
                if (schedules[j].ScheduleCode === scheduleCode) {
                    return programs[i];
                }
            }
        }
        return null;
    },

    upDateSubProgramList: function () {
        let subList = DataAccess.getSubscription ();
        let subscribeList = [];
        if (!subList) {
            return [];
        }
        let imgAddress = OTT.UserProfile.getScreenIMGSrvAddress ();
        for (let i = 0, len = subList.length; i < len; i++) {
            let element = subList[i];
            let schInfo = this.getSchInfoByCategoryKey (element["categoryCode"], element["programName"]);
            if (schInfo) {
                let schedule = schInfo["allSchedules"][0];
                let channelCode = schedule.ChannelCode;
                let scheduleCode = schedule.ScheduleCode;
                let startTime = schedule.StartTime;
                subscribeList.unshift ({
                    "keyname": element["programName"],
                    "categoryCode": element["categoryCode"],
                    "schedule": schInfo["allSchedules"],
                    "ImageUrl": getSchProgramImageUrl (channelCode, scheduleCode, startTime),
                    "newSeries": schedule.Name
                });
            } else {
                Subscribe.unSubscribed ({categoryCode: element["categoryCode"], programName: element["programName"]});
            }
        }
        return subscribeList;
    },

    /*从服务器端请求最后一次播放的直播频道信息
    * 有liveuds就从服务端获取，没有liveuds，就从本地获取
    * */
    requestLastLiveInfo: function (args) {
        let that = this;
        let _callback = null;
        if (args != undefined && args.callback != undefined) {
            _callback = args.callback;
        }
        let mData = webStorage.getItem ("lastLiveInfo");
        if (mData) {
            _callback && _callback (mData, interfaceBackStatus.SUCCESS);
            return mData;
        }
        let userInterfaceHost = OTTConfig.getUDSUrl ();
        let reqArgs = {
            url: userInterfaceHost + "/getLastLiveInfo",
            async: this.mAsync,
            success: function (result) {
                let liveInfo = result['liveInfo'];
                webStorage.setItem ("lastLiveInfo", liveInfo);
                _callback && _callback (liveInfo, interfaceBackStatus.SUCCESS);
            },
            error: function () {
                _callback && _callback ([], interfaceBackStatus.ERROR);
                JxLog.e([LogType.INTERFACE], "common/DataAccess/requestLastLiveInfo",
                    ["getLastLiveInfo interface request error!"]);
            },
            timeout: function () {
                _callback && _callback ([], interfaceBackStatus.TIMEOUT);
            }
        };
        if (userInterfaceHost !== "") {
            this.request (reqArgs, "lastLiveInfo");
        } else {
            let liveInfo = localPersistentStorage.getLastLiveInfo ();
            webStorage.setItem ("lastLiveInfo", liveInfo);
            _callback && _callback (liveInfo, interfaceBackStatus.SUCCESS);
        }
    },

    getLastLiveChannelFromCache: function () {
        return webStorage.getItem ("lastLiveInfo");
    },

    getLastLiveCodeFromCookie: function () {
        return webCookie.getItem ("lastLiveCode");
    },

    setLastLiveCodeFromCookie: function (liveChannelCode) {
        if (liveChannelCode.length > 128) {
            return
        }
        webCookie.setItem ("lastLiveCode", liveChannelCode);
    },

    /*上报播放的直播频道信息到服务端
    * 有liveuds就上报到服务端，没有liveuds，就本地存储
    * */
    uploadLastLiveInfoToServer: function (args) {
        if (!args) {
            return;
        }
        let userInterfaceHost = OTTConfig.getUDSUrl ();
        var url = userInterfaceHost + "/uploadLastLiveInfo";
        var channelCode = args.channelCode ? args.channelCode : '';
        var playTime = args.playTime ? args.playTime : '';
        var reqArgs = {
            url: url,
            async: this.mAsync,
            method: 'post',
            data: {
                Mac: DataAccess.params.Mac,
                UserID: DataAccess.params.UserID,
                UserGroup: DataAccess.params.UserGroup,
                ProjectCode: window.global_config.projectCode || '',
                channelCode: channelCode,
                playTime: playTime
            },
            success: function (result) {    //上报成功，暂不做任何处理

            },
            error: function () {
                JxLog.e([LogType.INTERFACE], "common/DataAccess/uploadLastLiveInfoToServer",
                    ["uploadLastLiveInfo interface request error!"]);
            },
            timeout: function () {
            }
        };
        if (this.mHttpList.lastLive) {
            this.mHttpList.lastLive.abort ();
        }
        if (userInterfaceHost !== "") {
            this.mHttpList.lastLive = new http ();
            this.mHttpList.lastLive.request (reqArgs);
        } else {
            localPersistentStorage.setLastLiveInfo (args);
        }
    },

    requestRecommendData: function (args, invalidCodeString) {
        //TODO: 智能推荐接口没有获取到数据时候，改为从EPG栏目中获取数据（同时要讲格式转化为从智能推荐接口一致）
        let _callback = null;
        if (args != undefined && args.callback != undefined) {
            _callback = args.callback;
        }
        let cacheKey = "recommend";
        let userId = this.params.UserID;
        let nonceStr = getRecommendNonceStr ();
        let sign = getRecommendSign (userId, nonceStr);
        let reqArgs = {
            //url :that.eplHost+"?controller=recommend&action=QueryRecommendVodInfo&",
            url: '/recommend',
            async: this.mAsync,
            method: 'get',
            data: {
                UserID: userId,
                ItemCodes: invalidCodeString,
                ContentTypes: "series",
                SceneID: 8,
                MaxCount: 16,
                TVProfile: this.params.Mac,
                UserGroup: this.params.UserGroup,
                NonceStr: nonceStr,
                Sign: sign
            },
            success: function (result) {
                if (result['Header']['RC'] == 0) {    //推荐接口正常
                    let obj = result['Body']['programs'];
                    _callback && _callback (obj, interfaceBackStatus.SUCCESS);
                }
            },
            error: function () {
                _callback && _callback ([], interfaceBackStatus.FAIL);
                JxLog.e([LogType.INTERFACE], "common/DataAccess/requestRecommendData",
                    ["requestRecommendData interface request error!"]);
            },
            timeout: function () {
                _callback && _callback ([], interfaceBackStatus.TIMEOUT);
            }
        };
        if (this.mHttpList[cacheKey]) {
            this.mHttpList[cacheKey].abort ();
            delete this.mHttpList[cacheKey];
        }
        this.mHttpList[cacheKey] = new http ();
        this.mHttpList[cacheKey].request (reqArgs);
    },

    //日志上报接口
    ottLogUpload: function (requestUrl) {
        let setArgs = {
            url: requestUrl,
            async: this.mAsync,
            success: function (result) {

            },
            error: function () {

            },
            timeout: function () {

            }
        };
        new http ().request (setArgs);
    }
};

export default DataAccess