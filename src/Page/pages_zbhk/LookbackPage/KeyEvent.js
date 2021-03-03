import {AbstractKeyEvent} from "../../../Abstract/scene/AbstractKeyEvent";
import {sceneIds} from "../../../App/app_zbhk/AppGlobal.js";
import playManage from "../../../App/app_zbhk/PlayManage";
import CommonConfig from "../../../common/Config";
import {KeyCode} from "../../../common/FocusModule";
import {addClass, removeClass, showCoverBottomTips} from "../../../common/CommonUtils";
import {sysTime} from "../../../common/TimeUtils";
import {mediaType, coverType, defaultLiveCode} from "../../../common/GlobalConst";
import {OTTConfig} from "../../../common/CmsSwitch";
import {pageKeyResponse} from "../../../App/app_zbhk/app.component";
import {focusManage} from "./Focus";
import {view} from "./View";
import {model} from "./Model";

class KeyEvent extends AbstractKeyEvent {
    constructor() {
        super(focusManage);
    }

    onKeyEvent(type, keyCode) {
        if(!this.isKeyEventNeedResponseByFocus(type, keyCode)) {
            return ;
        }
        super.onKeyEvent(type, keyCode);
        switch (keyCode) {
            case KeyCode.KEY_BACK:
            case KeyCode.KEY_BACK2:
                window.WebApp.appExit();
                break;
            case KeyCode.KEY_PAGE_UP:
            case KeyCode.KEY_PAGE_DOWN:
                if(this.isFocusChanelList()) {
                    pageKeyResponse.coverUpDownResponse(keyCode, view.channelListView, focusManage);
                }
                break;
            default:
        }
    }

    isFocusChanelList() {
        let focusLocation= focusManage.getFocusLocation();
        let paramType = view.getPageElementTypeByLocation(focusLocation);
        return paramType == view.pageElementType.CHANNEL_LIST;
    }

    //按钮ok的响应：跳转到回看封套页面
    processButtonOk() {
        let param = [];
        let pageID = OTTConfig.showEnvelopeFlag() == coverType.CHANNEL_LIST ? sceneIds.COVER_ID : sceneIds.COVER_IMAGE_ID;
        param[pageID] = {page: "from_lookback"};
        window.WebApp.switchScene(pageID, param);
    }

    //频道列表ok的响应：跳转到全屏播放页面，播放该频道的直播节目
    processChannelOk(focusLocation) {
        let categoryInfo = view.categoryListView.getCategoryInfoByLocation();
        let channelInfo = view.channelListView.getChannelInfoByFocusLocation(focusLocation);
        let code = categoryInfo.Code == CommonConfig.mCollectionCode ? defaultLiveCode : categoryInfo.Code;
        let playInfo = {type: mediaType.LIVE, channelCode: channelInfo.ChannelCode, categoryCode: code};
        playManage.fromCover = sceneIds.LOOK_BACK_ID;
        let param = [];
        param[sceneIds.PLAYER_SCENE_ID] = playInfo;
        window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID, param);
    }

    //节目列表ok的响应：跳转到全屏播放页面，播放该节目
    processProgramOk(focusLocation) {
        let now = sysTime.date().Format();
        let programInfo = view.programListView.getProgramInfoByFocusLocation(focusLocation);
        if(now < programInfo.StartTime) {     //预约节目
            showCoverBottomTips("节目暂未开始");
        } else {
            let categoryInfo = view.categoryListView.getCategoryInfoByLocation();
            let channelInfo = view.channelListView.getChannelInfoByFocusLocation();
            let code = categoryInfo.Code == CommonConfig.mCollectionCode ? defaultLiveCode : categoryInfo.Code;
            let playInfo = {type: mediaType.LIVE, channelCode: channelInfo.ChannelCode, categoryCode: code};
            if (programInfo.StartTime > now || now > programInfo.EndTime) {
                playInfo.type = mediaType.SCH;
                playInfo.scheduleCode = programInfo.ScheduleCode;
                playInfo.startTime = programInfo.StartTime;
                playInfo.endTime = programInfo.EndTime;
            }
            playManage.fromCover = sceneIds.LOOK_BACK_ID;
            let param = [];
            param[sceneIds.PLAYER_SCENE_ID] = playInfo;
            window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID, param);
        }
    }

    //直播分类on:更新右侧频道列表-日期列表-节目列表
    updateChannelListByCategory(focusLocation) {
        model.setSelectCategoryByLocation(focusLocation.y);
        view.channelListView.setNewInitParam();
        view.channelListView.viewUpdateData();
        view.channelListView.viewPage();
        view.dateListView.setNewInitParam();
        view.dateListView.viewUpdateData();
        view.dateListView.viewPage();
        let channelList = model.getChannelList();
        if(channelList.length > 0) {
            let channelCode = channelList[0].ChannelCode;
            model.updateProgramList(channelCode);
        }
    }

    //频道列表on：更新右侧日期列表-节目列表
    updateDateProgramListByChannel(focusLocation) {
        let channelInfo = view.channelListView.getChannelInfoByFocusLocation(focusLocation);
        let channelCode = channelInfo.ChannelCode;
        view.channelListView.setSelectedItem(view.channelListView.channelList[focusLocation.y]);
        view.dateListView.setNewInitParam();
        view.dateListView.viewUpdateData();
        view.dateListView.viewPage();
        model.updateProgramList(channelCode);
    }

    //日期列表on：更新右侧节目列表
    updateProgramListByDate(focusLocation) {
        let channelInfo = view.channelListView.getChannelInfoByFocusLocation();
        let channelCode = channelInfo.ChannelCode;
        view.dateListView.setSelectedItem(view.dateListView.dateList[focusLocation.y]);
        model.updateProgramList(channelCode, focusLocation.y);
    }

    //向上键的响应:按个翻
    processUpByOne(focusLocation, paramType) {
        let viewObj = view.getViewObjByType(paramType);
        if(viewObj.offset == 0 && focusLocation.y == 0) {
            return;
        } else if(focusLocation.y>0) {   //移动光标
            focusManage.lostNotice();
            focusLocation.y--;
            viewObj.setLostLocation(focusLocation);
        } else if(viewObj.offset > 0) {   //移动数据
            viewObj.offset--;
            focusLocation.y = 0;
            viewObj.setLostLocation(focusLocation);
            viewObj.viewUpdateData();
            viewObj.viewPage();
        }
        focusManage.setFocusLocation(focusLocation);
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }

    //向下键的响应：按个翻
    processDownByOne(focusLocation, paramType) {
        let viewObj = view.getViewObjByType(paramType);
        let totalData = viewObj.getTotalData();
        let totalLen = totalData ? totalData.length : 0;
        if(viewObj.offset+focusLocation.y == totalLen-1) {   //翻到最后一个，循环到第一个
            viewObj.offset = 0;
            focusLocation.y = 0;
            viewObj.setLostLocation(focusLocation);
            viewObj.viewUpdateData();
            viewObj.viewPage();
        } else if(focusLocation.y < (totalLen-1) && focusLocation.y<(viewObj.contentSize-1)) { //移动光标
            focusManage.lostNotice();
            focusLocation.y++;
            viewObj.setLostLocation(focusLocation);
        } else {   //移动数据
            viewObj.offset++;
            focusLocation.y = viewObj.contentSize-1;
            viewObj.setLostLocation(focusLocation);
            viewObj.viewUpdateData();
            viewObj.viewPage();
        }
        focusManage.setFocusLocation(focusLocation);
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }

    //直播频道向上键的响应
    processChannelUp(focusLocation) {
        if (focusLocation.y == 0 && view.channelListView.currentPage == 1) {
            return;
        } else if(focusLocation.y == 0 && view.channelListView.currentPage > 1){
            focusManage.lostNotice();
            focusLocation.y = view.channelListView.contentSize - 1;
            view.channelListView.setLostLocation(focusLocation);
            view.channelListView.currentPage--;
            view.channelListView.viewUpdateData();
            view.channelListView.viewPage();
        } else {
            focusManage.lostNotice();
            focusLocation.y--;
            view.channelListView.setLostLocation(focusLocation);
        }
        focusManage.setFocusLocation(focusLocation);
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }

    //直播频道向下键的响应
    processChannelDown(focusLocation) {
        if(view.channelListView.currentPage == view.channelListView.totalPage) { //最后一页    //最后一页且没有向下的元素了
            if(!view.channelListView.getDownChannelByFocusLocation(focusLocation)) {  //乡下翻没有元素了，轮翻到第一页
                view.channelListView.currentPage = 1;
                focusManage.lostNotice();
                focusLocation.y = 0;
                view.channelListView.setLostLocation(focusLocation);
                view.channelListView.viewUpdateData();
                view.channelListView.viewPage();
                focusManage.setFocusLocation(focusLocation);
                focusManage.nodeUpdate();
                focusManage.nodeFocus();
                return;
            }
        }
        if(focusLocation.y >= (view.channelListView.contentSize - 1) && view.channelListView.currentPage < view.channelListView.totalPage) {   //翻页
            focusManage.lostNotice();
            focusLocation.y = 0;
            view.channelListView.setLostLocation(focusLocation);
            view.channelListView.currentPage++;
            view.channelListView.viewUpdateData();
            view.channelListView.viewPage();
        } else {      //光标下移
            focusManage.lostNotice();
            focusLocation.y++;
            view.channelListView.setLostLocation(focusLocation);
        }
        focusManage.setFocusLocation(focusLocation);
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }
}

export const eventResponse = {
    on() {
        let focusLocation= focusManage.getFocusLocation();
        let id = view.getIdByFocusLocation(focusLocation);
        let ele = document.getElementById(id);
        if(ele){
            if(id.indexOf("program_item") != -1) {
                let tipEle = ele.getElementsByClassName("tips");
                if(tipEle && tipEle[0]) {
                    tipEle[0].style.display = "block";
                    if(tipEle[0].innerHTML == "直播") {
                        removeClass(ele, "playing_program");
                    }
                }
            }
            addClass(ele, "focus");
            addClass(ele, "select");
        }
        if(view.needUpdate) {
            let paramType = view.getPageElementTypeByLocation(focusLocation);
            if(paramType == view.pageElementType.CATEGORY_LIST) {
                keyEvent.updateChannelListByCategory(focusLocation);
            } else if(paramType == view.pageElementType.CHANNEL_LIST) {
                keyEvent.updateDateProgramListByChannel(focusLocation);
            } else if(paramType == view.pageElementType.DATE_LIST) {
                keyEvent.updateProgramListByDate(focusLocation);
            }
            view.needUpdate = false;
        }
    },
    lost() {
        let focusLocation= focusManage.getFocusLocation();
        let id = view.getIdByFocusLocation(focusLocation);
        let ele = document.getElementById(id);
        if(ele){
            if(id.indexOf("program_item") != -1) {
                let tipEle = ele.getElementsByClassName("tips");
                if(tipEle && tipEle[0]) {
                    if(tipEle[0].innerHTML == "直播") {
                        addClass(ele, "playing_program");
                        tipEle[0].style.display = "block";
                    } else {
                        tipEle[0].style.display = "none";
                    }
                }
            }
            removeClass(ele, "focus");
            removeClass(ele, "select");
        }
    },
    onTopBorder() {
        let focusLocation= focusManage.getFocusLocation();
        let paramType = view.getPageElementTypeByLocation(focusLocation);
        if(paramType===view.pageElementType.BUTTON){
            return;
        }
        view.needUpdate = true;
        if(paramType == view.pageElementType.CHANNEL_LIST) {   //频道列表：按页翻页
            keyEvent.processChannelUp(focusLocation);
        } else {
            keyEvent.processUpByOne(focusLocation, paramType);   //分类列表、日期列表、节目列表：按个翻页
        }
    },
    onBottomBorder() {
        let focusLocation= focusManage.getFocusLocation();
        let paramType = view.getPageElementTypeByLocation(focusLocation);
        if(paramType===view.pageElementType.BUTTON){
            return;
        }
        view.needUpdate = true;
        if(paramType == view.pageElementType.CHANNEL_LIST) {   //频道列表：按页翻页
            keyEvent.processChannelDown(focusLocation);
        } else {
            keyEvent.processDownByOne(focusLocation, paramType);   //分类列表、日期列表、节目列表：按个翻页
        }
    },
    onLeftBorder(){
        let focusLocation= focusManage.getFocusLocation();
        let paramType = view.getPageElementTypeByLocation(focusLocation);
        if(paramType == view.pageElementType.BUTTON){
            return;
        } else {
            focusManage.lostNotice();
            if(paramType != view.pageElementType.PROGRAM_LIST) {
                view.addItemSelectByLocation(focusLocation);
            }
            if(paramType == view.pageElementType.CATEGORY_LIST) {
                focusLocation.y = 0;
            } else if(paramType == view.pageElementType.CHANNEL_LIST) {
                let lostLocation = view.categoryListView.getLostLocation();
                focusLocation.y = lostLocation.y;
            } else if(paramType == view.pageElementType.DATE_LIST) {
                let lostLocation = view.channelListView.getLostLocation();
                focusLocation.y = lostLocation.y;
            } else if(paramType == view.pageElementType.PROGRAM_LIST) {
                let lostLocation = view.dateListView.getLostLocation();
                focusLocation.y = lostLocation.y;
            }
            focusLocation.x--;
            focusManage.setFocusLocation(focusLocation);
            focusManage.nodeUpdate();
            focusManage.nodeFocus();
        }
    },
    onRightBorder(){
        let focusLocation= focusManage.getFocusLocation();
        let paramType = view.getPageElementTypeByLocation(focusLocation);
        if(paramType == view.pageElementType.PROGRAM_LIST){
            return;
        } else {
            if(paramType == view.pageElementType.CATEGORY_LIST && model.channelList.length <= 0) {
                return;
            }
            if(paramType == view.pageElementType.DATE_LIST && model.programList.length <= 0) {
                return;
            }
            focusManage.lostNotice();
            if(paramType != view.pageElementType.BUTTON) {
                view.addItemSelectByLocation(focusLocation);
            }
            if(paramType == view.pageElementType.BUTTON) {
                let lostLocation = view.categoryListView.getLostLocation();
                focusLocation.y = lostLocation.y;
            } else if(paramType == view.pageElementType.CATEGORY_LIST) {
                let lostLocation = view.channelListView.getLostLocation();
                focusLocation.y = lostLocation.y;
            } else if(paramType == view.pageElementType.CHANNEL_LIST) {
                let lostLocation = view.dateListView.getLostLocation();
                focusLocation.y = lostLocation.y;
            } else if(paramType == view.pageElementType.DATE_LIST) {
                let lostLocation = view.programListView.getLostLocation();
                focusLocation.y = lostLocation.y;
            }
            focusLocation.x++;
            focusManage.setFocusLocation(focusLocation);
            focusManage.nodeUpdate();
            focusManage.nodeFocus();
        }
    },
    ok() {
        let focusLocation= focusManage.getFocusLocation();
        let paramType = view.getPageElementTypeByLocation(focusLocation);
        if(paramType == view.pageElementType.BUTTON){
            keyEvent.processButtonOk();
        } else if(paramType == view.pageElementType.CATEGORY_LIST) {
            //on的时候就已经联动了，ok无需响应
        } else if(paramType == view.pageElementType.CHANNEL_LIST) {
            keyEvent.processChannelOk();
        } else if(paramType == view.pageElementType.PROGRAM_LIST) {
            keyEvent.processProgramOk();
        }
    }
};
export const keyEvent = new KeyEvent();
export default {keyEvent}