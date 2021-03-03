import {AbstractModel} from "../../../Abstract/scene/AbstractModel";
import {sceneIds} from "../../../App/app_zbhk/AppGlobal";
import {mediaType, programTimeType} from "../../../common/GlobalConst";
import {getWeekShowByDate, getChannelCollectionInfo} from "../../../common/CommonUtils";
import DataAccess from "../../../common/DataAccess";
import {sysTime} from "../../../common/TimeUtils";
import {view} from "./View"
import OTTConfig from "../../../common/CmsSwitch";

class Model extends AbstractModel {
    constructor() {
        super();
        this.categoryList = []; //频道分类信息集合
        this.channelList = [];  //频道列表信息集合
        this.dateList = [];     //日期列表信息集合
        this.programList = [];  //节目单列表信息集合
        this.selectedCategory = null;
    }

    modelUpdateData(args){
        super.modelUpdateData(args);
        let that = this;
        let categoryLiveList =  DataAccess.getCategoryLiveChannelFromCache();
        let collectionCategory = getChannelCollectionInfo(DataAccess.getCollectedChannel());
        that.setLiveCategoryChannelList(categoryLiveList, collectionCategory);
        that.setChannelList();    //设置频道列表数据(根据selectedCategory)
        that.setDateList();       //设置日期列表数据
        let programParam = that.getProgramParamByPlayInfo();
        let channelInfo = DataAccess.getChannelInfo(programParam.channelCode);
        if(programParam.channelCode && channelInfo.ShowProgram) {
            let reqArgs = {
                channelCode: programParam.channelCode,
                startDate: programParam.time + " 00:00:00",
                endDate: programParam.time + " 23:59:59",
                callback: function(programData) {
                    that.setProgramList(programData);   //设置节目列表数据
                    args.callback();
                }
            };
            DataAccess.requestChannelSchedule(reqArgs);
        } else {
            this.setProgramList(null);
            args.callback();
        }
    }

    //光标在日期上面移动，根据channelcode+date更新节目单列表
    updateProgramList(channelCode, dateIdx) {
        let channelInfo = DataAccess.getChannelInfo(channelCode);
        if(!channelInfo.ShowProgram) {   //屏蔽回看的频道，不请求节目单
            this.setProgramList(null);
            view.programListView.setNewInitParam();
            view.programListView.viewUpdateData();
            view.programListView.viewPage();
            return;
        }
        if(dateIdx == null) {
            dateIdx = 0;
        }
        let that = this;
        let reqArgs = {
            channelCode: channelCode,
            startDate: this.dateList[dateIdx].date+" 00:00:00",
            endDate: this.dateList[dateIdx].date+" 23:59:59",
            callback: function(programData) {
                that.setProgramList(programData);
                view.programListView.setNewInitParam();
                view.programListView.viewUpdateData();
                view.programListView.viewPage();
            }
        };
        DataAccess.requestChannelSchedule(reqArgs);
    }

    //根据播放信息，获取进入页面需要请求节目单的参数
    getProgramParamByPlayInfo() {
        let res = {channelCode: null, time: null};
        let playInfo = this.getSceneParam();
        if(playInfo && playInfo.channelCode) {
            res.channelCode = playInfo.channelCode
        } else {
            if(this.channelList.length) {
                res.channelCode = this.channelList[0].ChannelCode;
            } else {       //该分类下没有频道数据，使用全部分类第一个频道数据
                let cateInfo = this.categoryList[1];
                res.channelCode = cateInfo.Channels[0].ChannelCode;
            }
        }
        if(playInfo && playInfo.type) {
            if (playInfo.type == mediaType.LIVE) {     //直播：获取今天节目单
                res.time = this.dateList[0].date;
            } else if (playInfo.type == mediaType.SCH) {   //回看：根据开始时间获取一天节目单
                let startTime = playInfo.startTime;
                res.time = startTime.substr(0, 4) + "-" + startTime.substr(4, 2) + "-" + startTime.substr(6, 2);
            }
        } else {
            res.time = this.dateList[0].date;
        }
        return res;
    }

    //1.设置分类列表
    setLiveCategoryChannelList(categoryList, colList) {
        if(categoryList) {
            for (let i = 0; i < categoryList.length; i++) {
                for (let j = 0; j < categoryList[i].Channels.length; j++) {
                    categoryList[i].Channels[j] = DataAccess.getChannelInfo(categoryList[i].Channels[j]);
                    categoryList[i].Channels[j].CategoryCode = categoryList[i].Code;
                }
            }
            let rightCategoryList = [];
            for (let i = 0; i < categoryList.length; i++) {
                if (categoryList[i].Channels.length > 0) {
                    rightCategoryList.push(categoryList[i]);
                }
            }
            this.categoryList = rightCategoryList;
            if(colList) {
                this.categoryList.unshift(colList);
            }
        }
    }

    //1.获取分类列表
    getLiveCategoryChannelList() {
        return this.categoryList;
    }

    getSelectedCategory(){
        return this.selectedCategory;
    }

    setSelectedCategory(category){
        this.selectedCategory = category;
    }

    setSelectCategoryByLocation(focusY) {
        let index = view.categoryListView.offset + focusY;
        if(index >= 0 && index < this.categoryList.length) {
            this.selectedCategory = this.categoryList[index];
        } else {
            this.selectedCategory = this.categoryList[0];
        }
        model.setChannelList();
    }

    //2.设置频道列表
    setChannelList() {
        if(!this.selectedCategory) {
            let idx = 1;
            this.selectedCategory = this.categoryList[idx];
        }
        this.channelList = this.selectedCategory.Channels;
    }

    //2.获取频道列表
    getChannelList() {
        return this.channelList;
    }

    //3.设置日期列表
    setDateList() {
        let showDate = DataAccess.getProgramShowDate();
        let dateList = [];
        let len = showDate.length;
        for(let i=len-1; i>=0; i--) {
            let weekShow = getWeekShowByDate(showDate[i]);
            let dateShow = showDate[i].substr(5, 2)+"/"+ showDate[i].substr(8, 2);
            let item = {weekShow: weekShow, date: showDate[i], dateShow: dateShow, idx: i};
            dateList.push(item);
        }
        this.dateList = dateList;
    }

    //3.获取日期列表
    getDateList() {
        return this.dateList;
    }

    //4.设置节目单列表
    setProgramList(programData) {
        this.programList = [];
        let programList = null;
        if(programData && programData.Schedule) {
            programList = programData.Schedule;
        }
        if(programList) {
            let now = sysTime.date().Format();
            for(let i=0; i<programList.length; i++) {
                let item = programList[i];
                if(now>item.EndTime) {
                    item.tips = programTimeType.IS_LOOK_BACK;
                } else if(now <item.StartTime) {
                    item.tips = OTTConfig.showBook() ? programTimeType.IS_FORE_SHOW : '';
                } else {
                    item.tips = programTimeType.IS_LIVE;
                }
                let endDate = sysTime.strToDate(item.EndTime).Format("yyyy-MM-dd");
                let startDate = sysTime.strToDate(item.StartTime).Format("yyyy-MM-dd");
                item.startTimeFmt = item.StartTime.substr(8, 2) + ":" + item.StartTime.substr(10, 2);
                if(i == 0) {     //按天取的节目单中，第一个是跨天的节目，就过滤掉该跨天的节目
                    if(startDate == endDate)  {
                        this.programList.push(item);
                    }
                } else {
                    this.programList.push(item);
                }
            }
        }
    }

    //4.获取节目单列表
    getProgramList() {
        return this.programList;
    }

    //获取scene的参数
    getSceneParam() {
        return window.WebApp.Nav.getNavParams(sceneIds.LOOK_BACK_ID);
    }
}

export const model = new Model();
export default {model}