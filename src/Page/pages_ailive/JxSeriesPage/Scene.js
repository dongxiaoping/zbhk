import {AbstractScene} from "../../../Abstract/scene/AbstractScene";
import {view} from "./View";
import {model} from "./Model";
import {keyEvent} from "./KeyEvent";
import {focusManage} from "./Focus";

export default class Scene extends AbstractScene {
    constructor(sceneId) {
        super(sceneId,model,view,keyEvent,focusManage);
    }

    displayScene(){
        super.displayScene();
        view.timingHideToPlayPage(10000);
    }

    destroyScene(){
        super.destroyScene();
        view.clearTimingHideToPlayPage();
    }

    fontAdjust(count){
        super.fontAdjust(count);
        let size1 = parseInt(document.getElementById("jx_series_sub_tip").style.fontSize.replace("px",""));
        let size2 = parseInt(document.getElementById("jx_series_name_0").style.fontSize.replace("px",""));
        if(count=="add"){
            size1++;
            size2++;
        }else{
            size1--;
            size2--;
        }
        document.getElementById("jx_series_sub_tip").style.fontSize = size1+"px";
        document.getElementById("jx_series_name_0").style.fontSize = size2+"px";
    }
}