// Copyright 2016 Nike, Inc. (https://www.nike.com)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const express = require('express');
const httpProxy = require('http-proxy');
const https = require('https');
const moment = require('moment');  // jshint ignore:line
const bokorOptions = {};
require('colors');
require('http');

function start(options) {

    // -- sepia config --------------
    // default bokor admin server on by default
    let sepia;
    if (options.admin === false) {
         sepia = require('./sepia');
    } else {
         sepia = require('./sepia').withSepiaServer();
    }

    let logger = sepia.logger;

    // -- bokor config --------------
    if (options.servers != null) {
      bokorOptions.servers = options.servers;
    } else {
      logger.error('CONFIGURATION ERROR: Missing server config');
      return;
    }

    if (options.filters != null) {
      bokorOptions.filters = options.filters;
    } else {
      logger.error('CONFIGURATION ERROR: Missing filters config');
      return;
    }

    bokorOptions.port = options.port || 7777;  // bokor server port
    bokorOptions.staticFileLocation = options.staticFileLocation || 'static_files';  // bokor server static file location
    bokorOptions.secure = options.secure === undefined ? true : false;


    sepia.configure({
        verbose: true,
        debug: false,
        includeHeaderNames: false,
        includeCookieNames: false
    });

    // allows access to internal server for switching bins
    sepia.filter({
      url: /:58080/,
      forceLive: true
    });


    // setup the dynamic datetimes for sepia
    if (options.datetimes != null) {
        bokorOptions.datetimes = options.datetimes;
        let datetimeConfigs = Object.keys(bokorOptions.datetimes);
        datetimeConfigs.forEach(datetime => {
          let datetimeConfig = options.datetimes[datetime];
          sepia.substitute(datetimeConfig.key, function () { return eval(datetimeConfig.value) ;});  // jshint ignore:line
        });
     }

    // setup the url filters for sepia
    let filterConfigs = Object.keys(bokorOptions.filters);
    filterConfigs.forEach(filterName => {
        let filterConfig = bokorOptions.filters[filterName];
        sepia.filter({
          url: filterConfig.url_filter,
          urlFilter: function(url) {
          return url.replace(filterConfig.regx, filterConfig.replace);
          }
        });
    });

    // end sepia config

    // start setup of express server with proxy
    let server = express();
    server.set('port', bokorOptions.port);

    // place to host any files like images
    server.use(express.static(bokorOptions.staticFileLocation));

    // status end point to see if running
    server.get('/status', function (req, res){
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ status: 1 }));
    });

    let apiProxy = httpProxy.createProxyServer({
      secure: bokorOptions.secure,
    });

    let serverConfigs = Object.keys(bokorOptions.servers);
    serverConfigs.forEach(serverName => {
        let serverConfig = bokorOptions.servers[serverName];

        server.all(serverConfig.url_filter, function(req, res) {
          delete req.headers['accept-encoding'];
          apiProxy.web(req, res, {
            target: 'https://' + serverConfig.url,
            agent: https.globalAgent,
            headers: {
              host: serverConfig.url
            }
          }, function(e) {
            logger.error({ url: serverConfig.url }, 'proxying to endpoint');
            logger.error({ err: e });
            res.send(JSON.stringify({ bokorProxyError: 1 }));
          });
        });

    });


    return new Promise(function (resolve) {
      server.listen(server.get('port'), function() {
          logger.info({ port: server.get('port') }, 'bokor listening');
          resolve(server);
      });
    });

}


module.exports.start = start;
