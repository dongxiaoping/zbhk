import {AbstractKeyEvent} from "../../../Abstract/scene/AbstractKeyEvent";
import playManage from "../../../App/app_zbhk/PlayManage";
import CommonConfig from "../../../common/Config";
import Collection from "../../../common/UserCollection";
import {KeyCode} from "../../../common/FocusModule";
import {addClass, removeClass} from "../../../common/CommonUtils";
import {mediaType, defaultLiveCode, coverPageMode} from "../../../common/GlobalConst";
import {sceneIds} from "../../../App/app_zbhk/AppGlobal.js";
import {pageKeyResponse} from "../../../App/app_zbhk/app.component";
import {focusManage} from "./Focus";
import {view} from "./View";
import {model} from "./Model";
import DataAccess from "../../../common/DataAccess";

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
                if(view.channelListView.pageMode == coverPageMode.LIST) {   //列表模式：back键退出应用
                    window.WebApp.appExit();
                } else if(view.channelListView.pageMode == coverPageMode.EDIT) {  //编辑模式：back键退出到列表模式
                    this.processFinishButtonOk();
                } else if(view.channelListView.pageMode == coverPageMode.CONFIRM) {  //二次确认模式：back键退出到编辑模式
                    this.processCancelButton();
                }
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
        model.setSelectedCategory(null);
    }

    //直播频道ok的响应：跳转到全屏播放页面
    processChannelOk(focusLocation) {
        let categoryInfo = view.categoryListView.getCategoryInfoByLocation();
        let channelInfo = view.channelListView.getChannelInfoByFocusLocation(focusLocation);
        if(view.channelListView.pageMode == coverPageMode.LIST) {      //列表模式：ok全屏播放
            let code = categoryInfo.Code == CommonConfig.mCollectionCode ? defaultLiveCode : categoryInfo.Code;
            let playInfo = {type: mediaType.LIVE, channelCode: channelInfo.ChannelCode, categoryCode: code};
            playManage.fromCover = sceneIds.COVER_ID;
            let param = [];
            param[sceneIds.PLAYER_SCENE_ID] = playInfo;
            window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID, param);
        } else if(view.channelListView.pageMode == coverPageMode.EDIT) {  //收藏分类的编辑模式：单个删除收藏的频道
            Collection.exec(channelInfo.ChannelCode);
            DataAccess.requestCollectedChannel({callback: function() {
                model.setChannelList();
                view.channelListView.setNewInitParam();
                view.channelListView.viewUpdateData();
                view.channelListView.viewPage();
                view.channelListView.viewCollectionDeleteIcon();
                focusManage.lostNotice();
                if (!view.channelListView.getChannelInfoByFocusLocation(focusLocation)) {
                    if(focusLocation.x > 2) {
                        focusLocation.x--;
                    } else {
                        focusLocation.y--;
                    }
                    if(!view.channelListView.getChannelInfoByFocusLocation(focusLocation)) {
                        focusLocation = {x: 2, y: 0};
                    }
                }
                if (!view.channelListView.getChannelInfoByFocusLocation(focusLocation)) {
                    focusLocation = { x: 1, y: 0 };
                }
                focusManage.setFocusLocation(focusLocation);
                focusManage.nodeUpdate();
                focusManage.nodeFocus();
            }});
        }
    }

    //收藏按钮ok键的响应
    processCollectionButtonOk(focusLocation) {
        if(focusLocation.y == view.channelListView.buttonType.EDIT) {
            this.processEditButtonOk();
        } else if(focusLocation.y == view.channelListView.buttonType.CLEAR) {
            this.processClearButtonOk();
        } else {
            this.processFinishButtonOk();
        }
    }

    processConfirmButtonOk(focusLocation) {
        if(focusLocation.y == 0) {
            this.processConfirmButton();
        } else {
            this.processCancelButton();
        }
    }

    //“编辑”按钮
    processEditButtonOk() {
        view.channelListView.pageMode = coverPageMode.EDIT;
        removeClass(view.channelListView.collectionEdit, "show");
        addClass(view.channelListView.collectionOperation, "show");
        view.channelListView.viewCollectionDeleteIcon();
        focusManage.lostNotice();
        focusManage.setFocusLocation({x:2, y:0});
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }

    //“清空”按钮
    processClearButtonOk() {
        view.channelListView.pageMode = coverPageMode.CONFIRM;
        let confirmEle = document.getElementById("second_confirm_tip");
        confirmEle.style.display = "block";
        focusManage.lostNotice();
        focusManage.setFocusLocation({ x: 6, y: 0});
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }
 
    //“完成”按钮：从编辑模式变为列表模式
    processFinishButtonOk() {
        view.channelListView.pageMode = coverPageMode.LIST;
        addClass(view.channelListView.collectionEdit, "show");
        removeClass(view.channelListView.collectionOperation, "show");
        view.channelListView.viewCollectionDeleteIcon(false);
        focusManage.lostNotice();
        focusManage.setFocusLocation({ x: 2, y: 0 });
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }

    //清空操作二次确定的“确定”按钮: 清空所有收藏频道，焦点定位在“收藏”分类上
    processConfirmButton(){
        view.channelListView.pageMode = coverPageMode.LIST;
        let confirmEle = document.getElementById("second_confirm_tip");
        confirmEle.style.display = "none";
        let channelList = model.getChannelList();
        let len = channelList.length;
        for(let i=0; i<len; i++) {
            Collection.exec(channelList[i].ChannelCode);
        }
        removeClass(view.channelListView.collectionEdit, "show");
        removeClass(view.channelListView.collectionOperation, "show");
        DataAccess.requestCollectedChannel({
            callback: function () {
                model.setChannelList();
                view.channelListView.setNewInitParam();
                view.channelListView.viewUpdateData();
                view.channelListView.viewPage();
                focusManage.lostNotice();                
                focusManage.setFocusLocation({ x: 1, y: 0 });
                focusManage.nodeUpdate();
                focusManage.nodeFocus();
            }
        });
    }

    //清空操作二次确认的“取消”按钮
    processCancelButton(){
        view.channelListView.pageMode = coverPageMode.EDIT;
        let confirmEle = document.getElementById("second_confirm_tip");
        confirmEle.style.display = "none";
        focusManage.lostNotice();
        focusManage.setFocusLocation({ x: 2, y: 0 });
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
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
            focusLocation.y = 7;
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
            if (focusLocation.y >= 7) {
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
            if (focusLocation.y >= 7) {
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
        if(view.needUpdate) {
            let paramType = view.getPageElementTypeByLocation(focusLocation);
            if (paramType == view.pageElementType.CATEGORY_LIST) {
                keyEvent.updateChannelListByCategory(focusLocation);
                view.channelListView.changeChannelListToList();
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
        } else if (paramType === view.pageElementType.COLLECTION_BUTTON) {
            if (focusLocation.y == 2) {
                focusManage.lostNotice();
                focusLocation.y--;
                focusManage.setFocusLocation(focusLocation);
                focusManage.nodeUpdate();
                focusManage.nodeFocus();
            }
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
        if(paramType === view.pageElementType.BUTTON){
            return;
        } else if(paramType === view.pageElementType.COLLECTION_BUTTON) {
            if(view.channelListView.pageMode == coverPageMode.EDIT && focusLocation.y == 1) {
                focusManage.lostNotice();
                focusLocation.y++;
                focusManage.setFocusLocation(focusLocation);
                focusManage.nodeUpdate();
                focusManage.nodeFocus();
            }
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
        if(paramType == view.pageElementType.BUTTON){  //回看按钮                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
            return;
        } else if(paramType == view.pageElementType.COLLECTION_BUTTON) { //收藏的操作按钮
            focusManage.lostNotice();
            focusLocation.x--;
            if (!view.channelListView.getRightChannelByFocusLocation(focusLocation)) {
                focusLocation.y = 0;
            }
            if (!view.channelListView.getRightChannelByFocusLocation(focusLocation)) {
                focusLocation.x = 2;
            }
            focusManage.setFocusLocation(focusLocation);
            focusManage.nodeUpdate();
            focusManage.nodeFocus();
        } else if(paramType == view.pageElementType.CONFIRM_BUTTON) {   //二次确认上的按钮
            if (focusLocation.y == 1) {
                focusManage.lostNotice();
                focusLocation.y--;
                focusManage.setFocusLocation(focusLocation);
                focusManage.nodeUpdate();
                focusManage.nodeFocus()
                return;
            }
        } else {   //分类和频道列表
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
        if(paramType == view.pageElementType.CHANNEL_LIST) {     //频道列表
            let selectCode = model.selectedCategory.Code;
            if(selectCode == CommonConfig.mCollectionCode) {  //"收藏"分类，有批量操作
                if (focusLocation.x == 4 || !view.channelListView.getRightChannelByFocusLocation(focusLocation)) {
                    focusManage.lostNotice();
                    if(view.channelListView.pageMode == coverPageMode.LIST) {
                        focusManage.setFocusLocation({x: 5, y: 0});
                    } else {
                        focusManage.setFocusLocation({x: 5, y: 1 });
                    }
                    focusManage.nodeUpdate();
                    focusManage.nodeFocus();
                    return;
                }       
            } else {   //其他频道分类
                if (focusLocation.x == 4 || !view.channelListView.getRightChannelByFocusLocation(focusLocation)) {
                    return;
                }
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
        } else if(paramType == view.pageElementType.COLLECTION_BUTTON) {
            return;
        } else if(paramType == view.pageElementType.CONFIRM_BUTTON) {
            if (focusLocation.y == 0) {
                focusManage.lostNotice();
                focusLocation.y++;
                focusManage.setFocusLocation(focusLocation);
                focusManage.nodeUpdate();
                focusManage.nodeFocus()
                return;
            }
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
        } else if(paramType == view.pageElementType.COLLECTION_BUTTON) {
            keyEvent.processCollectionButtonOk(focusLocation);
        } else if(paramType == view.pageElementType.CONFIRM_BUTTON) {
            keyEvent.processConfirmButtonOk(focusLocation);
        }
    }
};
export const keyEvent = new KeyEvent();
export default {keyEvent}