import {AbstractView,AbstractListView} from "../../../Abstract/scene/AbstractView"
import {mediaType,exitPageParamType} from "../../../common/GlobalConst"
import PlayerDataAccess from "../../../common/PlayerDataAccess"
import {sceneIds} from "../../../App/app_ailive/AppGlobal.js"
import {OTTConfig} from "../../../common/CmsSwitch"
import Subscribe from "../../../common/UserSubscribe"
import Collection from "../../../common/UserCollection"
import ChannelPay from "../../../App/app_ailive/ChannelPay"
import imageLoad  from "../../../common/ImageLoad"
import exit_button_img from "../../../images/pages_ailive/exit-button-img.png"
import order_button_img from "../../../images/pages_ailive/channel_pay_icon_focus.png"
import exit_menu_sub_icon from "../../../images/pages_ailive/exit_menu_sub_icon.png"
import exit_menu_unsub_icon from "../../../images/pages_ailive/exit_menu_unsub_icon.png"
import arrow_right from "../../../images/pages_ailive/arrow_right.png"
import exit_menu_live_icon from "../../../images/pages_ailive/exit_menu_live_icon.png"
import exit_menu_collection_icon from "../../../images/pages_ailive/exit_menu_collection_icon.png"
import exit_menu_uncollection_icon from "../../../images/pages_ailive/exit_menu_uncollection_icon.png"
import default_vertical_icon from "../../../images/pages_ailive/default_vertical_icon.jpg";
import {model} from "./Model"
import {focusManage} from "./Focus"

class View extends AbstractView {
    constructor() {
        super();
        this.exitButtonView = new exitButtonView();
        this.menuView = new menuView();
        this.recommendListView = new recommendListView();
    }
    viewUpdateData() {
        super.viewUpdateData();
        if(ChannelPay.isNeedPay) {       //需要付费的节目，默认落焦在“订购”按钮上
            focusManage.setFocusLocation({x: 1, y: 0});
        }
        this.exitButtonView.viewUpdateData();
        this.menuView.viewUpdateData();
        this.recommendListView.viewUpdateData();
    }

    viewPage() {
        super.viewPage();
        this.exitButtonView.viewPage();
        this.menuView.viewPage();
        this.recommendListView.viewPage();
    }

    getIdByFocusLocation(focusLocation){
        let paramType = this.getPageParamTypeByLocation(focusLocation);
        let id = "";
        switch(paramType) {
            case exitPageParamType.EXIT_BUTTON:
                id = "exit_button_div_id";
                break;
            case exitPageParamType.FUNCTION_LABEL:
                id = "exit_menu_function_id";
                break;
            case exitPageParamType.FUNCTION_JX_LIVE_LABEL:
                id = "exit_menu_live_id";
                break;
            case exitPageParamType.ORDER_BUTTON:
                id = "order_button_div_id";
                break;
            case exitPageParamType.RECOMMEND_LIST:
                let type = window.WebApp.Nav.getNavParams(sceneIds.EXIT_SCENE_ID);
                let recIdx = 0;
                if(type===mediaType.JX&&OTTConfig.liveSwitch()) {
                    recIdx = 3;
                } else {
                    recIdx = 2;
                    if(ChannelPay.isNeedPay) {
                        recIdx++
                    }
                    if(PlayerDataAccess.mLiveSeekOffset) {
                        recIdx++;
                    }
                }
                id = "exit_recommend_id_"+(focusLocation.x-recIdx);
                break;
            default:
        }
        return id;
    }

    //不同情况下的按钮个数
    getButtonCount(type) {
        let count = 0;
        if (type === mediaType.JX) {
            count = OTTConfig.liveSwitch() ? 2 : 1;
        } else {
            count = 1;
            if(ChannelPay.isNeedPay) {
                count++;
            }
            if(PlayerDataAccess.mLiveSeekOffset) {
                count++
            }
        }
        return count;
    }

    getPageParamTypeByLocation(focusLocation){
        if(focusLocation.x===0){
            return exitPageParamType.EXIT_BUTTON;
        }
        let type = window.WebApp.Nav.getNavParams(sceneIds.EXIT_SCENE_ID);
        if(type === mediaType.LIVE || type === mediaType.SCH){
            if(ChannelPay.isNeedPay) {
                if(focusLocation.x == 1){
                    return exitPageParamType.ORDER_BUTTON;
                }else if(focusLocation.x == 2) {
                    return exitPageParamType.FUNCTION_LABEL;
                } else {
                    return exitPageParamType.RECOMMEND_LIST;
                }
            } else {
                if(focusLocation.x == 1){
                    if(type === mediaType.LIVE && PlayerDataAccess.mLiveSeekOffset) {
                        return exitPageParamType.FUNCTION_JX_LIVE_LABEL;
                    } else {
                        return exitPageParamType.FUNCTION_LABEL;
                    }
                }else if(focusLocation.x == 2){
                    if(type === mediaType.LIVE && PlayerDataAccess.mLiveSeekOffset) {
                        return exitPageParamType.FUNCTION_LABEL;
                    } else {
                        return exitPageParamType.RECOMMEND_LIST;
                    }
                } else {
                    return exitPageParamType.RECOMMEND_LIST;
                }
            }
        }else{
            if(focusLocation.x===1){
                if(OTTConfig.liveSwitch()){
                    return exitPageParamType.FUNCTION_JX_LIVE_LABEL;
                }else{
                    return exitPageParamType.FUNCTION_LABEL;
                }
            }else if(focusLocation.x===2){
                if(OTTConfig.liveSwitch()){
                    return exitPageParamType.FUNCTION_LABEL;
                }else{
                    return exitPageParamType.RECOMMEND_LIST;
                }
            }else{
                return exitPageParamType.RECOMMEND_LIST;
            }
        }
    }

    destroy(){
        super.destroy();
    }
}

class exitButtonView extends AbstractListView{
    constructor(){
        super("exit_button_div_id");
        let exitEle = document.getElementById(this.id);
        if(exitEle) {
            exitEle.innerHTML = this.templateHtml;
        }
    }

    viewUpdateData() {

    }

    viewPage() {
        let imgId = document.getElementById("exit_button_id");
        imgId.src = exit_button_img;
    }
}

class menuView extends AbstractListView{
    constructor(){
        super("exit_menu_div_id");
        let menuEle = document.getElementById(this.id);
        if(menuEle) {
            menuEle.innerHTML = this.templateHtml;
        }
    }
    viewUpdateData() {

    }

    viewPage() {
        let type = window.WebApp.Nav.getNavParams(sceneIds.EXIT_SCENE_ID);
        let imgOb = document.getElementById("exit_scene_recommend_menu_img_id");
        let labelOb = document.getElementById("exit_scene_recommend_menu_label_id");
        let arrowOb = document.getElementById("exit_scene_menu_arrow_id");
        let jxLiveImgOb = document.getElementById("exit_menu_live_img_id");
        let jxLiveLabelOb = document.getElementById("exit_menu_label_id");
        imgOb.style.opacity = 0.4;
        arrowOb.src = arrow_right;
        document.getElementById("exit_menu_live_id").style.display="none";
        this.processOrderShow();
        switch(type) {
            case (mediaType.LIVE):
                let playInfo = window.WebApp.getNowPlayInfo();
                if(Collection.isCollected(playInfo.channelCode)){//已经收藏
                    imgOb.src = exit_menu_collection_icon;
                    labelOb.innerHTML = "已收藏";
                }else{//未收藏
                    imgOb.src = exit_menu_uncollection_icon;
                    labelOb.innerHTML = "收藏";
                }
                if(PlayerDataAccess.mLiveSeekOffset) {     //直播处于时移状态，给一个到达直播状态的入口
                    jxLiveImgOb.src = exit_menu_live_icon;
                    jxLiveLabelOb.innerHTML = OTTConfig.getLiveCoverName();
                    document.getElementById("exit_menu_live_id").style.display = "block";
                }
                break;
            case (mediaType.JX):
                if(Subscribe.isSubscribed()){//已经追剧
                    imgOb.src = exit_menu_sub_icon;
                    labelOb.innerHTML = "已追剧";
                }else{//未追剧
                    imgOb.src = exit_menu_unsub_icon;
                    labelOb.innerHTML = "追剧";
                }
                if(OTTConfig.liveSwitch()) {
                    jxLiveImgOb.src = exit_menu_live_icon;
                    jxLiveLabelOb.innerHTML = OTTConfig.getLiveCoverName();
                    document.getElementById("exit_menu_live_id").style.display = "block";
                }
                break;
            case (mediaType.SCH):
                imgOb.src = exit_menu_live_icon;
                labelOb.innerHTML = OTTConfig.getLiveCoverName();
                break;
            default:
        }
    }

    //处理订购的显示
    processOrderShow() {
        let orderEle = document.getElementById("order_button_div_id");
        if(ChannelPay.isNeedPay) {
            let orderImgEle = document.getElementById("exit_menu_order_id");
            orderImgEle.src = order_button_img;
            orderEle.style.display = "block";
        } else {
            orderEle.style.display = "none";
        }
    }
}

class recommendListView extends AbstractListView{
    constructor(){
        super("exit_menu_recommend_id");
        this.recommendList = [];
        let recEle = document.getElementById(this.id);
        if(recEle) {
            recEle.innerHTML = this.templateHtml;
        }
    }

    viewUpdateData() {
        this.recommendList = model.getRecommendList();
    }

    viewPage() {
        super.viewPage();
        this.viewPageImg();
    }

    getRecommendCount(){
        return this.recommendList.length;
    }

    viewPageImg(){
        for(let i=0;i<this.recommendList.length;i++){
            imageLoad.setBackgroundImg("exit_recommend_id_"+i,this.recommendList[i].poster,default_vertical_icon);
        }
    }
}

export const view = new View();
export default {view}