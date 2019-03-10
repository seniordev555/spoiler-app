 /**
 * Twitter library written to work with Cordova.
 *
 * This was specifically written to work with IonicFramework & AngularJS
 *
 * The code is based on the OpenFB Library which can be found here
 *    https://github.com/ccoenraets/sociogram-angular-ionic
 *
 * And the Twitter Library that can be found here
 *
 *
 * @author Aaron Saunders @aaronksaunders
 * @version 0.1
 */
angular.module('twitterLib', [])

    .factory('TwitterLib', function ($rootScope, $q, $window, $http, myAppConfig, $state, $ionicPopup, $timeout, $cordovaToast) {

        // GLOBAL VARS
        // console.log($window);
        var runningInCordova = false;
        var loginWindow;

        // console.log()
        // Construct the callback URL fro when running in browser
        var index = document.location.href.indexOf('index.html');
        var callbackURL = document.location.href.substring(0, index) + 'oauthcallback.html';
        console.log('this is the callback url',callbackURL);
        var oauth;

        // YOUR Twitter CONSUMER_KEY, Twitter CONSUMER_SECRET
        var options;

        options = angular.extend({}, myAppConfig.oauthSettings);
        options = angular.extend(options, {
            callbackUrl: callbackURL
        });

        // YOU have to replace it on one more Place                   
        var twitterKey = "t4QmjNTHVKuwZWUlkp2nFHa0x"; // This key is used for storing Information related


        // used to check if we are running in phonegap/cordova
        $window.document.addEventListener("deviceready", function () {
            runningInCordova = true;

            callbackURL = myAppConfig.oauthSettings.callbackUrl;
            options.callbackUrl = callbackURL;
        }, false);


        function byteArrayToString(byteArray) {
            var string = '', l = byteArray.length, i;
            for (i = 0; i < l; i++) {
                string += String.fromCharCode(byteArray[i]);
            }
            return string;
        }

        var Twitter = {
                init: function () {

                    var deferredLogin = $q.defer();

                    /**
                     *  the event handler for processing load events for the oauth
                     *  process
                     *
                     * @param event
                     */
                    var doLoadstart = function (event) {
                        console.log("in doLoadstart " + event.url);
                        var url = event.url;
                        Twitter.inAppBrowserLoadHandler(url, deferredLogin);
                    };

                    /**
                     *  the event handler for processing exit events for the oauth
                     *  process
                     *
                     * @param event
                     */
                    var doExit = function (event) {
                        // Handle the situation where the user closes the login window manually
                        // before completing the login process
                        console.log(JSON.stringify(event));
                        deferredLogin.reject({error: 'user_cancelled',
                            error_description: 'User cancelled login process',
                            error_reason: "user_cancelled"
                        });
                    };

                    var openAuthoriseWindow = function (_url) {
                        console.log(_url);
                        // console.log(window.open());

                        loginWindow = $window.open(_url, '_blank', 'location=no,clearsessioncache=yes,clearcache=yes');
                        if (loginWindow)
                        {
                            console.log(loginWindow);
                            if (runningInCordova) {
                                loginWindow.addEventListener('loadstart', doLoadstart);

                            } else {
                                // this saves the promise value in the window when running in the browser
                                window.deferredLogin = deferredLogin;
                            }
                        } else {
                            console.warn("your browser prevented the window from opening.");
                        }

                    };

                    var failureHandler = function () {
                        console.log("ERROR: " + JSON.stringify(error));
                        deferredLogin.reject({error: 'user_cancelled', error_description: error });
                    };

                    // Apps storedAccessData , Apps Data in Raw format
                    var storedAccessData, rawData = localStorage.getItem(twitterKey);
                    // here we are going to check whether the data about user is already with us.
                    if (localStorage.getItem(twitterKey) !== null) {

                        Twitter.verify(deferredLogin);

                    } else {
                        // we have no data for save user
                        oauth = OAuth(options);
                        oauth.fetchRequestToken(openAuthoriseWindow, failureHandler);
                    }

                    return deferredLogin.promise;
                },
                /**
                 *  When inAppBrowser's URL changes we will track it here.
                 *  We will also be acknowledged was the request is a successful or unsuccessful
                 *
                 @param _url url received from the event
                 @param _deferred promise associated with login process
                 */
                inAppBrowserLoadHandler: function (_url, _deferred) {

                    // this gets the promise value from the window when running in the browser
                    _deferred = _deferred || window.deferredLogin;


                    /**
                     *
                     * @param _args
                     */
                    var successHandler = function (_args) {
                        console.log(_args);
                        // Saving token of access in Local_Storage
                        var accessData = {};
                        accessData.accessTokenKey = oauth.getAccessToken()[0];
                        accessData.accessTokenSecret = oauth.getAccessToken()[1];

                        // Configuring Apps LOCAL_STORAGE
                        console.log("TWITTER: Storing token key/secret in localStorage");
                        $window.localStorage.setItem(twitterKey, JSON.stringify(accessData));

                        Twitter.verify(_deferred);

                    };

                    /**
                     *
                     * @param _args
                     */
                    var failureHandler = function (_args) {
                        console.log("ERROR - oauth_verifier: " + JSON.stringify(_args));
                        _deferred.reject({error: 'user_cancelled', error_description: _args });
                    };

                    console.log("callbackURL " + callbackURL);

                    if (_url.indexOf(callbackURL + "?") >= 0) {

                        loginWindow.close();

                        // Parse the returned URL
                        var params, verifier = '';
                        params = _url.substr(_url.indexOf('?') + 1);

                        params = params.split('&');
                        for (var i = 0; i < params.length; i++) {
                            var y = params[i].split('=');
                            if (y[0] === 'oauth_verifier') {
                                verifier = y[1];
                            }
                        }
                        oauth.setVerifier(verifier);
                        oauth.fetchAccessToken(successHandler, failureHandler);
                    } else {
                        // Just Empty
                    }
                },
                /**
                 * this will verify the user and store the credentials if needed
                 *
                 */
                verify: function (_deferred) {
                    var deferred = _deferred || $q.defer();
                    var storedAccessData, rawData = localStorage.getItem(twitterKey);
                    storedAccessData = JSON.parse(rawData);

                    // javascript OAuth will care of else for app we need to send only the options
                    oauth = oauth || OAuth(options);

                    oauth.setAccessToken([storedAccessData.accessTokenKey, storedAccessData.accessTokenSecret]);
                    function close () {
                        window.close();
                    }

                    oauth.get('https://api.twitter.com/1.1/account/verify_credentials.json?skip_status=true',
                        function (data) {
                            // console.log("in verify resolved " + data.text);
                            deferred.resolve(JSON.parse(data.text));
                        }, function (_error) {
                            var err = JSON.parse(_error.text).errors[0].message;
                            // console.log("in verify reject ", err);
                            // var message = _error.text;
                            console.log(err);
                            if (err == 'Rate limit exceeded') {
                                navigator.notification.alert('A request has been made too many times in a short time period. Please try again later.', this.close(), "Spoiler Block", 'OK');
                            }

                            deferred.reject(JSON.parse(_error.text));

                        }
                    );
                    return deferred.promise;
                },
                /**
                 * this will verify the user and send a tweet
                 *
                 * @param _message
                 */
                 tweet: function (_message, _media) {
                    var deferred = $q.defer();
                    return deferred.promise
                        .then(Twitter.verify().then(function () {
                                console.log("in tweet verified success");

                                tUrl = 'https://api.twitter.com/1.1/statuses/update.json';
                                tParams = {
                                    'status': _message,
                                    'trim_user': 'true'
                                };
                                return Twitter.apiPostCall({
                                    url: tUrl,
                                    params: tParams
                                });

                            }, function (_error) {
                                deferred.reject(JSON.parse(_error.text));
                                console.log("in tweet " + _error.text);
                            }
                        )
                    );
                },
                /**
                 * uses oAuth library to make a GET call
                 *
                 * @param _options.url
                 * @param _options.params
                 */
                apiGetCall: function (_options) {
                    var deferred = $q.defer();

                    // javascript OAuth will care of else for app we need to send only the options
                    oauth = oauth || OAuth(options);

                    var _reqOptions = angular.extend({}, _options);
                    _reqOptions = angular.extend(_reqOptions, {
                        success: function (data) {
                            deferred.resolve(JSON.parse(data.text));
                        },
                        failure: function (error) {
                        //    $scope.$broadcast('scroll.refreshComplete');
                            deferred.reject(JSON.parse(error.text));
                        }
                    });
                    // console.log('this is _reqOptions from line 297 in services.js', _reqOptions.data);
                    oauth.request(_reqOptions);
                    return deferred.promise;
                },
                /**
                 * uses oAuth library to make a POST call
                 *
                 * @param _options.url
                 * @param _options.params
                 */
                apiPostCall: function (_options) {
                    var deferred = $q.defer();

                    oauth = oauth || OAuth(options);
                    function close () {
                        window.close();
                    }
                    oauth.post(_options.url, _options.params,
                        function (data) {
                            if (_options.url == 'https://api.twitter.com/1.1/statuses/update.json') {
                                $cordovaToast.show('Tweet successfully posted', 'long', 'bottom');
                                setTimeout(function () {
                                    $cordovaToast.show('It may take a few minutes before showing up in your feed.', 'long', 'bottom');
                                },2000)
                                $state.go('app.feed');
                            } else {
                                // if (_options.url == 'https://api.twitter.com/1.1/statuses/retweet/:id.json') {
                                    $cordovaToast.show('Tweet has been retweeted', 'long', 'bottom');
                                // }
                                deferred.resolve(JSON.parse(data.text));
                                $state.go('app.feed');
                            }
                        },
                        function (error) {
                            var err = JSON.parse(error.text).errors[0].message;
                            navigator.notification.alert(err , this.close(), "Spoiler Block", 'OK');
                            console.log("in apiPostCall reject " + err);
                            deferred.reject(JSON.parse(error.text));
                        }
                    );
                    return deferred.promise;
                },
                /**
                 * clear out the tokens stored in local storage
                 */
                logOut: function () {
                    window.localStorage.removeItem(twitterKey);
                    options.accessTokenKey = null;
                    options.accessTokenSecret = null;
                    console.log("Please authenticate to use this app");
                }
            };
        return Twitter;
    });

/**
 * @see oauthcallback.html for additional information
 *
 * @param url
 */
function oauthCallback(url) {
    var injector = angular.element(document.getElementById('main')).injector();
    injector.invoke(function (TwitterLib) {
        TwitterLib.inAppBrowserLoadHandler(url, false);
    });
}
