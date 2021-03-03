import { AbstractFocus } from "../../../Abstract/scene/AbstractFocus";

class FocusManage extends AbstractFocus {
    constructor() {
        super();
    }

    nodeUpdate() {
        super.nodeUpdate();
    }

    destroy() {
        super.destroy();
    }
}
export const focusManage = new FocusManage();
export default { focusManage }