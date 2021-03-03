import {FocusNode, FocusExt} from "../../common/FocusModule";
export class AbstractFocus {
    constructor() {
        this.focusExt = new FocusExt();
        this.sceneFocus = new FocusNode();
        this.focusLocation = {x:0,y:0};
        this.lostLocation = null; //上一个丢失的光标坐标的json字符串
    }

    getFocusExt(){
        return this.focusExt;
    }

    getLostLocation(){
        return JSON.parse(this.lostLocation);
    }

    setLostLocation(info){
        this.lostLocation = JSON.stringify(info);
    }

    getFocusLocation(){
        return this.focusLocation;
    }

    setFocusLocation(info){
        this.focusLocation = info;
    }

    setFocusLocationByData(data) {

    }

    lostNotice(){
        let selectedNode = this.sceneFocus.getFirstChild();
        if(selectedNode!=null){
            selectedNode.lost();
        }
    }

    nodeUpdate(eventResponse=null) {
        this.sceneFocus.removeChildren();
        let node = new FocusNode({
            x: 0,
            y: 0,
            id: "",
            event_agent: eventResponse,
            data: {call: this, list:null},
            cache: 0
        });
        node.addChild(new FocusNode({
            x: 0,
            y: 0,
            id:"",
            data: {call: this, list:null}
        }));
        this.sceneFocus.addChild(node);
    }

    //页面初始光标定位
    nodeFocus() {
        let selectedNode = this.sceneFocus.getFirstChild();
        let region = selectedNode.coordTostr();
        this.focusExt.initByhistory(this.sceneFocus, region);
    }

    on(that){

    }

    lost(){
        this.setLostLocation(this.focusLocation);
    }

    ok(that){

    }

    onTopBorder(that){

    }

    onBottomBorder(that){

    }

    onRightBorder(that){

    }

    onLeftBorder(that){

    }

    destroy(){
        this.focusLocation = {x:0,y:0};
        this.sceneFocus.removeChildren();
    }
}

export default {
    AbstractFocus
}