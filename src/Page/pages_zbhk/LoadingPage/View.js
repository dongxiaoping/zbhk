import "../../../common/Loading.js";
import {AbstractView} from "../../../Abstract/scene/AbstractView"

class View extends AbstractView {
    constructor() {
        super();
    }
    viewUpdateData() {
        super.viewUpdateData();
    }

    viewPage() {
        super.viewPage();
        window.Loading.showLoading();
    }
}

export const view = new View();
export default {view}