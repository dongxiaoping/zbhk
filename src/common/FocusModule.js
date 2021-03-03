/**
定义FocusExt对象，负责各模块焦点事件处理
*/
export const KeyCode = {
    KEY_UP: 38,
    KEY_DOWN: 40,
    KEY_LEFT: 37,
    KEY_RIGHT: 39,
    KEY_OKey: 13,
    KEY_BACK: 8,
    KEY_BACK2: 18,//OTT KEY BACK
    KEY_PREV: 33,
    KEY_NEXT: 34,
    KEY_CHANNEL_ADD: 166,     //频道+
    KEY_CHANNEL_SUB: 167,     //频道-
    KEY_VOL_UP: 259,
    KEY_VOL_DOWN: 260,
    KEY_MUTE: 261,
    KEY_HOME: 272,
    KEY_HOME2: 613,
    KEY_MENU: 194,     //菜单按钮
    KEY_MENU2: 17,      //菜单按钮2
    KEY_STAR: 17,       //*星号按键
    KEY_PAGE_UP: 180,    //向上翻页
    KEY_PAGE_DOWN: 183   //向下翻页
};

export const FocusExt = function () {
    this.locked=0; //光标是否锁定，锁定后不可移动。手工change也无效
    this.node=null; //当前亮起的光标节点
    this.dir = 0;
    this.eventType = null;
};

//光标管理对象
FocusExt.prototype = {
    onKeyEvent: function (e) {
        var _key_code = e.code;
        switch (_key_code) {
            case KeyCode.KEY_UP:
                this.up();
                break;
            case KeyCode.KEY_DOWN:
                this.down();
                break;
            case KeyCode.KEY_LEFT:
                this.left();
                break;
            case KeyCode.KEY_RIGHT:
                this.right();
                break;
            case KeyCode.KEY_OKey:
                this.ok();
                break;
            default:
                break;
        }
    },

    getEventType: function () {
        return this.eventType;
    },
    /**
     * 初始化光标节点，在一开始页面还没有光标时，调用此方法
     * @param node_ 当前的光标节点
     */
    init: function (node_) {
        if (!this.node) {
            this.node = node_;
            this.node.on();
        }
        return true;
    },
    /**
     * 根据历史记录注册一个光标节点
     * 因为有些光标所在的按钮，一开始是隐藏的，需要点击另一个按钮(开启按钮)才能显示。
     * 所以这种情况下，一定要记录开启按钮的坐标，而且执行点击函数。才可让光标显示。
     * @param main_node  光标根节点
     * @param history    是历史记录的字符串，格式是光标节点坐标值，和他的父节点的坐标值
     * "x-y:parent.x-parent.y....top.x-top.y" 如："0-2:0-0:0-1:1-1:0-0"
     * 或者是开启按钮式的坐标路由|光标的坐标路由："1-0:0-0:1-1:0-0|0-2:0-0:0-1:1-1:0-0"
     */
    initByhistory: function (main_node, history) {
        if (history instanceof Array) {
            history = history[0];
        }
        var _track = history.split('|'),
            _node;
        if (1 < _track.length) {
            //有点击过的光标
            var _clicked = _track[0].split(':');
            _clicked.pop();
            var coord_str = _clicked.pop();
            _node = main_node;
            while (coord_str) {
                var coord = coord_str.split('-');
                var _x = coord[0];
                var _y = coord[1];
                var _node = _node.getChild(_x, _y);
                if (!_node) {
                    break;
                }
                coord_str = _clicked.pop();
            }
            if (_node) {
                _node.ok();
                this.clicked = _node;
                //如果初始化光标同事也是点击光标，则直接返回
                if (_track[1] == _track[0]) {
                    this.node = _node;
                    return true;
                }
            }
        }
        var _track_arr = _track.pop().split(':');
        _track_arr.pop();
        var coord_str = _track_arr.pop();
        _node = main_node;
        while (coord_str) {
            var coord = coord_str.split('-');
            var _x = coord[0];
            var _y = coord[1];
            _node.onEnter();
            var _node = _node.getChild(_x, _y);
            if (!_node) {
                break;
            }
            coord_str = _track_arr.pop();
        }
        if (_node) {
            if (_node.is_collection) {
                _node = _node.getFirstChild();
            }
            if (!_node) {
                _node = main_node.getFirstChild();
            }
            this.node = _node;
            _node.on();
            return true;
        }
        else {
            this.init(main_node.getFirstChild());
            return false;
        }
    },
    clicked: null, //把有点击动作的节点保存在这里，一般情况下，按钮一旦点击，就会离开页面，如果没有离开页面，很有可能会显示其他按钮。
    /**
     * 光标移动，让一个按钮的光标消失，让下一个按钮的光标亮起
     * @param next_  需要点亮的光标节点
     * @param direction_ 移动方向
     */
    change: function (next_, direction_) {
        if (this.locked) {
            return;
        }
        //next_有可能是一个空壳(底下还没有添加任何子元素的节点集合，这种情况下next_.is_collection应该为1)
        //理论上应该要杜绝只取空壳的情况。应当把空壳和status=0的情况做同样处理
        if (next_ && !next_.is_collection) {
            direction_ = direction_ || null;
            this.node && this.node.lost();
            this.node = next_;
            this.node.on(direction_);
        }
        return;
    },
    /**
     * 光标上移
     */
    up: function () {
        if (this.locked) {
            return;
        }
        this.dir = 1;
        this.change(this.node.getAbove(), this.DIR_UP);
    },
    /**
     * 光标下移
     */
    down: function () {
        if (this.locked) {
            return;
        }
        this.dir = -1;
        this.change(this.node.getUnder(), this.DIR_DOWN);
    },
    /**
     * 光标左移
     */
    left: function () {
        if (this.locked) {
            return;
        }
        this.dir = 2;
        this.change(this.node.getLeft(), this.DIR_LEFT);
    },
    /**
     * 光标右移
     */
    right: function () {
        if (this.locked) {
            return;
        }
        this.dir = -2;
        this.change(this.node.getRight(), this.DIR_RIGHT);
    },
    /**
     * 光标所在的按钮被点击ok
     */
    ok: function () {
        if (this.locked) {
            return;
        }
        if (false !== this.node.ok()) {
            this.clicked = this.node;
        }
    },
    /**
     * 获取当前光标节点的路径，以供保存历史记录
     */
    getHistory: function () {
        var _coord = this.node.coordTostr();
        if (this.clicked) {
            _coord = this.clicked.coordTostr() + '|' + _coord;
        }
        return _coord;
    },
    DIR_UP: 1,
    DIR_DOWN: 2,
    DIR_LEFT: 3,
    DIR_RIGHT: 4
};



//光标管理对象
var Focus = {
    locked: 0, //光标是否锁定，锁定后不可移动。手工change也无效
    node: null, //当前亮起的光标节点
    dir: 0,
    /**
     * 初始化光标节点，在一开始页面还没有光标时，调用此方法
     * @param node_ 当前的光标节点
     */
    init: function (node_) {
        if (!this.node) {
            this.node = node_;
            this.node.on();
        }
        return true;
    },
    /**
     * 根据历史记录注册一个光标节点
     * 因为有些光标所在的按钮，一开始是隐藏的，需要点击另一个按钮(开启按钮)才能显示。
     * 所以这种情况下，一定要记录开启按钮的坐标，而且执行点击函数。才可让光标显示。
     * @param main_node  光标根节点
     * @param history    是历史记录的字符串，格式是光标节点坐标值，和他的父节点的坐标值
     * "x-y:parent.x-parent.y....top.x-top.y" 如："0-2:0-0:0-1:1-1:0-0"
     * 或者是开启按钮式的坐标路由|光标的坐标路由："1-0:0-0:1-1:0-0|0-2:0-0:0-1:1-1:0-0"
     */
    initByhistory: function (main_node, history) {
        if (history instanceof Array) {
            history = history[0];
        }
        var _track = history.split('|'),
            _node;
        if (1 < _track.length) {
            //有点击过的光标
            var _clicked = _track[0].split(':');
            _clicked.pop();
            var coord_str = _clicked.pop();
            _node = main_node;
            while (coord_str) {
                var coord = coord_str.split('-');
                var _x = coord[0];
                var _y = coord[1];
                var _node = _node.getChild(_x, _y);
                if (!_node) {
                    break;
                }
                coord_str = _clicked.pop();
            }
            if (_node) {
                _node.ok();
                this.clicked = _node;
                //如果初始化光标同事也是点击光标，则直接返回
                if (_track[1] == _track[0]) {
                    this.node = _node;
                    return true;
                }
            }
        }
        var _track_arr = _track.pop().split(':');
        _track_arr.pop();
        var coord_str = _track_arr.pop();
        _node = main_node;
        while (coord_str) {
            var coord = coord_str.split('-');
            var _x = coord[0];
            var _y = coord[1];
            _node.onEnter();
            var _node = _node.getChild(_x, _y);
            if (!_node) {
                break;
            }
            coord_str = _track_arr.pop();
        }
        if (_node) {
            if (_node.is_collection) {
                _node = _node.getFirstChild();
            }
            if (!_node) {
                _node = main_node.getFirstChild();
            }
            this.node = _node;
            _node.on();
            return true;
        }
        else {
            this.init(main_node.getFirstChild());
            return false;
        }
    },
    clicked: null, //把有点击动作的节点保存在这里，一般情况下，按钮一旦点击，就会离开页面，如果没有离开页面，很有可能会显示其他按钮。
    /**
     * 光标移动，让一个按钮的光标消失，让下一个按钮的光标亮起
     * @param next_  需要点亮的光标节点
     * @param direction_ 移动方向
     */
    change: function (next_, direction_) {
        if (this.locked) {
            return;
        }
        //next_有可能是一个空壳(底下还没有添加任何子元素的节点集合，这种情况下next_.is_collection应该为1)
        //理论上应该要杜绝只取空壳的情况。应当把空壳和status=0的情况做同样处理
        if (next_ && !next_.is_collection) {
            direction_ = direction_ || null;
            this.node && this.node.lost();
            this.node = next_;
            this.node.on(direction_);
        }
        return;
    },
    /**
     * 光标上移
     */
    up: function () {
        if (this.locked) {
            return;
        }
        this.dir = 1;
        this.change(this.node.getAbove(), this.DIR_UP);
    },
    /**
     * 光标下移
     */
    down: function () {
        if (this.locked) {
            return;
        }
        this.dir = -1;
        this.change(this.node.getUnder(), this.DIR_DOWN);
    },
    /**
     * 光标左移
     */
    left: function () {
        if (this.locked) {
            return;
        }
        this.dir = 2;
        this.change(this.node.getLeft(), this.DIR_LEFT);
    },
    /**
     * 光标右移
     */
    right: function () {
        if (this.locked) {
            return;
        }
        this.dir = -2;
        this.change(this.node.getRight(), this.DIR_RIGHT);
    },
    /**
     * 光标所在的按钮被点击ok
     */
    ok: function () {
        if (this.locked) {
            return;
        }
        if (false !== this.node.ok()) {
            this.clicked = this.node;
        }
    },
    /**
     * 获取当前光标节点的路径，以供保存历史记录
     */
    getHistory: function () {
        var _coord = this.node.coordTostr();
        if (this.clicked) {
            _coord = this.clicked.coordTostr() + '|' + _coord;
        }
        return _coord;
    },
    DIR_UP: 1,
    DIR_DOWN: 2,
    DIR_LEFT: 3,
    DIR_RIGHT: 4
};


/**
 * 光标节点类，
 * 光标节点可以是一个按钮，也可以是一堆按钮的集合
 * @param args 设置参数
 */
export const FocusNode = function (args) {
    args = args || {};
    this.x = args.x || 0; //光标在坐标系中的x值
    this.y = args.y || 0; //光标在坐标系中的y值
    this.on = args.on || null; //光标点亮时的回调函数
    this.lost = args.lost || null;//光标移走时的回调函数
    this.ok = args.ok || null;//光标按钮被点击时的回调函数
    this.status = ('undefined' == typeof (args.status)) ? 1 : args.status;//光标状态，是否可用
    this.data = args.data || null;//光标节点需要保存的数据
    this.id = args.id || null;//节点id
    //以下几个事件，只有focus集合才会被执行
    this.event_agent = args.event_agent || {};//事件代理，设置此属性后，子结点的事件响应都将使用此属性内的方法
    this.cache = args.cache || 0;//光标跳出该集合时，是否记住光标所在子结点的ID
    this.saved_id = args.saved_id || null;//光标跳出该集合时，所在子结点的ID，当光标再次跳入此集合是恢复该节点的亮起状态
    this.saved_dir = args.saved_dir || null;//光标跳出该集合时，所在子结点的ID，当光标再次跳入此集合是恢复该节点的亮起状态
    this.onLeftBorder = this.event_agent.onLeftBorder || args.onLeftBorder || function () { };//光标移动到左边界时的回调函数
    this.onRightBorder = this.event_agent.onRightBorder || args.onRightBorder || function () { };//光标移动到右边界时的回调函数
    this.onTopBorder = this.event_agent.onTopBorder || args.onTopBorder || function () {

    };//光标移动到上边界时的回调函数
    this.onBottomBorder = this.event_agent.onBottomBorder || args.onBottomBorder || function () {
        if (this.event_agent.onBottomBorder) {
            this.event_agent.onBottomBorder();
        }
    };//光标移动到下边界时的回调函数
    this.onEnter = args.onEnter || function () { };//光标移进来时的回调函数
    this.onLeave = args.onLeave || function () { };//光标移出去时的回调函数
    //子结点
    this.children = [];
    //活着的子结点
    this.alive_children = null;
    //父节点
    this.parent = null;
    //是否是光标集合，通过args.on来判断，如果有on回调，说明是一个实体光标节点，没有则说明是一个光标集合
    this.is_collection = args.on ? 0 : 1;
};

FocusNode.prototype = {
    update: function (args) {
        this.data = args.data || null;//光标节点需要保存的数据
    },
    /**
     * 为本节点添加一个子结点。
     * @param node 待添加的子光标节点
     */
    addChild: function (node) {
        if (!(node instanceof FocusNode)) {
            d('addChild failed: node is not a FocusNode Object', node);
        }
        var _x = node.x, _y = node.y;
        node.parent = this;
        if (!this.children[_y]) {
            this.children[_y] = [];
        }
        //继承保存历史开关
        if (0 == node.cache && 1 == this.cache) {
            node.cache = 1;
        }
        //设置事件代理方法
        if (!node.on) {
            if (this.event_agent.on) {
                node.on = this.event_agent.on;
                //是否是光标集合，通过args.on来判断，如果有on回调，说明是一个实体光标节点，没有则说明是一个光标集合
                node.is_collection = 0;
            }
            else {
                node.on = function () { };
            }
        }
        if (!node.lost) {
            if (this.event_agent.lost) {
                node.lost = this.event_agent.lost;
            }
            else {
                node.lost = function () { };
            }
        }
        if (!node.ok) {
            if (this.event_agent.ok) {
                node.ok = this.event_agent.ok;
            }
            else {
                node.ok = function () { };
            }
        }

        this.children[_y][_x] = node;
    },
    /**
     * 替换指定位置的子结点，该位置原来的节点会和parent解除父子关系
     * @param x     要替换的位置x值
     * @param y     要替换的位置y值
     * @param node  新的节点对象
     */
    replaceChild: function (x, y, node) {
        if (!this.children[y]) {
            return false;
        }
        if (this.children[y][x]) {
            this.children[y][x].parent = null;
        }
        node.x = x;
        node.y = y;
        node.parent = this;
        this.children[y][x] = node;
        return true;
    },
    /**
     * 获取指定位置(或方向)的子结点，会向后递归
     * dir=-1表示从后面往前递归取元素
     * @param x     要获取的位置x值
     * @param y     要获取的位置y值
     * @param dir   搜索方向
     */
    getPosterity: function (x, y, dir) {
        if (!this.children[y]) {
            return null;
        }
        var _child = this.children[y][x];
        if (!_child) {
            return null;
        }
        //如果子结点的status不为1，则不再进入深层搜索
        if (0 < _child.children.length && 1 == _child.status) {
            //如果历史记录开关打开，且有历史记录
            if (1 == _child.cache && _child.saved_id && (0 == Focus.dir || _child.saved_dir == -Focus.dir)) {
                var ret = _child.onEnter();
                if (false === ret) {
                    return null;
                }
                return _child.getPosterity(_child.saved_id[0], _child.saved_id[1]);
            }
            if (_child.alive_children) {
                var ret = _child.onEnter();
                if (false === ret) {
                    return null;
                }
                //启动异次元搜索
                return _child.getAliveChild(0, 0);
            }

            //dir = -1 的时候，返回最后一个子元素
            if (-1 == dir) {
                return _child.getLastChild();
            }
            else if (-2 == dir) {
                if (1 < _child.children.length) {
                    return _child.getFirstChild();
                }
                else {
                    return _child.getLastChild();
                }
            }
            else if (-3 == dir) {
                if (1 == _child.children.length && 1 < _child.children[0].length) {
                    return _child.getFirstChild();
                }
                else {
                    return _child.getLastChild();
                }
            }
            else {
                return _child.getFirstChild();
            }
        }
        return _child;
    },
    /**
     * 获取一个儿子结点，不向后递归
     * @param x     要获取的位置x值
     * @param y     要获取的位置y值
     */
    getChild: function (x, y) {
        if (!this.children[y]) {
            return null;
        }
        var _child = this.children[y][x];
        if (!_child) {
            return null;
        }
        return _child;
    },
    /**
     * 获得一个可用的子结点
     * @param x     要获取的位置x值
     * @param y     要获取的位置y值
     */
    getAliveChild: function (x, y) {
        if (!this.alive_children) {
            return null;
        }
        if (!this.alive_children[y]) {
            return null;
        }
        var _len = this.alive_children[y].length - 1;
        if (x > _len) {
            return this.alive_children[y][_len]
        }
        return this.alive_children[y][x] || null;
    },
    /**
     * 过滤掉不可用的子结点
     */
    filterDisabled: function () {
        var _c = this.children,
            _x = 0,
            _y = -1,
            _z = -1;
        this.alive_children = [];
        for (var i = 0; i < _c.length; i++) {
            if (_c[i]) {
                for (var j = 0; j < _c[i].length; j++) {
                    if (_c[i][j] && 1 == _c[i][j].status) {
                        if (_z != i) {
                            _y++;
                            _x = 0;
                            this.alive_children[_y] = [];
                            _z = i;
                        }
                        var _node = _c[i][j];
                        _node.aX = _x;
                        _node.aY = _y;
                        this.alive_children[_y][_x] = _node;
                        _x++;
                    }
                }
            }
        }
    },
    /**
     * 获得第一个子结点
     */
    getFirstChild: function () {
        var ret = this.onEnter();
        if (false === ret) {
            return null;
        }
        return this.getPosterity(0, 0);
    },
    /**
     * 获得最后一个子结点
     */
    getLastChild: function () {
        var ret = this.onEnter();
        if (false === ret) {
            return null;
        }
        var _lengthY = this.children.length;
        if (0 == _lengthY) {
            return null;
        }
        var _lengthX = this.children[_lengthY - 1].length;
        if (0 == _lengthX) {
            return null;
        }
        return this.getPosterity(_lengthX - 1, _lengthY - 1, -1);
    },
    /**
     * 移除所有子结点，并断开父子关系
     */
    removeChildren: function () {
        for (var i = 0; i < this.children.length; i++) {
            var _child_row = this.children[i];
            if (_child_row)
                for (var j = 0; j < _child_row.length; j++) {
                    _child_row[j].parent = null;
                }
        }
        this.children = [];
    },
    /**
     * 获取父节点的兄弟节点
     */
    _getUncle: function (offsetX, offsetY) {
        try{
            var _p = this.parent,
                _x = _p.x + offsetX,
                _y = _p.y + offsetY,
                _dir = 1;
            if (!_p.parent) {
                return null;
            }
            var _pp = _p.parent;
            if (-1 == offsetX) {
                //左移
                _dir = -2;
            }
            else if (-1 == offsetY) {
                //上移
                _dir = -3;
            }
            //如果上下移动中，上一个x坐标超过了下一个x坐标的最大值，则调整为下一个x左边的最大值
            if (0 != offsetY && _pp.children[_y] && _x >= _pp.children[_y].length) {
                var _uncle = _pp.getPosterity(_pp.children[_y].length - 1, _y, _dir);
            }
            else {
                var _uncle = _pp.getPosterity(_x, _y, _dir);
            }
            if (_uncle) {
                //找到的不可用或者是个空壳
                if (1 != _uncle.status || _uncle.is_collection) {
                    return _uncle.getByOffset(offsetX, offsetY);
                }
                return _uncle;
            }
            return _p._getUncle(offsetX, offsetY);
        }catch (e){

        }
    },
    /**
     * 将节点所在的坐标路由转换成字符串
     */
    coordTostr: function () {
        var _str = this.x + '-' + this.y;
        if (this.parent) {
            _str += ':' + this.parent.coordTostr();
        }
        return _str;
    },
    /**
     * 根据当前节点的偏移量来获取兄弟结点
     */
    getByOffset: function (offsetX, offsetY) {
        var _p = this.parent,
            _x = this.x + offsetX,
            _y = this.y + offsetY,
            _dir = 1;;
        if (!_p) {
            return null;
        }
        if (-1 == offsetX) {
            //左移
            _dir = -2;
        }
        else if (-1 == offsetY) {
            //上移
            _dir = -3;
        }
        //如果上下移动中，上一个x坐标超过了下一个x坐标的最大值，则调整为下一个x左边的最大值
        if (0 != offsetY && _p.children[_y] && _x >= _p.children[_y].length) {
            var _next = _p.getPosterity(_p.children[_y].length - 1, _y, _dir);
        }
        else {
            var _next = _p.getPosterity(_x, _y, _dir);
        }
        if (_next) {
            if (0 == _next.status) {
                return _next.getByOffset(offsetX, offsetY);
            }
            return _next;
        }
        //触发事件
        var ret = true;
        if (0 == offsetY) {
            if (0 > offsetX) {
                //左移到边界
                ret = _p.onLeftBorder();
                if (1 == _p.cache) {
                    _p.saveId(this.x, this.y);
                }
            }
            else if (0 < offsetX) {
                //右移到边界
                ret = _p.onRightBorder();
                if (1 == _p.cache) {
                    _p.saveId(this.x, this.y);
                }
            }
        }
        else if (0 == offsetX) {
            if (0 > offsetY) {
                //上移到边界
                ret = _p.onTopBorder();
                if (1 == _p.cache) {
                    _p.saveId(this.x, this.y);
                }
            }
            else if (0 < offsetY) {
                //下移到边界
                ret = _p.onBottomBorder();
                if (1 == _p.cache) {
                    _p.saveId(this.x, this.y);
                }
            }
        }
        if (false === ret) {
            return null;
        }
        var _uncle = this._getUncle(offsetX, offsetY);
        if (_uncle) {
            _p.onLeave();
            //跳出
        }
        return _uncle;
    },
    saveId: function (x, y) {
        this.saved_id = [x, y];
        this.saved_dir = Focus.dir;
        if (this.parent.cache) {
            this.parent.saveId(this.x, this.y);
        }
    },
    /**
     * 获取左兄弟节点
     */
    getLeft: function () {
        var _node = this.getByOffset(-1, 0);
        if (!_node && undefined != this.aX && this.parent && this.parent.alive_children) {
            _node = this.parent.getAliveChild(this.aX - 1, this.aY);
        }
        return _node;
    },
    getRight: function () {
        var _node = this.getByOffset(1, 0);
        if (!_node && undefined != this.aX && this.parent && this.parent.alive_children) {
            _node = this.parent.getAliveChild(this.aX + 1, this.aY);
        }
        return _node;
    },
    getAbove: function () {
        var _node = this.getByOffset(0, -1);
        if (!_node && undefined != this.aX && this.parent && this.parent.alive_children) {
            _node = this.parent.getAliveChild(this.aX, this.aY - 1);
        }
        return _node;
    },
    getUnder: function () {
        var _node = this.getByOffset(0, 1);
        if (!_node && undefined != this.aX && this.parent && this.parent.alive_children) {
            _node = this.parent.getAliveChild(this.aX, this.aY + 1);
        }
        return _node;
    }
};

export default {KeyCode, FocusExt, FocusNode}