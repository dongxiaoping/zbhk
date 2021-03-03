// +----------------------------------------------------------------------
// | Copyright (js), BestTV.
// +----------------------------------------------------------------------
// | Author: karl.dong
// +----------------------------------------------------------------------
// | Date：2019/3/22
// +----------------------------------------------------------------------
// | Description: 
// +----------------------------------------------------------------------

/* reference lodash findIndex
 * example:
 * export const findIndex = function(showProgramList, function (o) {
 *    return o.tips === 2;
 * });
 * */
export const findIndex = function (array = null,funcExec) {
    let length = array === null ? 0 : array.length;
    if (!length) {
        return -1;
    }
    for(let index=0;index<length;index++){
        if(funcExec(array[index])){
            return index;
        }
    }
    return -1;
};

export const circleList = function (list, exec) {
    for (let i = 0; i < list.length; i++) {
        exec (list[i], i);
    }
};
