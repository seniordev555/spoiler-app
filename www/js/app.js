// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'ngStorage','ngCordova','starter.controllers', 'ngIOS9UIWebViewPatch','ngResource', 'twitterLib', 'angucomplete-alt', 'linkify', 'ngSanitize', 'ngMaterial'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
      ionic.Platform.isFullScreen = true;
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    // if (window.cordova && window.cordova.plugins.Keyboard) {
    //   cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    //   cordova.plugins.Keyboard.disableScroll(true);
    //
    // }

    // select the right Ad Id according to platform
    var admobid = {};
    if( /(android)/i.test(navigator.userAgent) ) { // for android
        admobid = {
            banner: 'ca-app-pub-4369449121891797/9537016466', // or DFP format "/6253334/dfp_example_ad"
            // interstitial: 'ca-app-pub-xxx/yyy'
        };
    } else if(/(ipod|iphone|ipad)/i.test(navigator.userAgent)) { // for ios
        admobid = {
            banner: 'ca-app-pub-4369449121891797/6605399662', // or DFP format "/6253334/dfp_example_ad"
            // interstitial: 'ca-app-pub-xxx/kkk'
        };
    }

    // if (window.StatusBar) {
      console.log("this is the story of a girl!");
      // org.apache.cordova.statusbar required
      StatusBar.backgroundColorByName('black');
      console.log(StatusBar);
    // }

    // console.log()
    if(AdMob) {
        AdMob.createBanner({
                adId: admobid.banner,
                position: AdMob.AD_POSITION.BOTTOM_CENTER,
                autoShow: true });
                console.log(AdMob);
    } else {
        console.log("we're missing admob!");
    }

  });
})

.config(function($stateProvider, $urlRouterProvider, $mdThemingProvider) {
  $stateProvider

    .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })

  .state('login', {
      url: '/login',
      templateUrl: 'templates/login.html',
      controller: 'LoginController'
  })

  .state('app.feed', {
    url: '/feed',
    views: {
      'menuContent': {
        templateUrl: 'templates/feed.html',
        controller: 'FeedController'
      }
    }
  })

  .state('intro', {
       url: '/intro',
       templateUrl: 'templates/intro.html',
       controller: 'IntroController'
   })

  .state('app.filter', {
      url: '/filter',
      views: {
        'menuContent': {
          templateUrl: 'templates/filter.html',
          controller: 'FilterController'
        }
      }
    })

    .state('app.sendTweet', {
      url: '/send-tweet',
      views: {
        'menuContent': {
          templateUrl: 'templates/send-tweet.html',
          controller: 'SendTweetCtrl'
        }
      }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/intro');

});

angular.module('starter').constant('myAppConfig', {
        oauthSettings: {
            consumerKey: 't4QmjNTHVKuwZWUlkp2nFHa0x',
            consumerSecret: 'YY9D6B08ZiYt6bLDQC1tUZLQVK9s4XUYPnKK8ktBpFdOwANrJh',
            requestTokenUrl: 'https://api.twitter.com/oauth/request_token',
            authorizationUrl: "https://api.twitter.com/oauth/authenticate",
            accessTokenUrl: "https://api.twitter.com/oauth/access_token",
            callbackUrl: "https://s3.amazonaws.com/spolier-block/oauthcallback.html"
        }
    });
