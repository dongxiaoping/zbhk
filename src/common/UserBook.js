//用户预约相关功能
import {msgType, actionType} from "./GlobalConst"
import {findIndex, circleList} from "../lib/lodash"
import DataAccess from "./DataAccess";
import {sysTime} from "./TimeUtils";
import {webCookie} from "./LocalStorage";
import JxLog from "./Log";
import Config from "./Config";
import OTTConfig from "./CmsSwitch";
import {processNotExistTips} from "./CommonUtils";

class UserBookManage {
    constructor () {
        this.bookList = [];
        this._isBookListHasInit = false;
        this._setTimeoutFlag = -99999;
        this.upcomingBookList = [];
        this.nowBookTip = null;
    }

    //从应用端获取用户预约信息
    getBookingFromLocal () {
        return this.bookList;
    }

    isBookListHasInit (){
        return this._isBookListHasInit;
    }

    setBookingToLocal (list) {
        let that = this;
        this.bookList = list;
        this._isBookListHasInit = true;
        setTimeout (function () {
            that._reStartPlayingBookNotice ();
        }, 12*1000);
    }

    getBookFromCookie() {
        let items = webCookie.getItem(Config.mBookCode);
        if (items === null) {
            return [];
        } else {
            items = JSON.parse(items);
            return items;
        }
    }

    setBookToCookie() {
        webCookie.setItem(Config.mBookCode, JSON.stringify(this.bookList));
    }

    /* 修改本地的预约信息
     * @list 预约信息列表
     * @modType 'insert' 表示插入 'delete' 表示删除
     * */
    editBookingToLocal (list,modType) {
        if (modType == actionType.INSERT) {
            let uds = OTTConfig.getUDSUrl();
            if((uds == '' && this.bookList.length >= Config.mBookLimt) || (uds != '' && this.bookList.length >= Config.mBookLimitUDS)) {
                JxLog.w('common/UserBook/editBookingToLocal', 'Book items number out of range!');
                processNotExistTips("预约容量已满！");
                return false;
            }
        }
        let that = this;
        circleList (list, function (item) {
            let index = findIndex (that.bookList, function (o) {
                return (o.channelCode === item.channelCode && o.programName === item.programName && o.scheduleCode === item.scheduleCode);
            });
            if (index === -1 && modType === actionType.INSERT) {
                let location = findIndex (that.bookList, function (o) {
                    return (o.startTime > item.startTime);
                });
                if (location !== -1) {
                    that.bookList.splice(location, 0, item);
                } else {
                    that.bookList.push (item);
                }
            }
            if (index !== -1 && modType === actionType.DELETE) {
                that.bookList.splice(index, 1);
            }
        });
        this.setBookToCookie();
        this._reStartPlayingBookNotice ();
        return true;
    }

    //判断是否已预约
    isBooked (channelCode = null, programName = null, scheduleCode = null) {
        let index = findIndex (this.bookList, function (o) {
            return (o.channelCode === channelCode && o.programName === programName && o.scheduleCode === scheduleCode);
        });
        return index !== -1;
    };

    //取消预约
    unBook (channelCode = null, programName = null, scheduleCode = null, startTime = null, endTime = null) {
        DataAccess.editBooking ([{channelCode:channelCode, programName:programName, scheduleCode:scheduleCode,
            startTime:startTime, endTime:endTime}], actionType.DELETE);
        return this.editBookingToLocal ([{channelCode:channelCode, programName:programName, scheduleCode:scheduleCode}],'delete');
    };

    //进行预约
    book (channelCode = null, programName = null, scheduleCode = null, startTime = null, endTime = null) {
        let bookTime = sysTime.nowFormat ();
        DataAccess.editBooking ([{channelCode:channelCode, programName:programName, scheduleCode:scheduleCode,
            startTime:startTime, endTime:endTime, bookTime:bookTime}], actionType.INSERT);
        return this.editBookingToLocal ([{channelCode:channelCode, programName:programName, scheduleCode:scheduleCode,
            startTime:startTime, endTime:endTime, bookTime:bookTime}], actionType.INSERT);
    };

    //执行操作，如果未预约，执行预约。如果已预约，取消预约
    exec (channelCode = null, programName = null, scheduleCode = null, startTime = null, endTime = null) {
        let flag = this.isBooked (channelCode, programName, scheduleCode);
        if (flag) {
            flag = this.unBook (channelCode, programName, scheduleCode);
        } else {
            flag = this.book (channelCode, programName, scheduleCode, startTime, endTime);
        }
        return flag;
    };

    //获取当前正显示的提示
    getNowBookTip() {
        return this.nowBookTip;
    }

    //有相同开始时间的预约信息：若预约提示自动消失,则不再弹出相同时间的预约提示,查找下一个即将开始的预约
    //没有相同开始时间的预约节目, 查找下一即将开始的预约节目
    // clearSameStartTimeTip() {
    //     if (this.upcomingBookList.length > 1) {
    //         this.upcomingBookList = [];
    //         this._reStartPlayingBookNotice();
    //     } else if((this.upcomingBookList.length > 0)) {
    //         this._reStartPlayingBookNotice(this.upcomingBookList[0]);
    //     }
    // }

    //有相同开始时间的预约信息：则弹出第二条同开始时间的预约信息
    //没有相同开始时间的预约节目：则查找下一即将开始的预约节目
    processNextBookTip() {
        if(this.upcomingBookList.length>0) {
            if(this.nowBookTip.startTime == this.upcomingBookList[0].startTime) {
                this.upcomingBookList.splice(0, 1);
                if (this.upcomingBookList.length>0) {
                    this.nowBookTip = this.upcomingBookList[0];
                    window.WebApp.messageBroadcast(msgType.BOOK_PLAYING, this.upcomingBookList[0]);
                }
            }
        } else {
            this._reStartPlayingBookNotice();
        }
    }

    //重新开始预约节目即将开始广播通知
    _reStartPlayingBookNotice (ignoreItem = null) {
        let that = this;
        clearTimeout(this._setTimeoutFlag);
        this.upcomingBookList = this._getUpcomingBookList(ignoreItem);
        if(this.upcomingBookList.length > 0) {
            let nowStamp = sysTime.now();
            let tipItem = this.upcomingBookList[0];
            let upcomingBookProgramBeginStamp = sysTime.strToTimeStamp(tipItem.startTime);
            let timeSet = upcomingBookProgramBeginStamp - nowStamp - 10;
            if(timeSet > 0) {
                this._setTimeoutFlag = setTimeout(function () {
                    that.nowBookTip = tipItem;
                    window.WebApp.messageBroadcast(msgType.BOOK_PLAYING, tipItem);
                }, timeSet * 1000);
            } else {
                that.nowBookTip = tipItem;
                window.WebApp.messageBroadcast(msgType.BOOK_PLAYING, tipItem);
            }
        }
    }

    //获取即将播放的节目信息(相同开始时间的，返回多个)
    _getUpcomingBookList (ignoreItem = null) {
        let that = this;
        let nowStamp = sysTime.now ();
        let upcomingBook = [];
        if (!this.bookList) {
            return upcomingBook;
        }
        let i, len = that.bookList.length;
        for(i=0; i<len; i++) {
            let item = that.bookList[i];
            let channelInfo = DataAccess.getChannelInfo(item.channelCode);
            if (channelInfo === null){
                continue;
            }
            if (ignoreItem && ignoreItem.channelCode === item.channelCode && ignoreItem.programName === item.programName
                && ignoreItem.scheduleCode === item.scheduleCode){
                continue;
            }
            let programBeginStamp = sysTime.strToTimeStamp (item.startTime);
            if(programBeginStamp > nowStamp) {
                if(upcomingBook.length==0) {
                    upcomingBook.push(item);
                } else {
                    if(item.startTime == upcomingBook[0].startTime) {   //相同时间
                        upcomingBook.push(item);
                    }
                }
            }
        }
        return upcomingBook;
    }
}

export const Book = new UserBookManage ();
export default Book;