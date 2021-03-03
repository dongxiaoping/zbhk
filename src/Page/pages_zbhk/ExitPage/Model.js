import {AbstractModel} from "../../../Abstract/scene/AbstractModel"
import PlayerDataAccess from "../../../common/PlayerDataAccess";
import {mediaType} from "../../../common/GlobalConst";
import {sceneIds} from "../../../App/app_zbhk/AppGlobal";
import { sysTime } from "../../../common/TimeUtils";

class Model extends AbstractModel {
    constructor() {
        super();
        this.schRecList = [];      //回看退出界面（上一回看节目-下一回看节目-当前直播）
    }

    modelUpdateData(args){
        super.modelUpdateData(args);
        this.schRecList = [];
        let playInfo = this.getExitSceneParam();
        if(playInfo.type == mediaType.SCH) {
            let currentProgram = PlayerDataAccess.getChannelCurrentProgram(playInfo.channelCode);
            currentProgram.Tips = "当前直播";
            if (!currentProgram.Name) {
                currentProgram.Name = "暂无节目名称";
            }
            let prevSchProgram = PlayerDataAccess.getPrevReviewProgram(playInfo);
            if(prevSchProgram.startTime > sysTime.nowFormat()) {  //今天第一条回看节目，上一回看：定位到今天的直播而不是未开始的节目
                prevSchProgram.detail = currentProgram;
            } else {
                prevSchProgram.detail.Tips = "上一回看节目";
            }
            this.schRecList.push(prevSchProgram.detail);
            let nextSchProgram = PlayerDataAccess.getNextReviewProgram(playInfo);
            if(nextSchProgram.type == mediaType.SCH) {
                nextSchProgram.detail.Tips = "下一回看节目";
            } else {
                nextSchProgram.detail = {Tips: "下一回看节目", Name: "节目暂未录制"};
            }
            this.schRecList.push(nextSchProgram.detail);
            this.schRecList.push(currentProgram);
        }
        args.callback();
    }

    getSchRecList(){
        return this.schRecList;
    }

    getExitSceneParam() {
        return window.WebApp.Nav.getNavParams(sceneIds.EXIT_SCENE_ID)
    }
}

export const model = new Model();
export default {model}
