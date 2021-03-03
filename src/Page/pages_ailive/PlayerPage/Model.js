import {AbstractModel} from "../../../Abstract/scene/AbstractModel";
import {view} from "./View";

class Model extends AbstractModel {
    constructor() {
        super();
    }

    //获取当前正在播放的节目信息
    getPlayInfo() {
        let nowPlayInfo = window.WebApp.getNowPlayInfo();
        return nowPlayInfo;
    }
}

export const model = new Model();
export default {model}
