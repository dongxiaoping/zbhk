import {AbstractPlayManage} from "../../Abstract/app/AbstractPlayManage";
import {mediaType, defaultLiveCode, interfaceType, LogType, msgType} from "../../common/GlobalConst";
import {OTT} from "../../common/OttMiddle";
import {PlayerControllerStatic} from "../../common/OttPlayer";
import {hiddenPauseIcon} from "../../common/CommonUtils";
import {programPlayTipBar} from "./app.component";
import {sceneIds} from "./AppGlobal";
import DataAccess from "../../common/DataAccess";
import modelManage from "./ModelManage";
import JxLog from "../../common/Log";

class PlayManage  extends AbstractPlayManage{
    constructor() {
        super();
        this.fromCover = null;         //播放是来自直播封套还是回看封套
    }

    switchPlay (playInfo, isUserOpAction = true) {
        try {
            if (!this.isPlayInfoFormat (playInfo)) {
                JxLog.e ([LogType.PLAY], "app_zbhk/PlayManage/switchPlay",
                    ["播放数据格式错误", playInfo]);
            }
            if (!this.isPlaySame (playInfo)) {        //不同的节目
                hiddenPauseIcon ();
                if (modelManage.getModeType () != interfaceType.ACTION_LIVE_CHANNEL_LOCK) {
                    programPlayTipBar.getAndShowPlayTipBarInfoByPlayInfo (playInfo);
                }
                if (playInfo.type == mediaType.LIVE) {
                    DataAccess.setLastLiveCodeFromCookie (playInfo.channelCode)
                }
            } else {     //相同的回看节目：暂停状态，ok键继续播放
                if (playInfo.type == mediaType.SCH) {
                    let state = OTT.MediaPlayer.getPlayState ();
                    if (state == PlayerControllerStatic.BE_MEDIA_PLAYER_PAUSE) {
                        PlayerControllerStatic.getInstance ().resumePlay ();
                        hiddenPauseIcon ();
                    }
                }
            }
            super.switchPlay (playInfo, isUserOpAction);
        } catch (e) {
            JxLog.e ([LogType.PLAY], 'app_zbhk/PlayManage/switchPlay',
                [e.toLocaleString ()]);
        }
    }

    playByChannelCode(channelCode) {
        let playInfo = {type: mediaType.LIVE, categoryCode: defaultLiveCode, channelCode: channelCode};
        let param = [];
        param[sceneIds.PLAYER_SCENE_ID] = playInfo;
        window.WebApp.switchScene(sceneIds.PLAYER_SCENE_ID, param);
    }

    receiveBroadcast(type, msg) {
        super.receiveBroadcast(type, msg);
        if (type === msgType.BOOK_PLAYING) {
            let playInfo = window.WebApp.getNowPlayInfo();
            if(!playInfo) {
                return;
            }
            let param = {};
            param[sceneIds.BOOK_TIP_SCENE_ID] = msg;
            window.WebApp.switchScene(sceneIds.BOOK_TIP_SCENE_ID, param);
        }
    }
}

export const playManage = new PlayManage();
export default playManage
