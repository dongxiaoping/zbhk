import {AbstractScene} from "../../../Abstract/scene/AbstractScene";
import {removeClass} from "../../../common/CommonUtils";
import {keyEvent} from "./KeyEvent";
import {focusManage} from "./Focus";
import {view} from "./View";
import {model} from "./Model";

export default class Scene extends AbstractScene {
    constructor(sceneId) {
        super(sceneId,model,view,keyEvent,focusManage);
    }

    exec() {

    }

    destroyScene(){
        super.destroyScene();
        let buttonEle = document.getElementById("cover_button");
        removeClass(buttonEle, "focus");
        removeClass(buttonEle, "select");
    }
}