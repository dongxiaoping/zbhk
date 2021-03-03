import {AbstractScene} from "../../../Abstract/scene/AbstractScene";
import {msgType, playerResponse, seekButtonType, sceneStatus} from "../../../common/GlobalConst";
import {KeyCode} from "../../../common/FocusModule";
import {programPlayTipBar} from "../../../App/app_zbhk/app.component";
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
        programPlayTipBar.hidden();
        view.timingHideToPlayPage(10000);
    }

    destroyScene(){
        super.destroyScene();
        view.clearTimingHideToPlayPage();
    }

    receiveBroadcast(type, msg) {
        if(this.status !== sceneStatus.DISPLAY){
            return ;
        }
        super.receiveBroadcast(type, msg);
        if(type == msgType.PLAYER_STATE) {
            switch(msg.state) {
                case playerResponse.PLAYER_PAUSED:
                    view.clearTimingHideToPlayPage();
                    view.seekView.updateIcon(seekButtonType.PAUSE);
                    break;
                case playerResponse.PLAYER_PLAYING:
                    view.seekView.updateIcon(seekButtonType.PLAY);
                    view.seekView.updatePlayerBarProgress(msg.current, msg.total);
                    view.seekView.updatePlayerBarView();
                    window.Loading.hiddenLoading();
                    break;
                case playerResponse.PLAYER_RESUMED:
                    view.timingHideToPlayPage(5000);
                    view.seekView.updateIcon(seekButtonType.PLAY);
                    break;
                case playerResponse.PLAYER_SEEKING_VIEW:
                    if (msg.direction == KeyCode.KEY_RIGHT) {
                        view.seekView.updateIcon(seekButtonType.FORWARD);
                    } else if(msg.direction == KeyCode.KEY_LEFT){
                        view.seekView.updateIcon(seekButtonType.BACKWARD);
                    } else {
                        view.seekView.updateIcon(seekButtonType.PLAY);
                    }
                    view.seekView.updatePlayerBarView();
                    break;
                case playerResponse.PLAYER_SEEKING_DATA:
                    view.seekView.updatePlayerBarProgress(msg.seekCurrent, msg.playingTotal);
                    break;
                default:
            }
        }
    }
}