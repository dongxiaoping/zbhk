import {AbstractScene} from "../../../Abstract/scene/AbstractScene";
import {sceneIds} from "../../../App/app_zbhk/AppGlobal.js";
import { programPlayTipBar } from "../../../App/app_zbhk/app.component";
import { keyEvent } from "./KeyEvent";
import { focusManage } from "./Focus";
import { view } from "./View";
import { model } from "./Model";
import { removeClass } from "../../../common/CommonUtils";
import Book from "../../../common/UserBook";

export default class Scene extends AbstractScene {
    constructor(sceneId) {
        super(sceneId, model, view, keyEvent, focusManage);
        this.setTimeoutOb = -987654563334;
    }

    displayScene(){
        super.displayScene();
        programPlayTipBar.hidden();
    }

    exec () {
        this.toPlayBookProgram(10);
    }

    toPlayBookProgram(time) {
        let that = this;
        document.getElementById('book_tip_time_id').innerHTML = '不再提醒（' + time + 's）';
        clearTimeout(this.setTimeoutOb);
        this.setTimeoutOb = setTimeout (function (){
            --time;
            if (time <=0 ){
                window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID);
                Book.processNextBookTip();
            } else {
                that.toPlayBookProgram (time);
            }
        }, 1000);
    }

    destroyScene(){
        super.destroyScene();
        focusManage.setFocusLocation ({x:0, y:0});
        clearTimeout(this.setTimeoutOb);
        removeClass(document.getElementById("play_button"), "focus");
        removeClass(document.getElementById("book_tip_time_id"), "focus");
    }
}