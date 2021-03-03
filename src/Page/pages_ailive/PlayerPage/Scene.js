import {AbstractScene} from "../../../Abstract/scene/AbstractScene";
import {PlayerControllerStatic} from "../../../common/OttPlayer";
import PlayerDataAccess from "../../../common/PlayerDataAccess";
import Log from "../../../common/Log";
import {msgType,playerResponse,playAction, mediaType} from "../../../common/GlobalConst"
import {sceneIds} from "../../../App/app_ailive/AppGlobal.js";
import {processNotExistTips} from "../../../common/CommonUtils";
import {view} from "./View";
import {model} from "./Model";
import {keyEvent} from "./KeyEvent";
import {playManage} from "../../../App/app_ailive/PlayManage"

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
        //  PlayerControllerStatic.getInstance().stopPlay(); //不能写在这里，见父类说明
    }
}
