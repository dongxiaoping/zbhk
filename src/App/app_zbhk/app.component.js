import DataAccess from "../../common/DataAccess";
import PlayerDataAccess from "../../common/PlayerDataAccess";
import {sysTime } from "../../common/TimeUtils";
import {mediaType} from "../../common/GlobalConst";
import OTTConfig from "../../common/CmsSwitch";
import {getPlayingScheduleLocation} from "../../common/CommonUtils";
import JxLog from "../../common/Log";
import {KeyCode} from "../../common/FocusModule"
import { view } from "../../Page/pages_zbhk/LoadingPage/View";

class ProgramPlayTipBar {
    constructor() {
        this.marqueeWordCountLimit = 35;//跑马灯字数阈值
        this.info = null;//播放标题提示信息数据集合
        this.showSetTimeout = null;
    }

    setInfo(info){
        this.info=info;
    }
    
    getInfo(){
        return this.info;
    }

    updateBar(){
        if(this.info==null) {
            return null;
        }
        let firstPart = this.info.firstPart;
        let secondPart = this.info.secondPart;
        let thirdPart = this.info.thirdPart;
        let progressValue = this.info.progressValue;
        let middleDiv = document.getElementById("play_program_tip_bar_middle_id");
        document.getElementById("play_program_tip_bar_schedule_id").style.width=progressValue+"%";
        middleDiv.innerHTML = '';
        let programNameDiv = document.getElementById("play_program_tip_program_name_id");
        programNameDiv.innerHTML=firstPart;
        middleDiv.innerHTML='<div id="now_play_program_name_id" style="width: 100%;overflow: hidden;color:#B9B9BA;margin-left:8px;height:30px;text-overflow:ellipsis;font-family:"Microsoft YaHei Regular";">'+secondPart+'</div>' +
            '</br><div  id="next_play_program_name_id"  style="width: 100%;color:#B9B9BA;font-size: 16px;margin-left:8px;position: absolute;top:80px;overflow: hidden;text-overflow:ellipsis;white-space:nowrap;">'+thirdPart+'</div>';
    }

    show(time=null) {//单位毫秒
        let that = this;
        if(this.showSetTimeout){
            clearTimeout(this.showSetTimeout);
            this.showSetTimeout = null;
        }
        let play_program_tip_bar=document.getElementById("play_program_tip_bar_id");
        play_program_tip_bar.style.display="block";
        if(time===null){
            return;
        }
        that.showSetTimeout = setTimeout(function(){
            let play_program_tip_bar=document.getElementById('play_program_tip_bar_id');
            play_program_tip_bar.style.display='none';
        }, time);
    }

    hidden(){
        if(this.showSetTimeout){
            clearTimeout(this.showSetTimeout);
            this.showSetTimeout = null;
        }
        let play_program_tip_bar=document.getElementById("play_program_tip_bar_id");
        play_program_tip_bar.style.display="none";
    }

    /*根据当前播放信息获取屏显信息
    * @playInfo 播放信息
    * @return 屏显信息 {firstPart:"118 湖南卫视",secondPart:"正男汉子（第二季）正正男汉子（第二的的",thirdPart:"即将直播：晚间整点新闻",progressValue:80}
    * */
    getAndShowPlayTipBarInfoByPlayInfo (playInfo) {
        try {
            this.hidden ();
            let showData = {firstPart: "", secondPart: "", thirdPart: "", progressValue: 80};
            let channelInfo = DataAccess.getChannelInfo (playInfo.channelCode);
            if (!channelInfo) {
                return null;
            }
            showData.firstPart = channelInfo.ChannelName;
            if (OTTConfig.showChannelNo ()) {
                showData.firstPart = channelInfo.ChannelNo + " " + channelInfo.ChannelName;
            }
            showData.secondPart = (channelInfo.CurrentSchedule && channelInfo.CurrentSchedule.Name) ? "正在直播:" + channelInfo.CurrentSchedule.Name : "暂无节目名称";
            showData.thirdPart = (channelInfo.NextSchedule && channelInfo.NextSchedule.Name) ? "即将直播:" + channelInfo.NextSchedule.Name : "暂无节目名称";
            switch (playInfo.type) {
                case mediaType.LIVE:
                    DataAccess.requestChannelSchedule ({
                        channelCode: playInfo.channelCode, callback: function (channelProgram) {
                            if (channelProgram && channelProgram.Schedule) {
                                let now = sysTime.date ().Format ();
                                let programs = channelProgram.Schedule;
                                let playingIndex = getPlayingScheduleLocation (programs)
                                if (playingIndex != -1) {
                                    let currentSchedule = programs[playingIndex];
                                    let progress = parseInt ((now - currentSchedule.StartTime) / (currentSchedule.EndTime - currentSchedule.StartTime) * 100);
                                    DataAccess.setCurrentProgramInfoForChannelInfo (playInfo.channelCode, currentSchedule);
                                    showData.progressValue = progress;
                                    showData.secondPart = "正在直播:" + currentSchedule.Name || "";
                                    if (playingIndex < (programs.length - 1)) {
                                        showData.thirdPart = "即将直播:" + programs[playingIndex + 1].Name || "";
                                    } else {   //直播的是当天的最后一个节目,后续节目是第二天节目单第一个节目
                                        showData.thirdPart = "即将直播:暂无节目名称";
                                        let tomorrowTime = sysTime.strToTimeStamp (currentSchedule.StartTime) + 24 * 60 * 60;
                                        let tomorrowDate = new Date (tomorrowTime * 1000).Format ("yyyy-MM-dd");
                                        DataAccess.requestChannelSchedule ({
                                            channelCode: playInfo.channelCode,
                                            startDate: tomorrowDate.concat (" 00:00:00"),
                                            endDate: tomorrowDate.concat (" 23:59:59"),
                                            callback: function (tomorrowProgram) {
                                                if (tomorrowProgram && tomorrowProgram.Schedule && tomorrowProgram.Schedule[0].Name) {
                                                    showData.thirdPart = "即将直播:" + tomorrowProgram.Schedule[0].Name;
                                                }
                                                programPlayTipBar.setInfo (showData);
                                                programPlayTipBar.updateBar ();
                                                programPlayTipBar.show (5000);
                                            }
                                        });
                                        return
                                    }
                                }
                                programPlayTipBar.setInfo (showData);
                                programPlayTipBar.updateBar ();
                                programPlayTipBar.show (5000);
                            }
                        }
                    });
                    break;
                case mediaType.SCH:
                    let reviewDetail = PlayerDataAccess.getReviewDetailByChannelSchedule (playInfo);
                    if (reviewDetail.PlayProgramName == "暂无节目名称") {  //播放预约回看节目，屏显需要请求频道一天节目单
                        let that = this;
                        let startTime = playInfo.startTime;
                        let day = startTime.substr(0, 4) + "-" + startTime.substr(4, 2) + "-" + startTime.substr(6, 2);
                        DataAccess.requestChannelSchedule({
                            channelCode: playInfo.channelCode,
                            startDate: day + " 00:00:00",
                            endDate: day + " 23:59:59",
                            callback: function () {
                                reviewDetail = PlayerDataAccess.getReviewDetailByChannelSchedule(playInfo);
                                that.showSchProgramPlayTip(reviewDetail, showData, playInfo);
                            }
                        })
                    } else {
                        this.showSchProgramPlayTip(reviewDetail, showData, playInfo);
                    }
                    break;
                default:
                    break;
            }
            return showData;
        } catch (e) {
            JxLog.e ([], 'app_zbhk/app.component/getAndShowPlayTipBarInfoByPlayInfo', [e.toLocaleString ()]);
            return null
        }
    }

    //回看节目播放右下角屏显
    showSchProgramPlayTip(reviewDetail, showData, playInfo) {
        let now = sysTime.date().Format();
        showData.secondPart = "正在回看:" + reviewDetail.PlayProgramName || "";
        let info = PlayerDataAccess.getNextReviewProgram(playInfo);
        let name = "";
        if (info.detail && info.detail.Name) {
            name = info.detail.Name;
            showData.thirdPart = ((info.detail.EndTime >= now) ? "即将直播：" : "即将回看：") + name;
        }
        programPlayTipBar.setInfo(showData);
        programPlayTipBar.updateBar();
        programPlayTipBar.show(5000);
    }
}
export const programPlayTipBar = new ProgramPlayTipBar();

//菜单按键的响应
class PageKeyResponse {
    menuUpDownResponse(keyValue, channelView, model, focusManage) {
        let originOffset = channelView.offset;
        if(keyValue == KeyCode.KEY_PAGE_UP) {
            if(channelView.offset < channelView.contentSize){
                return;  //往前翻，不够一页，不响应
            } else {
                channelView.offset -= channelView.contentSize;
            }
        } else if(keyValue == KeyCode.KEY_PAGE_DOWN){
            channelView.offset += channelView.contentSize;
            let categoryCode = model.getSelectedCategoryCode ();
            let list = model.getCategoryInfoByCode (categoryCode);
            let allChannel = list.Channels;
            if(channelView.offset > allChannel.length) {
                channelView.offset = originOffset;
                return;
            }
        }
        let location = focusManage.getFocusLocation();
        location.y = 0;
        focusManage.lostNotice ();
        focusManage.setFocusLocation (location);
        channelView.viewUpdateData ();
        channelView.viewPage ();
        focusManage.nodeUpdate ();
        focusManage.nodeFocus ();
    }

    coverUpDownResponse(keyValue, view, focusManage) {
        if(keyValue == KeyCode.KEY_PAGE_UP) {
            if(view.currentPage==1 || view.totalPage==1) {
                return;
            } else {
                view.currentPage--;
            }
        } else if(keyValue == KeyCode.KEY_PAGE_DOWN) {
            if(view.currentPage==view.totalPage) {
                return;
            } else {
                view.currentPage++;
            }
        }
        let focusLocation= {x:2, y:0};
        view.setLostLocation(focusLocation);
        view.viewUpdateData();
        view.viewPage();
        focusManage.setFocusLocation(focusLocation);
        focusManage.nodeUpdate();
        focusManage.nodeFocus();
    }
}
export const pageKeyResponse = new PageKeyResponse();

//预约显示
class BookTipBar {
    constructor () {
        this.bookTimeout = null;
        this.showTime = 3000;
        this.bookTipEle = document.getElementById('book_operation_tip');
        this.contentEle = document.getElementById('book_program');
        this.operationEle = document.getElementById('operation_tip');
        this.successTipEle = document.getElementById('success_tip');
    }

    showBookTip(succsss, content) {
        if (this.bookTimeout) {
            clearTimeout(this.bookTimeout);
            this.bookTimeout = null;
        }
        this.successTipEle.style.display = succsss ? "block" : "none";
        this.contentEle.innerHTML = content;
        this.operationEle.innerHTML = succsss ? "节目预约成功！" : "节目预约已取消！";
        this.bookTipEle.style.display = "block";
        let that = this;
        setTimeout(function() {
            that.bookTipEle.style.display="none";
        }, this.showTime);
    }

    clearBookTip() {
        this.bookTipEle.style.display = "none";
        clearTimeout(this.bookTimeout);
        this.bookTimeout = null;
    }

    isBookTipShow() {
        if(this.bookTipEle.style.display == "block") {
            return true;
        }
        return false;
    }
}
export const bookTipBar = new BookTipBar();

//*或ok提示的显示
class StarTipBar {
    constructor() {
        this.starTipEle = document.getElementById("star-button-tips");
    }

    show() {
        if (OTTConfig.responseStarButton()) {
            this.starTipEle.innerHTML = '按"*"键查看频道节目单';
        }
        this.starTipEle.style.display = "block";
    }

    hidden() {
        this.starTipEle.style.display = "none";
    }
}
export const starTipBar = new StarTipBar();

export default {programPlayTipBar, pageKeyResponse, bookTipBar, starTipBar}