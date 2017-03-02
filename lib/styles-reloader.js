/* jshint node: true */
'use strict';

var path = require('path');

// default reload css extensions
var styleExtensions = ['css', 'scss', 'sass', 'less', 'styl'];
var reloadCssPattern = new RegExp('\.(' + styleExtensions.join('|') + ')$');

var noop = function(){};

module.exports = function StylesReloader(options){
  var options = options;
  var fsWatcher = options.watcher;
  var ui = options.ui;
  var _isRunning = false;
  var lsProxy = options.ssl ? require('https') : require('http');

  // build app style pattern
  var appStylePath = path.join(options.project.root, 'app', 'styles', '*');
  var appStylePattern = new RegExp('^' + appStylePath);
  var appStyleResource = options.project.pkg.name + '.css';
  
  // build pod style pattern
  var podStylePath = path.join(options.project.root, 'app', 'pods', '*');
  var podStylePattern = new RegExp('^' + podStylePath);
  var podStyleResource = options.project.pkg.name + '.css';

  // livereload hostname
  var liveReloadHostname = [
    (options.ssl ? 'https://' :'http://'),
    (options.liveReloadHost || options.host),
    ':',
    options.liveReloadPort
  ].join('');


  function shouldReload(filePath){
    return filePath.match(reloadCssPattern);
  };

  function getReloadResource(filePath){
    var resource = '';
    if (filePath.match(appStylePattern)) {
      resource = appStyleResource;
    } else if (filePath.match(podStylePattern)) {
      resource = podStyleResource;
    } else {
      resource = 'vendor.css';
    }
    return resource;
  };

  function fileDidChange(results){
    var filePath = results.filePath || '';
    // notify livereload server if needed
    if (shouldReload(filePath)){
      var reloadResource = getReloadResource(filePath);
      ui.writeLine('Reloading ' + reloadResource + ' only');
      lsProxy.get(liveReloadHostname + '/changed?files=' + reloadResource)
          .on('error', noop);
    }
  };

  function mergeReloadFilters(){
    options.project.liveReloadFilterPatterns.push(reloadCssPattern);
  };

  return {

    run: function(){
      if (!options.liveReload) {
        ui.writeLine('StylesReloader is disabled');
        return;
      }

      if (this.isRunning()){
        return;
      }

      ui.writeLine('StylesReloader watches ' + styleExtensions.join('|'));
      if (fsWatcher) {
        mergeReloadFilters();
        fsWatcher.on('change', fileDidChange.bind(this));
        _isRunning = !_isRunning;
      }
    },

    isRunning: function(){
      return _isRunning;
    }
  };
};