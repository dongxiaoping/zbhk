import {AbstractModel} from "../../../Abstract/scene/AbstractModel";
import PlayerDataAccess from "../../../common/PlayerDataAccess";
import { mediaType} from "../../../common/GlobalConst";
import { sceneIds } from "../../../App/app_ailive/AppGlobal.js";
class Model extends AbstractModel {
    constructor() {
        super();
        this.seekData = {};
    }
    modelUpdateData(args){
        super.modelUpdateData(args);
        this.setSeekData();
        if(args) {
            args.callback();
        }
    }
    setSeekData() {
        let param = this.getSeekParam();
        let playInfo = param.playInfo;
        if(playInfo.type == mediaType.JX) {
            this.seekData = PlayerDataAccess.getSchDetailByCategorySchedule(playInfo.categoryCode, playInfo.scheduleCode);
            this.seekData.categoryCode = playInfo.categoryCode;
        } else {
            this.seekData = PlayerDataAccess.getReviewDetailByChannelSchedule(playInfo);
        }
    }
    getSeekData() {
        return this.seekData;
    }
    getSeekParam() {
        return window.WebApp.Nav.getNavParams(sceneIds.SEEK_SCENE_ID)
    }
}

export const model = new Model();
export default {model}
