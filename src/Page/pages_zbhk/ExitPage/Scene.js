import {AbstractScene} from "../../../Abstract/scene/AbstractScene";
import {removeClass } from "../../../common/CommonUtils";
import {programPlayTipBar} from "../../../App/app_zbhk/app.component";
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
        programPlayTipBar.hidden();
        view.timingHideToPlayPage(5000);
    }

    destroyScene(){
        super.destroyScene();
        focusManage.destroy();
        view.clearTimingHideToPlayPage();
        let exitEle = document.getElementById("exit_btn");
        removeClass(exitEle, "focus");

        let collectEle = document.getElementById("collection_btn");
        removeClass(collectEle, "focus");
        let collectIcon = document.getElementById("exit_collection_btn");
        removeClass(collectIcon, "collect_button");
        removeClass(collectIcon, "collected_button");

        let recList = document.getElementById("sch_rec_list");
        recList.style.display = "none";
        for(let i=0; i<3; i++) {
            let recEle = document.getElementById("sch_rec_id_"+i);
            removeClass(recEle, "focus");
        }
    }

}
