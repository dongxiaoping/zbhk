// +----------------------------------------------------------------------
// | Copyright (js), BestTV.
// +----------------------------------------------------------------------
// | Author: karl.dong
// +----------------------------------------------------------------------
// | Date：2017/9/14
// +----------------------------------------------------------------------
// | Description: 生产环境的运行脚本
// +----------------------------------------------------------------------

const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
module.exports = merge(common, {
    devtool: 'inline-source-map',
    plugins: [
        new webpack.optimize.UglifyJsPlugin({//压缩文件
            compressor: {
                warnings: false,
            },
            except: ['super', '$', '$super', 'exports', 'require', 'Scene', 'initialize', 'this', 'window', 'new', '_map2', 'onCreate', 'OTT', 'onBesTVEvent', '_ott_utils', 'params','Collections']    //排除关键字(可选)
        })
    ],
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
    },
});