import {AbstractView,AbstractListView} from "../../../Abstract/scene/AbstractView";
import {mediaType} from "../../../common/GlobalConst";
import {addClass, removeClass, getVersion} from "../../../common/CommonUtils";
import {sysTime} from "../../../common/TimeUtils";
import CommonConfig from "../../../common/Config"
import Collection from "../../../common/UserCollection";
import {focusManage} from "./Focus";
import {model} from "./Model";
import OTTConfig from "../../../common/CmsSwitch";
import { starTipBar } from "../../../App/app_zbhk/app.component";

class View extends AbstractView {
    constructor() {
        super();
        this.pageElementType = {BUTTON: 0, CATEGORY_LIST: 1, CHANNEL_LIST: 2, DATE_LIST: 3, PROGRAM_LIST: 4};
        this.categoryListView = new categoryListView();
        this.channelListView = new channelListView();
        this.dateListView = new dateListView();
        this.programListView  = new programListView();
        this.needUpdate = false;   //是否需要更新列表（上下移动的时候，联动；从左右移动的时候，不需要再次刷新）
    }
    viewUpdateData() {
        super.viewUpdateData();
        starTipBar.hidden();
        let param = model.getSceneParam();
        this.getInitDataByParam(param);
        this.categoryListView.viewUpdateData();
        this.channelListView.viewUpdateData();
        this.dateListView.viewUpdateData();
        this.programListView.viewUpdateData();
        let location = this.getInitLocationByParam(param);
        focusManage.setFocusLocation(location);
    }

    viewPage() {
        super.viewPage();
        this.categoryListView.viewPage();
        this.channelListView.viewPage();
        this.dateListView.viewPage();
        this.programListView.viewPage();
        document.getElementById("lookback_copy_num").innerHTML = "版本号：" + getVersion();
    }

    //按“个flag=true”与按“页flag==false”翻页的时候，显示箭头
    viewPageArrow(listDiv, begin, size, total, flag) {
        var preEle = listDiv.getElementsByClassName("up_arrow")[0];
        var nextEle = listDiv.getElementsByClassName("down_arrow")[0];
        var condition = flag == true ? ((begin+size) <= total) : (begin <= total && total != 1);
        if (condition) {
            removeClass(nextEle, "hide");
        } else {
            addClass(nextEle, "hide");
        }
        if (begin>1) {
            removeClass(preEle, "hide");
        } else {
            addClass(preEle, "hide");
        }
    }

    getPageElementTypeByLocation(location){
        return location.x;
    }

    getIdByFocusLocation(focusLocation){
        let type = view.getPageElementTypeByLocation(focusLocation);
        if(type == this.pageElementType.BUTTON) {
            return "cover_button";
        } else {
            let viewObj = this.getViewObjByType(type);
            return viewObj.itemIdPrefix + focusLocation.y;
        }
    }

    //通过类型获取view的对象
    getViewObjByType(type) {
        switch (type) {
            case this.pageElementType.CATEGORY_LIST:
                return this.categoryListView;
            case this.pageElementType.CHANNEL_LIST:
                return this.channelListView;
            case this.pageElementType.DATE_LIST:
                return this.dateListView;
            case this.pageElementType.PROGRAM_LIST:
                return this.programListView;
            default:
        }
    }

    //光标左右移动的时候，元素加上select样式
    addItemSelectByLocation(focusLocation){
        let id = this.getIdByFocusLocation(focusLocation);
        let ele = document.getElementById(id);
        if(ele) {
            addClass(ele, "select");
        }
    }

    //进入该页面: 根据param展示需要的数据
    getInitDataByParam(param) {
        view.categoryListView.setCategoryListOffsetByParam(param);
        let hasSelectChannel = view.channelListView.checkHasSelectChannel(param);
        if(!hasSelectChannel) {   //从“全部”分类找
            view.categoryListView.setCategoryToAllCategory();
        }
        view.channelListView.setChannelListOffsetByParam(param);
        view.dateListView.setDateListOffsetByParam(param);
        view.programListView.setProgramOffsetByParam(param);
    }

    //进入该页面：根据param进行焦点定位
    getInitLocationByParam(param) {
        if(!param) {                 // 1.参数为空：焦点定位“全部”分类；
            let idx = 1;
            return {x:view.pageElementType.CATEGORY_LIST, y:idx};
        } else {
            if(!param.channelCode) {  // 2.从直播封套进入回看封套：焦点定位在“最新”按钮；
                return {x:view.pageElementType.BUTTON, y:0};
            } else {                  //3.从播放退出到封套：焦点定位在退出播放前的节目
                if(view.programListView.programList.length > 0) {
                    return view.programListView.getLostLocation();
                } else {
                    return view.dateListView.getLostLocation();
                }
            }
        }
    }

    destroy(){
        super.destroy();
    }
}

//直播分类列表
class categoryListView extends AbstractListView {
    constructor() {
        super("lookback_category_list");
        this.contentSize = 7;
        this.offset = 0;
        this.totalLen = 0;
        this.itemIdPrefix = "lookback_category_item_";
        this.categoryList = []; //显示的分类列表
        this.selectedItem = null;
    }
    //更新数据
    viewUpdateData() {
        this.categoryList = this.getShowCategoryListByOffset();
    }
    //视图展现
    viewPage() {
        super.viewPage();
        view.addItemSelectByLocation(this.getLostLocation());
        view.viewPageArrow(document.getElementById("lookback_category_page_arrow"), this.offset, this.contentSize, this.totalLen, true);
    }
    setOffset(x) {
        this.offset = x;
    }
    setSelectedItem(category) {
        this.selectedItem = category;
    }
    setTotalLen(allCategory) {
        this.totalLen = allCategory ? allCategory.length : 0;
    }
    //定位到“全部”分类
    setCategoryToAllCategory() {
        let allCategory = model.getLiveCategoryChannelList();
        let idx = 1;
        let selectedCategory = allCategory[idx];
        let lostLocation =  {x: view.pageElementType.CATEGORY_LIST, y: idx};
        model.setSelectedCategory(selectedCategory);
        model.setChannelList();
        this.setOffset(0);
        this.setSelectedItem(selectedCategory);
        this.setLostLocation(lostLocation);
    }
    //初次进页面：通过scene参数设置offset，selectedItem
    setCategoryListOffsetByParam(param) {
        let allCategory = model.getLiveCategoryChannelList();
        let offset = 0;
        let selectedCategory = null;
        let lostLocation = {};
        if(param && param.categoryCode) {
            let i = 0;
            for(; i<allCategory.length; i++) {
                if(allCategory[i].Code == param.categoryCode) {
                    selectedCategory = allCategory[i];
                    break;
                }
            }
            offset = (i > (this.contentSize - 1)) ? (i - (this.contentSize - 1)) : 0;
            lostLocation = {x: view.pageElementType.CATEGORY_LIST, y: offset>0 ? this.contentSize-1 : i};
        } else {
            let idx = 1;
            selectedCategory = allCategory[idx];
            lostLocation =  {x: view.pageElementType.CATEGORY_LIST, y: idx};
        }
        model.setSelectedCategory(selectedCategory);
        model.setChannelList();
        this.setOffset(offset);
        this.setSelectedItem(selectedCategory);
        this.setLostLocation(lostLocation);
    }
    getShowCategoryListByOffset() {
        let allCategory = model.getLiveCategoryChannelList();
        this.setTotalLen(allCategory);
        let categoryList = [];
        for (let i = this.offset; i < (this.offset + this.contentSize); i++) {
            if (i < allCategory.length) {
                categoryList.push(allCategory[i]);
            }
        }
        //model.setSelectCategoryByLocation(this.lostLocation.y);
        return categoryList;
    }
    getTotalData() {
        return model.getLiveCategoryChannelList();
    }
    getCategoryInfoByLocation(focusLocation) {
        let lostLocation = this.getLostLocation();
        let idx = focusLocation ? focusLocation.y : lostLocation.y;
        let categoryInfo = this.categoryList[idx];
        return categoryInfo;
    }
}

//直播频道列表(按页翻页)
class channelListView extends AbstractListView {
    constructor() {
        super("lookback_channel_list");
        this.contentSize = 8;
        this.itemIdPrefix = "lookback_channel_item_";
        this.channelList = []; //显示的频道列表
        this.selectedItem = null;
        this.totalPage = 0;       //总页数
        this.currentPage = 0;     //当前所在页面
        this.totalListLen = 0;  //频道总个数
        this.rightEle = document.getElementById("lookback_right_list");
        this.noDataEle = document.getElementById("lookback_no_data");
    }
    setNewInitParam() {
        this.setLostLocation({x: view.pageElementType.CHANNEL_LIST, y: 0});
        this.channelList = [];
        this.selectedItem = null;
        this.totalPage = 0;
        this.currentPage = 0;
        this.totalListLen = 0;
    }
    viewUpdateData() {
        this.channelList = this.getShowChannelListByOffset();
    }

    updateChannelNum(){
        if(!OTTConfig.showChannelNo()) {
            let channelNums = document.getElementsByClassName('lookback_channel_no');
            let i = 0;
            for(;i<channelNums.length;i++){
                channelNums[i].style.visibility = 'hidden';
            }
        }
    }

    viewPage() {
        if(this.channelList.length > 0) {
            super.viewPage();
            this.viewRightList();
            view.addItemSelectByLocation(this.getLostLocation());
            if(model.selectedCategory.Code !==CommonConfig.mCollectionCode) {
                this.viewChannelIsCollection();
            }
            this.viewChannelPageInfo();
            view.viewPageArrow(document.getElementById("lookback_channel_page_arrow"), this.currentPage, this.contentSize, this.totalPage, false);
            this.updateChannelNum()
        } else {
            this.viewNoChannelList();
        }
    }
    viewRightList() {
        this.rightEle.style.display = "block";
        this.noDataEle.style.display = "none";
    }
    //该分类下没有频道数据
    viewNoChannelList() {
        this.rightEle.style.display = "none";
        this.noDataEle.style.display = "block";
    }
    //该分类下是否有param中的指定频道
    checkHasSelectChannel(param) {
        let allChannelList = model.getChannelList();
        if(param && param.channelCode) {
            let channelCode = param.channelCode;
            let len = allChannelList.length;
            for(let i=0; i<len; i++) {
                if(allChannelList[i].ChannelCode == channelCode) {
                    return true;
                }
            }
        }
        return false;
    }
    //初次进页面：通过scene参数设置currentPage，selectedItem
    setChannelListOffsetByParam(param){
        let allChannelList = model.getChannelList();
        let len = allChannelList.length;
        let selectedChannel = null;
        let currentPage = 1;
        let lostLocation = {};
        if(param && param.channelCode) {
            let channelCode = param.channelCode;
            let i = 0;
            for (; i < len; i++) {
                if (allChannelList[i].ChannelCode == channelCode) {
                    selectedChannel = allChannelList[i];
                    break;
                }
            }
            currentPage = parseInt(i/this.contentSize) + 1;
            lostLocation = {x: view.pageElementType.CHANNEL_LIST, y: i<this.contentSize ? i : i%this.contentSize};
        } else {
            selectedChannel = allChannelList[0];
            lostLocation = {x: view.pageElementType.CHANNEL_LIST, y: 0};
        }
        this.setCurrentPage(currentPage);
        this.setSelectedItem(selectedChannel);
        this.setLostLocation(lostLocation);
    }
    getShowChannelListByOffset() {
        let allChannelList = model.getChannelList();
        this.totalListLen = allChannelList.length;
        let channelList = [];
        if(this.totalListLen) {      //该分类下有频道数据
            if(!this.currentPage) {      //没有设置页码信息的时候，默认在第一页
                this.currentPage = 1;
            }
            this.totalPage = Math.ceil(this.totalListLen/this.contentSize);
            let startPos = (this.currentPage - 1)*this.contentSize;
            for (let i = startPos; i < (startPos + this.contentSize); i++) {
                if (i < allChannelList.length) {
                    channelList.push(allChannelList[i]);
                }
            }
            this.selectedItem = channelList[0];
        }
        return channelList;
    }
    setOffset(offset) {
        this.offset = offset;
    }
    setCurrentPage(page) {
        this.currentPage = page;
    }
    setSelectedItem(channel){
        this.selectedItem = channel;
    }
    //频道前收藏标识
    viewChannelIsCollection() {
        for(let i=0; i<this.channelList.length; i++) {
            if(Collection.isCollected(this.channelList[i].ChannelCode)) {
                let ele = document.getElementById("lookback_channel_collection_"+i);
                if(ele) {
                    ele.style.visibility = "visible";
                }
            }
        }
    }
    //展示频道页码信息
    viewChannelPageInfo() {
        let pageInfo = document.getElementById("lookback_channel_page_info");
        pageInfo.innerHTML = this.currentPage+"/"+this.totalPage;
    }
    //根据focusLocation获取向下的频道元素
    getDownChannelByFocusLocation(focusLocation) {
        let downIdx = focusLocation.y+1;
        let downEle = document.getElementById(this.itemIdPrefix+downIdx);
        return downEle;
    }
    getTotalData() {
        return model.getChannelList();
    }
    //根据focusLocation获取频道信息
    getChannelInfoByFocusLocation(focusLocation) {
        let lostLocation = this.getLostLocation();
        let idx = focusLocation ? focusLocation.y : lostLocation.y;
        let channelInfo = this.channelList[idx];
        return channelInfo;
    }
}

//日期列表
class dateListView extends AbstractListView {
    constructor() {
        super("date_list");
        this.contentSize = 7;
        this.offset = 0;
        this.itemIdPrefix = "date_item_";
        this.dateList = []; //显示的分类列表
        this.selectedItem = null;
    }
    setNewInitParam() {
        this.setLostLocation({x: view.pageElementType.DATE_LIST, y: 0});
        this.setSelectedItem(this.dateList[0]);
        this.setOffset(0);
    }
    //更新数据
    viewUpdateData() {
        this.dateList = this.getShowDateListByOffset();
    }
    //视图展现
    viewPage() {
        super.viewPage();
        view.addItemSelectByLocation(this.getLostLocation());
    }
    setOffset(x) {
        this.offset = x;
    }
    setSelectedItem(date){
        this.selectedItem = date;
    }
    setDateListOffsetByParam(param) {
        let allDateList = model.getDateList();
        let offset = 0;
        let selectedDate = null;
        let lostLocation = {};
        if(param && param.channelCode) {   //有播放数据
            if(param.type == mediaType.LIVE) {     //直播,日期为今天
                selectedDate = allDateList[0];
                lostLocation = {x: view.pageElementType.DATE_LIST, y: 0};
            } else if(param.type == mediaType.SCH){    //回看
                let startTime = param.startTime;
                let showDate = startTime.substr(0, 4)+"-"+startTime.substr(4, 2)+"-"+startTime.substr(6, 2);
                let len = allDateList.length;
                let i = 0;
                for(; i<len; i++) {
                    if(allDateList[i].date == showDate) {
                        selectedDate = allDateList[i];
                        offset = (i > (this.contentSize - 1)) ? (i - (this.contentSize - 1)) : 0;
                        break;
                    }
                }
                lostLocation = {x: view.pageElementType.DATE_LIST, y: i};
            }
        } else {
            selectedDate = allDateList[0];
            lostLocation = {x: view.pageElementType.DATE_LIST, y: 0};
        }
        this.setOffset(offset);
        this.setSelectedItem(selectedDate);
        this.setLostLocation(lostLocation);
    }

    getShowDateListByOffset() {
        let allDate = model.getDateList();
        let dateList = [];
        if(allDate) {
            for (let i = this.offset; i < (this.offset + this.contentSize); i++) {
                if (i < allDate.length) {
                    dateList.push(allDate[i]);
                }
            }
        }
        return dateList;
    }
    getTotalData() {
        return model.getDateList();
    }
}

//频道节目单列表（按个翻页）
class programListView extends AbstractListView {
    constructor() {
        super("program_list");
        this.contentSize = 8;
        this.itemIdPrefix = "program_item_";
        this.offset = 0;
        this.totalLen = 0;
        this.programList = []; //显示的分类列表
        this.selectedItem = null;
    }
    setNewInitParam() {
        this.setLostLocation({x: view.pageElementType.PROGRAM_LIST, y: 0});
        view.programListView.setOffsetByDate(model.getProgramList());
    }
    //更新数据
    viewUpdateData() {
        this.programList = this.getShowProgramListByOffset();
    }
    //视图展现
    viewPage() {
        if(this.programList.length > 0) {
            super.viewPage();
            this.addLiveProgramStyle();
            view.viewPageArrow(document.getElementById("program_page_arrow"), this.offset, this.contentSize, this.totalLen, true);
        } else {
            this.viewNoProgramList();
        }
    }
    //没有节目数据
    viewNoProgramList() {
        let ele = document.getElementById("program_list");
        ele.innerHTML = '<div class="no_data_tips">暂无节目单数据</div>';
    }
    setOffset(x) {
        this.offset = x;
    }
    setTotalLen(allProgram) {
        this.totalLen = allProgram ? allProgram.length : 0;
    }
    setSelectedItem(program){
        this.selectedItem = program;
    }
    setProgramOffsetByParam(param) {
        let allProgramList = model.getProgramList();
        let offset = 0;
        let selectedProgram = null;
        let lostLocation = {};
        if(param && param.channelCode && allProgramList) {   //有播放数据
            let len = allProgramList.length;
            if(param.type == mediaType.LIVE) {   //直播
                let res = this.setOffsetToLive(allProgramList);
                offset = res.offset;
                selectedProgram = res.selectedProgram;
                let i = res.index;
                lostLocation = {x: view.pageElementType.PROGRAM_LIST, y: i>3 ? 3: (i>2 ? 2 : (i>1 ? 1 : 0))};
            } else {   //回看：找到，定位到该回看节目，否则，从第一个开始
                let i = 0;
                for (; i < len; i++) {
                    if (allProgramList[i].ScheduleCode == param.scheduleCode) {
                        selectedProgram = allProgramList[i];
                        offset = (i > (this.contentSize - 1)) ? (i - (this.contentSize - 1)) : 0;
                        break;
                    }
                }
                lostLocation = {x: view.pageElementType.PROGRAM_LIST, y: i>this.contentSize ? (this.contentSize-1) : i};
            }
        } else {     //没有参数信息，也需要定位到今天的直播节目
            let res = this.setOffsetToLive(allProgramList);
            offset = res.offset;
            selectedProgram = res.selectedProgram;
            let i = res.index;
            lostLocation = {x: view.pageElementType.PROGRAM_LIST, y: i>3 ? 3: (i>2 ? 2 : (i>1 ? 1 : 0))};
        }
        this.setOffset(offset);
        this.setSelectedItem(selectedProgram);
        this.setLostLocation(lostLocation);
    }

    //设置offset至直播
    setOffsetToLive(allProgramList) {
        let res = {offset: 0, selectedProgram: null};
        let now = sysTime.date().Format();
        let len = allProgramList.length;
        for (let i = 0; i < len; i++) {
            let item = allProgramList[i];
            if (item.StartTime <= now && now <= item.EndTime) {
                res.selectedProgram = item;
                res.offset = i > 3 ? (i-3) : (i>2 ? (i-2) : (i>1 ? (i-1) : i));
                res.index = i;
                break;
            }
        }
        return res;
    }
    setOffsetByDate(allProgramList) {
        let offset = 0;
        let selectedProgram = allProgramList ? allProgramList[0] : null;
        if(view.dateListView.selectedItem.date == sysTime.getTodayDay()) {
            let res = this.setOffsetToLive(allProgramList);
            offset = res.offset;
            selectedProgram = res.selectedProgram;
        }
        this.setOffset(offset);
        this.setSelectedItem(selectedProgram);
    }
    getShowProgramListByOffset() {
        let programList = [];
        let allProgram = model.getProgramList();
        this.setTotalLen(allProgram);
        if (allProgram) {
            for (let i = this.offset; i < (this.offset + this.contentSize); i++) {
                if (i < allProgram.length) {
                    programList.push(allProgram[i]);
                }
            }
        }
        return programList;
    }
    //直播节目加上样式
    addLiveProgramStyle() {
        let programList = this.programList;
        let now = sysTime.date().Format();
        for (let i = 0; i < programList.length; i++) {
            let item = programList[i];
            let programEle = document.getElementById(this.itemIdPrefix + i);
            if (programEle) {
                let tipEle = document.getElementById("program_tips_"+i);
                tipEle.style.display = "none";
                if(item.StartTime <= now && now <= item.EndTime) {    //直播
                    addClass(programEle, "playing_program");
                    addClass(tipEle, "playing_tips");
                    tipEle.style.display = "block";
                } else if(now < item.StartTime) {    //预约
                    addClass(programEle, "not_start");
                }
            }
        }
    }
    getTotalData() {
        return model.getProgramList();
    }
    //根据focusLocation获取节目信息
    getProgramInfoByFocusLocation(focusLocation) {
        let lostLocation = this.getLostLocation();
        let idx = focusLocation ? focusLocation.y : lostLocation.y;
        let programInfo = this.programList[idx];
        return programInfo;
    }
}

export const view = new View();
export default {view}