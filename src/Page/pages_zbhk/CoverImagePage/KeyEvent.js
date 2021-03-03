import {AbstractKeyEvent} from "../../../Abstract/scene/AbstractKeyEvent";
import {OTTConfig} from "../../../common/CmsSwitch";
import {KeyCode} from "../../../common/FocusModule";
import {addClass, removeClass} from "../../../common/CommonUtils";
import {mediaType, coverType} from "../../../common/GlobalConst";
import {sceneIds} from "../../../App/app_zbhk/AppGlobal.js";
import playManage from "../../../App/app_zbhk/PlayManage";
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
        param[sceneIds.LOOK_BACK_ID] = {page: "from_cover"};
        window.WebApp.switchScene(sceneIds.LOOK_BACK_ID, param);
    }

    //直播频道ok的响应：跳转到全屏播放页面
    processChannelOk(focusLocation) {
        let categoryInfo = view.categoryListView.getCategoryInfoByLocation();
        let channelInfo = view.channelListView.getChannelInfoByFocusLocation(focusLocation);
        let playInfo = {type: mediaType.LIVE, channelCode: channelInfo.ChannelCode, categoryCode: categoryInfo.Code};
        playManage.fromCover = sceneIds.COVER_IMAGE_ID;
        let param = [];
        param[sceneIds.PLAYER_SCENE_ID] = playInfo;
        window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID, param);
    }

    //直播分类ok的响应：更新右侧频道列表
    updateChannelListByCategory(focusLocation) {
        model.setSelectCategoryByLocation(focusLocation, view.categoryListView.offset);
        model.setChannelList();
        view.channelListView.setNewInitParam();
        view.channelListView.viewUpdateData();
        view.channelListView.viewPage();
    }

    //直播分类向上键的响应
    processCategoryUp(focusLocation) {
        let viewObj = view.categoryListView;
        if(viewObj.offset == 0 && focusLocation.y == 0) {
            return;
        } else if(focusLocation.y>0) {   //移动光标
            focusManage.lostNotice();
            focusLocation.y--;
        } else if(viewObj.offset > 0) {   //移动数据
            viewObj.offset--;
            viewObj.viewUpdateData();
            viewObj.viewPage();
            focusLocation.y = 0;
        }
        viewObj.setLostLocation(focusLocation);
        focusManage.setFocusLocation(focusLocation);
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }

    //直播分类向下键的响应
    processCategoryDown(focusLocation) {
        let viewObj = view.categoryListView;
        let totalData = model.getLiveCategoryChannel();
        let totalLen = totalData ? totalData.length : 0;
        if(focusLocation.y < (totalLen-1) && focusLocation.y<(viewObj.contentSize-1)) { //移动光标
            focusManage.lostNotice();
            focusLocation.y++;
            viewObj.setLostLocation(focusLocation);
        } else {   //移动数据
            if(viewObj.offset+focusLocation.y == totalLen-1) {  //翻到最后一个，循环到第一个
                viewObj.offset = 0;
                focusLocation.y = 0;
            } else {
                viewObj.offset++;
                focusLocation.y = viewObj.contentSize-1;
            }
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
            view.channelListView.currentPage--;
            focusLocation.y = 3;
            view.channelListView.setLostLocation(focusLocation);
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
        focusManage.lostNotice();
        if(view.channelListView.currentPage == view.channelListView.totalPage) {      //最后一页
            if(!view.channelListView.getDownChannelByFocusLocation(focusLocation)) {  //没有向下的元素了，循环翻到第一页
                view.channelListView.currentPage = 0;
                focusLocation.y = 0;
                view.channelListView.setLostLocation(focusLocation);
                view.channelListView.viewUpdateData();
                view.channelListView.viewPage();
            } else {
                focusLocation.y++;
                view.channelListView.setLostLocation(focusLocation);
            }
        } else if(view.channelListView.currentPage == view.channelListView.totalPage - 1) {  //倒数第一页,下一页为最后一页
            if (focusLocation.y >= 3) {
                view.channelListView.currentPage++;
                view.channelListView.viewUpdateData();
                let pageItemLen = view.channelListView.channelList.length;
                if(pageItemLen < 3) {
                    focusLocation.x = pageItemLen + 1;
                }
                focusLocation.y = 0;
                view.channelListView.setLostLocation(focusLocation);
                view.channelListView.viewPage();
            } else {      //光标下移
                focusLocation.y++;
                view.channelListView.setLostLocation(focusLocation);
            }
        } else if(view.channelListView.currentPage < view.channelListView.totalPage - 1) { //翻页
            if (focusLocation.y >= 3) {
                view.channelListView.currentPage++;
                focusLocation.y = 0;
                view.channelListView.setLostLocation(focusLocation);
                view.channelListView.viewUpdateData();
                view.channelListView.viewPage();
            } else {      //光标下移
                focusLocation.y++;
                view.channelListView.setLostLocation(focusLocation);
            }
        }
        focusManage.setFocusLocation(focusLocation);
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }

    //直播频道on：九宫格封套，计算进度条
    processChannelCurrentProgress(focusLocation, ele) {
        let channelInfo = view.channelListView.getChannelInfoByFocusLocation(focusLocation);
        let progressEle = ele.getElementsByClassName("cur_name");
        if(progressEle && progressEle[0] && channelInfo.CurrentSchedule) {
            progressEle[0].style.backgroundSize = view.channelListView.computeLiveProgramProgress(channelInfo);
        }
    }
}

export const eventResponse = {
    on() {
        let focusLocation= focusManage.getFocusLocation();
        let id = view.getIdByFocusLocation(focusLocation);
        let ele = document.getElementById(id);
        if(ele){
            addClass(ele, "focus");
            addClass(ele, "select");
        }
        let paramType = view.getPageElementTypeByLocation(focusLocation);
        if(OTTConfig.showEnvelopeFlag() == coverType.CHANNEL_IMAGE && paramType == view.pageElementType.CHANNEL_LIST) {
            keyEvent.processChannelCurrentProgress(focusLocation, ele);
        }
        if(view.needUpdate) {
            if (paramType == view.pageElementType.CATEGORY_LIST) {
                keyEvent.updateChannelListByCategory(focusLocation);
            }
            view.needUpdate = false;
        }
    },
    lost() {
        let focusLocation= focusManage.getFocusLocation();
        let id = view.getIdByFocusLocation(focusLocation);
        let ele = document.getElementById(id);
        if(ele){
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
        if(paramType == view.pageElementType.CATEGORY_LIST){   //分类列表
            keyEvent.processCategoryUp(focusLocation);
        } else if(paramType == view.pageElementType.CHANNEL_LIST) {   //频道列表
            keyEvent.processChannelUp(focusLocation);
        }
    },
    onBottomBorder() {
        let focusLocation= focusManage.getFocusLocation();
        let paramType = view.getPageElementTypeByLocation(focusLocation);
        if(paramType===view.pageElementType.BUTTON){
            return;
        }
        view.needUpdate = true;
        if(paramType == view.pageElementType.CATEGORY_LIST){   //分类列表
            keyEvent.processCategoryDown(focusLocation);
        } else if(paramType == view.pageElementType.CHANNEL_LIST) {   //频道列表
            keyEvent.processChannelDown(focusLocation);
        }
    },
    onLeftBorder(){
        let focusLocation= focusManage.getFocusLocation();
        let paramType = view.getPageElementTypeByLocation(focusLocation);
        if(paramType == view.pageElementType.BUTTON){
            return;
        } else {
            focusManage.lostNotice();
            if(paramType == view.pageElementType.CATEGORY_LIST) {
                view.categoryListView.addCategorySelectByLocation();
                focusLocation.y = 0;
            } else if(paramType == view.pageElementType.CHANNEL_LIST && focusLocation.x == 2) {
                let lostLocation = view.categoryListView.getLostLocation();
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
        if(paramType == view.pageElementType.CHANNEL_LIST) {     //频道没有向右的元素了
            if(focusLocation.x == 4) {
                return;
            }
            if(!view.channelListView.getRightChannelByFocusLocation(focusLocation)) {
                return;
            }
            focusManage.lostNotice();
        } else if(paramType == view.pageElementType.BUTTON) {   //回看按钮
            focusManage.lostNotice();
            let lostLocation = view.categoryListView.getLostLocation();
            focusLocation.y = lostLocation.y;
        } else if(paramType == view.pageElementType.CATEGORY_LIST) {    //分类列表
            if(model.channelList.length <= 0) {
                return;
            }
            focusManage.lostNotice();
            view.categoryListView.addCategorySelectByLocation();
            let lostLocation = view.channelListView.getLostLocation();
            focusLocation.y = lostLocation.y;
        }
        focusLocation.x++;
        focusManage.setFocusLocation(focusLocation);
        focusManage.nodeUpdate();
        focusManage.nodeFocus();

    },
    ok() {
        let focusLocation= focusManage.getFocusLocation();
        let paramType = view.getPageElementTypeByLocation(focusLocation);
        if(paramType == view.pageElementType.BUTTON){
            keyEvent.processButtonOk();
        } else if(paramType == view.pageElementType.CATEGORY_LIST) {
            //on的时候就已经联动了，ok无需响应
        } else if(paramType == view.pageElementType.CHANNEL_LIST) {
            keyEvent.processChannelOk(focusLocation);
        }
    }
};
export const keyEvent = new KeyEvent();
export default {keyEvent}