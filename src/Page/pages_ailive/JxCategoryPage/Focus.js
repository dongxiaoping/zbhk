import {AbstractFocus} from "../../../Abstract/scene/AbstractFocus"
import {FocusNode} from "../../../common/FocusModule"
import {eventResponse} from "./KeyEvent"
class FocusManage extends AbstractFocus{
    constructor() {
        super();
    }

    nodeUpdate(){
        super.nodeUpdate(eventResponse);
    }
}
export const focusManage = new FocusManage();
export default {focusManage}


