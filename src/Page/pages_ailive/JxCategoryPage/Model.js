import {AbstractModel} from "../../../Abstract/scene/AbstractModel";
import DataAccess from "../../../common/DataAccess";
import {jxCategoryPageParamType, vodRecommendSwitch, defaultLiveCode}from "../../../common/GlobalConst";
import OTT from "../../../common/OttMiddle";
import OTTConfig from "../../../common/CmsSwitch";
import {view} from "./View";
import {getSchProgramImageUrl} from "../../../common/CommonUtils"
import recommendDataManage from "../../../common/RecommendDataManage";
import Config from "../../../App/app_ailive/app.config";

class Model extends AbstractModel {
    constructor() {
        super();
        this.categoryList = []; //分类的列表集合
        this.programListArray=[]; //以categorycode做为键的节目列表数组集合
        this.recommendListArray=[];//以categorycode做为键的推荐列表数组集合
        this.subscribeList = [];
        this.channelList = []; //频道分类中全部分类的频道列表 顶部留边用
    }

    modelUpdateData(args){
        let that = this;
        let subscribeList = DataAccess.upDateSubProgramList();
        this.setSubscribeList(subscribeList);
        if(OTTConfig.showVodRecommend(vodRecommendSwitch.JX_VOD_RECOMMEND)) {
            this.setRecommendResult();
        }
        if(this.programListArray.length>0){
            args.callback();
        }

        let req ={
            callback: function(data) {
                that.categoryList = data;
                that.removeLiveNewCategory();
                that.initOffSetByCategoryList();
                for(let i=0;i<that.categoryList.length;i++){
                    let categoryCode = that.categoryList[i].Code;
                    DataAccess.requestJxCategoryProgram({
                        categoryCode:  categoryCode,
                        callback:function(data){
                            that.addProgramListArray(data.categorycode,data.keys);
                        }
                    });
                }
                args.callback();
            }
        };
        DataAccess.requestAllJxCategory(req);
    }

    setRecommendResult(){
        let recommendList = recommendDataManage.getRecommendData(1);
        view.hasRecommend = recommendList.length>0;
    }

    initOffSetByCategoryList(){
        let len = this.categoryList.length;
        if(view.isHasRecommend()){
            len = 2*len;
        }
        let setList = [];
        for(let i=0;i<len;i++){
            setList.push(0);
        }
        view.doubleListView.initOffSet(setList);
    }

    updateProgramListArrayByCategory(locationY){
        let that = this;
        if(typeof (that.categoryList[locationY])==="undefined"){
            return ;
        }
        let categoryCode = this.categoryList[locationY].Code;
        if(typeof (that.programListArray[categoryCode])!=="undefined"){
            return ;
        }

        DataAccess.requestJxCategoryProgram({
            categoryCode:  categoryCode,
            callback:function(data){
                that.addProgramListArray(data.categorycode,data.keys);
            }
        });
    }


    removeLiveNewCategory(){
        for(let i=0;i<this.categoryList.length;i++){
            if(this.categoryList[i].Code === defaultLiveCode){
                this.categoryList.splice(i,1);
                break;
            }
        }
    }

    addProgramListArray(categoryCode,info){
        let imgAddress = OTT.UserProfile.getScreenIMGSrvAddress();
        for(let i=0;i<info.length;i++){
            let program = info[i];
            let suffixUrl =this.getSuffixUrl(program);
            if(suffixUrl!=null){
                info[i].ImageUrl = suffixUrl===null?"":(imgAddress+"/"+suffixUrl);
            }else{
                let schedules = program.schedules;
                let len = schedules.length;
                if(len>0){
                    let schedule =  schedules[0];
                    let channelCode = schedule.ChannelCode;
                    let scheduleCode = schedule.ScheduleCode;
                    let startTime = schedule.StartTime;
                    info[i].ImageUrl = getSchProgramImageUrl(channelCode,scheduleCode,startTime);
                }else{
                    info[i].ImageUrl = null;
                }
            }
        }
        this.programListArray[categoryCode] = info;
    }

    getSuffixUrl(program){
        let schedules = program.schedules;
        for(let i=0;i<schedules.length;i++){
            if(schedules[i].ImageUrl!=null&&schedules[i].ImageUrl!=""){
                return schedules[i].ImageUrl;
            }
        }
        return null;
    }

    addRecommendListArray(categoryCode,info){
        this.recommendListArray[categoryCode] = info;
    }

    getCategoryInfoByLocation(focusLocation){
        let categoryIndex = 0;
        let x = focusLocation.x;
        let y= focusLocation.y;
        if(y===0){
            return {Name:"追剧",Code:Config.mSubscriptionCode};
        }
        y=y-1;
        if(view.isHasRecommend()){
            categoryIndex=parseInt(y/2);
            if(this.categoryList.length<=categoryIndex){
                return null;
            }
            return this.categoryList[categoryIndex];
        }else{
            categoryIndex=y;
            if(this.categoryList.length<=categoryIndex){
                return null;
            }
            return this.categoryList[categoryIndex];
        }
    }

    getLocationByCategoryAndProgramName(categoryCode,programName){
        if(categoryCode === Config.mSubscriptionCode){
            for(let i=0;i<this.subscribeList.length;i++){
                if(this.subscribeList[i].keyname===programName){
                    return {x:i,y:0};
                }
            }
            return {x:0,y:1};
        }
        let selectedCategory = this.programListArray[categoryCode];
        if(typeof (selectedCategory)==="undefined"){
            return {x:0,y:1};
        }
        let x = 0;
        let y = 0;
        for(let i=0;i<selectedCategory.length;i++){
            if(selectedCategory[i].keyname===programName){
                x = i;
                break;
            }
        }
        for(let i=0;i<this.categoryList.length;i++){
            if(this.categoryList[i].Code===categoryCode){
                y =  view.isHasRecommend()?(2*i+1):(i+1);
                break;
            }
        }
        return {x:x,y:y};
    }

    getListByCategory(categoryCode,type){
        if(type===jxCategoryPageParamType.CATEGORY){
            return this.programListArray[categoryCode];
        }else{
            if(typeof (this.recommendListArray[categoryCode])==="undefined"){
                let subList = recommendDataManage.getRecommendData(6,this.getAllRecommendCodeList());
                if(subList.length<6){
                    subList = recommendDataManage.getRecommendData(6);
                }
                this.addRecommendListArray(categoryCode,subList);
            }
            return this.recommendListArray[categoryCode];
        }
    }

    getAllRecommendCodeList(){
        let codeList = [];
        for(let key in this.recommendListArray){
            for(let j=0;j<this.recommendListArray[key].length;j++){
                codeList.push(this.recommendListArray[key][j].code);
            }
        }
        return codeList;
    }

    getPageParamTypeByLocation(focusLocation){
        let x = focusLocation.x;
        let y= focusLocation.y;
        if(y<-1){
            return null;
        }
        if(y===-1){
            return jxCategoryPageParamType.OPERATE
        }
        if(y===0){
            return jxCategoryPageParamType.SUB;
        }
        if(view.isHasRecommend()){
            y=y-1;
            if(y%2===0){
                return jxCategoryPageParamType.CATEGORY;
            }else{
                return jxCategoryPageParamType.RECOMMEND;
            }
        }else{
            if(y===0){
                return jxCategoryPageParamType.SUB;
            }
            return jxCategoryPageParamType.CATEGORY;
        }
    }

    getSubscribeList(){
        return this.subscribeList;
    }

    setSubscribeList(list){
        this.subscribeList = list;
    }

    setChannelList(info) {
        for(let i=0;i<info.Channels.length;i++){
            info.Channels[i] = DataAccess.getChannelInfo(info.Channels[i]);
        }
        this.channelList = info.Channels.slice(0,6);
    }

    getChannelList(){
        return this.channelList;
    }

    //获取初始页面需要用到的初始回看分类加推荐的数据集合
    getInitPageDataList(){
        let list = [];
        for(let i=0;i<this.categoryList.length;i++){
            let item = this.getJxCategoryDefaultList();
            item.code = this.categoryList[i].Code;
            item.name = this.categoryList[i].Name;
            list.push(item);
        }
        return list;
    }

    getJxCategoryDefaultList(){
        let item = {
            "name": "",
            "code": "",
            "isScheduleInit":false,
            "isRecommendInit":false,
            "schedule": [

            ],
            "recommend": [

            ]
        };
        for(let i=0;i<6;i++){
            let scheduleItem ={
                "Code": "",
                "name": ""
            };
            let recommendItem = {
                "id": "",
                "idx": "0",
                "pic": "",
                "rating": "",
                "updateEpisodeNum": "",
                "name": ""
            };
            item.schedule.push(scheduleItem);
            if(view.isHasRecommend()){
                item.recommend.push(recommendItem);
            }
        }
        return item;
    }

    destroy(){
        this.recommendListArray = [];
    }
}

export const model = new Model();
export default {model}
