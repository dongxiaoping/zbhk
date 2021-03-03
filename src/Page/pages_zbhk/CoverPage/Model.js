import {AbstractModel} from "../../../Abstract/scene/AbstractModel";
import {sceneIds} from "../../../App/app_zbhk/AppGlobal";
import DataAccess from "../../../common/DataAccess";
import {getChannelCollectionInfo} from "../../../common/CommonUtils"
import Config from "../../../common/Config";

class Model extends AbstractModel {
    constructor() {
        super();
        this.categoryList = []; //频道分类信息集合
        this.channelList = [];
        this.selectedCategory = null;
    }

    modelUpdateData(args){
        super.modelUpdateData(args);
        let that = this;
        let categoryLiveList =  DataAccess.getCategoryLiveChannelFromCache();
        let collectionCategory = getChannelCollectionInfo(DataAccess.getCollectedChannel());
        that.setLiveCategoryChannel(categoryLiveList, collectionCategory);
        that.setChannelList();    //设置频道列表数据(根据selectedCategory)
        that.resetSelectCategoryAndChannel();
        args.callback();
    }

    //1.设置分类列表
    setLiveCategoryChannel(categoryList, colList) {
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
    getLiveCategoryChannel() {
        return this.categoryList;
    }

    //2.设置频道列表
    setChannelList() {
        if(!this.selectedCategory) {
            let idx = 1;
            this.selectedCategory = this.categoryList[idx];
        }
        this.channelList = this.selectedCategory.Channels;
        if(this.selectedCategory && this.selectedCategory.Code == Config.mCollectionCode) {
            let collectionCategory = getChannelCollectionInfo(DataAccess.getCollectedChannel());
            this.channelList = collectionCategory.Channels;
        }
    }

    //2.获取频道列表
    getChannelList() {
        return this.channelList;
    }

    //3.根据该页面的参数，重新设置选中的分类和频道（上下键切台，换了分类）
    resetSelectCategoryAndChannel() {
        let playInfo = this.getSceneParam();
        if(playInfo && playInfo.categoryCode != this.selectedCategory.Code) {
            for(let i=0; i<this.categoryList.length; i++) {
                if(playInfo.categoryCode == this.categoryList[i].Code) {
                    this.selectedCategory = this.categoryList[i];
                    this.channelList = this.selectedCategory.Channels;
                    break;
                }
            }
        }
    }

    getSelectedCategory(){
        return this.selectedCategory;
    }

    setSelectedCategory(category){
        this.selectedCategory = category;
    }

    setSelectCategoryByLocation(focusLocation, offset) {
        let index = offset + focusLocation.y;
        if(index >= 0 && index < this.categoryList.length) {
            this.selectedCategory = this.categoryList[index];
        } else {
            this.selectedCategory = this.categoryList[0];
        }
    }

    getCategoryByCode(code){
        for(let i=0;i<this.categoryList.length;i++){
            if(this.categoryList[i].Code===code){
                return this.categoryList[i];
            }
        }
        return null;
    }

    //获取scene的参数
    getSceneParam() {
        return window.WebApp.Nav.getNavParams(sceneIds.COVER_ID);
    }
}

export const model = new Model();
export default {model}