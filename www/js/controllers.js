angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $state, $localStorage, myAppConfig) {

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});
    //
    // console.log('AppCtrl is running!!!');
    //
    // $scope.toIntro = function(){
    //     $window.localStorage['didTutorial'] = "false";
    //     return $state.go('intro');
    // }
    // // Create var that can be used to call intro
    // // slide via ng-click in side menu
    // $scope.launchIntro = function(){
    //     console.log('Launch The Intro');
    //     $window.localStorage['didTutorial'] = "false";
    //     return $state.go('intro');
    // }
    var twitter_token = myAppConfig.oauthSettings.consumerKey;
    $scope.logout = function () {
        // console.log('stahhp!1');
        // console.log('this is the twitter key', twitter_token);
        window.localStorage.removeItem(twitter_token);
        $state.go('login');

    }
})

.controller('IntroController', function ($scope, $state, $localStorage, $ionicSlideBoxDelegate) {
    console.log('Intro Controller');
    var launchApp = function() {
        return $state.go('login');
    };

    $scope.startApp = function() {
        window.localStorage['didTutorial'] = "true";
        return $state.go('login');
    };

    if(window.localStorage['didTutorial'] === "true") {
        console.log('Skip intro');
        launchApp();
    };
})

.controller('LoginController', function ($scope, $timeout, $state, TwitterLib) {
    // Perform the login action when the user submits the login form
    var inLoginProcess = false;
    
    $scope.doLogin = function() {
        if (inLoginProcess) return;
        inLoginProcess = true;
        
        TwitterLib.init().then(function (_data) {
            console.log('Logging into Twitter.');
            return $state.go('app.feed');
            inLoginProcess = false;
        }).fail(function(){
            inLoginProcess = false;
        });
    };
})
.controller('SendTweetCtrl', function($scope, TwitterLib, $state, $ionicHistory) {
    function close () {
        window.close();
    }

    $scope.doTweet = function (str) {
        // console.log(str);
      // call the api to post our tweet
      TwitterLib.tweet(str).then(function (_data) {
          console.log(_data);
        //   console.log(str, 'this is a tweet.');
        //   navigator.notification.alert('Tweet sent!', close, "Spoiler Block", 'OK');
        //   $state.go('app.feed');
      }, function (_error) {
          console.log(error);
      });
      // remove the back button
      $ionicHistory.nextViewOptions({
          disableBack: true
      });
      // go back to the search page
    //   $state.go('app.feed');
    };
})

.controller('FilterController', function ($scope, $rootScope) {
    console.log('FilterController loaded!');

    var keyName = 'saved_keywords';
    // needs to be $scoped so angular will see the list in the remove filter view
    $scope.saved_keywords = JSON.parse(window.localStorage.getItem(keyName));


    $scope.onItemDelete = function(item) {
        $scope.saved_keywords.splice($scope.saved_keywords.indexOf(item), 1);
        window.localStorage.setItem(keyName, JSON.stringify($scope.saved_keywords));
        $rootScope.$broadcast('twFilterListChanged');
    };
})

.controller('FeedController', function($scope, $cordovaToast, $mdToast, TwitterLib, $ionicLoading, $sce, $ionicModal, $timeout, $ionicPlatform, $rootScope) {
    // number of tweets initially removed
    $scope.number = 0;

    // this needs to be set to 1 on initial load so we can grab a number of tweets,
    // then later well change this to the last id of the list after the first batch of tweets
    $scope.sinceId = '1';

    function close () {
        window.close();
    }
    // the add filter button is clicked
    $scope.saveFilter = function(text) {
        // if our value passed in is not null and its length is greater than 0
        if(text != null && text.length > 0) {
            // have to make sure that we grab the list everytime else we get incorrect toasts when the user adds/removes key
            var keywords = JSON.parse(window.localStorage.getItem('saved_keywords'));

            /* if there is nothing in the array, then that means this is the first keyword to save
               else go through the saved keyword list check if the user's input matches
               any of the saved keywords we currently have.
               IF no match is found, then add it to the saved keyword list.
             */
            if (keywords.length == 0) {
                keywords.push(text);
                $cordovaToast.show(text + ' has been saved.', 'short', 'bottom');

                // save our new keyword list to local storage
                window.localStorage.setItem('saved_keywords', JSON.stringify(keywords));

                // broadcast our event to refilter the twitter list with our updated filters
                $rootScope.$broadcast('twFilterListChanged');
                showMahToasts();
                // return;
            } else {
                // if there is no occurrence of the textToSave in the arrayToSearch then push it to the list
                if (keywords.indexOf(text) <= -1) {
                    keywords.push(text);
                    $cordovaToast.show(text + ' has been saved.', 'short', 'bottom');

                    // save our new keyword list to local storage
                    window.localStorage.setItem('saved_keywords', JSON.stringify(keywords));

                    // broadcast our event to refilter the twitter list with our updated filters
                    $rootScope.$broadcast('twFilterListChanged');
                    showMahToasts();
                } else {
                    $cordovaToast.show(text + ' has already been saved.', 'short', 'bottom');
                    return;
                }
            } // end if line 104, 124
        } // end if line 105

        // clear the textbox
        document.getElementById('input_0').value = '';
    } // end saveFilter

    /* will filter the twitter feed against the list of saved filters */
    function filterMe (tweetList, filterList) {
        var fList = [];
        var count = 0;

        // if we have no tweets to filter, return
        // if the filter list is empty or undefined, return
        if (typeof tweetList === 'undefined' || filterList.length == 0 || typeof filterList === 'undefined') {
            // console.log(tweetList);
            fList = tweetList;
            // console.info('nothing to filter', filteredList);
            return fList;
        } else {
            // still need to assign this to fList so we can do things to it without touching the original
            fList = tweetList;

            var fList = fList.filter( function (el) {                                 // executed for each item in the twitter feed list
                for (var i=0; i<filterList.length; i++) {                             // iterate over each saved keyword
                    var word = filterList[i].toLowerCase().replace(/\W+/,'');
                    var tweet = el.text.toLowerCase().replace(/\W+/,'');
                    if (tweet.indexOf(word) != -1) {
                        count++;
                        return false;                                                 // remove the item if we find a match
                    }
                } // end for
                return true;
            });
            $scope.number = count;
            return fList;
        } // end if line 152, 157
    } // end filterMe

    function getTweets () {
        console.log($scope.tweetList);
        TwitterLib.init().then(function (_data) {
           var options = {
               url: "https://api.twitter.com/1.1/statuses/home_timeline.json",
               data: {
               count: '200',
               since_id: $scope.sinceId
               }
           };

           TwitterLib.apiGetCall(options).then(function (_data) {
               $scope.tweetList = _data;

               // iterate through the items and grab the item.id_str and update our $scope.sinceId
               for (var i=0; i<$scope.tweetList.length; i++) {
                   if (i == $scope.tweetList.length-1) {
                        var idStr = $scope.tweetList[i].id_str;
                        console.log(idStr, 'this is the last id of the items fetched from twitter');
                   }
               }


                var filters = JSON.parse(window.localStorage.getItem('saved_keywords'));
                $scope.filteredTweetList = filterMe($scope.tweetList, filters);

                showMahToasts();

                var d = document.getElementById('feedButton');
                d.className = d.className + " remove-button";


                $scope.$broadcast('scroll.refreshComplete');
                $scope.$broadcast('scroll.infiniteScrollComplete');
                // console.log($scope.items);
           }, function (_error) {
               // $scope.hide();
               // console.log("doStatus error" + JSON.stringify(_error));
               $scope.$broadcast('scroll.refreshComplete');
               $scope.$broadcast('scroll.infiniteScrollComplete');
           });

           $scope.showImages = function(index, itemUrl) {

               $scope.activeSlide = index;
               $scope.showModal('templates/image-popover.html');
               //console.log('show images ran!', itemUrl);
               $scope.itemUrl = itemUrl;
           }

           $scope.playVideo = function() {
               $scope.showModal('templates/video-popover.html');
           }

           $scope.showModal = function(templateUrl) {
            //   console.log('show modal ran!');
               $ionicModal.fromTemplateUrl('templates/image-popover.html', {
                   scope: $scope,
                   animation: 'slide-in-up'
               }).then(function(modal) {
                   $scope.modal = modal;
                   $scope.modal.show();
               });
           }

           // Close the modal
           $scope.closeModal = function() {
            //    setTimeout(function () {
                   $scope.modal.hide().then(function () {
                     //  console.log('modal closed!');
                   });
                   $scope.modal.remove().then(function () {
                     //  console.log('modal removed!!!');
                //    $scope.modal = null;
                   });
                //   console.log('ive been closed!!!');
            //    }, 1500);/

           };
        }, function error(_error) {
            //    $scope.hide();
               console.log(_error);
               navigator.notification.alert('There was a problem fetching your tweets. Please try again later.', close, "Spoiler Block", 'OK');
               $scope.$broadcast('scroll.refreshComplete');
               $scope.$broadcast('scroll.infiniteScrollComplete');
        }); // end twitter.init line 114 then 145
    } // end getTweets


    function showMahToasts () {
        $mdToast.show({
            template: '<md-toast class="md-white">{{ toast.content }} <i class="imargin icon ion-alert"></i> </md-toast>',
            controller: [function () {
                this.content = ' '+$scope.number + ' tweet(s) filtered ';}],
            controllerAs: 'toast',
            hideDelay: 1000,
        });
    } // end showMahToasts

    $scope.canWeLoadMoreData = function() {
        console.log('canWeLoadMoreData has been called');
        if (typeof $scope.tweetList === 'undefined') {
            return;
        } else {
            return ($scope.tweetList.length > 196) ? false : true;
        }

    }
    var new_array = [];
    // grab our saved keywords from the localStorage
    var saved_keywords = JSON.parse(window.localStorage.getItem('saved_keywords'));

    // if there is no list of previously saved keywords create the empty list in locatStorage
    if (typeof saved_keywords === 'undefined' || saved_keywords === null) {
        saved_keywords = window.localStorage.setItem('saved_keywords', JSON.stringify(new_array));
    }

    // show us the number of saved_keywords in the console
    if (saved_keywords) {
        console.log('we have',saved_keywords.length, 'saved keyword(s)');
    } else {
        if (typeof saved_keywords === 'undefined') {
            console.log('we have',0, 'saved keyword(s)');
        }
    }

    // When the filter list is changed this event will get called that will refresh the twitter feed with and updated filtered list
    $rootScope.$on('twFilterListChanged', function (event) {
        console.info('the filter list has changed!');

        var saved_filters = JSON.parse(window.localStorage.getItem('saved_keywords'));
        $scope.filteredTweetList = filterMe($scope.tweetList, saved_filters);
    });

    // on resume get latest tweets
    $ionicPlatform.on('resume', function(){
        console.log("Welcome Back!");
        getTweets();
    });

    var last = {
        bottom: false,
        top: true,
        left: false,
        right: true
    };

    $scope.toastPosition = angular.extend({},last);

    $scope.getToastPosition = function() {
        return Object.keys($scope.toastPosition).filter(function(pos) {
            return $scope.toastPosition[pos];
        }).join(' ');
    };

    $scope.trustSrc = function(src) {
       return $sce.trustAsResourceUrl(src);
    }
    // here is where we'll pull in our tweets and filter them when the 'load my feed' button is clicked
    $scope.loadFeed = function () {
        // get our tweets
        getTweets();
    }

    $scope.retweetModal = function (item) {
        $ionicModal.fromTemplateUrl('contact-modal.html', {
          scope: $scope,
          animation: 'slide-in-up'
        }).then(function(modal) {
          $scope.retweet_modal = modal;
          $scope.retweet_item = item;
          $scope.retweet_modal.show();
        })
    };

    $scope.closeRetweetModal = function (item) {
        $scope.retweet_modal.hide().then(function () {
            console.log('modal closed!', item.id_str);
            // item.id_str

            TwitterLib.init().then(function (_data) {
               var options = {
                   url: "https://api.twitter.com/1.1/statuses/retweet/" + item.id_str + '.json',
               };

               TwitterLib.apiPostCall(options).then(function (_data) {
                   console.log("Retweet Successful", _data);
               }, function (_error) {
                   console.log("doStatus error" + JSON.stringify(_error));
               }); // end  apiPostCall

            }, function error(_error) {
                   console.log(_error);
                   navigator.notification.alert('There was a problem retweeting this. Please try again later.', close, "Spoiler Block", 'OK');
            }); // end twitter.init line 114 then 145

        });

        $scope.retweet_modal.remove().then(function () {
            console.log('modal removed!!!');
        });
        console.log('ive been closed!!!');
    } // end closeRetweetModal

    $scope.closeMe = function () {
        $scope.retweet_modal.hide();
        $scope.retweet_modal.remove();
    }

    $scope.init = function () {
        console.log('STAHHHHHHHHHP!!!!');
        $scope.$broadcast('scroll.infiniteScrollComplete');
        return;
    }
})

.filter('datetime', function($filter) {
    return function(input) {
        if(input == null){
            return "";
        }
    var _date = $filter('date')(new Date(input), 'HH:mm:ss - MMM dd yyyy');
    // console.log(_date.getHours());
        return _date ;
    };
})
.directive('myclick', function() {

    return function(scope, element, attrs) {

        element.bind('touchstart click', function(event) {

            event.preventDefault();
            event.stopPropagation();

            scope.$apply(attrs['myclick']);
        });
    };
});;
