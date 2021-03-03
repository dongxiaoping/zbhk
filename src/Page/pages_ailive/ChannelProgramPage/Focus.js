import {AbstractFocus} from "../../../Abstract/scene/AbstractFocus";
import {FocusNode} from "../../../common/FocusModule";
import {view} from "./View";
import {model}from "./Model";
import {dateItemResponse, programItemResponse} from "./KeyEvent";

class FocusManage extends AbstractFocus{
    constructor() {
        super();
        this.focusHistory = null;
        this.dateNodeId = "date";
        this.programNodeId = "program";
    }

    nodeUpdate() {
        this.sceneFocus.removeChildren();
        let dateItemId = view.dateListView.itemIdPrefix + view.dateListView.getSelectItemLocation();
        let programItemId = view.programListView.itemIdPrefix + view.programListView.getSelectItemLocation();
        this.dateFocus = new FocusNode({x: 0, y: 0, event_agent: dateItemResponse, cache: 0});
        this.programFocus = new FocusNode({x: 0, y: 1, event_agent: programItemResponse, cache: 0});
        this.dateFocus.addChild(new FocusNode({
            x: 0, y: 0, id: dateItemId,
            data: {call: this, list: view.dateListView.getSelectedItem(), id: this.dateNodeId}
        }));
        if(model.getProgramList()) {    //在没有节目单的时候，programFocus里面不添加节点
            this.programFocus.addChild(new FocusNode({
                x: 0, y: 0, id: programItemId,
                data: {call: this, list: view.programListView.getSelectedItem(), id: this.programNodeId}
            }));
        }
        this.sceneFocus.addChild(this.dateFocus);
        this.sceneFocus.addChild(this.programFocus);
    }

    //页面初始光标定位
    nodeFocus() {
        let programData = model.getProgramList();
        let selectedNode = programData.length > 0 ? this.programFocus : this.dateFocus;     //有节目单，光标默认定位在节目上；没有节目单，默认定位在日期上
        if(this.focusHistory) {
            selectedNode = this.getFocusNodeByHistory();
        }
        let region = selectedNode.coordTostr();
        this.focusExt.initByhistory(this.sceneFocus, region);
    }

    //主动出发lost事件，改变样式
    lostNotice() {
        let selectedNode = this.getFocusNodeByHistory();
        if(selectedNode != null){
            let child = selectedNode.getFirstChild();
            child.lost();
        }
    }

    getFocusNodeByHistory() {
        let selectedNode = null;
        if(this.focusHistory == this.dateNodeId) {
            selectedNode = this.sceneFocus.getChild(0, 0);
        } else if(this.focusHistory == this.programNodeId) {
            selectedNode = this.sceneFocus.getChild(0, 1);
        }
        return selectedNode;
    }
}

export const focusManage = new FocusManage();
export default {focusManage}