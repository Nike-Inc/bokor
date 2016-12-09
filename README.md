# Bokor

Bokor is a simple, Record and Playback Mock Server written in Node.js, utilized for Service Virtualization.

- [Installation](#installation)
- [Usage](#usage)
    - [Server Configuration](#server-configuration)
    - [Filter Configuration](#filter-configuration)
    - [Advanced Configuration](#advanced-configuration)
- [Data Fixtures](#data-fixtures)
    - [Data Bins](#data-bins)
    - [Fixture Filenames](#fixture-filenames)
- [Static Resources](#static-resources)
- [Logs](#logs)
- [Demo From Source](#demo-from-source)
- [Tests](#tests)
- [FAQ](#faq)
- [License](#license)
- [Creators](#creators)

---

## Installation
Install [Node JS](https://nodejs.org/en/download/)
```bash
$ npm install bokor
```
## Usage

#### Create `server.js` file

```javascript
var serversProperties = require('./servers.properties');
var filtersProperties = require('./filters.properties');

var bokor = require('bokor');

bokor.start({
servers : serversProperties,
filters : filtersProperties
});
```

### Server Configuration
#### Create `servers.properties` file
The `servers.properties` file is utilized to configure what servers will be proxied.  The `url_filter` field utilizes regular expressions to determine which requests to proxy and the `url` field instructs Bokor which base url to proxy the request to.
```javascript
var servers = {
   server1: {
        url_filter: '*/users*',
        url: 'api.github.com',
    },
    server2: {
        url_filter: '/unique-url-filter-here/*',
        url: 'url-your-application-uses',
    }
};

module.exports = servers;
```

### Filter Configuration
#### Create `filters.properties` file

Both the URL and the request body, if present, are used to generate the
filename for fixtures. The latter is used to differentiate between two POST or
PUT requests pointing to the same URL but differing only in the request body.

Sometimes, a request contains data in the URL that is necessary for
the successful execution of that request, but changes from repeated invocations
of that resource. One typical example is a timestamp; another is a uniquely
generated request ID. However, sometimes two requests that have all other parts
of the request aside from these parameters constant should be considered the
same for recording and playback purposes.

Suppose that your tests make the following request:

`http://example.com/client-config?user_id=444444321`

and while the `user_id` query parameter is required for the request to complete, you want to playback the same data that was recorded, regardless of what user_id was used during recording and during playback. Use a URL filter like `filter2` below.

The `url_filter` field is used to determine which requests should have `regx` applied to it. The matcher is a regex. The filter is only applied to determine which fixture will be used; the actual request made to the remote resource during recording is unchanged.


```javascript
var filters = {
    filter1: {
        description: 'DO NOT REMOVE-ignores the access token on ALL requests',
        url_filter: /[\w]+/,
        regx: /access_token=[\w]+/,
        replace: '',
    },
   filter2: {
        description: 'EXAMPLE-ignores user_id on all requests to client-config',
        url_filter: /client-config/,
        regx: /&user_id=[0-9]+/,
        replace: '',
    },
    filter3: {
        description: 'EXAMPLE-ignores os version on all requests to client-config',
        url_filter: /client-config/,
        regx: /os_version=[\/\d*\.\d*]+/,
        replace: '',
    },
    filter4: {
        descripton: 'EXAMPLE-replaces all version call with 1.0.0 call',
        url_filter: /client-config/,
        regx: /com.example.ios\/\d*\.\d*.\d*/,
        replace: 'com.example.ios/1.0.0',
    },
};

module.exports = filters;
```
#### Run server
```bash
$ node server.js
bokor server rolled lucky 7777
```


### Advanced Configuration

#### Static Resources
By default Bokor serves any static resource in the `static_files` folder.  You can modify this folder name by adjusting the server config.
```javascript
bokor.start({
servers : serversProperties,
filters : filtersProperties,
staticFileLocation: customFolder
});
```

#### Port
By default Bokor runs on port 7777.  You can modify this port by adjusting the server config.
```javascript
bokor.start({
servers : serversProperties,
filters : filtersProperties,
port: 1234
});
```

## Data Fixtures

### Data Bins
Bins give Bokor the ability to respond differently to the exact same request.  A series of downstream requests can be isolated, and their fixtures stored in a separate directory.

All recorded data will be stored in a top level folder called `bins`.  By default all recorded fixtures will be stored in the `bins\default` folder.

#### Change Default Bin

##### Admin Server Method
Bokor runs an internal admin server on port 58080 that allows you to change the bin Bokor is reading and writing to.

To change from the `bins\default` bin  make a post to the internal server bokor is running.  Run the below command to have Bokor configured to `bins\sampleBinName`.
```bash
$ curl -H "Content-Type: application/json" -X \
POST -d '{"testName": "sampleBinName"}' \
http://localhost:58080/testOptions
```

 This changes the global state of the Bokor server and all requests will go through this bin.

##### Header Method

 Using the header method allows the Bokor server to respond to simultaneous requests from different bins.

To do this you must modify the header of every request proxied through the Bokor server.  Add a header with the name of: `x-bokor-test-name` and the value of `binName` to each network request.  Bokor will read the request headers and use the specified bin to determine the response.



### Fixture Filenames

Fixture data generated during the recording phase are stored in files. In order
to uniquely associate each HTTP request with a filename used to store the
fixture data, several characteristics of the request are examined:

* The HTTP method, e.g. `GET` or `POST`.
* The request URL.
* The request body.
* The names of all the request headers.
* The names of all the cookies sent in the request.

This data is then aggregated and sent through an MD5 hash to produce the
filename.

## Static Resources
Bokor provides the ability to host static content.  Just store files in your static resources directory and request them from the root of the Bokor server.  `http://localhost:7777/bokor.jpg`

```
bokorServer/
+-- bins
+-- static_files
    +-- bokor.jpg
    +-- test.json
+-- server.js
+-- filters.properties
+-- servers.properties
```

## Logs
`====[ cache miss ]====`

❤️ If the request does not find a prerecorded response it will log cache miss in the color red.

`====[ cache hit ]====`

💚 If the request finds a prerecorded response it will log cache hit in the color green.

## Demo from Source
Follow the below steps to run the Bokor Demo.

```bash
$ git clone https://github.com/Nike-Inc/bokor.git
$ cd bokor
$ npm install
$ cd examples/source_example/
$ node server.js
```

Record a response
```bash
$ curl http://localhost:7777/users/jimmmyeisenhauer
```
Playback the response (notice the improved response time)
```bash
$ curl http://localhost:7777/users/jimmmyeisenhauer
```



## Tests

```
$ npm test
```

## FAQ
### Where did the name Bokor come from?
It is a long story, but one of my favorite quotes is:

#####“any sufficiently advanced technology is indistinguishable from magic.”

-arthur c. clarke

So of course I penned a similar quote around test automation.

#####“software tests that unexplainably pass or fail are indistinguishable from voodoo.”
-james r. eisenhauer

 And a Bokor is a voodoo sorcerer for hire who are said to serve the loa 'with both hands', practicing for both good and evil.




## License

Bokor is released under the Apache 2.0 license. See LICENSE for details.



## Creators

- [Jimmy Eisenhauer](https://github.com/JimmyEisenhauer) ([@JimmyEisenhauer](https://twitter.com/JimmyEisenhauer))

Special thanks to [Ben Williams](https://github.com/desertblade) for leading the efforts to have Bokor open sourced. Also thanks to the [Sepia](https://github.com/linkedin/sepia) team for their code and inspiration.
