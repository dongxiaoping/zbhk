import {AbstractScene} from "../../../Abstract/scene/AbstractScene";
import {sceneIds} from "../../../App/app_zbhk/AppGlobal.js";
import {view} from "./View";
import {model} from "./Model";
import {keyEvent} from "./KeyEvent";
import {playManage} from "../../../App/app_zbhk/PlayManage"

/* 播放页可以调起播放，切换播放，但是不能在销毁时主动关闭播放，因为页面在传参不一样时，会有一个销毁再创建的过程
 * */
export default class Scene extends AbstractScene {
    constructor(sceneId) {
        super(sceneId,model,view,keyEvent,null);
    }

    init(){
        this.initSceneEle();
        this.hiddenScene();
        this.exec();
    }

    exec(){
        let playInfo = window.WebApp.Nav.getNavParams(sceneIds.PLAYER_SCENE_ID);
        if(playInfo===null){
            return;
        }
        playManage.switchPlay(playInfo);
    }

    destroyScene() {
        super.destroyScene();
      //  PlayerControllerStatic.getInstance().stopPlay(); //不能写在这里，见顶部说明
    }
}
