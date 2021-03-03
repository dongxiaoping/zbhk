// +----------------------------------------------------------------------
// | Copyright (js), BestTV.
// +----------------------------------------------------------------------
// | Author: karl.dong
// +----------------------------------------------------------------------
// | Date：2018/10/25
// +----------------------------------------------------------------------
// | Description: 延迟加载数据管理对象，主要用于管理进入首页后，不定时的数据加载管理
// +----------------------------------------------------------------------
import SyncSchedule from '../../common/SyncSchedule.js';
import {OTTConfig} from "../../common/CmsSwitch";
import modelManage from '../../App/app_zbhk/ModelManage.js';
import { interfaceType } from '../../common/GlobalConst.js';

export class AbstractLazyLoadData {
    constructor() {

    }
    start(){
        this.commonDataLoad();
        if(OTTConfig.liveSwitch() && modelManage.getModeType() != interfaceType.ACTION_LIVE_CHANNEL_LOCK) {
            SyncSchedule.initChannelScheduleData();
            SyncSchedule.refreshChannelScheduleData();
            SyncSchedule.refreshChannelCurrentSch();
        }
    }

    commonDataLoad() {

    }
}
export default {
    AbstractLazyLoadData
}