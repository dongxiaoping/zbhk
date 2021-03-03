// +----------------------------------------------------------------------
// | Copyright (js), BestTV.
// +----------------------------------------------------------------------
// | Author: karl.dong
// +----------------------------------------------------------------------
// | Date：2017/10/17
// +----------------------------------------------------------------------
// | Description: 对页面实例对象进行管理
// +----------------------------------------------------------------------
import {sceneStatus} from "./GlobalConst"
import JxLog from "./Log"
class StackManage{
    constructor(scenesMap){
        this.stack = []; //[{"id":scenesId,"ob":ob}]
        this.scenesMap = scenesMap;
    }

    init(){
    }

    /* 通过id初始化一个scene 并返回，如果存在则返回false
     * @sceneId
     * */
    initScene(sceneId){
        let theScene = this.getSceneInStackById(sceneId);
        if(theScene===false){
            let ob = new this.scenesMap[sceneId](sceneId);
            ob.init();
            this.stackAdd(sceneId,ob);
            return ob;
        }
        return false;
    }

    //获取主页、遮罩页以及隐藏页的id集合
    getIdSort(sceneId,maskSceneIds,hideSceneIds,animationSceneIds){
        let newAnimationScenes = [];
        for(let i=0;i<animationSceneIds.length;i++){
            if(animationSceneIds[i]!==null){
                newAnimationScenes.push(animationSceneIds[i]);
            }
        }
        return [sceneId].concat(maskSceneIds).concat(hideSceneIds).concat(newAnimationScenes);
    }

    /* 修改栈的信息*/
    push(sceneId,params=[],maskSceneIds=[],hideSceneIds=[],animationSceneIds){
        let idSort = this.getIdSort(sceneId,maskSceneIds,hideSceneIds,animationSceneIds);
        this.removeInvalidSceneInStack(idSort);
        let theScene = this.setMainSceneInStack(sceneId,params);
        this.setStatusToMask(maskSceneIds,params);
        this.setStatusToHide(hideSceneIds,params);
        this.setStatusToMaskAnimation(animationSceneIds);
        theScene.displayScene();
        return true;
    }

    //创建顶层页面并返回
    setMainSceneInStack(sceneId,params=[]){
        let theScene = this.getSceneInStackById(sceneId);
        if(theScene===false){
            theScene = this.initScene(sceneId);
            return theScene;
        }
        if(typeof (params[sceneId])==="undefined"){
            return theScene;
        }else{
            this.removeSceneInStackById(sceneId);
            theScene = this.initScene(sceneId);
            return theScene;
        }
    }

    getStack(){
        return this.stack;
    }

    stackAdd(sceneId,ob){
        JxLog.d([], "common/app.stack/stackAdd", ["begin:向stack中添加页面对象",sceneId]);
        for(let i=0;i<this.stack.length;i++){
            if(this.stack[i].id===sceneId){
                JxLog.e([], "common/app.stack/stackAdd", ["stack中存在该页面对象，无法继续添加",sceneId]);
                return false;
            }
        }
        this.stack.push({"id":sceneId,"ob":ob});
        JxLog.d([], "common/app.stack/stackAdd", ["end:向stack中添加页面对象",sceneId]);
        return true;
    }

    //在栈中保留参数ids中指定的页面对象，其它的删除
    removeInvalidSceneInStack(sceneIds){
        let newStack = [];
        for(let i=0, len=this.stack.length;i<len;i++){
            let page = this.stack[i];
            if(sceneIds.indexOf(page.id) >= 0){
                newStack.push(page);
            }else{
                page.ob.destroyScene();
            }
        }
        this.stack = newStack;
    }

    getSceneInStackById(id){
        for(let j=0, len = this.stack.length; j < len; j++){
            if(id===this.stack[j].id){
                return this.stack[j].ob;
            }
        }
        return false;
    }

    /*判断实例化的Scene是否存在*/
    isSceneExistInStack(id){
        for(let j=0;j<this.stack.length;j++){
            if(id==this.stack[j].id){
                return true;
            }
        }
        return false;
    }

    removeSceneInStackById(id){
        for(let j=0;j<this.stack.length;j++){
            if(id===this.stack[j].id){
                this.stack[j].ob.destroyScene();
                this.stack.splice(j,1);
                return true;
            }
        }
        return false;
    }

    setStatusToMask(maskSceneIds,params=[]){
        for(let i=0;i<maskSceneIds.length;i++){
            let id = maskSceneIds[i];
            let sceneOb = this.getSceneInStackById(id);
            if(sceneOb){
                if(typeof (params[id])!=="undefined"){
                    sceneOb.destroyScene();
                    this.removeSceneInStackById(id);
                    this.initScene(id);
                    sceneOb = this.getSceneInStackById(id);
                }
            }else{
                this.initScene(id);
                sceneOb = this.getSceneInStackById(id);
            }
            sceneOb.maskScene(i+1);
        }
    }

    setStatusToHide(hideSceneIds,params){
        for(let i=0;i<hideSceneIds.length;i++){
            let id = hideSceneIds[i];
            let sceneOb = this.getSceneInStackById(id);
            if(sceneOb){
                if(typeof (params[id])!=="undefined"){
                    sceneOb.destroyScene();
                    this.removeSceneInStackById(id);
                    this.initScene(id);
                }else{
                    sceneOb.hiddenScene();
                }
            }else{
                this.initScene(id);
            }
        }
    }

    setStatusToMaskAnimation(ids){
        for(let i=0;i<ids.length;i++){
            let id = ids[i];
            if(id===null){
                continue;
            }
            let sceneOb = this.getSceneInStackById(id);
            if(!sceneOb){
                this.initScene(id);
                sceneOb = this.getSceneInStackById(id);
            }
            let theSceneStatus = i===0?sceneStatus.PAGE_FALL_TOP:sceneStatus.PAGE_FALL_BOTTOM;
            sceneOb.animationMaskScene(theSceneStatus);
        }
    }

    /* 消息广播
     * sceneIds 接受消息的页面scene id数组
     * type 消息类型
     * message 消息内容
     * */
    messageBroadcast(type,message){
        let myStack =this.getStack();
        for(let j=0;j<myStack.length;j++){
            myStack[j].ob.receiveBroadcast(type,message);
        }
    }
}
export default StackManage