import {AbstractView, AbstractListView} from "../../../Abstract/scene/AbstractView";
import {PlayerControllerStatic} from "../../../common/OttPlayer";
import {keyEvent, messageListener} from "./KeyEvent";
import {focusManage} from "./Focus";

class View extends AbstractView {
    constructor() {
        super();
        PlayerControllerStatic.getInstance().setPlayStateListener(messageListener);
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }
}

export const view = new View();
export default {view}