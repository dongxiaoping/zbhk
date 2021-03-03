import DataAccess from "../../common/DataAccess";
import tip_ok from "../../images/pages_ailive/tip_ok.png";
import tip_up_down from "../../images/pages_ailive/tip_up_down.png";
import tip_right from "../../images/pages_ailive/tip_right.png";
import tip_left_right from "../../images/pages_ailive/tip_left_right.png";
import JxLog from "../../common/Log"
class KeyOpTipForLive {
    constructor() {
        let liveOkEle = document.getElementById("key-op-tip-for-live-ok");
        if(liveOkEle) {
            liveOkEle.src=tip_ok;
        }
        let liveUpDownEle = document.getElementById("key-op-tip-for-live-up-down");
        if(liveUpDownEle) {
            liveUpDownEle.src=tip_up_down;
        }
        let liveRightEle = document.getElementById("key-op-tip-for-live-right");
        if(liveRightEle) {
            liveRightEle.src=tip_right;
        }
        this.timer =null;
    }

    show(name=""){
        let that = this;
        document.getElementById("key-op-tip-for-live-name-id").innerHTML = "正播："+name;
        if(this.timer){
            clearTimeout(that.timer);
        }
        document.getElementById("key-op-tip-for-live-id").style.display = "block";
        that.timer = setTimeout(function(){
            that.hide()
        },10000);
    }

    hide(){
        document.getElementById("key-op-tip-for-live-id").style.display = "none";
    }

    showOpTip(channelCode){
        try{
            let channelInfo = DataAccess.getChannelInfo(channelCode);
            let currentProgram = channelInfo.CurrentSchedule;
            this.show(currentProgram.Name);
        }catch(e){
            JxLog.e([], "App/app_ailive/app.component/showOpTip",
                ["不能显示提示，当前节目数据获取异常", channelCode]);
        }
    }
}

class KeyOpTipForLookBack {
    constructor() {
        let schOkEle = document.getElementById("key-op-tip-for-look-back-play");
        if(schOkEle) {
            schOkEle.src=tip_ok;
        }
        let schUpDownEle = document.getElementById("key-op-tip-for-look-back-up-down");
        if(schUpDownEle) {
            schUpDownEle.src=tip_up_down;
        }
        let schRightEle = document.getElementById("key-op-tip-for-look-back-left-right");
        if(schRightEle) {
            schRightEle.src = tip_left_right
        }
    }

    show(name=""){
        let that = this;
        document.getElementById("key-op-tip-for-look-back-name-id").innerHTML = "回看："+name;
        if(this.timer){
            clearTimeout(that.timer);
        }
        document.getElementById("key-op-tip-for-look-back-id").style.display = "block";
        that.timer = setTimeout(function(){
            that.hide()
        },10000);
    }

    hide(){
        document.getElementById("key-op-tip-for-look-back-id").style.display = "none";
    }
}

export const keyOpTipForLive = new KeyOpTipForLive();
export const keyOpTipForLookBack = new KeyOpTipForLookBack();
