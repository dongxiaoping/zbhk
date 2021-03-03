import {AbstractView, AbstractListView} from "../../../Abstract/scene/AbstractView"
import {sceneIds} from "../../../App/app_zbhk/AppGlobal.js";
import { focusManage } from "./Focus";
import Book from "../../../common/UserBook";

class View extends AbstractView {
    constructor() {
        super();
        this.tipView = new TipView();
    }
    viewUpdateData() {
        super.viewUpdateData();
        this.tipView.viewUpdateData();
        focusManage.focusLocation = { x: 0, y: 0 };
    }
    viewPage() {
        super.viewPage();
        this.tipView.viewPage();
    }
    getElementByLocation(location) {
        let id = location.x == 0 ? "play_button" : "book_tip_time_id";
        return document.getElementById(id);
    }
    destroy() {
        super.destroy();
    }
}

class TipView extends AbstractListView{
    constructor(){
        super("book_program_tip");
        this.programInfo = null;
    }

    viewUpdateData() {
        this.programInfo = Book.getNowBookTip();
        let start = this.programInfo.startTime
        let timeShow = start.substr(8, 2) + ":" + start.substr(10, 2);
        this.programInfo.showTip = timeShow + " " + this.programInfo.programName;
    }

    viewPage() {
        super.viewPage();
    }
}
export const view = new View ();
export default {view}