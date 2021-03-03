// +----------------------------------------------------------------------
// | Copyright (js), BestTV.
// +----------------------------------------------------------------------
// | Author: karl.dong
// +----------------------------------------------------------------------
// | Date：2017/12/29
// +----------------------------------------------------------------------
// | Description: 
// +----------------------------------------------------------------------
import HtmlBuilder from "../../lib/HtmlBuilder"
import {moveType} from "../../common/GlobalConst"
import {KeyCode} from "../../common/FocusModule"
import Log from "../../common/Log"
export class AbstractView {
    //页面初始化
    constructor() {
        this.sceneId = null;
    }
    //页面所需数据更新
    viewUpdateData() {

    }
    //展示页面
    viewPage() {

    }

    setSceneId(id){
        this.sceneId = id;
    }

    getSceneId(){
        return this.sceneId;
    }

    clearTimingHideToPlayPage(){
        window.WebApp.clearTimingHideToPlayPage();

    }

    timingHideToPlayPage(time){
        window.WebApp.timingHideToPlayPage(time);
    }

    /* 获取显示列表中，显示数据相对于总数据的偏移量
     * @param list 总数据列表
     * @param keyWord 对比关键字
     * @param keyValue 对比关键字的值
     * @param showListCount 显示列表的长度
     * */
    getOffsetValue(list,keyWord,keyValue,showListCount){
        let myOffset = 0;
        let len = list.length;
        let theValue = "";
        for(let i=0;i<len;i++){
            theValue = list[i][keyWord];
            if(theValue===keyValue){
                myOffset = this.getOffsetByIndex(i, len, showListCount);
                return myOffset;
            }
        }
        return myOffset;
    }

    //光标定位在最右边
    getOffsetByIndexRight(index, contentSize) {
        let offset = 0;
        if(index >= contentSize -1){
            offset = index - (contentSize - 1);
        }
        return offset;
    }

    //光标定位在倒数第二个
    getOffsetByIndexSecondLast(len, index, contentSize) {
        let offset = 0;
        if(index == len - 1) {      //正在播放的是最后一个节目，定位在最后一个节目
            offset = index - (contentSize - 1);
        } else {
            if (index >= contentSize - 2) {
                offset = index - (contentSize - 2);
            }
        }
        return offset;
    }

    //直播节目，光标不定位在中间，而是最右边
    getOffsetByIndex(index, totalLen, contentSize, flag=false) {
        let offset = 0;
        if(contentSize>=totalLen){
            return offset;
        }
        if(index > 2){
            if(index >= (totalLen - contentSize)){
                offset = (totalLen - contentSize);
            } else {
                offset = flag ? index-5 : index - 2;
            }
        } else{
            offset = 0;
        }
        return offset;
    }

    /* 获取页面列表移动方式
     * @param location:当前光标所在列表的位置，从0算起（0至pageSize-1）
     * @param pageSize:列表一页显示的个数
     * @param direction：遥控器切换方向，左右
     */
    getListSwitchMode(location, pageSize, direction) {
        if(location>0 && location<pageSize-1) {
            return moveType.FOCUS_MOVE;
        } else if(location == 0) {
            return direction == KeyCode.KEY_LEFT ? moveType.LIST_MOVE : moveType.FOCUS_MOVE;
        } else{
            return direction == KeyCode.KEY_RIGHT ? moveType.LIST_MOVE : moveType.FOCUS_MOVE;
        }
    }

    destroy(){
       this.clearTimingHideToPlayPage();
    }
}

export class AbstractListView {
    constructor(id){
        this.id = id;
        let eleObj = document.getElementById(this.id);
        if(eleObj) {
            this.templateHtml = eleObj.innerHTML.toString();
            eleObj.innerHTML = "";
        }
        this.lostLocation=null;//当前列表最后一次丢失光标位置
    }

    getLostLocation(){
        return JSON.parse(this.lostLocation);
    }

    setLostLocation(info){
        this.lostLocation = JSON.stringify(info);
    }

    viewPage(){
        if(!this.id){
            return ;
        }
        document.getElementById(this.id).innerHTML = this.templateHtml;
        let _parentChildNodes = document.getElementById(this.id).children;
        let isHasRepeat = false;
        let firstRepeatEle = null;
        for(let i=0;i<_parentChildNodes.length;i++){
            if(_parentChildNodes[i].getAttribute("repeat")){
                isHasRepeat = true;
                firstRepeatEle = _parentChildNodes[i];
                break;
            }
        }
        if(isHasRepeat){
            let _firstRepeatEleChildNodes = firstRepeatEle.children;
            for(let i=0;i<_firstRepeatEleChildNodes.length;i++){
                if(_firstRepeatEleChildNodes[i].getAttribute("repeat")){
                    this.viewPageWithDoubleRepeat();
                    return;
                }
            }
            this.viewPageWithOneRepeat();
        }else{
            this.viewPageNoRepeat();
        }
    }


    viewPageWithDoubleRepeat(){
        let totalHtml = "";
        let _mainHtml= document.getElementById(this.id).innerHTML.toString();
        let _main = document.getElementById(this.id).firstElementChild;
        let firstRepeatInfo = HtmlBuilder.getRepeatInfo(_main.getAttribute("repeat"));
        let firstValueFlag = firstRepeatInfo[0];
        let firstDataList = this[firstRepeatInfo[1]];
        let _mainChildNodes = _main.children;

        let childIndexList = [];
        let secondRepeatEleList = [];
        for(let i=0;i<_mainChildNodes.length;i++){
            if(_mainChildNodes[i].getAttribute("repeat")){
                secondRepeatEleList.push(_mainChildNodes[i]);
                childIndexList.push(i);
            }
        }
        let secondRepeatInfoList = [];
        let secondValueFlagList = [];
        let secondListDataFlagList = [];
        for(let i=0;i<secondRepeatEleList.length;i++){
            let info = HtmlBuilder.getRepeatInfo(secondRepeatEleList[i].getAttribute("repeat"));
            secondRepeatInfoList.push(info);
            secondValueFlagList.push(info[0]);
            secondListDataFlagList.push(info[1].replace(firstValueFlag+".",""));
        }

        function getRepeatOb(index,i){
            let newOb = document.createElement("div");
            secondRepeatEleList[index].removeAttribute("repeat");
            newOb.appendChild(secondRepeatEleList[index]);
            let theHtmlString = HtmlBuilder.getHtmlStringByListInfo(secondValueFlagList[index], firstDataList[i][secondListDataFlagList[index]], newOb.innerHTML.toString(), i);
            newOb.innerHTML = theHtmlString;
            return newOb;
        }

        for(let i=0;i<firstDataList.length;i++) {
            let mainOb = document.createElement("div");
            mainOb.innerHTML = _mainHtml;
            let childrenList = mainOb.children[0].children;
            let theString = "";
            let repeatIndex = 0;
            while(childrenList.length>0){
                if(childrenList[0].getAttribute("repeat")){
                    let n = childrenList[0];
                    let m = document.createElement("div");
                    m.appendChild(n);
                    m.innerHTML = "";

                    let newOb = getRepeatOb(repeatIndex,i);
                    let childList = newOb.children;
                    while(childList.length>0){
                        m.appendChild(childList[0]);
                    }
                    theString = theString+m.innerHTML;
                    repeatIndex++;
                }else{
                    let n = childrenList[0];
                    let m = document.createElement("div");
                    m.appendChild(n);
                    theString = theString+m.innerHTML;
                }
            }
            _main.innerHTML = theString;
            let mm = document.getElementById(this.id).innerHTML.toString();
             mm = mm.split(firstValueFlag+".").join('');
            let setHtmlString = HtmlBuilder.getHtmlString(firstDataList[i],mm,0);
            totalHtml = totalHtml+setHtmlString;
        }
        document.getElementById(this.id).innerHTML = totalHtml;
    }

    viewPageWithOneRepeat(){
        let setHtmlString = "";
        let _parentChildNodes = document.getElementById(this.id).children;
        while(_parentChildNodes.length>0){
            if(_parentChildNodes[0].getAttribute("repeat")){
                let repeatInfo = HtmlBuilder.getRepeatInfo(_parentChildNodes[0].getAttribute("repeat"));
                let valueFlag = repeatInfo[0];
                let dataList = this[repeatInfo[1]];
                let mainOb = document.createElement("div");
                mainOb.appendChild(_parentChildNodes[0]);
                setHtmlString = setHtmlString + HtmlBuilder.getHtmlStringByListInfo(valueFlag,dataList,mainOb.innerHTML,-1);
            }else{
                let mainOb = document.createElement("div");
                mainOb.appendChild(_parentChildNodes[0]);
                setHtmlString = setHtmlString + mainOb.innerHTML;
            }
        }
        document.getElementById(this.id).innerHTML = setHtmlString;
    }

    viewPageNoRepeat(){
        let valueFlag = HtmlBuilder.getSplitBetweenStr(this.templateHtml,"{{","}}");
        valueFlag = valueFlag[0];
        valueFlag = valueFlag.split(".");
        valueFlag = valueFlag[0];
        let theString = this.templateHtml.split(valueFlag+".").join('');
        let setHtmlString = HtmlBuilder.getHtmlString(this[valueFlag],theString,0);
        document.getElementById(this.id).innerHTML = setHtmlString;
    }

    destroy(){
        document.getElementById(this.id).innerHTML = "";
        this.lostLocation = null;
    }
}
export default {AbstractView,AbstractListView}