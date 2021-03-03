//应用常量
import LoadingScene from "../../Page/pages_zbhk/LoadingPage/Scene"
import PlayerScene from "../../Page/pages_zbhk/PlayerPage/Scene"
import CategoryPlayMenuScene from "../../Page/pages_zbhk/CategoryPlayMenuPage/Scene"
import ChannelPlayMenuScene from "../../Page/pages_zbhk/ChannelPlayMenuPage/Scene"
import CoverScene from "../../Page/pages_zbhk/CoverPage/Scene"
import CoverImageScene from "../../Page/pages_zbhk/CoverImagePage/Scene"
import ExitScene from "../../Page/pages_zbhk/ExitPage/Scene"
import LookbackScene from "../../Page/pages_zbhk/LookbackPage/Scene"
import SeekScene from "../../Page/pages_zbhk/SeekPage/Scene"
import LiveSeekScene from "../../Page/pages_zbhk/LiveSeekPage/Scene"
import ErrorScene from "../../Page/pages_zbhk/ErrorPage/Scene"
import BookTipScene from "../../Page/pages_zbhk/BookTipPage/Scene"

export const sceneIds = {
    LOADING_SCENE_ID: "loading_scene", //loading页面
    PLAYER_SCENE_ID: "player_scene",  //播放器页面
    CATEGORY_PLAY_MENU_ID: "category_play_menu_scene",   //直播分类菜单
    CHANNEL_PLAY_MENU_ID: "channel_play_menu_scene",   //直播频道菜单
    COVER_ID: "cover_scene",   //封套
    COVER_IMAGE_ID: 'cover_image_scene',    //带图片九宫格的封套
    EXIT_SCENE_ID: "exit_scene",   //退出
    LOOK_BACK_ID: "lookback_scene",   //回看封套
    SEEK_SCENE_ID: 'seek_scene',      //回看播控页面
    LIVE_SEEK_SCENE_ID: 'live_seek_scene',  //直播时移页面
    ERROR_SCENE_ID: "error_scene",             //错误页面
    BOOK_TIP_SCENE_ID: 'book_tip_scene'       //预约提示页面
};

export const scenesMap=[];
scenesMap[sceneIds.LOADING_SCENE_ID] = LoadingScene;
scenesMap[sceneIds.PLAYER_SCENE_ID] = PlayerScene;
scenesMap[sceneIds.ERROR_SCENE_ID] = ErrorScene;
scenesMap[sceneIds.CATEGORY_PLAY_MENU_ID] = CategoryPlayMenuScene;
scenesMap[sceneIds.CHANNEL_PLAY_MENU_ID] = ChannelPlayMenuScene;
scenesMap[sceneIds.COVER_ID] = CoverScene;
scenesMap[sceneIds.COVER_IMAGE_ID] = CoverImageScene;
scenesMap[sceneIds.EXIT_SCENE_ID] = ExitScene;
scenesMap[sceneIds.SEEK_SCENE_ID] = SeekScene;
scenesMap[sceneIds.LIVE_SEEK_SCENE_ID] = LiveSeekScene;
scenesMap[sceneIds.LOOK_BACK_ID] = LookbackScene;
scenesMap[sceneIds.BOOK_TIP_SCENE_ID] = BookTipScene;

//定义对外接口类型
export const interfaceType = {
    ACTION_OPEN_APP: "Normal",                           //1. 直接进入电视精选的接口
};