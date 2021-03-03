import {AbstractModel} from "../../../Abstract/scene/AbstractModel";
import OTTConfig from "../../../common/CmsSwitch";
import DataAccess from "../../../common/DataAccess";
import PlayerDataAccess from "../../../common/PlayerDataAccess";
import {vodRecommendSwitch, mediaType} from "../../../common/GlobalConst";
import { sceneIds } from "../../../App/app_ailive/AppGlobal.js";
import recommendDataManage from "../../../common/RecommendDataManage";
import ChannelPay from "../../../App/app_ailive/ChannelPay";

class Model extends AbstractModel {
    constructor() {
        super();
        this.screenData = null;
        this.recList = [];
    }

    modelUpdateData(args){
        this.setScreenData();
        let that = this;
        if(OTTConfig.showVodRecommend(vodRecommendSwitch.SCREEN_VOD_RECOMMEND)) {
            let len = ChannelPay.isNeedPay ? 2 : 3;
            let subList = recommendDataManage.getRecommendData(len);
            that.setRecList(subList);
        }
        args.callback();
    }

    setScreenData() {
        let playInfo = window.WebApp.Nav.getNavParams(sceneIds.SCREEN_SCENE_ID);
        if(!playInfo) return;
        if(playInfo.type == mediaType.LIVE) {
            this.screenData = DataAccess.getChannelInfo(playInfo.channelCode);
        } else if(playInfo.type == mediaType.JX) {  //精选节目
            this.screenData = PlayerDataAccess.getSchDetailByCategorySchedule(playInfo.categoryCode, playInfo.scheduleCode);
        } else if(playInfo.type == mediaType.SCH){    //回看节目
            this.screenData = PlayerDataAccess.getReviewDetailByChannelSchedule(playInfo);
        }
    }
    getScreenData() {
        return this.screenData;
    }
    setRecList(data) {
        this.recList = data;
    }
    getRecList() {
        return this.recList;
    }
    getListAllCount() {
        return this.recList.length;
    }
}

export const model = new Model();
export default {model}
