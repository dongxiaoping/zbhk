/*
loading组件
    1.应用进入之前的Loading圈;
    2.播放加之前，播控buffering的过程中的Loading圈；
 */

import {loadingType} from './GlobalConst'
let pageLoadingTimer = null;
class Loading {
    constructor() {
    }

    showLoading(type=loadingType.PLAY_LOADING_TYPE){
        let loadingEle=null;
        switch(type) {
            case loadingType.PLAY_LOADING_TYPE:
                loadingEle = document.getElementById("loading_component");
                if (loadingEle) {
                    loadingEle.style.display = 'block';
                }
                break;
            case loadingType.PAGE_LOADING_TYPE:
                loadingEle = document.getElementById("page_loading_component");
                if (loadingEle) {
                    loadingEle.style.display = 'block';
                }
                clearInterval(pageLoadingTimer);
                pageLoadingTimer=null;
                pageLoadingTimer = setInterval(()=>{
                    let dots = document.getElementById("page_loading_component").getElementsByTagName("div");
                    for(let i=0;i<dots.length;i++){
                        if(dots[i].style.display=="none"){
                            dots[i].style.display= "block";
                            return;
                        }
                    }
                    for(let i=0;i<dots.length;i++){
                        dots[i].style.display= "none";
                    }
                },500);
                break;
            default:
        }
    }

    hiddenLoading(type=loadingType.PLAY_LOADING_TYPE){
        let loadingEle = null;
        switch(type) {
            case loadingType.PLAY_LOADING_TYPE:
                loadingEle = document.getElementById("loading_component");
                if (loadingEle) {
                    loadingEle.style.display = 'none';
                }
                break;
            case loadingType.PAGE_LOADING_TYPE:
                clearInterval(pageLoadingTimer);
                pageLoadingTimer=null;
                loadingEle = document.getElementById("page_loading_component");
                if (loadingEle) {
                    loadingEle.style.display = 'none';
                }
                let dots = document.getElementById("page_loading_component").getElementsByTagName("div");
                for(let i=0;i<dots.length;i++){
                    dots[i].style.display="none";
                }
                break;
            default:
        }
    }

    /* 一个loading圈周期结束回调
     * */
    showPageLoadingCircle(callback){
        if(window.Loading.isPageLoadingCircleOnShow()){
            callback();
            return;
        }
        this.hiddenLoading(loadingType.PAGE_LOADING_TYPE);
        let loadingEle=null;
        loadingEle = document.getElementById("page_loading_component");
        if (loadingEle) {
            loadingEle.style.display = 'block';
        }
        pageLoadingTimer = setInterval(()=>{
            let dots = document.getElementById("page_loading_component").getElementsByTagName("div");
            for(let i=0;i<dots.length;i++){
                if(dots[i].style.display=="none"){
                    dots[i].style.display= "block";
                    return;
                }
            }
            for(let i=0;i<dots.length;i++){
                dots[i].style.display= "none";
            }
            callback();
            clearInterval(pageLoadingTimer);
            pageLoadingTimer=null;
        },150);
    }

    isPageLoadingCircleOnShow(){
        if(pageLoadingTimer){
            return true;
        }else{
            return false;
        }
    }

    isPlayLoadingOnShow(){
        let loadingEle = document.getElementById("loading_component");
        if (loadingEle&&loadingEle.style.display==="block") {
            return true;
        }
        return false;
    }
}
window.Loading = new Loading();