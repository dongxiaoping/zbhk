// +----------------------------------------------------------------------
// | Copyright (js), BestTV.
// +----------------------------------------------------------------------
// | Author: karl.dong
// +----------------------------------------------------------------------
// | Date：2018/4/18
// +----------------------------------------------------------------------
// | Description: 
// +----------------------------------------------------------------------
import DataAccess from "../../common/DataAccess";
import {interfaceBackStatus,interfaceType,interfaceTypeRelyReq} from "../../common/GlobalConst";
import { sceneIds} from "./AppGlobal";
import recommendDataManage from "../../common/RecommendDataManage";
import JxLog from "../../common/Log"
import jxDataManage from "../../common/JxDatasManage";
import modelManage from "./ModelManage";
import {AbstractLazyLoadData} from "../../Abstract/app/AbstractLazyLoadData";
class LazyLoadData extends AbstractLazyLoadData{
    constructor() {
        super();
        this.loadingInfo = []; //数据加载的状态信息
    }

    start(){
        super.start();
    }

    commonDataLoad(){
        let that = this;
        let appMode = modelManage.getModeParam();
        if(appMode.mode!==interfaceType.ACTION_OPEN_APP){
            DataAccess.requestLiveCategoryChannel({
                callback: function (data,status) {
                     that.setLazyLoadState("QueryCover", status);
                }
            });
        }else{
            that.setLazyLoadState("QueryCover", interfaceBackStatus.SUCCESS);
        }

        recommendDataManage.start({callback: function (data,status) {
            that.setLazyLoadState("QueryRecommendVodInfo",status);
            JxLog.i([], "App/app_ailive/LazyLoadData/commonDataLoad",
                ["推荐接口返回完毕"]);
        }});

        DataAccess.requestCollectedChannel({callback: function (data,status) {
            that.setLazyLoadState("getCollection",status);
            JxLog.i([], "App/app_ailive/LazyLoadData/commonDataLoad",
                ["请求收藏信息接口返回完毕"]);
        }});

        if(appMode.mode!==interfaceType.ACTION_OPEN_APP_WITHOUT_LIVE){
            DataAccess.requestSubscription({callback: function (data,status) {
                that.setLazyLoadState("getSubscription",status);
                JxLog.i([], "App/app_ailive/LazyLoadData/commonDataLoad",
                    ["请求订阅信息接口返回完毕"]);
            }});

            jxDataManage.start({callback: function (data,status) {
                that.setLazyLoadState("QueryJxCateAndProgram",status);
                that.setLazyLoadState("QueryJxCate",status);
                JxLog.i([], "App/app_ailive/LazyLoadData/commonDataLoad",
                    ["请求精选分类以及对应节目信息接口返回完毕"]);
            }});
        }
    }

    getLazyLoadState(interfaceName){
        return this.loadingInfo[interfaceName];
    }

    setLazyLoadState(interfaceName,status){
        this.loadingInfo[interfaceName] = status;
    }

    isPageLazyLoadRightForShow(sceneId){
        switch(sceneId) {
            case sceneIds.CHANNEL_MINI_SCENE_ID:
                return this.loadingInfo["QueryCover"]===interfaceBackStatus.SUCCESS;
                break;
            case sceneIds.JX_CATEGORY_SCENE_ID:
                //let count = recommendDataManage.getRecommendData().length;
                if(this.loadingInfo["QueryJxCateAndProgram"]===interfaceBackStatus.SUCCESS){
                    return true;
                }
                return false;
                return ;
                break;
            case sceneIds.SCREEN_SCENE_ID:
                return this.loadingInfo["QueryCover"]===interfaceBackStatus.SUCCESS;
                break;
            default:
        }
        return true;
    }
}

export const lazyLoadData = new LazyLoadData();
export default lazyLoadData;