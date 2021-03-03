import {AbstractView,AbstractListView} from "../../../Abstract/scene/AbstractView"
import {mediaType, exitPageParamType, interfaceType} from "../../../common/GlobalConst"
import {addClass} from "../../../common/CommonUtils"
import Collection from "../../../common/UserCollection"
import {model} from "./Model"
import {focusManage} from "./Focus"
import modelManage from "../../../App/app_zbhk/ModelManage";

class View extends AbstractView {
    constructor() {
        super();
        this.exitButtonView = new exitButtonView();
        this.schRecListView = new schRecListView();
    }
    viewUpdateData() {
        super.viewUpdateData();
        this.exitButtonView.viewUpdateData();
        let playInfo = model.getExitSceneParam();
        if(playInfo.type == mediaType.LIVE) {
            focusManage.focusLocation = {x: 1, y:0};
        } else {
            this.schRecListView.viewUpdateData();
            focusManage.focusLocation = {x: 1, y:1};
        }
    }

    viewPage() {
        super.viewPage();
        this.exitButtonView.viewPage();
        let playInfo = model.getExitSceneParam();
        if(playInfo.type == mediaType.SCH) {
            this.schRecListView.viewPage();
        }
    }

    getIdByFocusLocation(focusLocation){
        let paramType = this.getPageParamTypeByLocation(focusLocation);
        switch(paramType) {
            case exitPageParamType.EXIT_BUTTON:
                return "exit_btn";
            case exitPageParamType.FUNCTION_LABEL:
                return "collection_btn";
            case exitPageParamType.RECOMMEND_LIST:
                return "sch_rec_id_"+(focusLocation.x);
            default:
        }
    }

    getPageParamTypeByLocation(focusLocation){
        let playInfo = model.getExitSceneParam();
        if(playInfo.type == mediaType.LIVE) {
            return focusLocation.x == 0 ? exitPageParamType.FUNCTION_LABEL : exitPageParamType.EXIT_BUTTON;
        } else {
            if(focusLocation.y == 0) {
                return exitPageParamType.RECOMMEND_LIST;
            } else {
                return focusLocation.x == 0 ? exitPageParamType.FUNCTION_LABEL : exitPageParamType.EXIT_BUTTON;
            }
        }
    }

    destroy(){
        super.destroy();
    }
}

class exitButtonView extends AbstractListView{
    constructor(){
        super("exit_menu_div_id");
        this.buttonListEle = document.getElementById("exit_button_list");
        this.collectionBtn = document.getElementById("collection_btn");
        this.collecitonIcon = document.getElementById("exit_collection_btn");
    }
    viewUpdateData() {

    }

    viewPage() {
        let playInfo = model.getExitSceneParam();
        this.collectionBtn.style.display = "block";
        if (Collection.isCollected(playInfo.channelCode)) { //已经收藏,显示“取消”按钮
            addClass(this.collecitonIcon, "collect_button");
        } else {//未收藏，显示“收藏”按钮
            addClass(this.collecitonIcon, "collected_button");
        }
        let modeType = modelManage.getModeType();
        if(interfaceType.ACTION_LIVE_CHANNEL_LOCK == modeType){
            document.getElementById('collection_btn').style.display = 'none'
        }
        if(playInfo.type == mediaType.LIVE) {
            if(interfaceType.ACTION_LIVE_CHANNEL_LOCK == modeType){
                this.buttonListEle.style.left = '100px'
            }else{
                this.buttonListEle.style.left = "449px";
            }

            //if (PlayerDataAccess.mLiveSeekOffset) {     //todo 直播处于时移状态，给一个到达直播状态的入口
            //    jxLiveImgOb.src = exit_menu_live_icon;
            //    jxLiveLabelOb.innerHTML = OTTConfig.getLiveCoverName();
            //    document.getElementById("exit_menu_live_id").style.display = "block";
            //}
        } else if(playInfo.type == mediaType.SCH) {
            this.buttonListEle.style.left = "100px";
        }
    }
}

class schRecListView extends AbstractListView{
    constructor(){
        super("sch_rec_list");
        this.schRecList = [];
        this.recEle = document.getElementById(this.id);
    }

    viewUpdateData() {
        this.schRecList = model.getSchRecList();
    }

    viewPage() {
        let playInfo = model.getExitSceneParam();
        if(playInfo.type == mediaType.LIVE) {
            this.recEle.style.display = "none";
        } else {
            super.viewPage();
            this.recEle.style.display = "block";
        }
    }
}

export const view = new View();
export default {view}