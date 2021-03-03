import {AbstractScene} from "../../../Abstract/scene/AbstractScene";
import {removeClass } from "../../../common/CommonUtils";
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
        let exitOb = document.getElementById("exit_button_div_id");
        removeClass(exitOb, "picFocusDiv");
        document.getElementById("exit_button_id").style.opacity=0.4;

        let ob = document.getElementById("exit_menu_live_id");
        removeClass(ob, "picFocusDiv");
        document.getElementById("exit_menu_live_img_id").style.opacity=0.4;

        let recOb = document.getElementById("exit_menu_function_id");
        removeClass(recOb, "picFocusDiv");
        document.getElementById("exit_scene_recommend_menu_img_id").style.opacity=0.4;

        let orderOb = document.getElementById("order_button_div_id");
        removeClass(orderOb, "picFocusDiv");
        document.getElementById("exit_menu_order_id").style.opacity=0.4;
    }
}
