import {AbstractScene} from "../../../Abstract/scene/AbstractScene";
import {msgType, playerResponse, mediaType} from "../../../common/GlobalConst"
import { sceneIds } from "../../../App/app_ailive/AppGlobal.js";
import {removeClass} from  "../../../common/CommonUtils";
import {keyEvent} from "./KeyEvent";
import {focusManage} from "./Focus";
import {view} from "./View";
import {model} from "./Model";

export default class Scene extends AbstractScene {
    constructor(sceneId) {
        super(sceneId,model,view,keyEvent,focusManage);
    }

    displayScene(){
        super.displayScene();
        view.timingHideToPlayPage(5000);
    }

    destroyScene(){
        super.destroyScene();
        focusManage.destroy();
        view.clearTimingHideToPlayPage();
        let payEle = document.getElementById("pay_entry");
        removeClass(payEle, "focus");
        let programEle = document.getElementById("program_entry");
        removeClass(programEle, "focus");
        let collectionEle = document.getElementById("collection_entry");
        removeClass(collectionEle, "focus");
    }

    fontAdjust(count){
        super.fontAdjust(count);
        let size1 = parseInt(document.getElementById("screen_scene_live_program_id").style.fontSize.replace("px",""));
        let size2 = parseInt(document.getElementById("channel_no").style.fontSize.replace("px",""));
        let size3 = parseInt(document.getElementById("channel_name").style.fontSize.replace("px",""));
        let size4 = parseInt(document.getElementById("screen_scene_live_program_next_id").style.fontSize.replace("px",""));
        let size5 = parseInt(document.getElementById("screen_scene_live_time_start_id").style.fontSize.replace("px",""));
        let size6 = parseInt(document.getElementById("screen_scene_live_time_end_id").style.fontSize.replace("px",""));
        if(count=="add"){
            size1++;
            size2++;
            size3++;
            size4++;
            size5++;
            size6++;
        }else{
            size1--;
            size2--;
            size3--;
            size4--;
            size5--;
            size6--;
        }
        document.getElementById("screen_scene_live_program_id").style.fontSize = size1+"px";
        document.getElementById("channel_no").style.fontSize = size2+"px";
        document.getElementById("channel_name").style.fontSize = size3+"px";
        document.getElementById("screen_scene_live_program_next_id").style.fontSize = size4+"px";
        document.getElementById("screen_scene_live_time_start_id").style.fontSize = size5+"px";
        document.getElementById("screen_scene_live_time_end_id").style.fontSize = size6+"px";
    }
    
    receiveBroadcast(type, msg) {
        super.receiveBroadcast(type, msg);
        if(type == msgType.PLAYER_STATE) {
            switch(msg.state) {
                case playerResponse.PLAYER_PLAYING:
                    let playInfo = window.WebApp.Nav.getNavParams(sceneIds.SCREEN_SCENE_ID);    //屏显消失之后，就没有playInfo了
                    if(playInfo && playInfo.type != mediaType.LIVE) {
                        view.playInfoScreenView.updatePlayerBarProgress(msg.current, msg.total);
                    }
                    break;
                default:

            }
        }
    }
}
