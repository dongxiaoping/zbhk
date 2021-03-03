// +----------------------------------------------------------------------
// | Copyright (js), BestTV.
// +----------------------------------------------------------------------
// | Author: karl.dong
// +----------------------------------------------------------------------
// | Date：2017/11/30
// +----------------------------------------------------------------------
// | Description: 
// +----------------------------------------------------------------------
class HtmlBuilder{
    constructor(){

    }

    test(){

    }

    getHtmlString(param,html,index){
        let keyList = [];
        let htmlList =html.split("{{");
        for(let i=0;i<htmlList.length;i++){
            let partList = htmlList[i].split("}}");
            if(partList.length>1){
                keyList.push(partList[0]);
            }
        }
        keyList.push("index");
        if(param) {
            param.index=index;
        }
        for(let i=0;i<keyList.length;i++){
            html = html.replace("{{"+keyList[i]+"}}",param[keyList[i]]);
        }
        return html;
    }

    /* 获取html字符串信息
     * @param  valueFlag 变量名称
     * @param dataList 值集合
     * @param templateHtml 模板字符串
     * @param 双列表循环有效，表示第一层列表循环的值顺序index值，-1表示无效值
     * */
    getHtmlStringByListInfo(valueFlag,dataList,templateHtml,doubleToFirstRepeatIndex=-1){
        let setHtmlString = "";
        let theString = templateHtml.split(valueFlag+".").join('');
        for(let i=0;i<dataList.length;i++){
            let setIndex = i;
            if(doubleToFirstRepeatIndex!=-1){
                setIndex = doubleToFirstRepeatIndex+"_"+i;
            }
            setHtmlString = setHtmlString+this.getHtmlString(dataList[i],theString,setIndex);
        }
        return setHtmlString;
    }

    getRepeatInfo(repeatString){
        let returnList=[];
        let list = repeatString.split(" ");
        for(let i=0;i<list.length;i++){
            if(list[i]!=""&&list[i]!="in"){
                returnList.push(list[i]);
            }
        }
        return returnList;
    }

    /***
     *獲取兩字符串直接的字符串，返回：字符串數組
     **/
     getSplitBetweenStr(str,startStr,endStr){
        var resultAry=new Array();
        if(typeof str=='string' && typeof startStr=='string' && typeof endStr=='string'){
            var startLength=startStr.length;
            var endLength=endStr.length;
            var tempStr='';
            while(str.indexOf(startStr)!=-1 && str.indexOf(endStr)!=-1){
                tempStr=str.slice(str.indexOf(startStr)+startLength);
                resultAry.push(tempStr.slice(0,tempStr.indexOf(endStr)));
                str=tempStr.slice(tempStr.indexOf(endStr)+endLength);
            }
        }
        return resultAry;
    }
}
export default new HtmlBuilder();