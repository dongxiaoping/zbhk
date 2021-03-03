import {AbstractScene} from "../../../Abstract/scene/AbstractScene";
import {msgType, playerResponse, seekButtonType} from "../../../common/GlobalConst";
import {KeyCode} from "../../../common/FocusModule";
import {view} from "./View";
import {model} from "./Model";
import {keyEvent} from "./KeyEvent";
import {focusManage} from "./Focus";

export default class Scene extends AbstractScene {
    constructor(sceneId) {
        super(sceneId,model,view,keyEvent,focusManage);
    }

    displayScene(){
        super.displayScene();
        view.timingHideToPlayPage(5000);
    }

    destroyScene(){
        super.destroyScene();
        view.clearTimingHideToPlayPage();
    }

    receiveBroadcast(type, msg) {
        super.receiveBroadcast(type, msg);
        if(type == msgType.PLAYER_STATE) {
            let state = msg.state;
            switch(state) {
                case playerResponse.PLAYER_PAUSED:
                    view.clearTimingHideToPlayPage();
                    view.liveSeekView.updateIcon(seekButtonType.PAUSE);
                    view.liveSeekView.stopUpdatePlayingTime();
                    break;
                case playerResponse.PLAYER_START_PLAY:

                    break;
                case playerResponse.PLAYER_PLAYING:
                    view.liveSeekView.updateIcon(seekButtonType.PLAY);
                    view.liveSeekView.startUpdatePlayingTime();
                    view.liveSeekView.updatePlayerBarProgress(msg.current, msg.total);
                    view.liveSeekView.updatePlayerBarView();
                    window.Loading.hiddenLoading();
                    break;
                case playerResponse.PLAYER_RESUMED:
                    view.timingHideToPlayPage(5000);
                    view.liveSeekView.updateIcon(seekButtonType.PLAY);
                    view.liveSeekView.startUpdatePlayingTime();
                    break;
                case playerResponse.PLAYER_SEEKING_VIEW:
                    if (msg.direction == KeyCode.KEY_RIGHT) {
                        view.liveSeekView.updateIcon(seekButtonType.FORWARD);
                    } else if(msg.direction == KeyCode.KEY_LEFT){
                        view.liveSeekView.updateIcon(seekButtonType.BACKWARD);
                    } else {
                        view.liveSeekView.updateIcon(seekButtonType.PLAY);
                    }
                    view.liveSeekView.updatePlayerBarView();
                    break;
                case playerResponse.PLAYER_SEEKING_DATA:
                    view.liveSeekView.updatePlayerBarProgress(msg.seekCurrent, msg.playingTotal);
                    break;
                default:
            }
        }
    }
}