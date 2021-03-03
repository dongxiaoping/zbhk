import {sceneStatus,msgType, playerResponse, LogType} from "../../common/GlobalConst"
import PlayerDataAccess from "../../common/PlayerDataAccess"
import {processNotExistTips} from "../../common/CommonUtils"
import {mediaType} from "../../common/GlobalConst"
import JxLog from "../../common/Log"

export class AbstractScene {
    constructor(sceneId,Model,View,KeyEvent,FocusManage) {
        this.status = "";       //scene的状态
        this.sceneId = sceneId;
        this.Model = Model;
        this.View = View;
        this.KeyEvent = KeyEvent;
        this.FocusManage = FocusManage;
        View.setSceneId(sceneId);
    }

    //根据参数绘制页面，页面隐藏不显示
    init() {
        let that = this;
        JxLog.i([LogType.PAGE], "Abstract/scene/AbstractScene/init",
            ["begin:页面初始化", that.sceneId]);
        this.initSceneEle();
        this.hiddenScene();
        this.Model.modelUpdateData({
            callback: function() {
                that.View.viewUpdateData();
                that.View.viewPage();
                if(that.FocusManage) {
                    that.FocusManage.nodeUpdate();
                    that.FocusManage.nodeFocus();
                }
                that.status = sceneStatus.INITED;
                that.exec();
                JxLog.i([LogType.PAGE], "Abstract/scene/AbstractScene/init",
                    ["end:页面初始化完毕", that.sceneId]);
            }
        });
    }

    //将页面设置到顶层并显示
    displayScene() {
        JxLog.i([LogType.PAGE], "Abstract/scene/AbstractScene/displayScene",
            ["begin:显示页面", this.sceneId]);
        let divEle = document.getElementById(this.sceneId);
        divEle.style.display = "block";
        this.status = sceneStatus.DISPLAY;
        JxLog.i([LogType.PAGE], "Abstract/scene/AbstractScene/displayScene",
            ["end:显示页面", this.sceneId]);
    }

    //将页面设置到遮罩层，最上面的一个遮罩层为1
    maskScene(flag) {
        this.status = sceneStatus.MASKED;
    }

    /* 将页面显示为顶部动画页面或者底部动画页面，弃用
     * @flag 页面状态 sceneStatus.PAGE_FALL_TOP 或者sceneStatus.PAGE_FALL_BOTTOM
     * */
    animationMaskScene(flag){

    }

    //隐藏页面
    hiddenScene() {
        JxLog.i([LogType.PAGE], "Abstract/scene/AbstractScene/hiddenScene",
            ["begin:隐藏页面", this.sceneId]);
        document.getElementById(this.sceneId).style.display = "none";
        this.status = sceneStatus.HIDDEN;
        JxLog.i([LogType.PAGE], "Abstract/scene/AbstractScene/hiddenScene",
            ["end:隐藏页面", this.sceneId]);
    }

    //销毁页面
    destroyScene() {
        JxLog.i([LogType.PAGE], "Abstract/scene/AbstractScene/destroyScene",
            ["begin:销毁页面", this.sceneId]);
        let  divEle = document.getElementById(this.sceneId);
        let saveInfo = this.saveHistoryInfo();
        window.WebApp.Nav.setDestroyScenesDataInfo(this.sceneId,saveInfo);
        divEle.style.display = "none";
        this.View.destroy();
        this.Model.destroy();
        this.status = sceneStatus.DESTROYED;
        JxLog.i([LogType.PAGE], "Abstract/scene/AbstractScene/destroyScene",
            ["end:销毁页面", this.sceneId]);
    }

    onKeyEvent(isPress, keyCode) {
        if(this.KeyEvent===null){
            JxLog.e([LogType.PAGE], "Abstract/scene/AbstractScene/onKeyEvent",
                ["KeyEvent对象为空"]);
            let params = [];
          //  params[sceneIds.ERROR_SCENE_ID] = {code:"004",describe:"事件接收对象未初始化完毕！"};
          //  Nav.switchScene(sceneIds.ERROR_SCENE_ID,params);
            return ;
        }
        this.KeyEvent.onKeyEvent(isPress, keyCode);
    }

    //获取scene的id
    getSceneId() {
        return this.sceneId;
    }

    initSceneEle(){
        let divEle = document.getElementById(this.sceneId);
        if(!divEle) {
            divEle = document.createElement("div");
            divEle.id = this.sceneId;
            document.body.appendChild(divEle);
        }
    }
    //页面销毁后需要存储的页面历史记录信息
    saveHistoryInfo(){
        return {};
    }

    //页面加载显示完毕后，需要执行的页面相关的功能操作
    exec(){

    }

    /* 接受广播
     * type 消息类型
     * message 消息内容
     * */
    receiveBroadcast(type,msg){
        switch(type) {
            case msgType.FONT_ADJUST:
                if(this.status===sceneStatus.DISPLAY){
                    this.fontAdjust(msg);
                }
                break;
            case msgType.PLAYER_STATE:
                let state = msg.state;
                switch (state) {
                    case playerResponse.PLAYER_LOAD_END:
                        if(msg.status == -1) {
                            processNotExistTips(msg.tipInfo);
                        }
                        break;
                    case playerResponse.PLAYER_PLAYING:
                        let playInfo =  window.WebApp.getNowPlayInfo();
                        if(playInfo && playInfo.type != mediaType.LIVE) {
                            let progress = msg.total > 0 ? msg.current/msg.total : 0;
                            PlayerDataAccess.mBookMark = {bookMark: msg.current, progress: progress};
                        }
                        break;
                    default:
                }
            default:
        }
    }

    /* 调整当前页面的字体大小
     * @count 计数 add表示加  subtract 表示减
     * */
    fontAdjust(count){
    }


    //获取当前页面的跳转动画类型
    getSwitchAnimationType(){
        return window.WebApp.Nav.getSwitchAnimationType();
    }
}
export default {AbstractScene}