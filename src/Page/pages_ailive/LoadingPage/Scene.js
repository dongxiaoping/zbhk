import {AbstractScene} from "../../../Abstract/scene/AbstractScene";
import {OTTConfig} from "../../../common/CmsSwitch";
import {interfaceType,interfaceBackStatus} from "../../../common/GlobalConst";
import DataAccess from "../../../common/DataAccess";
import PlayerDataAccess from "../../../common/PlayerDataAccess";
import {sceneIds} from "../../../App/app_ailive/AppGlobal.js";
import modelManage from "../../../App/app_ailive/ModelManage";
import {view} from "./View";
import {model} from "./Model";
import "babel-polyfill"

export default class Scene extends AbstractScene {
    constructor() {
        super(sceneIds.LOADING_SCENE_ID, model, view, null, null);
    }

    //根据url不同参数，从服务器请求不同的接口
    exec() {
        let that = this;
        DataAccess.requestOptionData({callback: function(data,status) {
            if (status === interfaceBackStatus.SUCCESS) {
                OTTConfig.setConfig(data);
                that.dealAfterOptionData();
            }else{
                let params = [];
                params[sceneIds.ERROR_SCENE_ID] = {code: "002", describe: "requestOptionData"+"请求异常"};
                window.WebApp.switchScene(sceneIds.ERROR_SCENE_ID, params);
            }
        }});
    }

    dealAfterOptionData(){
        PlayerDataAccess.setInitSeekTime();
        modelManage.setModeByUrlAndSwitch();         //根据url及开关设置mode
        if(!OTTConfig.getUDSUrl()) {   //不支持liveuds，先从cookie取一次cookie收藏数据,非http请求
            DataAccess.requestCollectedChannel();
        }
        modelManage.loadingDataByMode();
    }

    destroyScene(){
        super.destroyScene();
        window.Loading.hiddenLoading();
    }
}