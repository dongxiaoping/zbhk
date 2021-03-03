import "../../../css/pages_ailive/screen.css";
import {AbstractView,AbstractListView} from "../../../Abstract/scene/AbstractView"
import {keyEvent} from "./KeyEvent";
import {focusManage} from "./Focus";
import {model} from "./Model";
import {OTTConfig} from "../../../common/CmsSwitch";
import {KeyCode} from "../../../common/FocusModule";
import JxLog from "../../../common/Log"
import CommonConfig from "../../../common/Config"
import Config from "../../../common/Config";
import {moveType,defaultLiveCode, LogType} from "../../../common/GlobalConst"
import ChannelPay from "../../../App/app_ailive/ChannelPay"
import {addClass,removeClass, getLiveChannelImageUrl, showChannelPayTips} from "../../../common/CommonUtils"
import {sceneIds} from "../../../App/app_ailive/AppGlobal"
import default_horizontal_icon from "../../../images/pages_ailive/default_horizontal_icon.jpg";
import channel_arrow_down from "../../../images/pages_ailive/channel_arrow_down.png"
import imageLoad  from "../../../common/ImageLoad"
import jx_category_clean_icon_unfocus from "../../../images/pages_ailive/jx_category_clean_icon_unfocus.png"
import jx_category_finish_icon_unfocus from "../../../images/pages_ailive/jx_category_finish_icon_unfocus.png"

class View extends AbstractView {
    constructor() {
        super();
        this.windowListView = new windowListView();
        this.categoryListView = new categoryListView();
        this.pageElementType = {
            CATEGORY: "category",//分类
            CHANNEL: "channel", //频道
            OPERATE: "operate" //操作
        };
        this.isEdited = false;
        this.playListLocationInfo = {categoryCode:null,location:null,offset:null}; //当前播放频道的在列表中的位置信息
    }

    viewUpdateData() {
        super.viewUpdateData();
        let param = window.WebApp.Nav.getNavParams(sceneIds.CHANNEL_MINI_SCENE_ID);

        let categoryCode = param.categoryCode;
        categoryCode = categoryCode===Config.mCollectionCode?defaultLiveCode:categoryCode;
        categoryCode = categoryCode===null?model.getCategoryList()[0].Code:categoryCode;
        let selectedCategory = model.getCategoryByCode(categoryCode);
        model.setSelectedCategory(selectedCategory);


        let channelCode = param.channelCode;
        channelCode = channelCode===null?model.getChannelList()[0].ChannelCode:channelCode;
        let theOffset = this.windowListView.getOffsetBySelectedChannelCode(channelCode);
        this.windowListView.setOffset(theOffset);

        this.categoryListView.viewUpdateData();
        this.windowListView.viewUpdateData();
        let location = this.getInitLocationByChannelCode(channelCode);
        focusManage.setFocusLocation(location);
    }

    viewPage() {
        super.viewPage();
        if(ChannelPay.isNeedPay) {
            showChannelPayTips();
        }
        this.categoryListView.viewPage();
        this.windowListView.viewPage();
        document.getElementById("channel_mini_down_arrow_id").src=channel_arrow_down;
        this.dealMinTabShow();

        let selectedCategoryCode = model.selectedCategory.Code;
        let theId = this.getIdByCategoryCode(selectedCategoryCode);
        let theOb = document.getElementById(theId);
        addClass(theOb, "selected");

        document.getElementById("live_save_clean_icon_id").src=jx_category_clean_icon_unfocus;
        document.getElementById("live_save_finish_icon_id").src=jx_category_finish_icon_unfocus;
    }

    getInitLocationByChannelCode(code){
        let list = view.windowListView.getChannelList();
        for(let i=0;i<list.length;i++){
            if(list[i].ChannelCode===code){
                return {x:i,y:0};
            }
        }
        return {x:0,y:0};
    }

    openEdited(){
        this.isEdited = true;
        document.getElementById("live_collection_div_id").style.display="block";
        document.getElementById("mini_collection_edit_function_tip_id").style.display="none";
        let delImgObs = document.getElementsByClassName("channel_mini_collection_del");
        for(let i=0;i<delImgObs.length;i++){
            delImgObs[i].style.display="block";
        }
        let topNumbers = document.getElementsByClassName("top_number");
        for(let i=0;i<topNumbers.length;i++){
            topNumbers[i].style.display="none";
        }
    }

    isCollection(){
        if(model.getSelectedCategory().Code===CommonConfig.mCollectionCode){
            return true;
        }else{
            return false;
        }
    }

    closeEdited(){
        this.isEdited = false;
        if(!this.windowListView.isEmpty() && view.isCollection()){
            document.getElementById("mini_collection_edit_function_tip_id").style.display="block";
        }else{
            document.getElementById("mini_collection_edit_function_tip_id").style.display="none";
        }
        document.getElementById("live_collection_div_id").style.display="none";
        let delImgObs = document.getElementsByClassName("channel_mini_collection_del");
        for(let i=0;i<delImgObs.length;i++){
            delImgObs[i].style.display="none";
        }
        let topNumbers = document.getElementsByClassName("top_number");
        for(let i=0;i<topNumbers.length;i++){
            topNumbers[i].style.display="block";
        }
    }

    getPageElementTypeByLocation(location){
        if(location.y===0){
            return this.pageElementType.CHANNEL;
        }else if(location.y===-1){
            return this.pageElementType.OPERATE;
        }else{
            return this.pageElementType.CATEGORY;
        }
    }

    getIdByLocation(location){
        let type = this.getPageElementTypeByLocation(location);
        if(type===this.pageElementType.CHANNEL){
            return "channel-mini-window_"+location.x;
        }else if(type===this.pageElementType.CATEGORY){
            return "channel_mini_category_id_"+location.x;
        }else{
            if(location.x===0){
                return "live_save_clean_div_id";
            }else{
                return "live_save_finish_div_id";
            }
        }
    }

    getIdByCategoryCode(code){
        for(let i=0;i<this.categoryListView.showCategoryList.length;i++){
            if(this.categoryListView.showCategoryList[i].Code===code){
                return "channel_mini_category_id_"+i;
            }
        }
        JxLog.e([LogType.PAGE], "Page/pages_ailive/ChannelMiniPage/getIdByCategoryCode",
            ["未找到指定分类的Dom ID", code]);
        return "channel_mini_category_id_0";
    }

    getDataByLocation(location){
        let type = this.getPageElementTypeByLocation(location);
        if(type===this.pageElementType.CHANNEL){
            return view.windowListView.channelList[location.x];
        }else if(type===this.pageElementType.CATEGORY){
            return view.categoryListView.showCategoryList[location.x];
        }
    }

    onLeftBorder(){
        let location = focusManage.getFocusLocation();
        let type = this.getPageElementTypeByLocation(location);
        if(type===this.pageElementType.CHANNEL){
            view.windowListView.onLeftBorder();
        }else if(type===this.pageElementType.CATEGORY){
            view.categoryListView.onLeftBorder();
        }else{
            if(location.x===1){
                let id = view.getIdByLocation(location);
                let ob = document.getElementById(id);
                addClass(ob, "unFocus");
                removeClass(ob, "focus");
                location.x =0;
                focusManage.setFocusLocation(location);
                focusManage.nodeUpdate();
                focusManage.nodeFocus();
            }
        }
    }

    onRightBorder(){
        let location = focusManage.getFocusLocation();
        let type = this.getPageElementTypeByLocation(location);
        if(type===this.pageElementType.CHANNEL){
            view.windowListView.onRightBorder();
        }else if(type===this.pageElementType.CATEGORY){
            view.categoryListView.onRightBorder();
        }else{
            if(location.x===0){
                let id = view.getIdByLocation(location);
                let ob = document.getElementById(id);
                addClass(ob, "unFocus");
                removeClass(ob, "focus");
                location.x =1;
                focusManage.setFocusLocation(location);
                focusManage.nodeUpdate();
                focusManage.nodeFocus();
            }
        }
    }

    dealMinTabShow(){
        if(OTTConfig.isShowMinProgramTab()){
            let obs = document.getElementsByClassName("min_tab_height_set");
            for(let i=0;i<obs.length;i++){
                obs[i].style.height = "202px";
            }
        }
    }

    destroy(){
        super.destroy();
        document.getElementById("mini_collection_edit_function_tip_id").style.display="none";
        this.closeEdited();
        this.windowListView.destroy();
    }

    updatePlayListLocationInfo(){
        let categoryInfo = model.getSelectedCategory();
        let location = JSON.stringify(focusManage.getFocusLocation());
        let offset = this.windowListView.offset;
        this.playListLocationInfo = {categoryCode:categoryInfo.Code,location:JSON.parse(location),offset:offset};
    }

    getPlayListLocationInfo(){
        return this.playListLocationInfo;
    }
}

class windowListView extends AbstractListView{
    constructor() {
        super("channel_mini_scene_pic_windows_id");
        this.contentSize = 6;
        this.offset = 0; //channelList在全部频道中的偏移量
        this.channelList = []; //显示的频道列表
    }

    getContentSize(){
        return this.contentSize;
    }

    getChannelListCount(){
        return this.channelList.length;
    }

    getOffset() {
        return this.offset;
    }

    setOffset(x) {
        this.offset = x;
    }

    getChannelList() {
        return this.channelList;
    }

    setChannelList(info) {
        this.channelList = info;
    }

    viewUpdateData() {
        let channelList = this.getShowChannelListByOffset();
        this.setChannelList(channelList);
    }

    viewPage() {
        super.viewPage();
        this.viewPageImg();
        if(!OTTConfig.showChannelName()) {
            let ele = document.getElementById("channel_mini_scene_pic_windows_id");
            if(ele) {
                addClass(ele, "no_channel_name");
            }
        }
        let ob = document.getElementById("mini_collection_edit_function_tip_id");
        ob.style.display = "none";
        if(this.isEmpty()){
            document.getElementById(this.id).innerHTML="<p style='margin-top: 90px;margin-left: 30px;font-size: 30px;color :rgba(255,255,255,0.5);font-family: 'Microsoft YaHei''>暂无收藏节目</p>";
        }
        if(view.isCollection()){
            view.closeEdited();
        }
        view.dealMinTabShow();
    }

    isEmpty(){
        let len = this.channelList.length;
        return len<=0;
    }

    viewPageImg(){
        for(let i=0;i<this.channelList.length;i++){
            let imageUrl = getLiveChannelImageUrl(this.channelList[i]);
            let image = this.channelList[i].ChannelImage ? this.channelList[i].ChannelImage : default_horizontal_icon;
            imageLoad.setBackgroundImg("channel_mini_scene_pic_windows_id_"+i, imageUrl, image);
        }
    }

    getShowChannelListByOffset(){
        let channelList = [];
        let allChannelList = model.getChannelList();
        for(let i = this.offset; i < (this.offset + this.contentSize); i++) {
            if(i < allChannelList.length) {
                channelList.push(allChannelList[i]);
            }
        }
        return channelList;
    }

    getOffsetBySelectedChannelCode(channelCode){
        let allChannelList = model.getChannelList();
        let myOffset =  view.getOffsetValue(allChannelList,"ChannelCode",channelCode,6);
        return myOffset;
    }

    partialViewRefreshByFocusLocation(){
        let numPre = "channel_mini_scene_num_";
        let namePre = "channel_mini_scene_channel_name_";
        let programPre = "channel_mini_scene_program_name_";
        let picPre = "channel_mini_scene_pic_windows_id_";
        for(let i=0;i<this.channelList.length;i++){
            let imageUrl = getLiveChannelImageUrl(this.channelList[i]);
            let numId = numPre+i;
            let nameId = namePre+i;
            let programId = programPre+i;
            let picId = picPre+i;
            let image = this.channelList[i].ChannelImage ? this.channelList[i].ChannelImage : default_horizontal_icon;
            document.getElementById(numId).innerHTML =this.channelList[i].ChannelNo;
            document.getElementById(nameId).innerHTML =this.channelList[i].ChannelName;
            document.getElementById(programId).innerHTML =this.channelList[i].PlayProgramName;
            imageLoad.setBackgroundImg(picId, imageUrl, image);
        }
    }

    onRightBorder(){
        let showChannelListCount = this.getChannelListCount();
        let location = focusManage.getFocusLocation();
        let setSelectedLocation = location.x;
        let moveMode =  view.getListSwitchMode(setSelectedLocation,showChannelListCount,KeyCode.KEY_RIGHT);
        if(moveMode === moveType.FOCUS_MOVE){
            if(location.x+1>=showChannelListCount){
                return ;
            }
            focusManage.lostNotice();
            location.x++;
            focusManage.setFocusLocation(location);
        }else{
            let allChannelList = model.getChannelList();
            if(this.offset+this.contentSize>=allChannelList.length){
                focusManage.lostNotice();
                this.offset = 0;
                location.x = 0;
                focusManage.setFocusLocation(location);
                this.viewUpdateData();
            }else{
                this.offset = this.offset+1;
                this.viewUpdateData();
            }
            if(this.offset>=allChannelList.length){
                return ;
            }
            this.partialViewRefreshByFocusLocation();
        }
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }

    onLeftBorder(){
        let location = focusManage.getFocusLocation();
        let setSelectedLocation = location.x;
        let showChannelListCount = this.getChannelListCount();
        let moveMode =  view.getListSwitchMode(setSelectedLocation,showChannelListCount,KeyCode.KEY_LEFT);
        if(moveMode === moveType.FOCUS_MOVE){
            if(location.x<=0){
                this.focusToFirstOrLastChannel(KeyCode.KEY_LEFT);
                return ;
            }
            focusManage.lostNotice();
            location.x--;
            focusManage.setFocusLocation(location);
        }else{
            if(this.offset<=0){
                let totalListCount = model.getChannelListCount();
                if(totalListCount<=this.contentSize){
                    return;
                }
                this.focusToFirstOrLastChannel(KeyCode.KEY_LEFT);
                return ;
            }
            focusManage.lostNotice();
            this.offset--;
            focusManage.setFocusLocation(location);
            this.viewUpdateData();
            this.partialViewRefreshByFocusLocation();
        }
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }

    //焦点定位到第一个或最后一个频道
    focusToFirstOrLastChannel(type) {
        let location = focusManage.getFocusLocation();
        focusManage.lostNotice();
        let allChannel = model.getChannelList();
        let len = allChannel.length;
        if(type == KeyCode.KEY_LEFT) {
            location.x = this.contentSize-1;
            this.offset = len - this.contentSize;
        } else if(type == KeyCode.KEY_RIGHT) {
            location.x = 0;
            this.offset = 0;
        }
        focusManage.setFocusLocation(location);
        this.viewUpdateData();
        this.partialViewRefreshByFocusLocation();
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }

    destroy(){
        super.destroy();
        this.setOffset(0);
    }
}

 class categoryListView extends AbstractListView {
    constructor() {
        super("channel_mini_category_list_id");
        this.showCategoryList = [];
        this.contentSize = 6;
        this.offset = 0; //channelList在全部频道中的偏移量
    }


    viewUpdateData() {
        this.showCategoryList = this.getShowListByOffset();
    }


    getLocationInShowByCategoryCode(code){
        for(let i=0;i<this.showCategoryList.length;i++){
            if(this.showCategoryList[i].Code ===code){
                return i;
            }
        }
        JxLog.e([LogType.PAGE], "Page/pages_ailive/ChannelMiniPage/getLocationInShowByCategoryCode",
            ["返回值异常", code]);
        return 0;
    }

     onLeftBorder(){
         let location = focusManage.getFocusLocation();
         let setSelectedLocation = location.x;
         let showListCount = this.showCategoryList.length;
         let moveMode =  view.getListSwitchMode(setSelectedLocation,showListCount,KeyCode.KEY_LEFT);
         if(moveMode === moveType.FOCUS_MOVE){
             if(location.x<=0){
                 this.focusToFirstOrLastChannel(KeyCode.KEY_LEFT);
                 return ;
             }
             focusManage.lostNotice();
             location.x--;
             focusManage.setFocusLocation(location);
         }else{
             if(this.offset<=0){
                 this.focusToFirstOrLastChannel(KeyCode.KEY_LEFT);
                 return ;
             }
             focusManage.lostNotice();
             this.offset--;
             focusManage.setFocusLocation(location);
             this.viewUpdateData();
             this.viewPage();
         }
         focusManage.nodeUpdate();
         focusManage.nodeFocus();
     }

     onRightBorder(){
         let showListCount = this.showCategoryList.length;
         let location = focusManage.getFocusLocation();
         let setSelectedLocation = location.x;
         let moveMode =  view.getListSwitchMode(setSelectedLocation,showListCount,KeyCode.KEY_RIGHT);
         if(moveMode === moveType.FOCUS_MOVE){
             focusManage.lostNotice();
             location.x++;
             focusManage.setFocusLocation(location);
         }else{
             let allList = model.getCategoryList();
             if(this.offset+this.contentSize>=allList.length){
                 focusManage.lostNotice();
                 this.offset = 0;
                 location.x = 0;
                 focusManage.setFocusLocation(location);
                 this.viewUpdateData();
             }else{
                 this.offset = this.offset+1;
                 this.viewUpdateData();
             }
             if(this.offset>=allList.length){
                 return ;
             }
             this.viewPage();
         }
         focusManage.nodeUpdate();
         focusManage.nodeFocus();
     }

     //焦点定位到第一个或最后一个频道
     focusToFirstOrLastChannel(type) {
         let location = focusManage.getFocusLocation();
         focusManage.lostNotice();
         let allList = model.getCategoryList();
         let len = allList.length;
         if(type == KeyCode.KEY_LEFT) {
             location.x = len - this.contentSize>=0?this.contentSize-1:len-1;
             this.offset = len - this.contentSize>=0?len - this.contentSize:0;
         } else if(type == KeyCode.KEY_RIGHT) {
             location.x = 0;
             this.offset = 0;
         }
         focusManage.setFocusLocation(location);
         this.viewUpdateData();
         this.viewPage();
         focusManage.nodeUpdate();
         focusManage.nodeFocus();
     }

     getShowListByOffset(){
         let list = [];
         let allList = model.getCategoryList();
         for(let i = this.offset; i < (this.offset + this.contentSize); i++) {
             if(i < allList.length) {
                 list.push(allList[i]);
             }
         }
         return list;
     }

    viewPage() {
        super.viewPage();
    }
}

export const view = new View();
export default {view}