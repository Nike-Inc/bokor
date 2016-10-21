
<img src="http://bitbucket.nike.com/users/jeisenha/repos/bokor-ios-omega/browse/hosted_files/bokor.jpg?raw" width="150">

# BOKOR
### A little bit of voodoo for your UI Test Automation
### Service Mock & Cache

## HOW TO USE BOKOR
1. Install [NODE.JS](https://nodejs.org/en/)
1. Download BOKOR
1. Configure BOKOR
1. Start BOKOR
1. Make a Request via BOKOR

*I have left the node_modules as part of the project.  This makes life a little easier, since the Nike world makes it hard to npm install*

## CONFIGURATION
##### Edit the `config_servers.properties` file
###### This is where you set-up what services you wish to mock/cache.

The *unique-url-filter-here*  can be any part of the URL and must be unique for your BOKOR configuration.  Best practice to to utlizes the first section of your URL after the root.  For example ***https://contentapi.nikeapp.com/contentapi-svc/rest***  you would use ***contentapi-svs*** as your filter.  You then need to place the URL root in ***url-your-application-uses*** section, which is ***contentapi.nikeapp.com***

```
server1: {
        url_filter: '/unique-url-filter-here/*',
        url: 'url-your-application-uses',
```
```
sample1: {
        url_filter: '/contentapi-svs/*',
        url: 'contentapi.nikeapp.com',
```

##### Edit the `config_filters.properties` file
###### This is where you tell bokor to ignore certain url parameters.

Often when mocking a endpoint there are dynamic values that the application sends with every requests.  The filters config properties file lets you ignore these.  Most common and included in the initial config is ignoring access_token.  The filter config heavily uses regular expressions.

1. ***url_filter*** in filter1 is set with the regular expression ***/[\w]+/*** to include ALL urls.  This finds the urls to apply the filter too.  In filter2  we set it to any url containing /client-config/.
1. ***regx***  finds the part of the url that you want to modify.  In filter1 we find the url parameter access_token and its token.  In filter2 we are looking for a much longer part of the url.
1. ***replace*** this is what we want to replace what we found with.  Most often it will just be blank '' as seen in filter1.  But in more complex scenarios, like filter2, we can replace the dynamic varibles with static ones.


```
filter1: {
        filter1: {
        description: 'do not remove-ignores the access token on ALL requests',
        url_filter: /[\w]+/,
        regx: /access_token=[\w]+/,
        replace: '',
```


```
filter1: {
        filter2: {
        descripton: 'replaces all version call with 1.0.0 call',
        url_filter: /client-config/,
        regx: /com.nike.commerce.omega.ios\/\d*\.\d*.\d*/,
        replace: 'com.nike.commerce.omega.ios/1.0.0',
    },
```

*The BOKOR server is currently designed to only handle https enabled services.*


## STARTING THE SERVER
Starting the server is easy just type:

 `npm start`

You can tell the server is started when you see:

 `bokor server rolled lucky 7777`


## USING THE SERVER

### Make a Request
Best way to make your first request is via `curl` from the terminal.  Make the below external request first to see what the correct response should be.  Next make sure your BOKOR server is started and now make the reqeust via the BOKOR url.  You will see the exact same response.  Make another and see how much faster it is!
#### BOKOR Logs
After making your requests go checkout the console where BOKOR is running.  You will see some output in green & red.  The red output is from the first time you hit the bokor server.  BOKOR was not able to find a local saved response so it proxied the request to the actual service and recorded the response.  You will also see some Green logs!  This is from the 2nd request.  BOKOR did find the local saved response and returned the cached copy.


### External Request

`curl https://api.github.com/users/jameseisenhauer`

### Same Request via BOKOR

`curl http://localhost:7777/users/jameseisenhauer`

### View Recording/Response

You will find all the recorded responses in `/dolls/default/`  For each request there will be two files.  The headers file and the response file.

### Edit Recording/Response

You can edit your responses to say anything you want now!    ***Be careful some headers have the response size in the header.  You will need to delete this out of the header if you modify the response***

## ***VOODOO*** DOLLS
Dolls give BOKOR the ability to respond differently to the exact same request. If you don't set the doll BOKOR will use the *default* doll.

Setting the doll is easy.  Just make a post to the internal server bokor is running.  This server runs on port 58080 and a sample post is shown below.  This changes the global state of the bokor server and all requests will go through this doll.

```
curl -H "Content-Type: application/json" -X POST -d '{"testName": "DollName"}' http://localhost:58080/testOptions
```
You can also set the doll by sending this ***x-bokor-test-name*** as a header with the request.  This will allow for parallel execution with different dolls.

## Configure your Application
Once you have your BOKOR server configured and running modify your application to point at BOKOR instead of the actual service, run your tests and enjoy the magic!

### For any questions or feedback contact: James Eisenhauer
