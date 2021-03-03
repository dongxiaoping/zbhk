// +----------------------------------------------------------------------
// | Copyright (js), BestTV.
// +----------------------------------------------------------------------
// | Author: karl.dong
// +----------------------------------------------------------------------
// | Date：2018/2/2
// +----------------------------------------------------------------------
// | Description: 精选分类节目数据缓存管理
// +----------------------------------------------------------------------
import DataAccess from "./DataAccess";
import {interfaceBackStatus, defaultLiveCode,mediaType} from "./GlobalConst";
import OTTConfig from "./CmsSwitch";
import JxLog from "./Log"

class JxDataManage {
    constructor() {
        this.categoryList = []; //分类的列表集合
        this.jxPlayInfoForFirstProgram = null;
    }

    start(args){
        let that = this;
        let req ={
            callback: function(data) {
                that.categoryList = data;
                that.removeLiveNewCategory();

                function getProgramListInCategory(){
                    if(that.categoryList.length<=0){
                        JxLog.i([], "common/JxDatasManage/JxDataManage/start", ["精选分类数据缓存完毕!"]);
                        args.callback(0,interfaceBackStatus.SUCCESS);
                        return ;
                    }
                    let categoryCode = that.categoryList[0].Code;
                    DataAccess.requestJxCategoryProgram({
                        categoryCode:  categoryCode,
                        callback:function(data){
                            if(!OTTConfig.liveSwitch()) {
                                that.setJxPlayInfoForFirstProgram(data);
                            }
                            that.categoryList.splice(0,1);
                            getProgramListInCategory();
                        }
                    });
                }
                getProgramListInCategory();

            }
        };
        DataAccess.requestAllJxCategory(req);
    }

    removeLiveNewCategory(){
        for(let i=0;i<this.categoryList.length;i++){
            if(this.categoryList[i].Code === defaultLiveCode){
                this.categoryList.splice(i,1);
                break;
            }
        }
    }

    setJxPlayInfoForFirstProgram(info){
        if(this.jxPlayInfoForFirstProgram===null){
            let scheduleInfo = info.keys[0];
            let channelCode = "";
            if(scheduleInfo.schedules[0]&&scheduleInfo.schedules[0].ChannelCode){
                channelCode = scheduleInfo.schedules[0].ChannelCode;
            }
            let playInfo = {type: mediaType.JX,channelCode:channelCode, scheduleCode: scheduleInfo.schedules[0].ScheduleCode,
                startTime: scheduleInfo.schedules[0].StartTime, endTime: scheduleInfo.schedules[0].EndTime, categoryCode: info.categorycode
            };
            this.jxPlayInfoForFirstProgram = playInfo;
        }
    }

    //当应用首页为精选分类页面时，需要用到的默认播放信息
    getJxPlayInfoForFirstProgram(){
        return this.jxPlayInfoForFirstProgram;
    }
}
export const jxDataManage = new JxDataManage();
export default jxDataManage;