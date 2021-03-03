//图片加载通用函数
import JxLog from "./Log"
class ImageLoad {
    constructor() {
        this.loadInfo=[];
    }
    /*
     *给指定DIV对象添加背景图
     * @id 对象DIV的id
     * @showImgUrl 需要显示的图片URL
     * @defaultImgUrl 默认的图片URL
     * */
    setBackgroundImg(id, showImgUrl, defaultImgUrl) {
        let that = this;
        try {
            let ele = document.getElementById(id);
            let imgUrl = "url(\"" + defaultImgUrl + "\")";
            ele.style.backgroundImage = imgUrl;
        } catch (e) {
            JxLog.e([], "common/ImageLoad/setBackgroundImg", ["picLoad，错误的id", id]);
        }
        if(showImgUrl==""){
            JxLog.e([], "common/ImageLoad/setBackgroundImg", ["空的图片地址"]);
            return ;
        }
        if(typeof (that.loadInfo[id])!="undefined"){
            that.loadInfo[id] = null;
            delete that.loadInfo[id];
        }
        that.loadInfo[id] = document.createElement("img");
        that.loadInfo[id].src = showImgUrl;
        that.loadInfo[id].onload = function() { //图片下载完毕时异步调用callback函数。
            try {
                let ele = document.getElementById(id);
                let theUrl = that.loadInfo[id].src;
                ele.style.backgroundImage ="url(" + theUrl + ")";
                delete that.loadInfo[id];
                JxLog.i([], "common/ImageLoad/setBackgroundImg", ["picLoad 图片获取成功", theUrl]);
            } catch (e) {

            }
        };
        that.loadInfo[id].onerror = function() { //图片下载完毕时异步调用callback函数。
            JxLog.e([], "common/ImageLoad/setBackgroundImg", ["picLoad 图片获取失败", that.loadInfo[id].src]);
        };
    };
}
export const imageLoad = new ImageLoad();
export default imageLoad;