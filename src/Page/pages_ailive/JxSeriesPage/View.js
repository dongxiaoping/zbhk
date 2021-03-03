import { AbstractView, AbstractListView } from "../../../Abstract/scene/AbstractView";
import { KeyCode } from "../../../common/FocusModule";
import { sceneIds } from "../../../App/app_ailive/AppGlobal.js";
import { addClass, removeClass} from "../../../common/CommonUtils";
import { moveType } from "../../../common/GlobalConst";
import imageLoad  from "../../../common/ImageLoad"
import { keyEvent } from "./KeyEvent";
import { focusManage } from "./Focus";
import { model } from "./Model";
import Subscribe from "../../../common/UserSubscribe";
import default_horizontal_icon from "../../../images/pages_ailive/default_horizontal_icon.jpg";

class View extends AbstractView {
    constructor() {
        super();
        this.categoryProgramView = new categoryProgramView();
        this.jxSeriesView = new jxSeriesView();
        this.pageParamType = {SUB: 1, SERIES_LIST: 2}
    }
    viewUpdateData() {
        super.viewUpdateData();
        let focusLocation = this.getInitLocationByPlayInfo();
        focusManage.setFocusLocation(focusLocation);
        this.jxSeriesView.viewUpdateData();
        this.categoryProgramView.viewUpdateData();
    }

    getPageParamTypeByLocation(location){
        if(location.y === 0){
            return this.pageParamType.SUB;
        }else{
            return this.pageParamType.SERIES_LIST;
        }
    }

    getIdByFocusLocation(focusLocation){
        let pageParamType = view.getPageParamTypeByLocation(focusLocation);
        if(pageParamType === view.pageParamType.SERIES_LIST){
            return "jx_series_item_"+focusLocation.x;
        }else if(pageParamType === view.pageParamType.SUB){
            return "subscribe_show";
        }
    }

    getInitLocationByPlayInfo(){
        let playInfo = model.getPlayInfo();
        let scheduleCode = playInfo.scheduleCode;
        let theOffset = this.jxSeriesView.getOffsetByScheduleCode(scheduleCode);
        this.jxSeriesView.setOffset(theOffset);
        let selectedSeries = model.getSeriesByScheduleCode(scheduleCode);
        let seriesList = this.jxSeriesView.getShowSeriesListByOffset();
        this.jxSeriesView.setSeriesList(seriesList);
        let location = this.jxSeriesView.getLocationInShowSeriesList(selectedSeries);
        let focusLocation = {x:location,y:1};
        return focusLocation;
    }

    viewPage() {
        super.viewPage();
        this.categoryProgramView.viewPage();
        this.jxSeriesView.viewPage();
    }

    destroy() {
        super.destroy();
        this.categoryProgramView.destroy();
        this.jxSeriesView.destroy();
        focusManage.lostNotice();
    }
}
//精选分类及节目名称信息
class categoryProgramView extends AbstractListView {
    constructor() {
        super("category_program_show");
        this.categoryProgramInfo = null;
    }
    viewUpdateData() {
        this.categoryProgramInfo = model.getJxCategoryData();
    }
    viewPage() {
        super.viewPage();
    }
}
//精选剧集列表信息
class jxSeriesView extends AbstractListView {
    constructor() {
        super("jx_series_list");
        this.contentSize = 5;
        this.offset = 0;
        this.itemIdPrefix = "jx_series_item_";
        this.seriesList = []; //显示的剧集列表
        this.selectedSeries = null;
    }
    //更新数据
    viewUpdateData() {
        this.seriesList = this.getShowSeriesListByOffset();
    }
    //视图展现
    viewPage() {
        super.viewPage();
        this.viewPageSub();
        this.viewPageImg();
        this.addPlayingSeriesStyle();
        this.setLeftRightArrowShow();
    }
    //追剧按钮展现（不同状态）
    viewPageSub() {
        let subOb = document.getElementById("subscribe_show");
        let labelOb = document.getElementById("jx_series_sub_tip");
        if(Subscribe.isSubscribed()){
            labelOb.innerHTML = "已追剧";
            addClass(subOb, "has_sub");
        }else{
            labelOb.innerHTML = "追剧";
            removeClass(subOb, "has_sub");
        }
    }
    //图片加载
    viewPageImg(){
        for(let i=0; i<this.seriesList.length; i++) {
            imageLoad.setBackgroundImg("jx_series_item_"+i, this.seriesList[i].seriesImgUrl, default_horizontal_icon);
        }
    }
    getDataByFocusLocation(location){
        return  this.seriesList[location.x];
    }
    getLocationInShowSeriesList(selectedSeries){
        let id = selectedSeries.Id;
        for(let i=0;i<this.seriesList.length;i++){
            if(this.seriesList[i].Id===id){
                return i;
            }
        }
        return null;
    }
    setOffset(x) {
        this.offset = x;
    }
    setSeriesList(info) {
        this.seriesList = info;
    }
    getSeriesList() {
        return this.seriesList;
    }
    getItemListCount() {
        return this.seriesList.length;
    }
    getSelectedItem() {
        return this.selectedSeries;
    }
    setSelectedItem(series) {
        this.selectedSeries = series;
    }
    getSelectItemLocation() {
        let seriesList = this.getSeriesList();
        if (this.selectedSeries) {
            for (let i = 0; i < seriesList.length; i++) {
                if (seriesList[i].ScheduleCode == this.selectedSeries.ScheduleCode) {
                    return i;
                }
            }
        }
        return 0;
    }
    getShowSeriesListByOffset() {
        let allSeries = model.getJxSeriesData();
        let seriesList = [];
        if (allSeries) {
            for (let i = this.offset; i < (this.offset + this.contentSize); i++) {
                if (i < allSeries.length) {
                    seriesList.push(allSeries[i]);
                }
            }
        }
        return seriesList;
    }
    getOffsetByScheduleCode(scheduleCode) {
        let offset = 0;
        let allSeries = model.getJxSeriesData();
        let len = allSeries.length;
        for (let i = 0; i < len; i++) {
            if (allSeries[i].ScheduleCode == scheduleCode) {
                offset = view.getOffsetByIndex(i, len, this.contentSize);
                return offset
            }
        }
        return offset;
    }
    //正在播放的剧集，加上选中样式
    addPlayingSeriesStyle(flag=false) {
        let playInfo = null;
        if(!flag) {
            playInfo = model.getPlayInfo();
        } else {
            playInfo = window.WebApp.getNowPlayInfo();
        }
        for (let i = 0; i < this.seriesList.length; i++) {
            let ele = document.getElementById(this.itemIdPrefix + i);
            if (ele) {
                if (this.seriesList[i].ScheduleCode == playInfo.scheduleCode) {
                    addClass(ele, "series_item_select");
                } else {
                    removeClass(ele, "series_item_select");
                }
            }
        }
    }
    //设置左、右箭头的显示和隐藏
    setLeftRightArrowShow() {
        let allSeries = model.jxSeriesData;
        let allLength = allSeries.length;
        let firstSeries = this.seriesList[0];
        let i = 0;
        for (; i < allLength; i++) {
            if (allSeries[i].ScheduleCode == firstSeries.ScheduleCode) {
                break;
            }
        }
        let leftEle = document.getElementById("jx_left_icon");
        let rightEle = document.getElementById("jx_right_icon");
        if (leftEle) {
            if (i > 0) {
                leftEle.style.visibility = "visible";
            } else {
                leftEle.style.visibility = "hidden";
            }
        }
        if (rightEle) {
            if ((i + this.contentSize) < allLength) {
                rightEle.style.visibility = "visible";
            } else {
                rightEle.style.visibility = "hidden";
            }
        }
    }
    //左右键的时候，光标或数据移动
    prevNextOne(keyCode, focusLocation) {
        let totalSeriesListCount = model.getListAllCount();
        let showListCount =  this.getItemListCount();
        let setSelectedLocation = focusManage.getFocusLocation().x +1;
        let moveMode = view.getListSwitchMode(setSelectedLocation-1,showListCount,keyCode);
        if (moveMode == moveType.FOCUS_MOVE) {
            if(keyCode == KeyCode.KEY_LEFT) {
                if(focusLocation.x<0){
                    return;
                }
                focusManage.lostNotice();
                focusLocation.x--;
            } else {
                if(focusLocation.x>=(this.seriesList.length-1)){
                    return;
                }
                focusManage.lostNotice();
                focusLocation.x++;
            }
            focusManage.setFocusLocation(focusLocation);
        } else {
            let newOffset = keyCode == KeyCode.KEY_LEFT ? this.offset-1 : this.offset+1;
            if(newOffset < 0 || (newOffset+this.contentSize) > totalSeriesListCount) {
                return;
            }
            keyCode == KeyCode.KEY_LEFT ? this.offset-- : this.offset++;
            this.viewUpdateData();
            this.partialViewRefreshByFocusLocation();
            this.addPlayingSeriesStyle(true);
            this.setLeftRightArrowShow();
        }
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }
    //部分数据刷新
    partialViewRefreshByFocusLocation() {
        for(let i=0; i<this.seriesList.length; i++){
            document.getElementById("jx_series_name_"+i).innerHTML =this.seriesList[i].fullName;
            imageLoad.setBackgroundImg("jx_series_item_"+i, this.seriesList[i].seriesImgUrl, default_horizontal_icon);
        }
    }
}
export const view = new View();
export default { view }