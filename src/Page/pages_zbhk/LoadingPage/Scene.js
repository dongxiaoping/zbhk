import { sceneIds } from "../../../App/app_zbhk/AppGlobal.js";
import {AbstractScene} from "../../../Abstract/scene/AbstractScene";
import {view} from "./View";
import {model} from "./Model";

export default class Scene extends AbstractScene {
    constructor() {
        super(sceneIds.LOADING_SCENE_ID, model, view, null, null);
    }

    //根据url不同参数，从服务器请求不同的接口
    exec() {
    }


    destroyScene(){
        super.destroyScene();
        window.Loading.hiddenLoading();
    }
}