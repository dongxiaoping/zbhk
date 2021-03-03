//用户追剧相关功能
import { actionType } from "./GlobalConst"
import DataAccess from "./DataAccess"
import PlayerDataAccess from "./PlayerDataAccess"
import { sysTime } from "./TimeUtils";
import Config from "./Config";
import {processNotExistTips} from "./CommonUtils"
import {webStorage} from './LocalStorage'

let Subscribe = {
    schInfo: null,
    subList: null
};

Subscribe.exec = function() {
    let flag = this.isSubscribed();
    if (flag) {
        flag = this.unSubscribed();
    } else {
        flag = this.subscribe();
    }
    return flag;
};
Subscribe.subscribe = function() {
    let subList = DataAccess.getSubscription() || [];
    if(subList.length >= Config.mSubscriptionLimit){
        processNotExistTips("追剧容量已满！");
        return false;
    }
    let series = [];
    let cateInfo = DataAccess.getJxCategoryProgram(this.schInfo.categoryCode);
    let now = sysTime.date().Format("yyyyMMdd hhmmss");
    for (let i = 0, len = cateInfo.length; i < len; i++) {
        let item = cateInfo[i];
        if (item["keyname"] == this.schInfo.programName) {
            for (let j = 0, length = item["schedules"].length; j < length; j++) {
                series.push(item["schedules"][j]["ScheduleCode"]);
            }
        }
    }
    let subscribe = {
        subscriptions: [{
            "categoryCode": this.schInfo.categoryCode,
            "programName": this.schInfo.programName,
            "series": series,
            "lastVisitTime": now,
            "subcribeTime": now
        }],
        actionType: actionType.INSERT
    };
    DataAccess.setSubscription(subscribe);
    this.storageSubscriptionsData(subscribe, subList);
    return true;
};

Subscribe.unSubscribed = function(info) {
    let data = info || this.schInfo;
    let subscribe = {
        subscriptions: [{
            "categoryCode": data.categoryCode,
            "programName": data.programName,
        }],
        actionType: actionType.DELETE
    };
    let subList = DataAccess.getSubscription() || [];
    DataAccess.setSubscription(subscribe);
    this.storageSubscriptionsData(subscribe, subList);
    return false;
};

Subscribe.removeAll = function() {
    let mData = DataAccess.getSubscription();
    let subList = [];
    if (!mData) return;
    for (let index = 0, len = mData.length; index < len; index++) {
        subList.push({
            "categoryCode": mData[index].categoryCode,
            "programName": mData[index].programName,
        })
    }
    DataAccess.setSubscription({ subscriptions: subList, actionType: actionType.DELETE });
    webStorage.removeItem("subscriptions");
};

Subscribe.isSubscribed = function() {
    let navHistory = window.WebApp.getTheNavHistory(1);
    let params = navHistory.param;
    let playInfo = params[''];
    if(!playInfo){
        let playScene = window.WebApp.getSceneById('player_scene');
        if(!playScene){
            return;
        }
        playInfo = window.WebApp.getNowPlayInfo();
    }
    this.schInfo = PlayerDataAccess.getSchDetailByCategorySchedule(playInfo.categoryCode, playInfo.scheduleCode);
    this.subList = DataAccess.getSubscription();
    if (!this.subList) return false;
    for (let i = 0, len = this.subList.length; i < len; i++) {
        let element = this.subList[i];
        if (element.categoryCode == this.schInfo.categoryCode && element.programName == this.schInfo.programName) {
            return true;
        }
    }
    return false;
}


Subscribe.storageSubscriptionsData = function(args, mData) {
    let subscriptions = args.subscriptions;
    let type = args.actionType;
    let subList = [];
    if (type == actionType.DELETE) {
        for (let i = 0, len = mData.length; i < len; i++) {
            let j = 0,
                length = subscriptions.length;
            for (; j < length; j++) {
                if (mData[i]['categoryCode'] == subscriptions[j]['categoryCode'] && mData[i]['programName'] == subscriptions[j]['programName']) {
                    break;
                }
            }
            if (j >= length) {
                subList.push(mData[i]);
            }
        }
    } else if (type == actionType.INSERT) {
        subList = mData.concat(subscriptions);
    } else if (type == actionType.UPDATE) {

    }
    webStorage.setItem("subscriptions", subList);
};

export default Subscribe