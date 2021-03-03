//用户收藏相关功能
import {actionType} from "./GlobalConst"
import DataAccess from "./DataAccess"
import Config from "./Config"
import {processNotExistTips} from "./CommonUtils"
import {webStorage} from './LocalStorage'

let Collection = {
    colList: null
};

Collection.exec = function(channelCode){
    let flag = this.isCollected(channelCode);
    if(flag){
        flag = this.unColleciton(channelCode);
    }else{
        flag = this.collection(channelCode);
    }
    return flag;
};

Collection.isCollected = function(channelCode){
    this.colList = DataAccess.getCollectedChannel();
    if(!this.colList) {
        return false;
    }
    for(let i = 0, len = this.colList.length; i < len; i++){
        let element = this.colList[i];
        if(element.channelCode == channelCode){
            return true;
        }
    }
    return false;
};

Collection.unColleciton = function(channelCode){
    let params = {
        collections: [{"channelCode": channelCode}], 
        actionType: actionType.DELETE
    };
    let colList = DataAccess.getCollectedChannel() || [];
    DataAccess.setCollectChannel(params);
    this.storageCollectionData(params, colList);
    return false;
};

Collection.removeAll = function() {
    let colList = DataAccess.getCollectedChannel() || [];
    let commitList = [];
    for (let index = 0, len = colList.length; index < len; index++) {
        commitList.push({
            "channelCode": colList[index].channelCode,
        })
    }
    DataAccess.setCollectChannel({ collections: commitList, actionType: actionType.DELETE });
    webStorage.removeItem("collections");
};

Collection.collection = function(channelCode){
    let colList = DataAccess.getCollectedChannel() || [];
    let limitCount = Config.mCollectionLimit;
    if(colList.length >= limitCount){
        processNotExistTips("收藏容量已满！");
        return false;
    }
    let params = {
        collections: [{"channelCode": channelCode}],
        actionType: actionType.INSERT
    };
    DataAccess.setCollectChannel(params);
    this.storageCollectionData(params, colList);
    return true;
};

Collection.storageCollectionData = function(args, mData){
    let collections = args.collections;
    let type = args.actionType;
    let colList = [];
    if(type ==  actionType.DELETE){
        for(let j = 0, length = mData.length; j < length; j++){
            let i = 0, len = collections.length;
            for(; i < len; i++){
                if(mData[j]['channelCode'] == collections[i]['channelCode']){
                    break;
                }
            }
            if(i >= len){
                colList.push(mData[j]);
            }
        }
    }else if(type == actionType.INSERT){
        colList = collections.concat(mData);
    }
    webStorage.setItem("collections", colList);
};

export default Collection