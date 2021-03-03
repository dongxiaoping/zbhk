// +----------------------------------------------------------------------
// | Copyright (js), BestTV.
// +----------------------------------------------------------------------
// | Author: karl.dong
// +----------------------------------------------------------------------
// | Date：2017/10/17
// +----------------------------------------------------------------------
// | Description: 
// +----------------------------------------------------------------------
import JxLog from "./Log"
import {msgType,appNode} from "./GlobalConst";
class NavManage {
    constructor(Stack){
        this.Stack = Stack;
        this.navHistory=[];
        this.destroyScenesDataInfo = [];
    }

    getNavHistory(){
        return this.navHistory;
    }

    /* 获取指定的一条导航记录
     * @flag 表示导航记录的位置 1 表示顶层最新的一个
     * */
    getTheNavHistory(flag){
        let totalLength = this.navHistory.length;
        let startIndex =  totalLength - flag;
        if(startIndex<0){
            return false;
        }else{
            return this.navHistory[startIndex];
        }
    }

    getScenesMap(){
        return this.Stack.scenesMap;
    }

    /* 通过输入的scene id 集合，检查是否存在错误，有错误返回false 没有返回true
     * @allIds ID集合
     * */
    checkSceneIds(allIds=[]){
        let scenesMap = this.getScenesMap();
        for(let i=0;i<allIds.length;i++){
            if(typeof(scenesMap[allIds[i]])=="undefined"){
                JxLog.e([], "common/app.nav/checkSceneIds",
                    [allIds[i], "is not exist"]);
                return false;
            }
        }
        return true;
    }

    //通过id获取实例化的scene，没有返回false
    getSceneById(id=null){
        if(id==null){
            return false;
        }
        return this.Stack.getSceneInStackById(id);
    }

    /* 页面跳转函数
     * @sceneId 需要跳转到的页面ID
     * @param 跳转页面传参，如： param[sceneIds.PLAYER_SCENE_ID],param[sceneIds.SCREEN_SCENE_ID],
     * 可以传多个页面参数，主键为页面ID
     * @maskSceneIds 蒙层页面ID集合，依次为顶部、底部、浮层1、浮层2、...
     * @hideSceneIds 需要隐藏的页面ID集合
     * @animationModel 页面跳转动画类型
     * */
    switchScene(sceneId,param=[],maskSceneIds=[],hideSceneIds=[],animationModel=null){
        //获取参数中id的集合并返回
        maskSceneIds = maskSceneIds===null?[]:maskSceneIds;
        hideSceneIds = hideSceneIds===null?[]:hideSceneIds;
        param = param===null?[]:param;
        let maskAndAnimationScenes= this.getMaskSceneAndAnimationSceneList(maskSceneIds);
        let allIds = this.getAllSceneIds(sceneId,maskAndAnimationScenes.mask,hideSceneIds,maskAndAnimationScenes.animation);
        let isParamRight =  this.checkSceneIds(allIds);
        if(isParamRight===false){
            return false;
        }
        let switchInfo = {"id":sceneId,"param":param,"maskSceneIds":maskSceneIds,"hideSceneIds":hideSceneIds, "animationModel":animationModel};
        window.WebApp.messageBroadcast(msgType.NODE_TRIGGER,{node:appNode.SWITCH_PAGE,info:JSON.stringify(switchInfo)});
        this.addNavHistory(switchInfo);
        let isPushRight = this.Stack.push(sceneId,param,maskAndAnimationScenes.mask,hideSceneIds,maskAndAnimationScenes.animation);
        if(isPushRight===false){
            return false;
        }
        return true;
    }

    getAllSceneIds(sceneId,maskSceneIds,hideSceneIds,animationScenes){
        let newAnimationScenes = [];
        for(let i=0;i<animationScenes.length;i++){
            if(animationScenes[i]!==null){
                newAnimationScenes.push(animationScenes[i]);
            }
        }
        let newMaskSceneIds = [];
        for(let i = 0;i<maskSceneIds.length;i++){
            if(maskSceneIds[i]!=null){
                newMaskSceneIds.push(maskSceneIds[i]);
            }
        }
        return [sceneId].concat(newMaskSceneIds).concat(hideSceneIds).concat(newAnimationScenes);
    }

    //添加跳转历史记录
    addNavHistory(item) {
        if(this.navHistory.length == 30) {
            this.navHistory = this.navHistory.slice(1);
        }
        this.navHistory.push(item);
    }

    /*获取导航参数*/
    getNavParams(sceneId=null) {
        let theTheNavHistory = this.getTheNavHistory(1);
        if(!theTheNavHistory){
            return null;
        }
        let selectedParams = theTheNavHistory.param;

        if(sceneId==null){
            return selectedParams;
        }else{
            let theParam = this.getLastParamBySceneId(sceneId);
            return theParam;
        }
    }

    getLastParamBySceneId(sceneId){
        let count = this.navHistory.length;
        if(count<=0){
            return null;
        }
        if(typeof (this.navHistory[count-1].param[sceneId])!=="undefined"){
            return this.navHistory[count-1].param[sceneId];
        }
        return null;
    }

    getMaskSceneAndAnimationSceneList(scenes){
        let outScene = {"animation":[],"mask":[]};
        for(let i=0;i<scenes.length;i++){
            if(i<=1){
                outScene.animation.push(scenes[i]);
            }else{
                outScene.mask.push(scenes[i]);
            }
        }
        return outScene;
    }

    getSwitchAnimationType(){
        let theTheNavHistory = this.getTheNavHistory(1);
        if(!theTheNavHistory){
            return null;
        }
        return theTheNavHistory.animationModel;
    }

    setDestroyScenesDataInfo(sceneId,info){
        this.destroyScenesDataInfo[sceneId] = info;
    }

    getDestroyScenesDataInfo(sceneId){
        return this.destroyScenesDataInfo[sceneId];
    }

}
export default NavManage;