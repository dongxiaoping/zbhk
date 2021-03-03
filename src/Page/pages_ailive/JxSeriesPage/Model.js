import {AbstractModel} from "../../../Abstract/scene/AbstractModel";
import {getSchProgramImageUrl} from "../../../common/CommonUtils";
import DataAccess from "../../../common/DataAccess";
import PlayerDataAccess from "../../../common/PlayerDataAccess";
import { sceneIds } from "../../../App/app_ailive/AppGlobal.js";

class Model extends AbstractModel {
    constructor() {
        super();
        this.jxCategoryData = {categoryName: "", programName: ""};    //节目分类及名称
        this.jxSeriesData = [];    //剧集列表
    }
    modelUpdateData(args){
        super.modelUpdateData(args);
        let param = this.getPlayInfo();
        let jxSeekData = PlayerDataAccess.getSchDetailByCategorySchedule(param.categoryCode, param.scheduleCode);
        this.setJxCategoryData(param.categoryCode, jxSeekData);
        this.setJxSeriesData(jxSeekData);
        if(args) {
            args.callback();
        }
    }
    setJxCategoryData(code, jxSeekData) {
        this.jxCategoryData.categoryName = DataAccess.getCateInfo(code);
        this.jxCategoryData.programName = jxSeekData.programName;
    }
    getJxCategoryData() {
        return this.jxCategoryData;
    }
    setJxSeriesData(jxSeekData) {
        let allSeries = jxSeekData.allSchedules;
        for(let i=0; i<allSeries.length; i++) {
            let item = allSeries[i];
            item.seriesImgUrl = getSchProgramImageUrl(item.ChannelCode, item.ScheduleCode, item.StartTime);
            item.fullName = item.Name + item.NamePostfix;
        }
        this.jxSeriesData = allSeries;
    }
    getJxSeriesData() {
        return this.jxSeriesData;
    }
    getListAllCount() {
        let count = 0;
        if(this.jxSeriesData) {
            count = this.jxSeriesData.length;
        }
        return count;
    }
    getSeriesByScheduleCode(scheduleCode) {
        if(this.jxSeriesData) {
            let len = this.jxSeriesData.length;
            for(let i=0; i<len; i++) {
                if(this.jxSeriesData[i].ScheduleCode == scheduleCode) {
                    return this.jxSeriesData[i];
                }
            }
        }
        return null;
    }
    getPlayInfo() {
        return window.WebApp.Nav.getNavParams(sceneIds.JX_SERIES_SCENE_ID);
    }
}

export const model = new Model();
export default {model}
