import {AbstractModel} from "../../../Abstract/scene/AbstractModel"
import DataAccess from "../../../common/DataAccess"
import {sceneIds} from "../../../App/app_zbhk/AppGlobal.js";
import {sysTime} from "../../../common/TimeUtils";

class Model extends AbstractModel {
    constructor() {
        super();
        this.channelSeekData = null;
        this.playInfo = null;
    }
    modelUpdateData(args){
        let that = this;
        let param = this.getLiveSeekParam();
        let playInfo = param.playInfo;
        let channelCode = playInfo.channelCode;
        let now = sysTime.date().Format();
        //使用频道列表的封套时候，没有正在播放的节目信息，需要请求节目单，遍历得到
        DataAccess.requestChannelSchedule({channelCode: channelCode, callback: function(channelProgram){
            if(channelProgram && channelProgram.Schedule) {
                let programs = channelProgram.Schedule;
                let len = programs.length;
                for(let i=0;i<len;i++){
                    if(programs[i].StartTime <= now && now <= programs[i].EndTime) {
                        DataAccess.setCurrentProgramInfoForChannelInfo(channelCode, programs[i]);
                        break;
                    }
                }
            }
            that.setChannelSeekData(DataAccess.getChannelInfo(channelCode));
            args.callback();
        }});
    }
    setChannelSeekData(channelSeekData) {
        this.channelSeekData = channelSeekData;
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
