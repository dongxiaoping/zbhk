import {AbstractScene} from "../../../Abstract/scene/AbstractScene";
import {PlayerControllerStatic} from "../../../common/OttPlayer";
import Log from "../../../common/Log"
import {msgType,sceneStatus} from "../../../common/GlobalConst"
import DataAccess from "../../../common/DataAccess";
import OTTConfig from "../../../common/CmsSwitch";
import {view} from "./View";
import {model} from "./Model";
import {keyEvent} from "./KeyEvent";
import {focusManage} from "./Focus";

export default class Scene extends AbstractScene {
    constructor(sceneId) {
        super(sceneId,model,view,keyEvent,focusManage);
    }

    destroyScene(){
        super.destroyScene();
        view.clearTimingHideToPlayPage();
        focusManage.setFocusLocation({x:0,y:0});
        this.resumePageSet();
        let  divEle = document.getElementById(this.sceneId);
        divEle.style.left="0px";
        divEle.style.zIndex = "";
        model.destroy();
    }

    exec(){
    }

    hiddenScene(){
        super.hiddenScene();
    }

    resumePageSet(){
        let ob = document.getElementById("no_recommend_schedule_category_double_list_id");
        view.subListView.updateSubTop(true);
        ob = document.getElementById("no_recommend_jx_sub_operate_div_id");
        ob.style.display = "block";
        ob = document.getElementById("no_recommend_schedule_category_sub_list_id");
        ob.style.display = "block";
        ob.style.top="190px";
        document.getElementById("jx_no_recommend_scene").style.top = "0px";
    }

    displayScene(){
        if(this.status===sceneStatus.MASKED){
            let  divEle = document.getElementById(this.sceneId);
            divEle.style.left="0px";
            this.status = sceneStatus.DISPLAY;
            focusManage.nodeFocus();
        }
        super.displayScene();
        view.timingHideToPlayPage(10000);
    }

    maskScene(flag) {
        super.maskScene(flag);
        let  divEle = document.getElementById(this.sceneId);
        divEle.style.zIndex = "-1";
        divEle.style.display = "block";
        divEle.style.left="310px";
        document.getElementById(this.sceneId).style.background = "";
    }

    animationMaskScene(flag){

    }

    receiveBroadcast(type,msg){
        super.receiveBroadcast(type,msg);
        if(type === msgType.SUBSCRIPTION_CHANGE){
            model.setSubscribeList(DataAccess.upDateSubProgramList());
            view.subListView.viewUpdateData();
            view.subListView.viewPage();
            view.subListView.updateSubTop();
        }
    }

    exec(){
        if(OTTConfig.liveSwitch()) {
            let data = DataAccess.getAllLiveChannelFromCache();
            model.setChannelList(data);
            view.windowListView.viewUpdateData();
            view.windowListView.viewPage();
        }
    }
}
