import {AbstractModel} from "../../../Abstract/scene/AbstractModel";
import DataAccess from "../../../common/DataAccess";
import {getChannelCollectionInfo,getMergeCategoryList} from "../../../common/CommonUtils"
import CommonConfig from "../../../common/Config"
class Model extends AbstractModel {
    constructor() {
        super();
        this.categoryList = []; //频道分类信息集合
        this.selectedCategory = null;
    }

    getChannelListCount(){
        return this.selectedCategory.Channels.length;
    }

    getSelectedCategory(){
        return this.selectedCategory;
    }

    setSelectedCategory(category){
        this.selectedCategory = category;
    }

    delCollectionByChannelCode(code){
        if(this.selectedCategory.Code!==CommonConfig.mCollectionCode){
            return null;
        }
        for(let i=0;i<this.selectedCategory.Channels.length;i++){
            if(this.selectedCategory.Channels[i].ChannelCode===code){
                this.selectedCategory.Channels.splice(i,1);
                return i;
            }
        }
        return null;
    }

    setSubscribeList(list){
        if(this.selectedCategory.Code===CommonConfig.mCollectionCode){
            this.selectedCategory.Channels = list;
        }
        for(let i=0;i<this.categoryList.length;i++){
            if(this.categoryList[i].Code === CommonConfig.mCollectionCode){
                this.categoryList[i].Channels = list;
                return;
            }
        }
    }

    modelUpdateData(args){
        super.modelUpdateData(args);
        let categoryLiveList =  DataAccess.getCategoryLiveChannelFromCache();
        let colList  = getChannelCollectionInfo(DataAccess.getCollectedChannel());
        this.categoryList = getMergeCategoryList(categoryLiveList,colList,1);
        args.callback();
    }

    getCategoryByCode(code){
        for(let i=0;i<this.categoryList.length;i++){
            if(this.categoryList[i].Code===code){
                return this.categoryList[i];
            }
        }
        return null;
    }

    getCategoryList(){
        return  this.categoryList;
    }

    getChannelList() {
        return this.selectedCategory.Channels;
    }
}

export const model = new Model();
export default {model}
