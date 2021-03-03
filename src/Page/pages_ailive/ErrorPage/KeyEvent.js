import {AbstractKeyEvent} from "../../../Abstract/scene/AbstractKeyEvent"
import {focusManage} from "./Focus"
import {addClass, removeClass} from "../../../common/CommonUtils";
import {view} from "./View"


class KeyEvent extends AbstractKeyEvent {
    constructor() {
        super(focusManage);
    }

    onKeyEvent(type, keyCode) {
        view.clearTimingHideToPlayPage();
        view.timingHideToPlayPage(5000);

        if(!this.isKeyEventNeedResponseByFocus(type, keyCode)) {
            return ;
        }
        super.onKeyEvent(type, keyCode);
    }
}

export const eventResponse = {
    on() {
        let focusLocation = focusManage.getFocusLocation();
        let divId = "error_scene_location_id_0_"+focusLocation.x;
        let ob = document.getElementById(divId);
        removeClass(ob, "newUnFocus");
        addClass(ob, "newFocus");
        ob.style.backgroundColor="#0093DF";
    },

    lost() {

    },

    ok() {
        let focusLocation = focusManage.getFocusLocation();
        if(focusLocation.x===1){
            window.WebApp.appExit();
        }else{
            window.WebApp.appStart();
        }
    },

    onTopBorder() {

    },

    onBottomBorder() {

    },

    onLeftBorder(){
        let focusLocation = focusManage.getFocusLocation();
            if(focusLocation.x===1){
                let divId = "error_scene_location_id_0_1";
                let ob = document.getElementById(divId);
                removeClass(ob, "newFocus");
                addClass(ob, "newUnFocus");
                ob.style.backgroundColor="#162638";
                focusLocation.x = 0;
                focusManage.setFocusLocation(focusLocation);
                focusManage.nodeUpdate();
                focusManage.nodeFocus();
            }else{
                return;
            }
    },

    onRightBorder(){
        let focusLocation = focusManage.getFocusLocation();
        if(focusLocation.x===0){
            let divId = "error_scene_location_id_0_0";
            let ob = document.getElementById(divId);
            removeClass(ob, "newFocus");
            addClass(ob, "newUnFocus");
            ob.style.backgroundColor="#162638";
            focusLocation.x = 1;
            focusManage.setFocusLocation(focusLocation);
            focusManage.nodeUpdate();
            focusManage.nodeFocus();
        }else{
            return;
        }
    }
};


export const keyEvent = new KeyEvent();
export default {keyEvent,eventResponse}