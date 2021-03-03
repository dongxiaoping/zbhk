/*
 对本地持久存储的数据进行管理，有几下一种
 1. 追剧；
 2. 收藏；
 3. 最后一次播放信息；
 4. 回看节目断点续播点;
 5. 页面历史记录
 */
import {webCookie} from './LocalStorage'
import PlayerDataAccess from "./PlayerDataAccess"
import {mediaType, modeType, interfaceType} from "./GlobalConst";
import modelManage from '../App/app_zbhk/ModelManage';

class LocalPersistentStorage {
    constructor() {
        this.localStorage = webCookie;
        this.mLastLiveInfoKey = "last_play_info";   //直播-回看节目最后一次播放的频道信息
        this.mBookMarkKey = "sch_play_bookmark";  //回看-精选节目cookie存放用于断点续播的key
        this.mRestoreInfoKey = "restore_play_info";    //恢复上下文所需播放信息
    }

    requestCollectedChannel(){
        let list = this.getCollection();
        return list;
    }

    setCollect(data){
        this.localStorage.setItem("collection_items",JSON.stringify(data));
    }

    getCollection(){
        let items = this.localStorage.getItem("collection_items");
        if(items===null){
            return [];
        }else{
            items = JSON.parse(items);
            return items;
        }
    }

    setCollectChannel(actionType,collections){
        if(actionType===""||collections===""){
            return ;
        }

        let list = this.getCollection();
        if(actionType==="insert"){
            for(let i=0;i<collections.length;i++){
                let channelCode = collections[i].channelCode;
                let isExist = false;
                for(let j=0;j<list.length;j++){
                    if(list[j].channelCode===channelCode){
                        isExist = true;
                        break;
                    }
                }
                if(!isExist){
                    list.push(collections[i]);
                }
            }
            this.setCollect(list);
            return;
        }

        if(actionType==="delete"){
            for(let i=0;i<collections.length;i++){
                let channelCode = collections[i].channelCode;
                for(let j=0;j<list.length;j++){
                    if(list[j].channelCode===channelCode){
                        list.splice(j, 1);
                        break;
                    }
                }
            }
            this.setCollect(list);
            return;
        }

    }

    setSubscription(data){
        this.localStorage.setItem("subscription_items",JSON.stringify(data));
    }

    getSubscription(){
        let items = this.localStorage.getItem("subscription_items");
        if(items===null){
            return [];
        }else{
            items = JSON.parse(items);
            return items;
        }
    }

    requestSubscription(){
        let list = this.getSubscription();
        return list;
    }

    setSubscriptionNet(actionType,items){
        let list = this.getSubscription();
        if(actionType==="insert"){
            for(let i=0;i<items.length;i++){
                let categoryCode = items[i].categoryCode;
                let programName = items[i].programName;
                let isExist = false;
                for(let j=0;j<list.length;j++){
                    if(list[j].categoryCode===categoryCode&&list[j].programName===programName){
                        isExist = true;
                        break;
                    }
                }
                if(!isExist){
                    list.push(items[i]);
                }
            }
            this.setSubscription(list);
            return;
        }

        if(actionType==="delete"){
            for(let i=0;i<items.length;i++){
                let categoryCode = items[i].categoryCode;
                let programName = items[i].programName;
                for(let j=0;j<list.length;j++){
                    if(list[j].categoryCode===categoryCode&&list[j].programName===programName){
                        list.splice(j, 1);
                        break;
                    }
                }
            }
            this.setSubscription(list);
            return;
        }
    }

    //liveuds关闭的时候，获取最后一次播放的直播频道信息
    getLastLiveInfo(){
        let item = this.localStorage.getItem(this.mLastLiveInfoKey);
        if(item===null){
            return "";
        }else{
            item = JSON.parse(item);
            return item;
        }
    }

    //liveuds关闭的时候，设置最后一次播放的直播频道信息
    setLastLiveInfo(info){
        this.localStorage.setItem(this.mLastLiveInfoKey, JSON.stringify(info));
    }

    setBookMarkToCookie() {
        this.localStorage.setItem(this.mBookMarkKey, JSON.stringify(PlayerDataAccess.mBookMark));
    }

    getBookMarkFromCookie() {
        let bookInfo = this.localStorage.getItem(this.mBookMarkKey);
        if(bookInfo) {
            bookInfo = JSON.parse(bookInfo);
        }
        return bookInfo;
    }

    //离开应用，保存页面历史记录，方便从点播回来之后，恢复上下文（1.直播跳转到点播，2.语音跳转到点播）
    saveLastSwitchHistoryToCookie() {
        let lastSwitchHistory =  window.WebApp.getTheNavHistory(1);
        let nowPlayInfo = window.WebApp.getNowPlayInfo();
        lastSwitchHistory.param['player_scene'] = nowPlayInfo;
        let params = lastSwitchHistory.param;
        let newParams = [];
        for (let a in params) {
            let item = { t: a, v: params[a] };
            newParams.push(item);
        }
        lastSwitchHistory.param = newParams;
        this.localStorage.setItem("lsh", JSON.stringify(lastSwitchHistory));
    }

    //获取页面历史记录的信息
    getLastSwitchHistoryFromCookie() {
        return this.localStorage.getItem("lsh");
    }

    //恢复上下文需要的信息存储至cookie
    saveRestoreInfoToCookie() {
        let nowPlayInfo = window.WebApp.getNowPlayInfo();
        if(nowPlayInfo) {
            if(nowPlayInfo.type == mediaType.SCH && PlayerDataAccess.mBookMark.bookMark>2) {
                nowPlayInfo.bookMark = PlayerDataAccess.mBookMark.bookMark - 2;
                nowPlayInfo.progress = PlayerDataAccess.mBookMark.progress;
            }
            //单一模式：恢复上下文，还是恢复到单一模式
            if(modelManage.getModeType() == interfaceType.ACTION_LIVE_CHANNEL_LOCK) {
                nowPlayInfo.mode = modeType.Single;
            }
            this.localStorage.setItem(this.mRestoreInfoKey, JSON.stringify(nowPlayInfo));
        }
    }

    //获取恢复上下文的信息
    getRestoreInfoFromCookie() {
        let item = this.localStorage.getItem(this.mRestoreInfoKey);
        if(item === null){
            return "";
        } else {
            item = JSON.parse(item);
            return item;
        }
    }

    //清除恢复上下文的信息
    clearRestoreInfo() {
        webCookie.removeItem(this.mRestoreInfoKey);
    }
}

export const localPersistentStorage = new LocalPersistentStorage();
export default localPersistentStorage;