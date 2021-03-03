// +----------------------------------------------------------------------
// | Copyright (js), BestTV.
// +----------------------------------------------------------------------
// | Author: karl.dong
// +----------------------------------------------------------------------
// | Date：2018/3/22
// +----------------------------------------------------------------------
// | Description: 推荐数据管理服务
// +----------------------------------------------------------------------
import {interfaceBackStatus, LogType} from "./GlobalConst"
import DataAccess from "./DataAccess";
import OTT from "./OttMiddle";
import OTTConfig from "./CmsSwitch";
import JxLog from "./Log"

class RecommendDataManage {
    constructor() {
        this.recommendDataList = [];
        this.repeatTime=null; //推荐接口请求频率
        this.countLimit = 90; //推荐数据存储数量上限
    }

    start(args){
        let that = this;
        if(!OTTConfig.showVodRecommend()){
            args.callback([],interfaceBackStatus.SUCCESS);
            return ;
        }else{

        }
        let isFirst = true;
        let repeatArgs = {
            callback: function (list,status) {
                that.recommendBackDataSet(list,status);
                if(isFirst){
                    args.callback([],interfaceBackStatus.SUCCESS);
                    isFirst = false;
                }
                setTimeout(function() {
                    let invalidCodeString = that.getInvalidCodeString();
                    DataAccess.requestRecommendData(repeatArgs,invalidCodeString);
                },that.repeatTime*1000);
            }
        };
        let invalidCodeString = this.getInvalidCodeString();
        DataAccess.requestRecommendData(repeatArgs,invalidCodeString);
    }

    /*推荐接口返回数据处理*/
    recommendBackDataSet(list,status){
        if(status===interfaceBackStatus.SUCCESS){
            JxLog.i([LogType.INTERFACE], "common/RecommendDataManage/recommendBackDataSet",
                ["推荐接口请求成功"]);
            let imgAddress = OTT.UserProfile.getVodIMGSrvAddress();
            if(list.length!==0){
                for(let i=0; i<list.length; i++) {
                    list[i].poster = imgAddress + list[i].poster;
                }
                this.recommendDataList= this.recommendDataList.concat(list);
                let theLength = this.recommendDataList.length;
                if(theLength>=this.countLimit) {//缓存数量满了
                    this.repeatTime = 60*30;
                    this.recommendDataList= this.recommendDataList.splice((theLength-this.countLimit),this.countLimit);
                    JxLog.i([LogType.INTERFACE], "common/RecommendDataManage/recommendBackDataSet",
                        ["推荐数据更新成功", this.countLimit]);
                } else{
                    this.repeatTime = 3;

                }
            }else{
                this.repeatTime = 960;
                JxLog.e([LogType.INTERFACE], "common/RecommendDataManage/recommendBackDataSet",
                    ["推荐接口返回的是空数据,下次接口请求频率设置为", this.repeatTime]);
            }
        }else if(status===interfaceBackStatus.FAIL){
            this.repeatTime = 480;
            JxLog.e([LogType.INTERFACE], "common/RecommendDataManage/recommendBackDataSet",
                ["推荐接口请求失败,下次接口请求频率设置为:", this.repeatTime]);
        }else{
            this.repeatTime = 180;
            JxLog.e([LogType.INTERFACE], "common/RecommendDataManage/recommendBackDataSet",
                ["推荐接口请求超时,下次接口请求频率设置为", this.repeatTime]);
        }
    }

    getInvalidCodeString(){
        let stringSet = "";
        for(let j=0;j<this.recommendDataList.length;j++){
            if(stringSet===""){
                stringSet = stringSet+this.recommendDataList[j].code;
            }else{
                stringSet = stringSet+","+this.recommendDataList[j].code;
            }
        }
        return stringSet;
    }


    /* 获取指定数量的推荐集合
     * @count 数量
     * @outItemList 排除的推荐条目code的集合
     * @return 返回指定数量的推荐信息集合
     * */
    getRecommendData(count,outItemList = []){
        let returnList = [];
        let theLength = this.recommendDataList.length;
        if(theLength<=0){
            return returnList;
        }
        for(let i=0;i<theLength;i++){
            if(!this.isItemCodeRepeat(outItemList,this.recommendDataList[i].code)){
                returnList.push(this.recommendDataList[i]);
            }
            if(returnList.length>=count){
                return returnList;
            }
        }
        return returnList;
    }

    isItemCodeRepeat(compareList,code){
        for(let i=0;i<compareList.length;i++){
            if(compareList[i]===code){
                return true;
            }
        }
        return false;
    }

    /**
     * JS获取n至m随机整数,m大于n
     */
    getRandNum(n,m){
        let c = m-n+1;
        return Math.floor(Math.random() * c + n);

    }
}
export const recommendDataManage = new RecommendDataManage();
export default recommendDataManage;