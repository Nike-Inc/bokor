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


var express = require('express');
var httpProxy = require('http-proxy');
var https = require('https');
var config = require('./config_servers.properties');
var filter = require('./config_filters.properties');
require('colors');
require('http');


// sepia config
var sepia = require('./sepia').withSepiaServer();
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


// setup the url filters for sepia
var filterConfigs = Object.keys(filter);
filterConfigs.forEach(filterName => {
    var filterConfig = filter[filterName];
    sepia.filter({
      url: filterConfig.url_filter,
      urlFilter: function(url) {
      return url.replace(filterConfig.regx, filterConfig.replace);
      }
    });
});

// end sepia config

// start setup of express server with proxy
var server = express();
server.set('port', 7777);

// place to host any files like images
server.use(express.static('hosted_files'));

// status end point to see if running
server.get('/status', function (req, res){
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ status: 1 }));
});

var apiProxy = httpProxy.createProxyServer();


var serverConfigs = Object.keys(config);
serverConfigs.forEach(serverName => {
    var serverConfig = config[serverName];

    server.all(serverConfig.url_filter, function(req, res) {
      delete req.headers['accept-encoding'];
        apiProxy.web(req, res, {
          target: 'https://' + serverConfig.url,
          agent: https.globalAgent,
          headers: {
            host: serverConfig.url
          }
        }, function(e) {
            console.log('[ERROR] proxying to endpoint: '.red + serverConfig.url);
            console.log(e);
            res.send(JSON.stringify({ bokorProxyError: 1 }));
           });
    });

});

server.listen(server.get('port'), function() {
    console.log('bokor'.red + ' server'.blue + ' rolled '.green.bold + 'lucky '.blue + server.get('port'));

});
