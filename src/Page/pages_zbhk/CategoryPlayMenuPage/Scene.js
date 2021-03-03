import {AbstractScene} from "../../../Abstract/scene/AbstractScene";
import JxLog from "../../../common/Log"
import {sceneStatus, LogType} from "../../../common/GlobalConst";
import {keyEvent} from "./KeyEvent";
import {focusManage} from "./Focus";
import {view} from "./View";
import {model} from "./Model";
import { starTipBar } from "../../../App/app_zbhk/app.component";

export default class Scene extends AbstractScene {
    constructor(sceneId) {
        super(sceneId, model, view, keyEvent, focusManage);
    }

    init() {
        let that = this;
        this.initSceneEle();
        this.hiddenScene();
        this.Model.modelUpdateData({
            callback: function() {
                that.View.viewUpdateData();
                that.View.viewPage();
                that.status = sceneStatus.INITED;
                that.exec();
                JxLog.i([LogType.PAGE], "Page/pages_zbhk/Scene/init", ["状态：页面初始化完毕",that.sceneId]);
            }
        });
        starTipBar.show();
    }

    exec() {

    }

    destroyScene(){
        super.destroyScene();
        view.clearTimingHideToPlayPage();
    }

    displayScene() {
        super.displayScene();
        view.timingHideToPlayPage(5000);
    }
}