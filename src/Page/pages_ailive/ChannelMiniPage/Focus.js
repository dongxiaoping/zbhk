import {AbstractFocus} from "../../../Abstract/scene/AbstractFocus"
import {eventResponse} from "./KeyEvent";
class FocusManage extends AbstractFocus{
    constructor() {
        super();
        this.focusLocation = {x:0,y:0};
        this.lostPageType = null;
    }
    nodeUpdate(){
        super.nodeUpdate(eventResponse);
    }

    setLostPageType(pageType){
        this.lostPageType = pageType;
    }

    getLostPageType(pageType){
        return this.lostPageType;
    }

    destroy(){
        this.focusLocation = {x:0,y:0};
    }
}
export const focusManage = new FocusManage();
export default {focusManage}


