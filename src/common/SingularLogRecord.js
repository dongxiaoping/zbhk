// +----------------------------------------------------------------------
// | Copyright (js), BestTV.
// +----------------------------------------------------------------------
// | Author: karl.dong
// +----------------------------------------------------------------------
// | Date：2019/1/22
// +----------------------------------------------------------------------
// | Description:
// +----------------------------------------------------------------------
import {DataReport} from './DataReport';
import JxLog from "./Log"
import {LogType} from "./GlobalConst";
import OTTConfig from './CmsSwitch'
import {sysTime} from "./TimeUtils";
class SingularLogRecord {
    constructor() {
        this._singularData = null;
    }

    getSingularData(){
        return this._singularData;
    }

    setSingularData(playInfo){
        JxLog.i([LogType.REPORT], "common/SingularLogRecord/setSingularData",
            ["tag-singularLogRecord、tag-breakpoint-report begin：playInfo", playInfo]);
        let singularData = JSON.stringify(playInfo);
        singularData = JSON.parse(singularData);
        this._singularData = singularData;
    }

    broadcastTimingFinished(){
        JxLog.d([LogType.REPORT], "common/SingularLogRecord/broadcastTimingFinished",
            ["tag-singularLogRecord、tag-breakpoint-report begin：服务器时间校对完毕通知 diff", sysTime.diff]);
        if(this._singularData===null){
            JxLog.i([LogType.REPORT], "common/SingularLogRecord/broadcastTimingFinished",
                ["tag-singularLogRecord、tag-breakpoint-report 没有需要重新上报的校时异常播放数据"]);
            return ;
        }
        JxLog.i([LogType.REPORT], "common/SingularLogRecord/broadcastTimingFinished",
            ["tag-singularLogRecord、tag-breakpoint-report 校时异常的播放数据信息", this._singularData]);
        let newPlayInfo = this.getNewPlayInfoForReport();
        DataReport.send(newPlayInfo);
        JxLog.i([LogType.REPORT], "common/SingularLogRecord/broadcastTimingFinished",
            ["tag-singularLogRecord、tag-breakpoint-report 校时后上报的播放数据信息", newPlayInfo]);
        this._singularData = null;
        JxLog.d([LogType.REPORT], "common/SingularLogRecord/broadcastTimingFinished",
            ["tag-singularLogRecord end"]);
    }

    getNewPlayInfoForReport(){
        let nowTime = sysTime.nowFormat();
        this._singularData.now_time = nowTime;
        this._singularData.endTime = nowTime;
        let beginTime = sysTime.strToTimeStamp(nowTime);
        let breakPointSetIntervalTime = OTTConfig.getBreakPointSetIntervalTime()/1000;
        beginTime = beginTime - breakPointSetIntervalTime;
        beginTime = new Date(parseInt(beginTime)*1000).Format();
        this._singularData.begintime = beginTime;
        return this._singularData;
    }
}

export const singularLogRecord = new SingularLogRecord();
export default singularLogRecord;