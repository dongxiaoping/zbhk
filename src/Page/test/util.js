import log from 'loglevel';
import prefixer from '../../lib/loglevel-plugin-prefix';

export const ElementSate = Object.freeze({
    normal: "normal", 
    select: "select",
    focus: "focus"
})

export const KeyCode = Object.freeze({
    KEY_UP: 38,
    KEY_DOWN: 40,
    KEY_LEFT: 37,
    KEY_RIGHT: 39,
    KEY_OK: 13,
    KEY_BACK: 8,
    KEY_BACK2: 18, // OTT KEY BACK
    KEY_PREV: 33,
    KEY_NEXT: 34,
    KEY_CHANNEL_ADD: 166, // 频道+
    KEY_CHANNEL_SUB: 167, // 频道-
    KEY_VOL_UP: 259,
    KEY_VOL_DOWN: 260,
    KEY_MUTE: 261,
    KEY_HOME: 272,
    KEY_HOME2: 613,
    KEY_MENU: 194, // 菜单按钮
    KEY_MENU2: 17 // 菜单按钮2
})


export const EventType = Object.freeze({
    REMOTE_EVENT: Symbol("remoteEvent") //遥控器事件
})

// export const elementStateClass = new Dictionary();
// elementStateClass.add( ElementSate.focus ,"focus" );
// elementStateClass.add( ElementSate.select , "select");
// elementStateClass.add( ElementSate.focus , "normal");

export function logInit(){
    prefixer.reg(log);
    let logConfig = {
        template: '[%t] %l (%n) the-flash:',
        levelFormatter: function (level) {
            return level.toUpperCase();
        },
        nameFormatter: function (name) {
            return name || 'root';
        },
        timestampFormatter: function (date) {
           return date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*!/, '$1');
        },
        format: undefined
    };
    prefixer.apply(log, logConfig);

    log.setLevel("trace")
    // log.trace("trace")
    // log.debug("debug")
    // log.info("info")
    // log.warn("warn")
    // log.error("error")
    // log.getLogger("moduleTest").error([{a:3,b:4},()=>{let a=3},3], "two","three", true,{a:3,b:4});
    // log.getLogger("moduleTest").info("dfsaf", 4, false,{a:3,b:5});
}