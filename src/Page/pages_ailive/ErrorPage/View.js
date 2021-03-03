import {AbstractView,AbstractListView} from "../../../Abstract/scene/AbstractView"
import {sceneIds} from "../../../App/app_ailive/AppGlobal.js";
import error_refresh_img from "../../../images/pages_ailive/error_refresh_img.png"
import error_exit_img from "../../../images/pages_ailive/error_exit_img.png"

class View extends AbstractView {
    constructor() {
        super();
        this.tipView = new tipView();
    }
    viewUpdateData() {
        super.viewUpdateData();
        this.tipView.viewUpdateData();
    }

    viewPage() {
        super.viewPage();
        this.tipView.viewPage();
        document.getElementById("error_refresh_img_id").src= error_refresh_img;
        document.getElementById("error_exit_img_id").src= error_exit_img;
    }

    destroy(){
        super.destroy();
    }
}

class tipView extends AbstractListView{
    constructor(){
        super("error_scene_tip_id");
        this.tipInfo = {
            error_title:"对不起，应用异常，请稍后再试！",
            error_code:"错误代码：05",
            error_explain:"连接不到服务器（0-92）"
        };
    }

    viewUpdateData() {
        let info = window.WebApp.Nav.getNavParams(sceneIds.ERROR_SCENE_ID);
        this.tipInfo.error_code = "错误代码："+info.code;
        this.tipInfo.error_explain = info.describe;
    }

    viewPage() {
        super.viewPage();
    }
}

export const view = new View();
export default {view}