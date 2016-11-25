# build-html-webpack-plugin

简易版的`html-webpack-plugin`

## 功能说明

- 支持自动替换bundle的实际访问地址

- 支持搭配`webpack-dev-server`使用, 并可选择性开启html监听自动刷新

## 使用说明

```javascript
// webpack.config.js
var BuildHtmlWebpackPlugin = require('build-html-webpack-plugin')
module.exports = {
  // ...
  plugins: [new BuildHtmlWebpackPlugin({
    tplPath: './outTpl',
    outPath: './'
  })];
}
```

参数说明:

```javascript
new BuildHtmlWebpackPlugin(options);

// options.tplPath  模板的目录(目录下所有html文件批量处理), 可以是绝对路径, 可以是相对于执行webpack命令的相对路径(process.cwd())
// option.outPath  html文件的输出目录, 可以是绝对路径, 可以是相对于执行webpack命令的相对路径(process.cwd())

```

模板示例:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Hello world</title>
  <meta name="keywords" content="">
  <meta name="description" content="">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="format-detection" content="telephone=no">
  <meta name="viewport" content="initial-scale=1, width=device-width, maximum-scale=1, minimum-scale=1, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-touch-fullscreen" content="yes">
  <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico">
  <!-- nunjucks 模板变量语法 -->
  <!-- module["bundleName.js"] or module["bundleNamename.css"] 替换实际bundle的实际访问地址 -->
  <link rel="stylesheet" href="{{ module["app.css"] }}">
</head>
<body>
  <div id="main"></div>
  <!-- nunjucks 模板变量语法 -->
  <!-- module["bundleName.js"] or module["bundleNamename.css"] 替换实际bundle的实际访问地址 -->
  <script src="{{ module["app.js"] }}"></script>
</body>
</html>

```


## 搭配webpack-dev-server使用

希望开启修改html模板的时候启用liveReload吗?

- webpack.config.js 按上述配置使用插件

- webpack.config.js中的entry, 添加插件的client

  ```javascript
  var config = require("./webpack.config.js");
  config.entry.app.unshift("webpack-dev-server/client?http://localhost:8080/");
  config.entry.app.unshift("build-html-webpack-plugin/lib/client?http://localhost:8080/");
  var compiler = webpack(config);
  var server = new WebpackDevServer(compiler, {...});
  compiler._server = server; // 一定要加这一句
  server.listen(8080);
  ```

- cli添加环境变量`WATCH=true`

  ```ruby
  $ WATCH=true your-server # can be webpack-dev-server or your server-cli
  ```
