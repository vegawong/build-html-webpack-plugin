'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @module
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @author vega <vegawong@126.com>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      **/

/* eslint no-underscore-dangle: 0 */

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fsPlus = require('fs-plus');

var _fsPlus2 = _interopRequireDefault(_fsPlus);

var _chokidar = require('chokidar');

var _chokidar2 = _interopRequireDefault(_chokidar);

var _nunjucks = require('nunjucks');

var _nunjucks2 = _interopRequireDefault(_nunjucks);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function getDep(tplPath, outPath) {
  // 读取模板文件
  var tplFiles = _glob2.default.sync(_path2.default.join(tplPath, '**/*.html'));
  var data = [];

  tplFiles.forEach(function (htmlFile) {
    var relative = _path2.default.relative(tplPath, htmlFile);
    var baseName = _path2.default.basename(htmlFile);
    // 忽略以_开头的文件名
    if (baseName.indexOf('_') !== 0) {
      data.push({
        source: htmlFile,
        relative: relative,
        out: _path2.default.join(outPath, relative)
      });
    }
  });

  return data;
}

// buildHtml

var BuildHtml = function () {
  function BuildHtml(options) {
    _classCallCheck(this, BuildHtml);

    this.tplPath = _path2.default.isAbsolute(options.tplPath) ? options.tplPath : _path2.default.join(process.cwd(), options.tplPath);
    this.outPath = _path2.default.isAbsolute(options.outPath) ? options.outPath : _path2.default.join(process.cwd(), options.outPath);
    this.varMap = options.varMap || {};
    this.filters = options.filters || {};
    this.stats = null;
    this.buildCallback = options.callback || function () {};
    this.template = _nunjucks2.default.configure({
      noCache: true,
      aotuescape: false
    });
    if (process.env.WATCH) {
      this.watch();
    }
  }

  _createClass(BuildHtml, [{
    key: 'apply',
    value: function apply(compiler) {
      var _this = this;

      this.compiler = compiler;
      compiler.plugin('done', function (stats) {
        _this.stats = stats;
        _this.build();
      });
    }
  }, {
    key: 'watch',
    value: function watch() {
      var _this2 = this;

      var watchPath = _path2.default.join(this.tplPath, '**/*.html');
      var watcher = _chokidar2.default.watch(watchPath, {
        persistent: true
      });
      watcher.on('all', function (event, tplPath) {
        if (_this2.stats === null) {
          return;
        }
        _this2.build();
        // 通过sockets 发送刷新信号
        if (_this2.compiler && _this2.compiler._server && _this2.compiler._server) {
          _this2.compiler._server._sendStats(_this2.compiler._server.sockets, _this2.stats.toJson(), null);
          _this2.compiler._server.sockWrite(_this2.compiler._server.sockets, 'changeTpl', [tplPath]);
        }
      });
    }
  }, {
    key: 'build',
    value: function build() {
      var _this3 = this;

      if (this.stats === null) {
        return;
      }

      // console.log(this.stats.toJson().publicPath);
      var publicPath = this.stats.toJson().publicPath || '';
      if (publicPath.length > 0 && publicPath[publicPath.length - 1] === '/') {
        publicPath = publicPath.substr(0, publicPath.length - 1);
      }
      var packMap = this.stats.toJson().assetsByChunkName;
      var packs = Object.keys(packMap);
      var renderData = {
        module: {},
        publicPath: this.stats.toJson().publicPath
      };

      // Object.keys(this.varMap).forEach(key => {
      //   if (typeof this.varMap[key] === 'function') {
      //     renderData[key] = this.varMap[key]();
      //   }
      // });

      // 注册 module:name
      packs.forEach(function (pack) {
        if (Array.isArray(packMap[pack])) {
          renderData.module[pack] = publicPath + '/' + packMap[pack][0];

          packMap[pack].forEach(function (fileName) {
            if (fileName.indexOf('hot-update') === -1) {
              var name = '' + pack + _path2.default.extname(fileName);
              renderData.module[name] = publicPath + '/' + fileName;
            }
          });
        } else {
          renderData.module[pack] = publicPath + '/' + packMap[pack];
          renderData.module[pack + '.js'] = publicPath + '/' + packMap[pack];
          renderData.module[pack + '.css'] = '';
        }
      });
      this.buildCallback(renderData);
      getDep(this.tplPath, this.outPath).forEach(function (v) {
        var tpl = _fsPlus2.default.readFileSync(v.source, 'utf8');
        try {
          tpl = _this3.template.renderString(tpl, renderData);
          _fsPlus2.default.writeFileSync(v.out, tpl, 'utf8');
        } catch (err) {
          console.error(err);
        }
      });
    }
  }]);

  return BuildHtml;
}();

exports.default = BuildHtml;
module.exports = exports['default'];