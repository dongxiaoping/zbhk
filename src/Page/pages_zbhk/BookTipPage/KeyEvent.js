import {AbstractKeyEvent} from "../../../Abstract/scene/AbstractKeyEvent"
import {sceneIds} from "../../../App/app_zbhk/AppGlobal.js";
import {KeyCode} from "../../../common/FocusModule";
import { addClass, removeClass } from "../../../common/CommonUtils";
import { mediaType, defaultLiveCode } from "../../../common/GlobalConst";
import playManage from "../../../App/app_zbhk/PlayManage";
import { focusManage } from "./Focus";
import { view } from "./View";
import Book from "../../../common/UserBook";

class KeyEvent extends AbstractKeyEvent {
    constructor() {
        super(focusManage);
    }

    onKeyEvent(type, keyCode) {
        view.clearTimingHideToPlayPage();
        this.showTimer = setTimeout(function () {
            window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID);
            Book.processNextBookTip();
        }, 10000);
        if (!this.isKeyEventNeedResponseByFocus(type, keyCode)) {
            return;
        }
        super.onKeyEvent(type, keyCode);
        switch(keyCode) {
            case KeyCode.KEY_BACK:
            case KeyCode.KEY_BACK2:
                window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID);
                Book.processNextBookTip();
                break;
            default:
                break;
        }
    }
}
export const eventResponse = {
    on() {
        let location = focusManage.getFocusLocation();
        let ob = view.getElementByLocation(location);
        addClass(ob, "focus");
    },
    lost() {
        let location = focusManage.getFocusLocation();
        let ob = view.getElementByLocation(location);
        removeClass(ob, "focus");
    },
    ok() {
        let focusLocation = focusManage.getFocusLocation();
        if(focusLocation.x==0) {
            let playInfo = { type:mediaType.LIVE, categoryCode:defaultLiveCode, channelCode: view.tipView.programInfo.channelCode};
            playManage.switchPlay(playInfo);
        }
        window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID);
        Book.processNextBookTip();
    },
    onTopBorder() {},
    onBottomBorder() {},
    onLeftBorder(){
        let focusLocation = focusManage.getFocusLocation();
        if (focusLocation.x==1) {
            focusManage.lostNotice();
            focusLocation.x--;
            focusManage.setFocusLocation(focusLocation);
            focusManage.nodeUpdate();
            focusManage.nodeFocus();
        }
    },
    onRightBorder(){
        let focusLocation = focusManage.getFocusLocation();
        if (focusLocation.x == 0) {
            focusManage.lostNotice();
            focusLocation.x++;
            focusManage.setFocusLocation(focusLocation);
            focusManage.nodeUpdate();
            focusManage.nodeFocus();
        }
    }
};
export const keyEvent = new KeyEvent();
export default { keyEvent, eventResponse }