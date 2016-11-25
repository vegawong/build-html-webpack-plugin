/**
 *
 * @module
 * @author vega <vegawong@126.com>
 **/

/* eslint no-underscore-dangle: 0 */

import glob from 'glob';
import path from 'path';
import fs from 'fs-plus';
import chokidar from 'chokidar';
import nunjucks from 'nunjucks';

function getDep(tplPath, outPath) {
  // 读取模板文件
  const tplFiles = glob.sync(path.join(tplPath, '**/*.html'));
  const data = [];

  tplFiles.forEach(htmlFile => {
    const relative = path.relative(tplPath, htmlFile);
    const baseName = path.basename(htmlFile);
    // 忽略以_开头的文件名
    if (baseName.indexOf('_') !== 0) {
      data.push({
        source: htmlFile,
        relative,
        out: path.join(outPath, relative)
      });
    }
  });

  return data;
}

// buildHtml
export default class BuildHtml {
  constructor(options) {
    this.tplPath = path.isAbsolute(options.tplPath) ? options.tplPath
    : path.join(process.cwd(), options.tplPath);
    this.outPath = path.isAbsolute(options.outPath) ? options.outPath
    : path.join(process.cwd(), options.outPath);
    this.varMap = options.varMap || {};
    this.filters = options.filters || {};
    this.stats = null;
    this.buildCallback = options.callback || function () { };
    this.template = nunjucks.configure({
      noCache: true,
      aotuescape: false
    });
    if (process.env.WATCH) {
      this.watch();
    }
  }

  apply(compiler) {
    this.compiler = compiler;
    compiler.plugin('done', stats => {
      this.stats = stats;
      this.build();
    });
  }

  watch() {
    const watchPath = path.join(this.tplPath, '**/*.html');
    const watcher = chokidar.watch(watchPath, {
      persistent: true
    });
    watcher.on('all', (event, tplPath) => {
      if (this.stats === null) {
        return;
      }
      this.build();
      // 通过sockets 发送刷新信号
      if (this.compiler && this.compiler._server &&
        this.compiler._server) {
        this.compiler._server._sendStats(this.compiler._server.sockets, this.stats.toJson(), null);
        this.compiler._server.sockWrite(this.compiler._server.sockets, 'changeTpl', [tplPath]);
      }
    });
  }

  build() {
    if (this.stats === null) {
      return;
    }

    // console.log(this.stats.toJson().publicPath);
    let publicPath = this.stats.toJson().publicPath || '';
    if (publicPath.length > 0 && publicPath[publicPath.length - 1] === '/') {
      publicPath = publicPath.substr(0, publicPath.length - 1);
    }
    const packMap = this.stats.toJson().assetsByChunkName;
    const packs = Object.keys(packMap);
    const renderData = {
      module: {},
      publicPath: this.stats.toJson().publicPath
    };

    // Object.keys(this.varMap).forEach(key => {
    //   if (typeof this.varMap[key] === 'function') {
    //     renderData[key] = this.varMap[key]();
    //   }
    // });

    // 注册 module:name
    packs.forEach(pack => {
      if (Array.isArray(packMap[pack])) {
        renderData.module[pack] = `${publicPath}/${packMap[pack][0]}`;

        packMap[pack].forEach(fileName => {
          if (fileName.indexOf('hot-update') === -1) {
            const name = `${pack}${path.extname(fileName)}`;
            renderData.module[name] = `${publicPath}/${fileName}`;
          }
        });
      } else {
        renderData.module[pack] = `${publicPath}/${packMap[pack]}`;
        renderData.module[`${pack}.js`] = `${publicPath}/${packMap[pack]}`;
        renderData.module[`${pack}.css`] = '';
      }
    });
    this.buildCallback(renderData);
    getDep(this.tplPath, this.outPath).forEach(v => {
      let tpl = fs.readFileSync(v.source, 'utf8');
      try {
        tpl = this.template.renderString(tpl, renderData);
        fs.writeFileSync(v.out, tpl, 'utf8');
      } catch (err) {
        console.error(err);
      }
    });
  }


}
