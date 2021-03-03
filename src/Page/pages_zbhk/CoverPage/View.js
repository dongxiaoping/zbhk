import {AbstractView, AbstractListView} from "../../../Abstract/scene/AbstractView";
import {addClass, removeClass, getVersion} from "../../../common/CommonUtils";
import Collection from "../../../common/UserCollection";
import CommonConfig from "../../../common/Config";
import localPersistentStorage from "../../../common/LocalPersistentStorage";
import {focusManage} from "./Focus";
import {model} from "./Model";
import OTTConfig from "../../../common/CmsSwitch";
import {coverPageMode} from "../../../common/GlobalConst";
import Config from "../../../common/Config";
import { starTipBar } from "../../../App/app_zbhk/app.component";

class View extends AbstractView {
    constructor() {
        super();
        this.pageElementType = {BUTTON: 0, CATEGORY_LIST: 1, CHANNEL_LIST: 2, COLLECTION_BUTTON: 3, CONFIRM_BUTTON: 4};
        this.categoryListView = new categoryListView();
        this.channelListView = new channelListView();
        this.needUpdate = false;   //是否需要更新列表（上下移动的时候，联动；从左右移动的时候，不需要再次刷新）
    }
    viewUpdateData() {
        super.viewUpdateData();
        starTipBar.hidden();
        let param = model.getSceneParam();
        this.getInitDataByParam(param);
        this.categoryListView.viewUpdateData();
        this.channelListView.viewUpdateData();
        let location = this.getInitLocationByParam(param);
        focusManage.setFocusLocation(location);
    }

    viewPage() {
        super.viewPage();
        localPersistentStorage.clearRestoreInfo();
        this.categoryListView.viewPage();
        this.channelListView.viewPage();
        document.getElementById("cover_copy_num").innerHTML = "版本号：" + getVersion();
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
        if(location.x < 2) {
            return location.x;
        } else if(location.x > 5) {
            return this.pageElementType.CONFIRM_BUTTON;
        } else if (location.x > 4) {
            return this.pageElementType.COLLECTION_BUTTON;
        } else {
            return this.pageElementType.CHANNEL_LIST;
        }
    }

    getIdByFocusLocation(focusLocation){
        let type = view.getPageElementTypeByLocation(focusLocation);
        switch (type) {
            case this.pageElementType.BUTTON:
                return "lookback_button";
            case this.pageElementType.CATEGORY_LIST:
                return this.categoryListView.itemIdPrefix + focusLocation.y;
            case this.pageElementType.CHANNEL_LIST:
                let idx = parseInt((focusLocation.x - 2) + 3*focusLocation.y);
                return this.channelListView.itemIdPrefix + idx;
            case this.pageElementType.COLLECTION_BUTTON: 
                return "collection_button_"+focusLocation.y;
            case this.pageElementType.CONFIRM_BUTTON:
                return "confirm_button_"+focusLocation.y;
            default:
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
    }

    //进入该页面：根据param进行焦点定位
    getInitLocationByParam(param) {
        if(!param) {                 // 1.参数为空：焦点定位“全部”分类；
            let idx = 1;
            return {x:view.pageElementType.CATEGORY_LIST, y:idx};
        } else {
            if(!param.channelCode) {  // 2.从回看封套进入直播频道：焦点定位在“回看”按钮；
                return {x:view.pageElementType.BUTTON, y:0};
            } else {                  //3.从播放退出到封套：焦点定位在退出播放前的频道
                return view.channelListView.getLostLocation();
            }
        }
    }
    destroy(){
        super.destroy();
        //从“收藏”分类进入播放页面，退出到封套，定位到“全部”分类
        if(model.selectedCategory.Code == Config.mCollectionCode) {
            model.selectedCategory = null;
        }
    }
}

//直播分类列表
class categoryListView extends AbstractListView {
    constructor() {
        super("category_list");
        this.contentSize = 7;
        this.offset = 0;
        this.totalLen = 0;
        this.itemIdPrefix = "category_item_";
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
        this.addCategorySelectByLocation();
        view.viewPageArrow(document.getElementById("category_page_arrow"), this.offset, this.contentSize, this.totalLen, true);
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
        let allCategory = model.getLiveCategoryChannel();
        let idx = 1;
        let selectedCategory = allCategory[idx];
        let lostLocation =  {x: view.pageElementType.CATEGORY_LIST, y: idx};
        model.setSelectedCategory(selectedCategory);
        this.setOffset(0);
        this.setSelectedItem(selectedCategory);
        this.setLostLocation(lostLocation);
    }
    //初次进页面：通过scene参数设置offset，selectedItem
    setCategoryListOffsetByParam(param) {
        let allCategory = model.getLiveCategoryChannel();
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
        this.setOffset(offset);
        this.setSelectedItem(selectedCategory);
        this.setLostLocation(lostLocation);
    }
    getShowCategoryListByOffset() {
        let allCategory = model.getLiveCategoryChannel();
        this.setTotalLen(allCategory);
        let categoryList = [];
        if (allCategory) {
            for (let i = this.offset; i < (this.offset + this.contentSize); i++) {
                if (i < allCategory.length) {
                    categoryList.push(allCategory[i]);
                }
            }
        }
        return categoryList;
    }
    //光标从分类上左右移动的时候，给category加上select样式
    addCategorySelectByLocation(){
        let lostLocation = this.getLostLocation();
        let ele = document.getElementById(this.itemIdPrefix + lostLocation.y);
        if(ele) {
            addClass(ele, "select");
        }
    }
    getCategoryInfoByLocation(focusLocation) {
        let lostLocation = this.getLostLocation();
        let idx = focusLocation ? focusLocation.y : lostLocation.y;
        let categoryInfo = this.categoryList[idx];
        return categoryInfo;
    }
}

//直播频道列表
class channelListView extends AbstractListView {
    constructor() {
        super("channel_list");
        this.contentSize = 24;
        this.itemIdPrefix = "channel_item_";
        this.channelList = []; //显示的频道列表
        this.selectedItem = null;
        this.totalPage = 0;       //总页数
        this.currentPage = 0;     //当前所在页面
        this.totalListLen = 0;  //频道总个数
        this.pageMode = coverPageMode.LIST;        //列表模式-编辑模式-确认模式
        this.buttonType = { EDIT: 0, CLEAR: 1, FINISH: 2 };
        this.pageEle = document.getElementById("channel_page_info");
        this.arrowEle = document.getElementById("channel_page_arrow");
        this.collectionEdit = document.getElementById("collection_button_0");
        this.collectionOperation = document.getElementById("collection_operation");
    }

    viewUpdateData() {
        this.channelList = this.getShowChannelListByOffset();
    }

    updateChannelNumAndIcon(){
        if(!OTTConfig.showChannelNo()) {
            let channelNums = document.getElementsByClassName('cover_scene_channel_no');
            let i = 0;
            for(;i<channelNums.length;i++){
                channelNums[i].style.visibility = 'hidden';
            }
        }
    }
    viewPage() {
        if(this.channelList.length > 0) {
            super.viewPage();
            if(model.selectedCategory.Code !== CommonConfig.mCollectionCode) {
                this.viewChannelIsCollection();
            }            
            this.pageEle.style.display = "block";
            this.arrowEle.style.display = "block";
            this.viewChannelPageInfo();
            view.viewPageArrow(document.getElementById("channel_page_arrow"), this.currentPage, this.contentSize, this.totalPage, false);
        } else {
            this.viewNoChannelList();
            this.pageEle.style.display = "none";
            this.arrowEle.style.display = "none";
        }
        this.updateChannelNumAndIcon()
    }
    //所选分类下没有频道数据
    viewNoChannelList() {
        let ele = document.getElementById("channel_list");
        ele.innerHTML = '<div class="no_data_tips">该分类下暂无数据</div>';
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

    setNewInitParam() {
        this.setLostLocation({x: view.pageElementType.CHANNEL_LIST, y: 0});
        this.channelList = [];
        this.selectedItem = null;
        this.totalPage = 0;
        this.currentPage = 0;
        this.totalListLen = 0;
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
            if(i<len) {
                currentPage = parseInt(i/this.contentSize) + 1;
                lostLocation = {x: 2+i%3, y: parseInt(i%this.contentSize/3)};
            } else {       //找不到指定channelCode的频道，定位第一个频
                selectedChannel = allChannelList[0];
                lostLocation = {x: 2, y: 0};
            }
        } else {
            selectedChannel = allChannelList[0];
            lostLocation = {x: 2, y: 0};
        }
        this.setCurrentPage(currentPage);
        this.setSelectedItem(selectedChannel);
        this.setLostLocation(lostLocation);
    }
    getShowChannelListByOffset() {
        let allChannelList = model.getChannelList();
        let channelList = [];
        this.totalListLen = allChannelList.length;
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
            let ele = document.getElementById("channel_collection_"+i);
            let noEle = document.getElementById("channel_no_"+i);
            if(ele) {
                if (Collection.isCollected(this.channelList[i].ChannelCode)) {
                    ele.style.display = "block";
                    noEle.style.marginLeft = "0px";
                }
            }
        }
    }
    //收藏分类操作的删除标识
    viewCollectionDeleteIcon(flag=true) {
        let len = this.channelList.length;
        for (let i = 0; i < len; i++) {
            let ele = document.getElementById("collection_delete_" + i);
            let noEle = document.getElementById("channel_no_" + i);
            if (ele) {
                if(flag) {
                    ele.style.display = "block";
                    noEle.style.marginLeft = "0px";
                } else {
                    ele.style.display = "none";
                    noEle.style.marginLeft = "32px"
                }
            }
        }
    }
    //展示频道页码信息
    viewChannelPageInfo() {
        let pageInfo = document.getElementById("channel_page_info");
        pageInfo.innerHTML = this.currentPage+"/"+this.totalPage
    }
    //根据focusLocation获取向下的频道元素
    getDownChannelByFocusLocation(focusLocation) {
        let downIdx = parseInt((focusLocation.x - 2) + 3*(focusLocation.y+1));
        let downEle = document.getElementById(this.itemIdPrefix+downIdx);
        return downEle;
    }
    //根据focusLocation获取向右的频道元素
    getRightChannelByFocusLocation(focusLocation) {
        let rightIdx = parseInt((focusLocation.x - 2) + 3*focusLocation.y+1);
        let rightEle = document.getElementById(this.itemIdPrefix+rightIdx);
        return rightEle;
    }
    //根据focusLocation获取频道信息
    getChannelInfoByFocusLocation(focusLocation) {
        let idx = focusLocation.x - 2 + focusLocation.y*3;
        let channelInfo = this.channelList[idx];
        return channelInfo;
    }
    changeChannelListToList() {
        this.pageMode = coverPageMode.LIST;
        if (model.selectedCategory.Code == CommonConfig.mCollectionCode) {
            if(this.channelList.length > 0) { //收藏分类有数据
                addClass(this.collectionEdit, "show");
            } else {
                removeClass(this.collectionEdit, "show");
            }
            removeClass(this.collectionOperation, "show");
            this.viewCollectionDeleteIcon(false);
        } else {
            removeClass(this.collectionEdit, "show");
            removeClass(this.collectionOperation, "show");
        }
    }
}

export const view = new View();
export default {view}