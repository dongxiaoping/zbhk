import { AbstractView, AbstractListView } from "../../../Abstract/scene/AbstractView";
import { KeyCode } from "../../../common/FocusModule";
import {moveType,mediaType, seekButtonType} from "../../../common/GlobalConst";
import { addClass, removeClass} from "../../../common/CommonUtils";
import imageLoad  from "../../../common/ImageLoad"
import { sceneIds } from "../../../App/app_ailive/AppGlobal.js";
import { keyEvent } from "./KeyEvent";
import { focusManage } from "./Focus";
import { model } from "./Model";
import default_horizontal_icon from "../../../images/pages_ailive/default_horizontal_icon.jpg";

class View extends AbstractView {
    constructor() {
        super();
        this.schDateView = new schDateView();
        this.schProgramView = new schProgramView();
    }
    viewUpdateData() {
        super.viewUpdateData();
        this.schDateView.viewUpdateData();
        let focusLocation = this.getInitLocationByPlayInfo();
        focusManage.setFocusLocation(focusLocation);
        this.schProgramView.viewUpdateData();
    }

    getIdByFocusLocation(focusLocation){
        return view.schProgramView.itemIdPrefix + focusLocation.x;
    }

    getInitLocationByPlayInfo(){
        let playInfo = model.getPlayInfo();
        let scheduleCode = playInfo.scheduleCode;
        let theOffset = this.schProgramView.getOffsetByScheduleCode(scheduleCode);
        this.schProgramView.setOffset(theOffset);
        let selectedProgram = model.getProgramByScheduleCode(scheduleCode);
        let programList = this.schProgramView.getShowProgramListByOffset();
        this.schProgramView.setProgramList(programList);
        let location = this.schProgramView.getLocationInShowProgramList(selectedProgram);
        let focusLocation = {x: location, y: 0};
        return focusLocation;
    }

    viewPage() {
        super.viewPage();
        this.schDateView.viewPage();
        this.schProgramView.viewPage();
    }

    destroy() {
        super.destroy();
        this.schDateView.destroy();
        this.schProgramView.destroy();
    }
}

//回看的日期显示
class schDateView extends AbstractListView {
    constructor() {
        super("sch_date_show");
        this.dateShow = {};
    }
    viewUpdateData() {
        this.dateShow = model.getDateShow();
    }
    viewPage() {
        super.viewPage();
    }
}
//回看一天的节目信息
class schProgramView extends AbstractListView {
    constructor() {
        super("sch_program_list");
        this.contentSize = 5;
        this.offset = 0;
        this.itemIdPrefix = "sch_program_item_";
        this.programList = []; //显示的节目列表
        this.dateShow = {};
        this.selectedProgram = null;
    }
    //更新数据
    viewUpdateData() {
        let programList = this.getShowProgramListByOffset();
        this.dateShow = model.getDateShow();
        this.setProgramList(programList);
    }
    //视图展现
    viewPage() {
        super.viewPage();
        this.viewPageImg();
        this.addPlayingProgramStyle();
        this.setLeftRightArrowShow();
    }
    //图片加载
    viewPageImg(){
        for(let i=0; i<this.programList.length; i++) {
            imageLoad.setBackgroundImg("sch_program_item_"+i, this.programList[i].programImgUrl, default_horizontal_icon);
        }
    }
    getDataByFocusLocation(location){
        return this.programList[location.x];
    }
    getLocationInShowProgramList(selectedProgram){
        for(let i=0;i<this.programList.length;i++){
            if(this.programList[i].ScheduleCode === selectedProgram.ScheduleCode){
                return i;
            }
        }
        return null;
    }
    setOffset(x) {
        this.offset = x;
    }
    setProgramList(info) {
        this.programList = info;
    }
    getProgramList() {
        return this.programList;
    }
    getSelectedItem() {
        return this.selectedProgram;
    }
    setSelectedItem(program) {
        this.selectedProgram = program;
    }
    getSelectItemLocation() {
        let programList = this.getProgramList();
        if (this.selectedProgram) {
            for (let i = 0; i < programList.length; i++) {
                if (programList[i].ScheduleCode == this.selectedProgram.ScheduleCode) {
                    return i;
                }
            }
        }
        return 0;
    }
    getItemListCount() {
        return this.programList.length;
    }
    getShowProgramListByOffset() {
        let data = model.getProgramList();
        let programList = [];
        if (data) {
            for (let i = this.offset; i < (this.offset + this.contentSize); i++) {
                if (i < data.length) {
                    programList.push(data[i]);
                }
            }
        }
        return programList;
    }
    getOffsetByScheduleCode(scheduleCode) {
        let data = model.getProgramList();
        let offset = 0;
        if (data) {
            let len = data.length;
            for (let i = 0; i < len; i++) {
                if (data[i].ScheduleCode == scheduleCode) {
                    offset = view.getOffsetByIndex(i, len, this.contentSize);
                    return offset
                }
            }
        }
        return offset;
    }
    //正在播放的节目，加上选中样式
    addPlayingProgramStyle(flag=false) {
        let playInfo = null;
        if(!flag) {
            playInfo = model.getPlayInfo();
        } else {
            playInfo = window.WebApp.getNowPlayInfo();
        }
        for (let i = 0; i < this.programList.length; i++) {
            let ele = document.getElementById(this.itemIdPrefix + i);
            if (ele) {
                if (this.programList[i].ScheduleCode == playInfo.scheduleCode) {
                    addClass(ele, "program_item_select");
                } else {
                    removeClass(ele, "program_item_select");
                }
            }
        }
    }
    //设置左、右箭头的显示和隐藏
    setLeftRightArrowShow() {
        let allProgram = model.getProgramList();
        let allLength = allProgram.length;
        let firstSeries = this.programList[0];
        let i = 0;
        for (; i < allLength; i++) {
            if (allProgram[i].ScheduleCode == firstSeries.ScheduleCode) {
                break;
            }
        }
        let leftEle = document.getElementById("sch_left_icon");
        let rightEle = document.getElementById("sch_right_icon");
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
        let totalProgramListCount = model.getTotalProgramListCount();
        let showListCount =  this.getItemListCount();
        let setSelectedLocation = focusManage.getFocusLocation().x +1;
        let moveMode = view.getListSwitchMode(setSelectedLocation-1,showListCount, keyCode);
        if (moveMode == moveType.FOCUS_MOVE) {
            if(keyCode == KeyCode.KEY_LEFT) {
                if(focusLocation.x<=0){
                    return;
                }
                focusManage.lostNotice();
                focusLocation.x--;
            } else {
                if(focusLocation.x >= (this.programList.length-1)){
                    return;
                }
                focusManage.lostNotice();
                focusLocation.x++;
            }
            focusManage.setFocusLocation(focusLocation);
        } else {
            let newOffset = keyCode == KeyCode.KEY_LEFT ? this.offset-1 : this.offset+1;
            if(newOffset < 0 || (newOffset+this.contentSize) > totalProgramListCount) {
                return;
            }
            keyCode == KeyCode.KEY_LEFT ? this.offset-- : this.offset++;
            this.viewUpdateData();
            this.partialViewRefreshByFocusLocation();
            this.addPlayingProgramStyle(true);
            this.setLeftRightArrowShow();
        }
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }
    //部分数据刷新
    partialViewRefreshByFocusLocation() {
        for(let i=0; i<this.programList.length; i++){
            document.getElementById("sch_program_time_"+i).innerHTML =this.programList[i].time;
            document.getElementById("sch_program_name_"+i).innerHTML =this.programList[i].Name;
            imageLoad.setBackgroundImg("sch_program_item_"+i, this.programList[i].programImgUrl, default_horizontal_icon);
        }
    }

    changePlayingProgramStyle(idx) {
        let len = this.programList.length;
        for(let i=0; i<len; i++) {
            let programEle = document.getElementById(this.itemIdPrefix+i);
            if(programEle) {
                if (i == idx) {
                    addClass(programEle, "program_item_select")
                } else {
                    removeClass(programEle, "program_item_select");
                }
            }
        }
    }
}
export const view = new View();
export default { view }