'use strict';

/**
 * @ngdoc overview
 * @name presidentsClubApp
 * @description
 * # presidentsClubApp
 *
 * Main module of the application.
 */
angular.module('presidentsClubApp', [
        'ngAnimate',
        'ngCookies',
        'ngMessages',
        'ngResource',
        'ngRoute',
        'ngSanitize',
        'ngTouch',
        'ui.mask'
    ])
    .config(function($routeProvider, $sceDelegateProvider, $httpProvider) {
        $httpProvider.useApplyAsync(true);
        $routeProvider
            .when('/', {
                templateUrl: 'views/login.html',
                controller: 'MainCtrl',
                controllerAs: 'main'
            })
            .when('/nominee', {
                templateUrl: 'views/nominee.html',
                controller: 'NomineeCtrl',
                controllerAs: 'nominee'
            })
            .when('/performance', {
                templateUrl: 'views/performance.html',
                controller: 'NomineeCtrl',
                controllerAs: 'nominee'
            })
            .when('/comments', {
                templateUrl: 'views/comments.html',
                controller: 'NomineeCtrl',
                controllerAs: 'nominee'
            })
            .when('/thanks', {
                templateUrl: 'views/thanks.html',
                controller: 'ThanksCtrl',
                controllerAs: 'thanks'
            })
            .otherwise({
                redirectTo: '/'
            });
    })
    .run(['$rootScope', '$location', '$cookieStore', '$http',
        function($rootScope, $location, $cookieStore, $http) {
            $rootScope.cloud = false;
            // keep user logged in after page refresh
            $rootScope.globals = $cookieStore.get('globals') || {};
            if ($rootScope.globals.currentUser) {
                $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata; // jshint ignore:line
            }

            $rootScope.$on('$locationChangeStart', function(event, next, current) { // jshint ignore:line
                // redirect to login page if not logged in
                if ($location.path() !== '/' && !$rootScope.globals.currentUser) {
                    $location.path('/');
                }
            });
        }
    ])
    .value('globals', {
        loader: {
            show: false
        }
    });

'use strict';

/**
 * @ngdoc function
 * @name presidentsClubApp.controller:NavCtrl
 * @description
 * # NavCtrl
 * Controller of the presidentsClubApp
 */
angular.module('presidentsClubApp')
  .controller('NavCtrl', ['$scope', '$rootScope', '$q', '$location', '$routeParams', 'AuthenticationService', 'settings', 
   function ($scope, $rootScope, $q, $location, $routeParams, AuthenticationService, settings) {
    
    $scope.settings = null;

    $scope.checkForLogin = function(){
      if($rootScope.globals.currentUser){
        return true;
      }
      return false;
    };

    $scope.getUsername = function(){
      if($rootScope.globals.currentUser){
        return $rootScope.globals.currentUser.username;
      }
      return '';
    };

    settings.getSettings(function(result) {
      $scope.settings = result;
    });

    $scope.logout = function(){
      // reset login status & return to login
      AuthenticationService.ClearCredentials();
      $rootScope.cloud = false;
      $location.path('/');
    };
    
  }]);

'use strict';

/**
 * @ngdoc function
 * @name presidentsClubApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the presidentsClubApp
 */
angular.module('presidentsClubApp')
    .controller('MainCtrl', ['$scope', '$rootScope', '$location', 'AuthenticationService', 'settings', 'globals',
        function($scope, $rootScope, $location, AuthenticationService, settings, globals) {

            //Bounce to here if we have a user logged in
            if ($rootScope.globals.currentUser) {
                $location.path('/nominee');
            }

            // Obj for user creds
            $scope.loginCredentials = {
                username: null,
                password: null
            };
            $scope.loginError = false;

            $scope.alert = {
                type: 'danger',
                msg: 'Unrecognized username & or password.'
            };

            //Settings for handling the top nav items
            settings.setValue('logo', true);
            settings.setValue('back', false);

            //Called on pressing login
            $scope.tryLogin = function() {
                globals.loader.show = true;
                AuthenticationService.Login($scope.loginCredentials.username, $scope.loginCredentials.password, function(response) {
                    if (response.success) {
                        AuthenticationService.SetCredentials($scope.loginCredentials.username, $scope.loginCredentials.password);
                        $rootScope.cloud = true;
                        $scope.loginError = false;
                        $scope.next();
                    } else {
                        $scope.loginError = true;
                        $scope.alert.msg = response.message;
                        globals.loader.show = false;
                    }
                });
            };

            // Continue to step 1 after successfull login
            $scope.next = function() {
                globals.loader.show = false;
                $location.path('/nominee');
            };

        }
    ]);

'use strict';

/**
 * @ngdoc function
 * @name presidentsClubApp.controller:NomineeCtrl
 * @description
 * # NomineeCtrl
 * Controller of the presidentsClubApp nomination forms
 */
angular.module('presidentsClubApp')
    .controller('NomineeCtrl', ['$scope', '$rootScope', '$location', '$routeParams', 'dataService', 'settings', 'modelService', 'nomineeService',
        function($scope, $rootScope, $location, $routeParams, dataService, settings, modelService, nomineeService) {

            //Bounce to here if we have a user not logged in
            if (!$rootScope.globals.currentUser) {
                $location.path('/');
            } else {
                $rootScope.cloud = true;
            }

            //The persistant data model bound to html
            modelService.getModel(function(result) {
                $scope.nomineeModel = result;
            });

            //Top nav DOM visual switches
            settings.setValue('logo', false);
            settings.setValue('back', true);

            //Step forward to next form after validation
            $scope.next = function(url) {
                if ($scope.userForm.$valid) {
                    //Update local model for persistance
                    modelService.updateModel($scope.nomineeModel);
                    $location.path('/'+url);
                }
            };

            //Step back to previous form
            $scope.back = function(url) {
                //Update local model for persistance
                modelService.updateModel($scope.nomineeModel);
                $location.path('/'+url);
            };

            /*
                Last form (Step 3) calls this method
                Call postNominee in nomineeService here.

            */
            $scope.save = function(url) {
                if ($scope.userForm.$valid) {
                    //Update local model for persistance
                    modelService.updateModel($scope.nomineeModel);
                    //Post model to server
                    nomineeService.postNominee($scope.nomineeModel).then(function(result) {
                        console.log(result);
                        //Goto thank you page.
                        $location.path('/'+url);
                    });
                }
            };

            //Consumable Data for pre-population, dropdowns etc.
            dataService.getData(function(result) {
                $scope.salesOrg = result.salesOrg;
                $scope.regions = result.regions;
                $scope.countries = result.countries;
                $scope.titles = result.titles;
                $scope.salutations = result.salutations;
                $scope.winCount = result.winCount;
            });

        }
    ])
/*
    Directive to handle 70 word max in textarea validation
*/
    .directive('maximumWordsValidation', function() {
        return {
            require: 'ngModel',
            link: function(scope, element, attrs, ngModelCtrl) {
                // Figure out name of count variable we will set on parent scope
                var wordCountName = attrs.ngModel.replace('.', '_') + '_words_count';

                scope.$watch(function() {
                    return ngModelCtrl.$modelValue;
                }, function(newValue) {
                    var str = newValue && newValue.replace('\n', '');
                    // Dont split when string is empty, else count becomes 1
                    var wordCount = str ? str.split(' ').length : 0;
                    // Set count variable
                    scope.$parent[wordCountName] = wordCount;
                    // Update validity
                    var max = attrs.maximumWordsValidation;
                    ngModelCtrl.$setValidity('maximumWords', wordCount <= max);
                });
            }
        };
    });

'use strict';

/**
 * @ngdoc function
 * @name presidentsClubApp.controller:ThanksCtrl
 * @description
 * # ThanksCtrl
 * Controller of the presidentsClubApp
 */
angular.module('presidentsClubApp')
    .controller('ThanksCtrl', ['$scope', '$q', '$location', 'settings', 
        function($scope, $q, $location, settings) {

            settings.setValue('logo', false);
            settings.setValue('back', true);
            
            $scope.restart = function() {
                $location.path('/nominee');
            };

        }
    ]);

/**
 * @ngdoc function
 * @name presidentsClubApp.service:AuthenticationService
 * @description
 * # AuthenticationService
 * Login Authentication Service for the presidentsClubApp
 */
(function() {
    'use strict';
    angular.module('presidentsClubApp')

    .factory('AuthenticationService', ['Base64', '$http', '$cookieStore', '$rootScope', '$timeout',
        function(Base64, $http, $cookieStore, $rootScope, $timeout) {
            var service = {};

            service.Login = function(username, password, callback) {

                /* Dummy authentication for testing, uses $timeout to simulate api call
                 ----------------------------------------------*/
                $timeout(function() {
                    var response = {
                        success: username === 'John_Smith' && password === 'password'
                    };
                    if (!response.success) {
                        response.message = 'Username or password is incorrect';
                    }
                    callback(response);
                }, 1000);


                /* Use this for real authentication
                 ----------------------------------------------*/
                //$http.post('/api/authenticate', { username: username, password: password })
                //    .success(function (response) {
                //        callback(response);
                //    });

            };

            service.SetCredentials = function(username, password) {
                var authdata = Base64.encode(username + ':' + password);

                $rootScope.globals = {
                    currentUser: {
                        username: username,
                        authdata: authdata
                    }
                };

                $http.defaults.headers.common['Authorization'] = 'Basic ' + authdata; // jshint ignore:line
                $cookieStore.put('globals', $rootScope.globals);
            };

            service.ClearCredentials = function() {
                $rootScope.globals = {};
                $cookieStore.remove('globals');
                $http.defaults.headers.common.Authorization = 'Basic ';
            };

            return service;
        }
    ])

    .factory('Base64', function() {
        /* jshint ignore:start */

        var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

        return {
            encode: function(input) {
                var output = "";
                var chr1, chr2, chr3 = "";
                var enc1, enc2, enc3, enc4 = "";
                var i = 0;

                do {
                    chr1 = input.charCodeAt(i++);
                    chr2 = input.charCodeAt(i++);
                    chr3 = input.charCodeAt(i++);

                    enc1 = chr1 >> 2;
                    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                    enc4 = chr3 & 63;

                    if (isNaN(chr2)) {
                        enc3 = enc4 = 64;
                    } else if (isNaN(chr3)) {
                        enc4 = 64;
                    }

                    output = output +
                        keyStr.charAt(enc1) +
                        keyStr.charAt(enc2) +
                        keyStr.charAt(enc3) +
                        keyStr.charAt(enc4);
                    chr1 = chr2 = chr3 = "";
                    enc1 = enc2 = enc3 = enc4 = "";
                } while (i < input.length);

                return output;
            },

            decode: function(input) {
                var output = "";
                var chr1, chr2, chr3 = "";
                var enc1, enc2, enc3, enc4 = "";
                var i = 0;

                // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
                var base64test = /[^A-Za-z0-9\+\/\=]/g;
                if (base64test.exec(input)) {
                    window.alert("There were invalid base64 characters in the input text.\n" +
                        "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
                        "Expect errors in decoding.");
                }
                input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

                do {
                    enc1 = keyStr.indexOf(input.charAt(i++));
                    enc2 = keyStr.indexOf(input.charAt(i++));
                    enc3 = keyStr.indexOf(input.charAt(i++));
                    enc4 = keyStr.indexOf(input.charAt(i++));

                    chr1 = (enc1 << 2) | (enc2 >> 4);
                    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                    chr3 = ((enc3 & 3) << 6) | enc4;

                    output = output + String.fromCharCode(chr1);

                    if (enc3 != 64) {
                        output = output + String.fromCharCode(chr2);
                    }
                    if (enc4 != 64) {
                        output = output + String.fromCharCode(chr3);
                    }

                    chr1 = chr2 = chr3 = "";
                    enc1 = enc2 = enc3 = enc4 = "";

                } while (i < input.length);

                return output;
            }
        };

        /* jshint ignore:end */
    });
})();

/**
 * @ngdoc function
 * @name presidentsClubApp.service:settings
 * @description
 * # Settings
 * Show/hide nav based items for the presidentsClubApp
 */
(function() {
    'use strict';
    angular.module('presidentsClubApp')
        .service('settings', function() {

            var settings = {
                'logo': true,
                'back': false,
                'user': false
            };

            this.getSettings = function(callback) {
                callback(settings);
            };

            this.setValue = function(key, val) {
                settings[key] = val;
            };

        });
})();

/**
 * @ngdoc function
 * @name presidentsClubApp.service:nomineeService
 * @description
 * # NomineeService
 * Main HTTP Service for the presidentsClubApp
 */
(function() {
    'use strict';
    angular.module('presidentsClubApp')
        .factory('nomineeService', function($http, $log, $q) {
            return {
                /* 
                    Server REST API Calls
                    Change URL's to path to your REST call.
                */
                //Post a nominee
                postNominee: function(dataObj) {
                    var q = $q.defer();
                    $http.post('/api/v1/nominees', dataObj)
                        .success(function(result) {
                            q.resolve(result);
                        }).error(function(msg, code) {
                            q.reject(msg);
                            console.log(msg, code);
                        });
                    return q.promise;
                },
                //Get all nominees
                getNominees: function() {
                    var q = $q.defer();
                    $http.get('/api/v1/nominees')
                        .success(function(result) {
                            q.resolve(result);
                        }).error(function(msg, code) {
                            q.reject(msg);
                            console.log(msg, code);
                        });
                    return q.promise;
                },
                //Get a nominee by id
                getNomineeById: function(id) {
                    var q = $q.defer();
                    $http.get('/api/v1/nominees' + id)
                        .success(function(result) {
                            q.resolve(result);
                        }).error(function(msg, code) {
                            q.reject(msg);
                            console.log(msg, code);
                        });
                    return q.promise;
                }
            };
        })
        /*
            Service used to persist the data throughout the form flow
        */
        .service('modelService', function() {
            var nomineeModel = null;
            var template = {
                number: '',
                salesOrg: {},
                region: {},
                country: {},
                salutation: {},
                first: '',
                last: '',
                address: '',
                officeTel: '',
                mobileTel: '',
                email: '',
                title: {},
                nominatedByManager: 'No',
                recurringWinner: 'No',
                winCount: {},
                years: '',
                performance: {
                    salesQuota: null,
                    sales: null,
                    percentOver: null,
                    percentLast: null
                },
                comments: {
                    performance: '',
                    planning: '',
                    relationship: '',
                    behavior: '',
                    leadership: ''
                },
                nominator: {
                    first: '',
                    last: '',
                    email: '',
                    phone: ''
                },
                nominationStatus: ''
            };
            nomineeModel = angular.copy(template);

            this.getModel = function(callback) {
                callback(nomineeModel);
            };
            this.updateModel = function(model) {
                nomineeModel = model;
            };
        });
})();

/*
    Consumable data for dropdowns, etc.
*/
(function() {
    'use strict';
    angular.module('presidentsClubApp')
        .service('dataService', function() {

            var data = {
                salesOrg: [{
                    id: '0',
                    name: 'LSAG/ACG'
                }, {
                    id: '1',
                    name: 'SAG2/ABC'
                }, {
                    id: '2',
                    name: 'SAG3/DEF'
                }, {
                    id: '3',
                    name: 'SAA4/EYT'
                }, {
                    id: '4',
                    name: 'SAG5/ANB'
                }],
                regions: [{
                    id: '0',
                    name: 'China'
                }, {
                    id: '1',
                    name: 'India'
                }, {
                    id: '2',
                    name: 'Russia'
                }, {
                    id: '3',
                    name: 'Italy'
                }, {
                    id: '4',
                    name: 'Australia'
                }],
                countries: [{
                    id: '0',
                    name: 'USA'
                }, {
                    id: '1',
                    name: 'Germany'
                }, {
                    id: '2',
                    name: 'Spain'
                }, {
                    id: '3',
                    name: 'England'
                }, {
                    id: '4',
                    name: 'France'
                }],
                titles: [{
                    id: '0',
                    name: 'Accountant'
                }, {
                    id: '1',
                    name: 'Account Manager'
                }, {
                    id: '2',
                    name: 'District Sales Managr'
                }, {
                    id: '3',
                    name: 'Product Designer'
                }, {
                    id: '4',
                    name: 'Product Specialist'
                }],
                salutations: [{
                    id: '0',
                    name: 'Mr'
                }, {
                    id: '1',
                    name: 'Ms'
                }, {
                    id: '2',
                    name: 'Mrs'
                }, {
                    id: '3',
                    name: 'Dr'
                }],
                winCount: [{
                    id: '0',
                    name: '1'
                }, {
                    id: '1',
                    name: '2'
                }, {
                    id: '2',
                    name: '3'
                }, {
                    id: '3',
                    name: '4'
                }, {
                    id: '4',
                    name: '5'
                }]
            };

            // Call this to get the data
            this.getData = function(callback) {
                callback(data);
            };

        });
})();
