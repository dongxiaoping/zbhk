import {AbstractScene} from "../../../Abstract/scene/AbstractScene";
import {view} from "./View";
import {model} from "./Model";
import {keyEvent} from "./KeyEvent";
import {focusManage} from "./Focus";

export default class Scene extends AbstractScene {
    constructor(sceneId) {
        super(sceneId,model,view,keyEvent,focusManage);
    }

    destroyScene() {
        super.destroyScene();
        focusManage.focusHistory = null;
        view.clearTimingHideToPlayPage();
    }

    displayScene(){
        super.displayScene();
        view.timingHideToPlayPage(10000);
    }

    fontAdjust(count){
        super.fontAdjust(count);
        let pre1 = "date_play_";
        let pre2 = "date_show_";
        let pre3 = "scene_rec_list_series_";
        let pre4 = "scene_rec_list_name_";
        let pre5 = "start_time_";

        for(let i=0;i<6;i++){
            let size1 = parseInt(document.getElementById(pre1+i).style.fontSize.replace("px",""));
            let size2 = parseInt(document.getElementById(pre2+i).style.fontSize.replace("px",""));
            let size3 = parseInt(document.getElementById(pre3+i).style.fontSize.replace("px",""));
            let size4 = parseInt(document.getElementById(pre4+i).style.fontSize.replace("px",""));
            let size5 = parseInt(document.getElementById(pre5+i).style.fontSize.replace("px",""));
            if(count=="add"){
                size1++;
                size2++;
                size3++;
                size4++;
                size5++;
            }else{
                size1--;
                size2--;
                size3--;
                size4--;
                size5--;
            }
            document.getElementById(pre1+i).style.fontSize = size1+"px";
            document.getElementById(pre2+i).style.fontSize = size2+"px";
            document.getElementById(pre3+i).style.fontSize = size3+"px";
            document.getElementById(pre4+i).style.fontSize = size4+"px";
            document.getElementById(pre5+i).style.fontSize = size5+"px";
        }
    }

}