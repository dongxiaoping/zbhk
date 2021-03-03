import {AbstractScene} from "../../../Abstract/scene/AbstractScene";
import {OTT} from "../../../common/OttMiddle";
import {PlayerControllerStatic} from "../../../common/OttPlayer";
import {keyEvent} from "./KeyEvent";
import {focusManage} from "./Focus";
import {view} from "./View";
import {model} from "./Model";
import { starTipBar } from "../../../App/app_zbhk/app.component";

export default class Scene extends AbstractScene {
    constructor(sceneId) {
        super(sceneId, model, view, keyEvent, focusManage);
    }

    exec() {
        starTipBar.show();
    }

    destroyScene(){
        super.destroyScene();
        focusManage.destroy();
        view.clearTimingHideToPlayPage();
    }

    displayScene() {
        super.displayScene();
        let state = OTT.MediaPlayer.getPlayState();
        if(state != PlayerControllerStatic.BE_MEDIA_PLAYER_PAUSE){    //暂停时候，常显菜单
            view.timingHideToPlayPage(10000);
        }
    }
}