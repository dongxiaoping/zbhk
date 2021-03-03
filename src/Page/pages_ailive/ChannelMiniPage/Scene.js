import {AbstractScene} from "../../../Abstract/scene/AbstractScene";
import {view} from "./View";
import {model} from "./Model";
import {keyEvent} from "./KeyEvent";
import {focusManage} from "./Focus";

export default class Scene extends AbstractScene {
    constructor(sceneId) {
        super(sceneId,model,view,keyEvent,focusManage);
    }
    destroyScene(){
        super.destroyScene();
        view.clearTimingHideToPlayPage();
    }

    displayScene(){
        super.displayScene();
        view.timingHideToPlayPage(10000);
    }

    maskScene(flag){

    }

    hiddenScene(){
        super.hiddenScene();
        view.closeEdited();
    }

    /* 调整字体大小
    *@count 调整值 add表示加1px  subtract表示减1px
    * */
    fontAdjust(count){
        super.fontAdjust(count);
        let channelNameIdPre = "channel_mini_scene_channel_name_";
        let programNameIdPre = "channel_mini_scene_program_name_";
        let numNameIdPre = "channel_mini_scene_num_";
        let barPre = "channel_mini_scene_pic_windows_id_bar_";
        for(let i=0;i<6;i++){
            let nameFontSize = parseInt(document.getElementById(channelNameIdPre+i).style.fontSize.replace("px",""));
            let programFontSize = parseInt(document.getElementById(programNameIdPre+i).style.fontSize.replace("px",""));
            let numFontSize = parseInt(document.getElementById(numNameIdPre+i).style.fontSize.replace("px",""));
            let barFontSize = parseInt(document.getElementById(barPre+i).getElementsByTagName("label")[0].style.fontSize.replace("px",""));
            if(count=="add"){
                nameFontSize++;
                programFontSize++;
                numFontSize++;
                barFontSize++;
            }else{
                nameFontSize--;
                programFontSize--;
                numFontSize--;
                barFontSize--;
            }
            document.getElementById(channelNameIdPre+i).style.fontSize = nameFontSize+"px";
            document.getElementById(programNameIdPre+i).style.fontSize = programFontSize+"px";
            document.getElementById(numNameIdPre+i).style.fontSize = numFontSize+"px";
            document.getElementById(barPre+i).getElementsByTagName("label")[0].style.fontSize =  barFontSize+"px";
        }
    }

    exec(){

    }
}
