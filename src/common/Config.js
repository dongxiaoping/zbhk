//通用的配置文件
export default {
    AppVersion: "THE_FLASH_4.10.3.0_20210111.01", // 应用版本
    ModuleAppCode: "SERVICE_H5JINGXUAN", // module调用的AppCode, 日志上报中的appcode
    vodAction: "bestv.ott.action.online.main", //直播跳转到点播，用到的跳转code
    AppFlag: "THE_FLASH", // 应用标识
    logLevel: "INFO", // ERROR,WARN,INFO,DEBUG
    supportMaxSeekTime: 1 * 3600, //支持的最大直播时移（单位：秒）
    channelNoAddNum: 10, //虚拟频道号显示需要添加的数值
    mCollectionLimit: 16, //收藏的个数限制
    mSubscriptionLimit: 8, //订阅的个数限制
    mBookLimt: 8,       //预约的个数限制(无uds)
    mBookLimitUDS: 100, //预约的个数限制(有uds)
    nextDayScheduleGetTime: "22:00:00", //第二天的节目单下发时间
    mCollectionCode: "live_collection",
    mSubscriptionCode: "subscription_local",
    mBookCode: "book_local",
    breakPointSetIntervalTime: 10 * 60 * 1000,
    maxChannelReqSch: 20,
    supportCacheAuthResult: true, //默认支持鉴权地址的缓存
    authResultCacheTime: 4 * 3600, //鉴权地址的本地缓存时间
    schProgramContactPlayUrl: true, //回看节目是否拼接播放地址（starttime/endtime/playseek）
    imgPath: "/screenShootCenter/", //默认实施截图图片路径
};