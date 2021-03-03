//应用常量
import LoadingScene from "../../Page/pages_ailive/LoadingPage/Scene"
import PlayerScene from "../../Page/pages_ailive/PlayerPage/Scene"
import ScreenScene from "../../Page/pages_ailive/ScreenPage/Scene"
import ChannelMiniScene from "../../Page/pages_ailive/ChannelMiniPage/Scene"
import ChannelProgramScene from "../../Page/pages_ailive/ChannelProgramPage/Scene"
import jxNoRecommendScene from "../../Page/pages_ailive/JxCategoryPage/Scene"
import LiveSeekScene from "../../Page/pages_ailive/LiveSeekPage/Scene"
import SeekScene from "../../Page/pages_ailive/SeekPage/Scene"
import ExitScene from "../../Page/pages_ailive/ExitPage/Scene"
import ErrorScene from "../../Page/pages_ailive/ErrorPage/Scene"
import JxSeriesScene from "../../Page/pages_ailive/JxSeriesPage/Scene"
import SchProgramScene from "../../Page/pages_ailive/SchProgramPage/Scene"

export const sceneIds = {
    LOADING_SCENE_ID: "loading_scene", //loading页面
    PLAYER_SCENE_ID: "player_scene",  //播放器页面
    SCREEN_SCENE_ID: "screen_scene", //屏显+点播推荐页面
    CHANNEL_MINI_SCENE_ID: "channel_mini_scene",   //直播频道迷你菜单
    JX_CATEGORY_SCENE_ID:"jx_no_recommend_scene", //精选回看分类页面
    CHANNEL_PROGRAM_SCENE_ID: "channel_program_scene",    //直播频道节目单页面（按天回顾节目单）
    LIVE_SEEK_SCENE_ID: "live_seek_scene",          //直播快进快退页面
    SEEK_SCENE_ID: "seek_scene",            //精选或回看的播控页面
    EXIT_SCENE_ID: "exit_scene",             //退出页面
    ERROR_SCENE_ID: "error_scene",             //错误页面
    JX_SERIES_SCENE_ID: 'jx_series_scene',      //精选剧集列表页面
    SCH_PROGRAM_SCENE_ID: 'sch_program_scene'   //回看节目单列表页面
};

export const scenesMap=[];
scenesMap[sceneIds.JX_CATEGORY_SCENE_ID] = jxNoRecommendScene;
scenesMap[sceneIds.LOADING_SCENE_ID] = LoadingScene;
scenesMap[sceneIds.PLAYER_SCENE_ID] = PlayerScene;
scenesMap[sceneIds.SCREEN_SCENE_ID] = ScreenScene;
scenesMap[sceneIds.CHANNEL_MINI_SCENE_ID] = ChannelMiniScene;
scenesMap[sceneIds.CHANNEL_PROGRAM_SCENE_ID] = ChannelProgramScene;
scenesMap[sceneIds.LIVE_SEEK_SCENE_ID] = LiveSeekScene;
scenesMap[sceneIds.SEEK_SCENE_ID] = SeekScene;
scenesMap[sceneIds.EXIT_SCENE_ID] = ExitScene;
scenesMap[sceneIds.ERROR_SCENE_ID] = ErrorScene;
scenesMap[sceneIds.JX_SERIES_SCENE_ID] = JxSeriesScene;
scenesMap[sceneIds.SCH_PROGRAM_SCENE_ID] = SchProgramScene;