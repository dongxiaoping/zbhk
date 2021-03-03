import {AbstractFocus} from "../../../Abstract/scene/AbstractFocus"
import {eventResponse} from "./KeyEvent"
import {view} from "./View";

class FocusManage extends AbstractFocus{
    constructor() {
        super();
        this.focusLocation = null;
    }

    nodeUpdate(){
        super.nodeUpdate(eventResponse);
    }

    lost(){
        super.lost();
        let elementType = view.getPageElementTypeByLocation(this.focusLocation);
        if(elementType===view.pageElementType.DATE||elementType===view.pageElementType.COLLECT){
            view.dateListView.setLostLocation(this.focusLocation);
        }else if(elementType===view.pageElementType.CHANNEL){
            view.channelListView.setLostLocation(this.focusLocation);
        }else{
            view.programListView.setLostLocation(this.focusLocation);
        }
    }

    destroy() {
        super.destroy();
        this.focusLocation = null;
    }
}
export const focusManage = new FocusManage();
export default {focusManage}
