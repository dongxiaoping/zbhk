import {AbstractScene} from "../../../Abstract/scene/AbstractScene";
import {KeyCode} from "../../../common/FocusModule";
import {msgType, playerResponse, seekButtonType, sceneStatus} from "../../../common/GlobalConst";
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

    fontAdjust(count){
        super.fontAdjust(count);
        let size1 = parseInt(document.getElementById("seek_tips").style.fontSize.replace("px",""));
        let size2 = parseInt(document.getElementById("seek_cate_name").style.fontSize.replace("px",""));
        let size3 = parseInt(document.getElementById("seek_program_name").style.fontSize.replace("px",""));
        let size4 = parseInt(document.getElementById("play_time").style.fontSize.replace("px",""));
        let size5 = parseInt(document.getElementById("play_end_time").style.fontSize.replace("px",""));
        if(count=="add"){
            size1++;
            size2++;
            size3++;
            size4++;
            size5++;
        }else{
            size1--;
            size2--;
            size3--;
            size4--;
            size5--;
        }
        document.getElementById("seek_tips").style.fontSize = size1+"px";
        document.getElementById("seek_cate_name").style.fontSize = size2+"px";
        document.getElementById("seek_program_name").style.fontSize = size3+"px";
        document.getElementById("play_time").style.fontSize = size4+"px";
        document.getElementById("play_end_time").style.fontSize = size5+"px";
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