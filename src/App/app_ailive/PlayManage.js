import {AbstractPlayManage} from "../../Abstract/app/AbstractPlayManage";
import ChannelPay from "./ChannelPay";
import {sceneIds} from "./AppGlobal";
import {laterShowType, mediaType, defaultLiveCode} from "../../common/GlobalConst";

class PlayManage  extends AbstractPlayManage{
    constructor() {
        super();
    }

    switchPlay(playInfo,isUserOpAction=true){
        if(this.isPlaySame(playInfo)) {
            setTimeout(function(){ //TODO 这个为了解决stack中会添加多个播放页面而执行的零时解决方案，后续要将播放页面和播放功能分开，不要播放页面，添加播放服务
                ChannelPay.processLaterShowPage(playInfo, ChannelPay.isNeedPay);
            },300);
        }
        super.switchPlay(playInfo,isUserOpAction);
    }

    playByChannelCode(channelCode) {
        ChannelPay.laterShowSceneType = laterShowType.SCREEN_SCENE;
        let playInfo = {type: mediaType.LIVE, categoryCode: defaultLiveCode, channelCode: channelCode};
        let param = [];
        param[sceneIds.PLAYER_SCENE_ID] = playInfo;
        window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID, param);
    }
}

export const playManage = new PlayManage();
export default playManage
