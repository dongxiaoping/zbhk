const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const WriteFilePlugin = require("write-file-webpack-plugin");

/*
 * 打包参数说明 示例: npm run dev、npm run dev --app=test、npm run build
 * --app : 构建项目的名称（选填） pages_ailive、 pages_zbhk、 pages_dsjx、 pages_mst
 * */

//获取命令行参数
function findPara(param){
    let result = ''
    let paramList = []
    try{
        paramList = JSON.parse(process.env.npm_config_argv).original
        paramList.forEach((argv)=>{
            if(argv.indexOf('--' + param) === -1) return;
            result = argv.split('=')[1];
        });
        return  result;
    }catch (e) {
        console.log("打包参数函数异常")
        console.log(e)
        return ""
    }
}

let appName = findPara("app");//需要编译的应用 pages_ailive pages_zbhk
appName = appName == '' ? 'pages_zbhk' : appName;
console.log(appName)
module.exports = {
    entry: './src/Page/'+appName+'/index.js',
    output: {
        filename: '[name].[chunkhash].js',
        path: path.resolve(__dirname, 'dist')
    },
    //分内置插件和外置插件
    plugins: [
        new CleanWebpackPlugin(['dist']),//每次构建前清理dist目录
        new CopyPlugin([
            {from: './src/Page/' + appName + '/config.js', to: __dirname + '/dist/config.js'}
        ]),
        new HtmlWebpackPlugin({ //发布加载html文件
            filename: 'index.html',
            template: './src/Page/'+appName+'/index.html'
        }),
        new WriteFilePlugin()
    ],
    module: {
        // module.rules 是最关键的一块配置。它告知 webpack每一种文件都需要使用什么加载器来处理：
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.(png|jpg|gif)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 8192
                        }
                    }
                ]
            },
            {
                test: /\.html$/,
                use: [ {
                    loader: 'html-loader',
                    options: {
                        minimize: true
                    }
                }],
            }
        ]
    },
    devServer: {
        contentBase: "dist",//本地服务器所加载的页面所在的目录
        historyApiFallback: true,//不跳转
        port:8089,
        inline: true,//实时刷新
        proxy: {
            '/recommend': {
                target: 'http://10.201.55.102',
                pathRewrite: {'^/recommend' : '/epg/epgService/v6/programs/recommend'},
                changeOrigin: true
            }
        }
    },
    //其它解决方案配置
    resolve: {}
};