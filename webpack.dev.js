// +----------------------------------------------------------------------
// | Copyright (js), BestTV.
// +----------------------------------------------------------------------
// | Author: karl.dong
// +----------------------------------------------------------------------
// | Date：2017/9/14
// +----------------------------------------------------------------------
// | Description: 开发环境的运行脚本
// +----------------------------------------------------------------------
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    devtool: 'inline-source-map',//开发时调用
    module: {
        rules: [
            { //对ES6进行转码
                test: /\.js$/,
                exclude: /\prototype.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env']
                    }
                }
            }
        ]
    }
});
