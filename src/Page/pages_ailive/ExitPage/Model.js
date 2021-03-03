import {AbstractModel} from "../../../Abstract/scene/AbstractModel"
import {OTTConfig} from "../../../common/CmsSwitch";
import {vodRecommendSwitch,mediaType} from "../../../common/GlobalConst";
import recommendDataManage from "../../../common/RecommendDataManage";
import ChannelPay from "../../../App/app_ailive/ChannelPay";

class Model extends AbstractModel {
    constructor() {
        super();
        this.recommendList = [];
    }

    modelUpdateData(args){
        super.modelUpdateData(args);
        if(OTTConfig.showVodRecommend(vodRecommendSwitch.EXIT_VOD_RECOMMEND)) {
            this.recommendList = recommendDataManage.getRecommendData(5);
        }
        args.callback();
    }

    getRecommendList(){
        return this.recommendList;
    }

    getRecommendDataByLocation(location,type){
        let x = location.x;
        if(type===mediaType.LIVE || type===mediaType.SCH){
            x = ChannelPay.isNeedPay ? (x-3) : (x-2);
        } else{
            x = OTTConfig.liveSwitch() ? (x-3) : (x-2);
        }
        return this.recommendList[x];
    }
}

export const model = new Model();
export default {model}
