import {AbstractModel} from "../../../Abstract/scene/AbstractModel"
import DataAccess from "../../../common/DataAccess"
import {sceneIds} from "../../../App/app_ailive/AppGlobal.js";

class Model extends AbstractModel {
    constructor() {
        super();
        this.channelSeekData = null;
        this.playInfo = null;
    }
    modelUpdateData(args){
        this.setChannelSeekData();
        if(args) {
            args.callback();
        }
    }
    setChannelSeekData() {
        let param = this.getLiveSeekParam();
        let playInfo = param.playInfo;
        let channelCode = playInfo.channelCode;
        this.channelSeekData = DataAccess.getChannelInfo(channelCode);
    }
    getChannelSeekData() {
        return this.channelSeekData;
    }
    getLiveSeekParam() {
        return window.WebApp.Nav.getNavParams(sceneIds.LIVE_SEEK_SCENE_ID);
    }
}

export const model = new Model();
export default {model}
