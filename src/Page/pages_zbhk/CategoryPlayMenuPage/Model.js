import {AbstractModel} from "../../../Abstract/scene/AbstractModel"
import DataAccess from "../../../common/DataAccess";
import {getChannelCollectionInfo,getMergeCategoryList} from "../../../common/CommonUtils"
import OTTConfig from "../../../common/CmsSwitch";
import { sysTime } from "../../../common/TimeUtils";

class Model extends AbstractModel {
    constructor() {
        super();
        this.categoryList = []; //频道分类信息集合
        this.selectedCategoryCode= null; //选中的分类code
        this.selectedChannelCode = null;
        this.bookList = []; //预约数据
    }

    modelUpdateData(args){
        let categoryLiveList =  DataAccess.getCategoryLiveChannelFromCache();
        let colList  = getChannelCollectionInfo(DataAccess.getCollectedChannel());
        this.categoryList = getMergeCategoryList(categoryLiveList,colList,0);
        args.callback();        
    }

    getCategoryList(){
        return this.categoryList;
    }

    getSelectedCategoryCode(){
        return this.selectedCategoryCode;
    }

    setSelectedCategoryCode(code){
        this.selectedCategoryCode = code;
    }

    setSelectedChannelCode(code){
        this.selectedChannelCode = code;
    }

    getSelectedChannelCode(){
        if(this.selectedChannelCode===null){
            let list = this.getCategoryInfoByCode(this.getSelectedCategoryCode());
            this.selectedChannelCode = list.Channels[0].ChannelCode;
        }
        return this.selectedChannelCode;
    }

    getCategoryInfoByCode(code){
        for(let i=0;i<this.categoryList.length;i++){
            if(this.categoryList[i].Code ===code){
                return this.categoryList[i];
            }
        }
        return null;
    }

    setBookList (bookList) {
        this.bookList = [];
        let len = bookList.length;
        if (len) {
            let now = sysTime.date ().Format ();
            for (let i = 0; i < len; i++) {
                let item = bookList[i];
                let channelInfo = DataAccess.getChannelInfo(item.channelCode);
                if (channelInfo === null){
                    continue;
                }
                item.channelName = channelInfo.ChannelName;
                item.channelNo = channelInfo.ChannelNo;
                if (now > item.endTime) {
                    item.tips = "可回看";
                } else if (now < item.startTime) {
                    item.tips = "已预约";
                } else {
                    item.tips = "直播中";
                }
                let month = item.startTime.substr (4, 1) == '0' ? item.startTime.substr(5, 1) : item.startTime.substr(4, 2);
                let date = item.startTime.substr (6, 1) == '0' ? item.startTime.substr(7, 1) : item.startTime.substr(6, 2);
                item.dateShow = month+"月"+date+"日";
                item.startTimeFmt = item.startTime.substr (8, 2) + ":" + item.startTime.substr (10, 2);
                this.bookList.push (item);
            }
        }
    }

    getBookList () {
        return this.bookList;
    }

    destroy () {
        this.programList = [];
    }
}

export const model = new Model();
export default {model}