//频道付费
import {keyOpTipForLive,keyOpTipForLookBack} from "./app.component.js";
import {sceneIds} from "./AppGlobal";
import DataAccess from "./../../common/DataAccess";
import {KeyCode} from "./../../common/FocusModule";
import {laterShowType, eventType} from "./../../common/GlobalConst";
import {PlayerControllerStatic} from "./../../common/OttPlayer";
import PlayerDataAccess from "./../../common/PlayerDataAccess";
import {showChannelPayTips} from "./../../common/CommonUtils";

let ChannelPay  = {
    isNeedPay: false,                   //是否需要付费的标识
    laterShowSceneType: null,           //在付费auth回调之后，需要显示的界面类型
    isResponseBack: true,               //是否响应back键（取消订购的back键，屏显页面或退出页面会收到back事件，此时不需要响应）

    //订购操作
    processOrderOperation() {
        DataAccess.uploadLastLiveInfoToServer(PlayerDataAccess.mLastLiveInfo);
        this.isResponseBack = false;
        PlayerControllerStatic.getInstance().order();
    },

    //处理鉴权后，根据是否需要付费, 不同情况下各自需要显示的页面
    processLaterShowPage: function(playInfo, isNeedPay, isNeedUpdate = true) {
        switch (ChannelPay.laterShowSceneType) {
            case laterShowType.SCREEN_SCENE:
                let params = [];
                params[sceneIds.SCREEN_SCENE_ID] = playInfo;
                window.WebApp.switchScene(sceneIds.SCREEN_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
                break;
            case laterShowType.LIVE_OPERATION_TIPS:
                window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID);
                if (isNeedPay) {      //付费节目,显示屏显信息
                    keyOpTipForLive.hide();
                    let params = [];
                    params[sceneIds.SCREEN_SCENE_ID] = playInfo;
                    window.WebApp.switchScene(sceneIds.SCREEN_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
                } else {        //非付费节目，显示直播操作提示
                    keyOpTipForLive.showOpTip(playInfo.channelCode)
                }
                break;
            case laterShowType.SCH_OPERATION_TIPS:
                window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID);
                if (isNeedPay) {      //付费节目,显示屏显信息
                    keyOpTipForLookBack.hide();
                    let params = [];
                    params[sceneIds.SCREEN_SCENE_ID] = playInfo;
                    window.WebApp.switchScene(sceneIds.SCREEN_SCENE_ID, params, [null, null, sceneIds.PLAYER_SCENE_ID]);
                } else {        //非付费节目，显示回看操作提示
                    let info = PlayerDataAccess.getReviewDetailByChannelSchedule(playInfo);
                    let keyName = info.CurrentSchedule.Name;
                    keyOpTipForLookBack.show(keyName)
                }
                break;
            default:
        }
        if(isNeedUpdate) {
            ChannelPay.laterShowSceneType = null;
        }
    },

    //处理是否响应back键
    processResponseBack: function(type, theKeyCode) {
        if(theKeyCode == KeyCode.KEY_BACK || theKeyCode == KeyCode.KEY_BACK2) {
            if(!this.isResponseBack) {
                if(type === eventType.CLICK||type === eventType.HOLD_END) {
                    this.isResponseBack = true;
                }
                return false;
            }
        }
        return true;
    },

    //处理付费频道不操作，自动跳转到屏显页面
    processAutoToScreen(playScene) {
        showChannelPayTips();
        let params = [];
        params[sceneIds.SCREEN_SCENE_ID] = window.WebApp.getNowPlayInfo();
        window.WebApp.switchScene(sceneIds.SCREEN_SCENE_ID, params, [null, null, sceneIds.SCREEN_SCENE_ID]);
    }
}

export default ChannelPay;