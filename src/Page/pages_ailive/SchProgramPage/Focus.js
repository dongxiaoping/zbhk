import {AbstractFocus } from "../../../Abstract/scene/AbstractFocus";
import {eventResponse} from "./KeyEvent";

class FocusManage extends AbstractFocus {
    constructor() {
        super();
    }

    nodeUpdate() {
        super.nodeUpdate(eventResponse);
    }

    destroy() {
        super.destroy();
    }
}
export const focusManage = new FocusManage();
export default { focusManage }