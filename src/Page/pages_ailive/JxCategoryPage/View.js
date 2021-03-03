import {AbstractView,AbstractListView} from "../../../Abstract/scene/AbstractView"
import {model} from "./Model";
import {KeyCode} from "../../../common/FocusModule";
import {keyEvent} from "./KeyEvent";
import {jxCategoryPageParamType,moveType} from "../../../common/GlobalConst"
import { sceneIds } from "../../../App/app_ailive/AppGlobal.js";
import {addClass, removeClass,hiddenChannelPayTips, getVersion} from "../../../common/CommonUtils"
import imageLoad  from "../../../common/ImageLoad"
import {focusManage} from "./Focus"
import Log from "../../../common/Log"
import ChannelPay from "../../../App/app_ailive/ChannelPay"
import jx_category_clean_icon_unfocus from "../../../images/pages_ailive/jx_category_clean_icon_unfocus.png"
import jx_category_finish_icon_unfocus from "../../../images/pages_ailive/jx_category_finish_icon_unfocus.png"
import jx_category_edit_icon_unfocus from "../../../images/pages_ailive/jx_category_edit_icon_unfocus.png"
import default_horizontal_icon from "../../../images/pages_ailive/default_horizontal_icon.jpg";
import default_vertical_icon from "../../../images/pages_ailive/default_vertical_icon.jpg";

class View extends AbstractView {
    constructor() {
        super();
        this.subListView = new subListView();
        this.doubleListView = new doubleListView();
        this.windowListView = new windowListView();
        this.hasRecommend = false;
    }

    viewUpdateData() {
        super.viewUpdateData();
        this.subListView.viewUpdateData();
        let initPageDataList = model.getInitPageDataList();
        this.doubleListView .setInitPageDataList(initPageDataList);
        this.doubleListView.viewUpdateData();
        this.initLocation();
    }

    viewPage() {
        super.viewPage();
        hiddenChannelPayTips();    //精选分类页面，隐藏付费提示
        let ele = document.getElementById("jx_no_recommend_scene");
        if(ChannelPay.isNeedPay) {
            ele.style.background = "rgba(0, 0, 0, 0.9)";
        } else {
            ele.style.background = "rgba(0, 0, 0, 0.8)";
        }
        this.subListView.viewPage();
        this.doubleListView.viewPage();
        let location = focusManage.getFocusLocation();
        view.doubleListView.partialViewRefreshByFocusLocation(location,true);
        document.getElementById("no_recommend_jx_category_clean_icon_id").src=jx_category_clean_icon_unfocus;
        document.getElementById("no_recommend_jx_category_finish_icon_id").src=jx_category_finish_icon_unfocus;
        document.getElementById("no_recommend_jx_category_edit_icon_id").src=jx_category_edit_icon_unfocus;
        document.getElementById("version_num_id").innerHTML = "版本号："+getVersion();
        this.subListView.closeEdited();
    }

    initLocation(){
        let subList = this.subListView.getSubProgramList();
        let location = {x:0,y:1};
        if(subList.length>0){
            location = {x:0,y:0};
        }
        let params = window.WebApp.Nav.getNavParams(sceneIds.JX_CATEGORY_SCENE_ID);
        if(params!==null){
            let categoryCode = params.categoryCode;
            let programName = params.programName;
            location = model.getLocationByCategoryAndProgramName(categoryCode,programName);
        }
        let setY  = location.y;
        if(this.doubleListView.contentSize<(location.x+1)){
            this.doubleListView.offSet[setY-1] = location.x+1 - this.doubleListView.contentSize;
            location.x = this.doubleListView.contentSize-1;
        }
        focusManage.setFocusLocation(location);
    }

    isHasRecommend(){
        return this.hasRecommend;
    }

    //根据传入的focusLocation，修改页面的top值来改变页面的显示区域
    setPageShowByTop(focusLocation){
        let obOperate = document.getElementById("no_recommend_jx_sub_operate_div_id");
        let obSub = document.getElementById("no_recommend_schedule_category_sub_list_id");
        let obDoubleList = document.getElementById("no_recommend_schedule_category_double_list_id");
        let topLb = document.getElementById("no_recommend_top_channel_mini_scene_pic_windows_id");
        let subTop = "380px";
        if(view.subListView.isSubEmpty()){
            subTop = "270px";
        }
        if(focusLocation.y<=2){
            obOperate.style.display="block";
            obSub.style.display="block";
            topLb.style.display="block";
            obDoubleList.style.top = subTop;
            document.getElementById("version_num_id").style.display="block";
            return ;
        }
        obOperate.style.display="none";
        document.getElementById("version_num_id").style.display="none";
        obSub.style.display="none";
        topLb.style.display="none";
        let topValue = 0;
        let setY = (focusLocation.y-3);
        if(this.isHasRecommend()){
            let subHeightValue = 230;
            let commendHeightValue = 447;
            let setValue = commendHeightValue;
            for(let i=0;i<setY;i++){
                topValue = topValue+setValue;
                setValue = setValue==subHeightValue?commendHeightValue:subHeightValue;
            }
            obDoubleList.style.top = -topValue+"px";
        }else{
            let subHeightValue = 280;
            let commendHeightValue = 280;
            let setValue = commendHeightValue;
            for(let i=0;i<setY;i++){
                topValue = topValue+setValue;
                setValue = setValue==subHeightValue?commendHeightValue:subHeightValue;
            }
            obDoubleList.style.top = -topValue+"px";
        }
    }

    getIdByLocation(location){
        let x = location.x;
        let y= location.y;
        let isEdited = this.subListView.getEditStatus();
        if(y===-1&&!isEdited){
            return "no_recommend_jx_category_edit_div_id";
        }else if(y===-1&&isEdited){
            if(x===0){
                return "no_recommend_jx_category_clean_div_id";
            }else{
                return "no_recommend_jx_category_finish_div_id";
            }
        }
        if(y===0){
            return "no_recommend_schedule_category_sub_windows_id_"+x;
        }
        y=y-1;
        if(this.isHasRecommend()){
            let preFix = "no_recommend_schedule_category_recommend_id_";
            if(y%2===0){
                preFix = "no_recommend_schedule_category_windows_id_";
            }
            y=parseInt(y/2);
            return preFix+y+"_"+x;
        }else{
            let preFix = "no_recommend_schedule_category_windows_id_";
            return preFix+y+"_"+x;
        }
    }

    getIdPreByDataLocation(location){
        let x = location.x;
        let y= location.y;
        if(y==0){
            return null;
        }
        y=y-1;
        if(view.isHasRecommend()){
            let preFix = "no_recommend_schedule_category_recommend_id_";
            if(y%2==0){
                preFix = "no_recommend_schedule_category_windows_id_";
            }
            y=parseInt(y/2);
            return preFix+y;
        }else{
            let preFix = "no_recommend_schedule_category_windows_id_";
            return preFix+y;
        }

    }

    destroy(){
        super.destroy();
        this.subListView.destroy();
    }
}

class subListView extends AbstractListView {
    constructor() {
        super("no_recommend_schedule_category_sub_list_id");
        this.showSubProgramList = [];
        this.contentSize = 6;
        this.offSet = 0; //显示部分在整个数据中的偏移量，从0算起
        this.isEdited = false;
    }


    getSubProgramList(){
        return this.showSubProgramList;
    }

    viewUpdateData() {
        let subscribeList = model.getSubscribeList();
        let newShowSubProgramList = [];
        let totalCount = subscribeList.length;
        for(let i = this.offSet;i< this.offSet+this.contentSize;i++){
            if(i>=totalCount){
                break;
            }
            newShowSubProgramList.push(subscribeList[i]);
        }
        this.showSubProgramList = newShowSubProgramList;
    }

    viewPage() {
        super.viewPage();
        if(this.isSubEmpty()){
            document.getElementById(this.id).innerHTML="<p style='margin-top: 30px;margin-left: 55px;font-size: 30px;color :rgba(255,255,255,0.5);font-family: 'Microsoft YaHei''>暂无追剧节目</p>";
        }
        if(this.isEdited){
            this.openEdited();
        }else{
            this.closeEdited();
        }
        this.viewPageImg();
    }

    viewPageImg(){
        for(let i=0;i<this.showSubProgramList.length;i++){
            imageLoad.setBackgroundImg("no_recommend_schedule_category_sub_windows_id_"+i,this.showSubProgramList[i].ImageUrl,default_horizontal_icon);
        }
    }

    closeEdited(){
        this.isEdited = false;
        if(this.isSubEmpty()){
            document.getElementById("no_recommend_jx_sub_edit_function_tip_id").style.display="none";
        }else{
            document.getElementById("no_recommend_jx_sub_edit_function_tip_id").style.display="block";
        }
        document.getElementById("no_recommend_jx_category_edit_div_id").style.display="block";
        document.getElementById("no_recommend_jx_sub_edit_div_id").style.display="none";
        document.getElementById("no_recommend_jx_category_clean_div_id").style.display="none";
        document.getElementById("no_recommend_jx_category_finish_div_id").style.display="none";
        for(let i=0;i<6;i++){
            let id="no_recommend_schedule_category_sub_windows_id_del_img"+"_"+i;
            let ob = document.getElementById(id);
            if(ob){
                ob.style.display="none";
            }
            let ele = document.getElementById("no_recommend_schedule_category_sub_windows_id_"+i);
            if(ele) {
                removeClass(ele, "sub_edit_status");
            }
        }
    }
    //判断追剧是否为空
    isSubEmpty(){
        return this.showSubProgramList.length<=0;

    }

    updateSubTop(isDestroy=false){
        let ob = document.getElementById("no_recommend_schedule_category_double_list_id");
        if(ob.style.top==="380px"||ob.style.top==="270px"||isDestroy){
            let subTop = "380px";
            if(this.isSubEmpty()){
                subTop = "270px";
            }
            ob.style.top = subTop;
        }
    }

    getDataByFocusLocation(focusLocation){
        let locationIndex = focusLocation.x;
        return this.showSubProgramList[locationIndex];
    }


    openEdited(){
        this.isEdited = true;
        document.getElementById("no_recommend_jx_sub_edit_function_tip_id").style.display="none";
        document.getElementById("no_recommend_jx_category_edit_div_id").style.display="none";
        document.getElementById("no_recommend_jx_sub_edit_div_id").style.display="block";
        document.getElementById("no_recommend_jx_category_clean_div_id").style.display="block";
        document.getElementById("no_recommend_jx_category_finish_div_id").style.display="block";

        for(let i=0;i<6;i++){
            let id="no_recommend_schedule_category_sub_windows_id_del_img_"+i;
            let ob = document.getElementById(id);
            if(ob){
                ob.style.display="block";
            }
            let ele = document.getElementById("no_recommend_schedule_category_sub_windows_id_"+i);
            if(ele) {
                addClass(ele, "sub_edit_status");
            }
        }
    }

    getEditStatus(){
        return this.isEdited;
    }


    getShowSubscribeLocationInTotal(){
        let showSubscribeList = model.getSubscribeList();
        let focusLocation = focusManage.getFocusLocation();
        let selectedData = this.getDataByFocusLocation(focusLocation);
        for(let i=0;i<showSubscribeList.length;i++){
            if(showSubscribeList[i].categoryCode ==selectedData.categoryCode&&showSubscribeList[i].keyname==selectedData.keyname){
                return i;
            }
        }
        return 0;
    }

    onLeftBorder(focusLocation){
        let theJxCategoryPageParamType = model.getPageParamTypeByLocation(focusLocation);
        if(theJxCategoryPageParamType===jxCategoryPageParamType.SUB){
            let totalSubscribeList = model.getSubscribeList();
            let totalSubscribeListCount = totalSubscribeList.length;
            let showSubscribeListCount = view.subListView.showSubProgramList.length;
            let setOffset = view.subListView.offSet+1;
            let setSelectedLocation = focusLocation.x+1;
            let moveMode =  view.getListSwitchMode(setSelectedLocation-1,showSubscribeListCount,KeyCode.KEY_LEFT);
            if(moveMode === moveType.FOCUS_MOVE){
                focusManage.lostNotice();
                let location = focusManage.getFocusLocation();
                location.x--;
                focusManage.setFocusLocation(location);
            }else{
                if(view.subListView.offSet<=0){
                    return ;
                }
                view.subListView.offSet--;
                view.subListView.viewUpdateData();
                view.subListView.viewPage();
            }
        }else if(theJxCategoryPageParamType===jxCategoryPageParamType.OPERATE){
            if(focusLocation.x===1){
                let id = view.getIdByLocation(focusLocation);
                let ob = document.getElementById(id);
                addClass(ob, "unFocus");
                removeClass(ob, "focus");
                focusLocation.x =0;
                focusManage.setFocusLocation(focusLocation);
            }
        }
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }

    onRightBorder(focusLocation){
        let theJxCategoryPageParamType = model.getPageParamTypeByLocation(focusLocation);
        if(theJxCategoryPageParamType===jxCategoryPageParamType.OPERATE){
            if(focusLocation.x===0){
                let id = view.getIdByLocation(focusLocation);
                let ob = document.getElementById(id);
                addClass(ob, "unFocus");
                removeClass(ob, "focus");
                focusLocation.x =1;
                focusManage.setFocusLocation(focusLocation);
            }
        }else if(theJxCategoryPageParamType===jxCategoryPageParamType.SUB){
            let totalSubscribeList = model.getSubscribeList();
            let totalSubscribeListCount = totalSubscribeList.length;
            let showSubscribeListCount = view.subListView.showSubProgramList.length;
            let setOffset = view.subListView.offSet+1;
            let setSelectedLocation = focusLocation.x+1;
            let moveMode =  view.getListSwitchMode(setSelectedLocation-1,showSubscribeListCount,KeyCode.KEY_RIGHT);
            if(moveMode === moveType.FOCUS_MOVE){
                let location = focusManage.getFocusLocation();
                if(location.x+1>=showSubscribeListCount){
                    return;
                }
                focusManage.lostNotice();
                location.x++;
                focusManage.setFocusLocation(location);
                view.subListView.viewUpdateData();
            }else{
                if(showSubscribeListCount<view.subListView.contentSize){
                    return;
                }
                if( view.subListView.offSet+this.contentSize>=totalSubscribeListCount){
                    return;
                }
                view.subListView.offSet++;
                view.subListView.viewUpdateData();
                view.subListView.viewPage();
            }
        }
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }
}

class doubleListView extends AbstractListView {
    constructor() {
        super("no_recommend_schedule_category_double_list_id");
        this.initPageDataList = [];
        this.offSet = []; //而每一行的显示数据在整个数据中的偏移量的集合,从0起，包含分类行以及点播行（不包含追剧）
        this.contentSize = 6;
    }

    viewUpdateData() {

    }

    viewPage() {
        super.viewPage();
    }

    setInitPageDataList(initPageDataList){
        this.initPageDataList = initPageDataList;
    }

    initOffSet(dataList){
        this.offSet = dataList;
    }

    getInitPageDataList(){
        return this.initPageDataList;
    }

    getDataByFocusLocation(focusLocation){
        let showList = this.getShowList(focusLocation);
        return showList[focusLocation.x];
    }


    getListInRowByFocusLocation(focusLocation){
        let theJxCategoryPageParamType = model.getPageParamTypeByLocation(focusLocation);
        let categoryInfo = model.getCategoryInfoByLocation(focusLocation);
        if(theJxCategoryPageParamType == jxCategoryPageParamType.SUB){
            return view.subListView.getSubProgramList();
        }
        if(categoryInfo===null){
            return null;
        }
        let categoryCode = categoryInfo.Code;
        let list = model.getListByCategory(categoryCode,theJxCategoryPageParamType);
        return list;
    }

    /* 通过焦点位置更新局部列的页面显示
     * */
    partialViewRefreshByFocusLocation(focusLocation,isInitRefresh=false){
        let obId = view.getIdPreByDataLocation(focusLocation);
        if(obId===null){
            return ;
        }
        let categoryInfo = model.getCategoryInfoByLocation(focusLocation);
        let pageEleType = model.getPageParamTypeByLocation(focusLocation);
        let showList = this.getShowList(focusLocation);
        if(showList===null){
            return ;
        }
        if(pageEleType===jxCategoryPageParamType.CATEGORY){
            for(let i=0;i<this.initPageDataList.length;i++){
                    if(this.initPageDataList[i].code ===categoryInfo.Code){
                        if(this.initPageDataList[i].isScheduleInit&&isInitRefresh){
                            return ;
                        }else{
                            this.initPageDataList[i].isScheduleInit = true;
                        }
                        break;
                    }
            }
            let showLen = showList.length;
            for(let i=0;i<this.contentSize;i++){
                let setObId = obId+"_"+i;
                if(i>=showLen){
                    document.getElementById(setObId).style.display="none";
                }else{
                    let nameId = setObId+"_name";
                    let seriesId = setObId+"_series";
                    let newSeries = showList[i].schedules[0].Name;
                    imageLoad.setBackgroundImg(setObId,showList[i].ImageUrl,default_horizontal_icon);
                    document.getElementById(nameId).innerHTML =showList[i].keyname;
                    document.getElementById(seriesId).innerHTML ="更新至"+ newSeries;
                }
            }
            return ;
        }

        if(pageEleType===jxCategoryPageParamType.RECOMMEND){
            for(let i=0;i<this.initPageDataList.length;i++){
                if(this.initPageDataList[i].code ===categoryInfo.Code){
                    if(this.initPageDataList[i].isRecommendInit&&isInitRefresh){
                        return ;
                    }else{
                        this.initPageDataList[i].isRecommendInit = true;
                    }
                    break;
                }
            }
            for(let i=0;i<showList.length;i++){
                let setObId = obId+"_"+i;
                let nameId = setObId+"_name";
                let seriesId = setObId+"_series";
                let updateEpisodeNum = showList[i].updateEpisodeNum;
                let scoreId = setObId+"_score";
                let picAddr = showList[i].poster;
                document.getElementById(nameId).innerHTML =showList[i].name;
                document.getElementById(seriesId).innerHTML ="更新至"+ updateEpisodeNum;
                document.getElementById(scoreId).innerHTML =showList[i].rating;
                imageLoad.setBackgroundImg(setObId,picAddr,default_vertical_icon);
            }
            return;
        }
    }

    getShowList(focusLocation){
        let theJxCategoryPageParamType = model.getPageParamTypeByLocation(focusLocation);
        if(theJxCategoryPageParamType === jxCategoryPageParamType.SUB){
            return view.subListView.getSubProgramList();
        }
        let allListInRow;
        allListInRow = this.getListInRowByFocusLocation(focusLocation);
        if(allListInRow === null||allListInRow===undefined){
            return null;
        }
        let allLen = allListInRow.length;
        let rowOffsetIndex = this.getRowOffsetIndexByFocusLocation(focusLocation);
        let rowOffset = this.offSet[rowOffsetIndex];
        let showList = [];
        for(let i=rowOffset;i<rowOffset+this.contentSize;i++){
            if(i<allLen){
                showList.push(allListInRow[i]);
            }
        }
        return showList;
    }

    getRowOffsetIndexByFocusLocation(focusLocation){
        let rowOffsetIndex = (focusLocation.y-1);
        return rowOffsetIndex;
    }

    onRightBorder(focusLocation){
        let theJxCategoryPageParamType = model.getPageParamTypeByLocation(focusLocation);
        let categoryInfo= model.getCategoryInfoByLocation(focusLocation);
        if(categoryInfo===null){
            return ;
        }
        let categoryCode = categoryInfo.Code;

        let totalList = model.getListByCategory(categoryCode,theJxCategoryPageParamType);
        let showList = this.getShowList(focusLocation);

        let totalCount = totalList.length;
        let showCount = showList.length;
        let rowOffsetIndex = this.getRowOffsetIndexByFocusLocation(focusLocation);
        let setOffset = this.offSet[rowOffsetIndex]+1;
        let setSelectedLocation = focusLocation.x+1;
        let moveMode =  view.getListSwitchMode(setSelectedLocation-1,showCount,KeyCode.KEY_RIGHT);
        if(moveMode === moveType.FOCUS_MOVE){
            if(focusLocation.x+1>=showCount){
                return;
            }
            focusManage.lostNotice();
            focusLocation.x=focusLocation.x+1;
            focusManage.setFocusLocation(focusLocation);
        }else{
            let rowOffsetIndex = this.getRowOffsetIndexByFocusLocation(focusLocation);
            if( this.offSet[rowOffsetIndex]+this.contentSize>=totalList.length){
                return;
            }
            this.offSet[rowOffsetIndex]++;
            this.partialViewRefreshByFocusLocation(focusLocation);
        }
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }

    onLeftBorder(focusLocation){
        let theJxCategoryPageParamType = model.getPageParamTypeByLocation(focusLocation);
        let categoryInfo= model.getCategoryInfoByLocation(focusLocation);
        if(categoryInfo===null){
            return ;
        }
        let categoryCode = categoryInfo.Code;
        let totalList = model.getListByCategory(categoryCode,theJxCategoryPageParamType);
        let showList = this.getShowList(focusLocation);
        let totalCount = totalList.length;
        let showCount = showList.length;
        let rowOffsetIndex = this.getRowOffsetIndexByFocusLocation(focusLocation);
        let setSelectedLocation = focusLocation.x+1;
        let moveMode =  view.getListSwitchMode(setSelectedLocation-1,showCount,KeyCode.KEY_LEFT);
        if(moveMode === moveType.FOCUS_MOVE){
            focusManage.lostNotice();
            focusLocation.x=focusLocation.x-1;
            focusManage.setFocusLocation(focusLocation);
        }else{
            let setOffset = this.offSet[rowOffsetIndex];
            if(setOffset<=0){
                return ;
            }
            this.offSet[rowOffsetIndex]--;
            this.partialViewRefreshByFocusLocation(focusLocation);
        }
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }
}

class windowListView extends AbstractListView{
    constructor() {
        super("no_recommend_top_channel_mini_scene_pic_windows_id");
        this.channelList = []; //显示的频道列表
    }

    viewUpdateData() {
        this.channelList = model.getChannelList();
    }

    viewPage() {
        super.viewPage();
        this.viewPageImg()
    }

    viewPageImg(){
        for(let i=0;i<this.channelList.length;i++){
            imageLoad.setBackgroundImg("no_recommend_top_channel_mini_scene_pic_windows_id_"+i,this.channelList[i].ImageUrl,default_horizontal_icon);
        }
    }
}

export const view = new View();
export default {view}