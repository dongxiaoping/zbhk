import {AbstractScene} from "../../../Abstract/scene/AbstractScene";
import {view} from "./View";
import {model} from "./Model";
import {keyEvent} from "./KeyEvent";
import {focusManage} from "./Focus";
import {addClass, removeClass} from "../../../common/CommonUtils";

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
        let divId = "error_scene_location_id_0_1";
        let ob = document.getElementById(divId);
        removeClass(ob, "newFocus");
        addClass(ob, "newUnFocus");
        divId = "error_scene_location_id_0_0";
        ob = document.getElementById(divId);
        removeClass(ob, "newFocus");
        addClass(ob, "newUnFocus");
        focusManage.destroy();
    }
}
