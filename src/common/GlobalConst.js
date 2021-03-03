//通用的常量定义
export const sceneStatus = {
    INITED: 0,  //初始化过
    DISPLAY: 1, //显示
    MASKED: 2, // 被遮罩
    HIDDEN: 3, //隐藏
    DESTROYED:4, //销毁
    PAGE_FALL_TOP:5,//瀑布流页面的顶部
    PAGE_FALL_BOTTOM:6//瀑布流页面的底部
};

export const moveType = {
    LIST_MOVE:"listMove",   //数据列表移动
    FOCUS_MOVE:"focusMove"   //焦点移动
};

//接口缓存数据的key
export const interfaceCacheKey = {
    ALL_LIVE_CHANNEL: "allLiveChannel",                    //所有直播频道
    CATEGORY_LIVE_CHANNEL: "categoryLiveChannel",          //其他直播分类及其频道
    JX_CATRGORY: "jxCate",                                  //精选分类
};

//播放媒体类型
export const mediaType = {
    LIVE:1, //直播
    JX:2, //精选（回看拆条）
    SCH:3  //回看（直播回顾）
};
//上下键行为
export const keyUpDownOperation = {
    DO_NOTHING: 0,                    //不响应
    SWITCH_CHANNEL_PROGRAM_ADD: 1,    //直播切换频道（上键减频道，下键加频道）;回看切换节目；精选切换剧集，
    SHOW_MENU: 2,                     //直播呼出迷你菜单页；回顾呼出频道节目单页；回看呼出精选分类页
    SWITCH_CHANNEL_PROGRAM_SUB: 3     //直播切换频道（上键加频道，下键减频道）;
};
export const jxCategoryPageParamType = {
    SUB: "sub",//订阅
    CATEGORY: "category",//分类
    RECOMMEND: "recommend", //推荐
    OPERATE: "operate" //操作
};

export const exitPageParamType = {
    EXIT_BUTTON: 1,//退出按钮
    FUNCTION_LABEL: 2,//订阅
    RECOMMEND_LIST: 3, //推荐列表
    FUNCTION_JX_LIVE_LABEL:4,//精选的直播按钮
    ORDER_BUTTON: 5     //直播或回看的订购按钮
};

//“全部”分类的code
export const defaultLiveCode = "live_new";

export const liveInfo = {
    CODE: defaultLiveCode,
    NAME: "最新"
};

export const notExistTips = {
    CHANNEL_TIPS: "该频道不存在，请选择其他频道",
    PROGRAM_TIPS: "该节目不存在，请选择其他节目"
};

/*应用广播类型*/
export const msgType = {
    PLAYER_STATE: "playerState",      //播放器状态消息
    SUBSCRIPTION_CHANGE: "subscriptionChange",    //订阅信息改变
    FONT_ADJUST:"fontAdjust",//字体调整
    NODE_TRIGGER:"nodeTrigger",//应用节点触发通知
    BOOK_PLAYING: "bookPlaying", //预约节目即将播放
};

/*应用节点集合*/
export const appNode = {
    APP_START:"app_start",//程序开始执行js程序
    FIRST_PAGE_SHOW:"firstPageShow",//第一个页面完全显示
    KEY_EVENT:"keyEvent",//遥控器事件
    SWITCH_PAGE:"switchPage",//页面跳转
};

export const playerResponse = {
    PLAYER_LOAD_END: 0,   //auth接口返回播放地址结束
    PLAYER_START_PLAY: 1, //开始播放
    PLAYER_PLAYING: 2,    //正在播放中
    PLAYER_PAUSED: 3,     //暂停中
    PLAYER_RESUMED: 4,    //继续播放
    PLAYER_SEEKING_VIEW: 5,    //快进快退seeking更新view
    PLAYER_SEEKING_DATA: 6,    //快进快退seeking更新data
    PLAYER_STOP: 7,    //播放停止
    PLAYER_BUFFERING: 8        //缓冲中
};

//定义对外接口类型
export const interfaceType = {
    ACTION_OPEN_APP: "Normal",                           //1. 直接进入电视精选的接口
    ACTION_OPEN_APP_WITHOUT_LIVE:"NormalWithOutLive",   //1.直接进入电视精选的接口无直播
    ACTION_RESTORE_PREV_STATE_LIVE: "RestorePrevStateLive",       //2.1. 恢复电视精选应用上下文接口：恢复直播播放
    ACTION_RESTORE_PREV_STATE_SCH: "RestorePrevStateSch",         //2.2. 恢复电视精选应用上下文接口：恢复回看播放
    ACTION_RESTORE_PREV_STATE_JX: "RestorePrevStateJx",           //2.3. 恢复电视精选应用上下文接口：恢复精选播放
    ACTION_PLAY_BY_CHANNEL_CODE: "PlayByChannelCode",             //3.1. 按传入的参数播放：直播-根据channelCode播放
    ACTION_PLAY_BY_PROJECT_CODE: "PlayByProjectCode",             //3.2. 按传入的参数播放：直播-根据项目code定位到直播频道播放
    ACTION_PLAY_BY_PROGRAM_KEY: "PlayByProgramKey",               //3.3. 按传入的参数播放：回看-根据回看分类及节目关键字播放
    ACTION_PLAY_BY_PROGRAM_INDEX: "PlayByProgramIndex",           //3.4. 按传入的参数播放：回看-根据回看分类及节目下标播放
    ACTION_PLAY_BY_PROGRAM_SCHEDULE_CODE: "PlayByProgramScheduleCode",    //3.5. 按传入的参数播放：回看-根据回看分类及节目scheduleCode播放
    ACTION_LIVE_CHANNEL_LOCK: "LiveChannelLock",  //直播频道锁定
    ACTION_GET_VERSION: "GetVersion"                      //4. 获取应用版本
};

//不同模式下，对应的需要请求的接口状态集合
export const interfaceTypeRelyReq = {
    "Normal":{"QueryCover":false},
    "NormalWithOutLive":{"QueryJxCateAndProgram":false},
    "RestorePrevStateLive":{},
    "RestorePrevStateSch":{},
    "RestorePrevStateJx":{"QueryJxCateAndProgram":false},
    "PlayByChannelCode":{},
    "PlayByProjectCode":{},
    "PlayByProgramKey":{},
    "PlayByProgramIndex":{},
    "PlayByProgramScheduleCode":{},
    "GetVersion":{}
};

export const paramType = {
    BY_CHANNEL_CODE: 1,    //直播：根据channelcode进行直播频道的播放并定位
    BY_PROJ_CHANNEL: 2,    //直播：根据proj|chmark进行直播频道的播放并定位
    BY_PROGRAM_KEY: 3,     //回看：根据指定分类下节目的关键字key进行回看节目的播放并定位
    BY_PROGRAM_INDEX: 4,   //回看：根据指定分类下节目的下标index进行回看节目的播放并定位
    BY_SCHEDULE_CODE: 5    //回看：根据指定分类下节目的scheduleCode进行回看节目的播放并定位
};

//操作类型 insert:新增 update:更新 delete:删除
export const actionType = {
    INSERT: "insert",
    DELETE: "delete",
    UPDATE:"update"
};

//接口返回状态定义
export const interfaceBackStatus = {
    SUCCESS:1,
    FAIL:2,
    TIMEOUT:3,
    DATA_BACK_ERROR:4//返回的数据异常
};

//加载动画类型
export const loadingType = {
    PLAY_LOADING_TYPE: 1,    //播放加载
    PAGE_LOADING_TYPE:2    //页面加载
};

//播控页面按钮类型
export const seekButtonType = {
    FORWARD: 1,        //快进
    BACKWARD: 2,       //快退
    PLAY: 3,           //播放
    PAUSE: 4           //暂停
};

//频道节目单页面-数据更新方式
export const programUpdateDataType = {
    BY_PLAY_INFO: 1,    //根据播放信息更新数据
    BY_DATE: 2          //根据日期更新数据
};

//推荐位每一位用于界面推荐的开关控制
export const vodRecommendSwitch = {
    EXIT_VOD_RECOMMEND: 0,    //退出页面点播推荐
    SCREEN_VOD_RECOMMEND: 1,  //屏显页面点播推荐
    PROGRAM_VOD_RECOMMEND: 2, //频道节目单页面点播推荐
    JX_VOD_RECOMMEND:3,       //精选页面点播推荐
    TOTAL_VOD_RECOMMEND: 4    //总的点播推荐开关
};

//屏显界面，按钮的类型
export const screenEntryType = {
    PAY_ENTRY: 0,        //订购入口
    PROGRAM_ENTRY: 1,    //节目单入口
    COLLECTION_ENTRY: 2, //收藏按钮入口
    REC_ENTRY: 3         //点播推荐入口
};

export const channelInfoShowType = {
    HIDDEN: 0,     //不显示频道号
    REAL: 1,       //显示真实频道号
    VIRTUAL: 2     //显示虚拟频道号
};

//遥控器事件类型
export const eventType = {
    FIRST_DOWN:1,
    CLICK: 2,
    HOLD_BEGIN:3,
    HOLDING: 4,
    HOLD_END:5
};

//播放行为
export const playAction = {
    PLAY_OVER:0, //播放结束
    ERROR_EXIT:1, //异常退出
    USER_EXIT:2, //用户主动退出
    USER_PLAY:3, //用户主动播放
    AUTO_PLAY_NEXT:4 //自动播放下一个
};

//付费鉴权回调之后，需要根据是否付费，跳转到不同的页面
export const laterShowType = {
    SCREEN_SCENE: 1,                //无论付费与否，都跳转到屏显页面
    LIVE_OPERATION_TIPS: 2,         //付费节目跳转到屏显页面，非付费节目显示直播操作提示
    SCH_OPERATION_TIPS: 3,          //付费节目跳转到屏显页面，非付费节目显示回看操作提示
};

//一天节目单节目类型
export const programTimeType ={
    IS_LIVE:"直播",//当前正在播的节目
    IS_LOOK_BACK:"回看",//已播放的节目
    IS_FORE_SHOW:"预约"//未开始的节目
};

export const coverType = {
    HIDDEN: 0,          //不显示封套
    CHANNEL_LIST: 1,    //频道列表封套
    CHANNEL_IMAGE: 2    //频道九宫格图片封套
};

export const liveOkResponse = {
    PROGRAM_LIST: 0,           //ok呼出节目单列表，落焦在直播节目上
    CATEGORY_LIST: 1,          //ok呼出分类列表
    PROGRAM_FOCUS_CHANNEL: 2   //ok呼出节目单列表，落焦在频道上
};

//封套（追剧、收藏）页面模式
export const coverPageMode = {
    LIST: 0,      //列表模式
    EDIT: 1,      //编辑模式
    CONFIRM: 2    //确认模式
};

export const LogType = {
    PLAY: '_play_', //播放
    INTERFACE: '_interface_', //接口
    REPORT: '_report_', //上报
    EVENT: '_event_', //事件 包括遥控器事件  播放事件 广播事件等
    PLAY_EVENT: '_play_event_', //播放器事件
    PAGE: '_page_',  //页面事件
    KEY_EVENT: '_key_event_' //遥控器事件
};

//开关状态
export const switchState = {
    off:0,
    on:1
};

//模式类型
export const modeType = {
    Normal: 0,  //普通模式
    Single: 1  //单频道模式
};

export const defaultBookInfo = {
    Code: "Book",
    Name: "预约"
};