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
                $scope.regions = result.countries;
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
    .controller('ThanksCtrl', ['$scope', '$q', '$location', 'settings', 'modelService', 
        function($scope, $q, $location, settings, modelService) {

            settings.setValue('logo', false);
            settings.setValue('back', true);
            
            $scope.restart = function() {
            	modelService.resetModel();
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
            this.resetModel = function() {
                nomineeModel = angular.copy(template);
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
                countries: [{
                    id: 0,
                    name: 'United States'
                }, {
                    id: 1,
                    name: 'Afghanistan'
                }, {
                    id: 2,
                    name: 'Albania'
                }, {
                    id: 3,
                    name: 'Algeria'
                }, {
                    id: 4,
                    name: 'Andorra'
                }, {
                    id: 5,
                    name: 'Angola'
                }, {
                    id: 6,
                    name: 'Antigua & Deps'
                }, {
                    id: 7,
                    name: 'Argentina'
                }, {
                    id: 8,
                    name: 'Armenia'
                }, {
                    id: 9,
                    name: 'Australia'
                }, {
                    id: 10,
                    name: 'Austria'
                }, {
                    id: 11,
                    name: 'Azerbaijan'
                }, {
                    id: 12,
                    name: 'Bahamas'
                }, {
                    id: 13,
                    name: 'Bahrain'
                }, {
                    id: 14,
                    name: 'Bangladesh'
                }, {
                    id: 15,
                    name: 'Barbados'
                }, {
                    id: 16,
                    name: 'Belarus'
                }, {
                    id: 17,
                    name: 'Belgium'
                }, {
                    id: 18,
                    name: 'Belize'
                }, {
                    id: 19,
                    name: 'Benin'
                }, {
                    id: 20,
                    name: 'Bhutan'
                }, {
                    id: 21,
                    name: 'Bolivia'
                }, {
                    id: 22,
                    name: 'Bosnia Herzegovina'
                }, {
                    id: 23,
                    name: 'Botswana'
                }, {
                    id: 24,
                    name: 'Brazil'
                }, {
                    id: 25,
                    name: 'Brunei'
                }, {
                    id: 26,
                    name: 'Bulgaria'
                }, {
                    id: 27,
                    name: 'Burkina'
                }, {
                    id: 28,
                    name: 'Burundi'
                }, {
                    id: 29,
                    name: 'Cambodia'
                }, {
                    id: 30,
                    name: 'Cameroon'
                }, {
                    id: 31,
                    name: 'Canada'
                }, {
                    id: 32,
                    name: 'Cape Verde'
                }, {
                    id: 33,
                    name: 'Central African Rep'
                }, {
                    id: 34,
                    name: 'Chad'
                }, {
                    id: 35,
                    name: 'Chile'
                }, {
                    id: 36,
                    name: 'China'
                }, {
                    id: 37,
                    name: 'Colombia'
                }, {
                    id: 38,
                    name: 'Comoros'
                }, {
                    id: 39,
                    name: 'Congo'
                }, {
                    id: 40,
                    name: 'Congo Democratic Rep'
                }, {
                    id: 41,
                    name: 'Costa Rica'
                }, {
                    id: 42,
                    name: 'Croatia'
                }, {
                    id: 43,
                    name: 'Cuba'
                }, {
                    id: 44,
                    name: 'Cyprus'
                }, {
                    id: 45,
                    name: 'Czech Republic'
                }, {
                    id: 46,
                    name: 'Denmark'
                }, {
                    id: 47,
                    name: 'Djibouti'
                }, {
                    id: 48,
                    name: 'Dominica'
                }, {
                    id: 49,
                    name: 'Dominican Republic'
                }, {
                    id: 50,
                    name: 'East Timor'
                }, {
                    id: 51,
                    name: 'Ecuador'
                }, {
                    id: 52,
                    name: 'Egypt'
                }, {
                    id: 53,
                    name: 'El Salvador'
                }, {
                    id: 54,
                    name: 'Equatorial Guinea'
                }, {
                    id: 55,
                    name: 'Eritrea'
                }, {
                    id: 56,
                    name: 'Estonia'
                }, {
                    id: 57,
                    name: 'Ethiopia'
                }, {
                    id: 58,
                    name: 'Fiji'
                }, {
                    id: 59,
                    name: 'Finland'
                }, {
                    id: 60,
                    name: 'France'
                }, {
                    id: 61,
                    name: 'Gabon'
                }, {
                    id: 62,
                    name: 'Gambia'
                }, {
                    id: 63,
                    name: 'Georgia'
                }, {
                    id: 64,
                    name: 'Germany'
                }, {
                    id: 65,
                    name: 'Ghana'
                }, {
                    id: 66,
                    name: 'Greece'
                }, {
                    id: 67,
                    name: 'Grenada'
                }, {
                    id: 68,
                    name: 'Guatemala'
                }, {
                    id: 69,
                    name: 'Guinea'
                }, {
                    id: 70,
                    name: 'Guinea-Bissau'
                }, {
                    id: 71,
                    name: 'Guyana'
                }, {
                    id: 72,
                    name: 'Haiti'
                }, {
                    id: 73,
                    name: 'Honduras'
                }, {
                    id: 74,
                    name: 'Hungary'
                }, {
                    id: 75,
                    name: 'Iceland'
                }, {
                    id: 76,
                    name: 'India'
                }, {
                    id: 77,
                    name: 'Indonesia'
                }, {
                    id: 78,
                    name: 'Iran'
                }, {
                    id: 79,
                    name: 'Iraq'
                }, {
                    id: 80,
                    name: 'Ireland Republic'
                }, {
                    id: 81,
                    name: 'Israel'
                }, {
                    id: 82,
                    name: 'Italy'
                }, {
                    id: 83,
                    name: 'Ivory Coast'
                }, {
                    id: 84,
                    name: 'Jamaica'
                }, {
                    id: 85,
                    name: 'Japan'
                }, {
                    id: 86,
                    name: 'Jordan'
                }, {
                    id: 87,
                    name: 'Kazakhstan'
                }, {
                    id: 88,
                    name: 'Kenya'
                }, {
                    id: 89,
                    name: 'Kiribati'
                }, {
                    id: 90,
                    name: 'Korea North'
                }, {
                    id: 91,
                    name: 'Korea South'
                }, {
                    id: 92,
                    name: 'Kosovo'
                }, {
                    id: 93,
                    name: 'Kuwait'
                }, {
                    id: 94,
                    name: 'Kyrgyzstan'
                }, {
                    id: 95,
                    name: 'Laos'
                }, {
                    id: 96,
                    name: 'Latvia'
                }, {
                    id: 97,
                    name: 'Lebanon'
                }, {
                    id: 98,
                    name: 'Lesotho'
                }, {
                    id: 99,
                    name: 'Liberia'
                }, {
                    id: 100,
                    name: 'Libya'
                }, {
                    id: 101,
                    name: 'Liechtenstein'
                }, {
                    id: 102,
                    name: 'Lithuania'
                }, {
                    id: 103,
                    name: 'Luxembourg'
                }, {
                    id: 104,
                    name: 'Macedonia'
                }, {
                    id: 105,
                    name: 'Madagascar'
                }, {
                    id: 106,
                    name: 'Malawi'
                }, {
                    id: 107,
                    name: 'Malaysia'
                }, {
                    id: 108,
                    name: 'Maldives'
                }, {
                    id: 109,
                    name: 'Mali'
                }, {
                    id: 110,
                    name: 'Malta'
                }, {
                    id: 111,
                    name: 'Marshall Islands'
                }, {
                    id: 112,
                    name: 'Mauritania'
                }, {
                    id: 113,
                    name: 'Mauritius'
                }, {
                    id: 114,
                    name: 'Mexico'
                }, {
                    id: 115,
                    name: 'Micronesia'
                }, {
                    id: 116,
                    name: 'Moldova'
                }, {
                    id: 117,
                    name: 'Monaco'
                }, {
                    id: 118,
                    name: 'Mongolia'
                }, {
                    id: 119,
                    name: 'Montenegro'
                }, {
                    id: 120,
                    name: 'Morocco'
                }, {
                    id: 121,
                    name: 'Mozambique'
                }, {
                    id: 122,
                    name: 'Myanmar, Burma'
                }, {
                    id: 123,
                    name: 'Namibia'
                }, {
                    id: 124,
                    name: 'Nauru'
                }, {
                    id: 125,
                    name: 'Nepal'
                }, {
                    id: 126,
                    name: 'Netherlands'
                }, {
                    id: 127,
                    name: 'New Zealand'
                }, {
                    id: 128,
                    name: 'Nicaragua'
                }, {
                    id: 129,
                    name: 'Niger'
                }, {
                    id: 130,
                    name: 'Nigeria'
                }, {
                    id: 131,
                    name: 'Norway'
                }, {
                    id: 132,
                    name: 'Oman'
                }, {
                    id: 133,
                    name: 'Pakistan'
                }, {
                    id: 134,
                    name: 'Palau'
                }, {
                    id: 135,
                    name: 'Panama'
                }, {
                    id: 136,
                    name: 'Papua New Guinea'
                }, {
                    id: 137,
                    name: 'Paraguay'
                }, {
                    id: 138,
                    name: 'Peru'
                }, {
                    id: 139,
                    name: 'Philippines'
                }, {
                    id: 140,
                    name: 'Poland'
                }, {
                    id: 141,
                    name: 'Portugal'
                }, {
                    id: 142,
                    name: 'Qatar'
                }, {
                    id: 143,
                    name: 'Romania'
                }, {
                    id: 144,
                    name: 'Russian Federation'
                }, {
                    id: 145,
                    name: 'Rwanda'
                }, {
                    id: 146,
                    name: 'St Kitts & Nevis'
                }, {
                    id: 147,
                    name: 'St Lucia'
                }, {
                    id: 148,
                    name: 'Saint Vincent & the Grenadines'
                }, {
                    id: 149,
                    name: 'Samoa'
                }, {
                    id: 150,
                    name: 'San Marino'
                }, {
                    id: 151,
                    name: 'Sao Tome & Principe'
                }, {
                    id: 152,
                    name: 'Saudi Arabia'
                }, {
                    id: 153,
                    name: 'Senegal'
                }, {
                    id: 154,
                    name: 'Serbia'
                }, {
                    id: 155,
                    name: 'Seychelles'
                }, {
                    id: 156,
                    name: 'Sierra Leone'
                }, {
                    id: 157,
                    name: 'Singapore'
                }, {
                    id: 158,
                    name: 'Slovakia'
                }, {
                    id: 159,
                    name: 'Slovenia'
                }, {
                    id: 160,
                    name: 'Solomon Islands'
                }, {
                    id: 161,
                    name: 'Somalia'
                }, {
                    id: 162,
                    name: 'South Africa'
                }, {
                    id: 163,
                    name: 'South Sudan'
                }, {
                    id: 164,
                    name: 'Spain'
                }, {
                    id: 165,
                    name: 'Sri Lanka'
                }, {
                    id: 166,
                    name: 'Sudan'
                }, {
                    id: 167,
                    name: 'Suriname'
                }, {
                    id: 168,
                    name: 'Swaziland'
                }, {
                    id: 169,
                    name: 'Sweden'
                }, {
                    id: 170,
                    name: 'Switzerland'
                }, {
                    id: 171,
                    name: 'Syria'
                }, {
                    id: 172,
                    name: 'Taiwan'
                }, {
                    id: 173,
                    name: 'Tajikistan'
                }, {
                    id: 174,
                    name: 'Tanzania'
                }, {
                    id: 175,
                    name: 'Thailand'
                }, {
                    id: 176,
                    name: 'Togo'
                }, {
                    id: 177,
                    name: 'Tonga'
                }, {
                    id: 178,
                    name: 'Trinidad & Tobago'
                }, {
                    id: 179,
                    name: 'Tunisia'
                }, {
                    id: 180,
                    name: 'Turkey'
                }, {
                    id: 181,
                    name: 'Turkmenistan'
                }, {
                    id: 182,
                    name: 'Tuvalu'
                }, {
                    id: 183,
                    name: 'Uganda'
                }, {
                    id: 184,
                    name: 'Ukraine'
                }, {
                    id: 185,
                    name: 'United Arab Emirates'
                }, {
                    id: 186,
                    name: 'United Kingdom'
                }, {
                    id: 187,
                    name: 'Uruguay'
                }, {
                    id: 188,
                    name: 'Uzbekistan'
                }, {
                    id: 189,
                    name: 'Vanuatu'
                }, {
                    id: 190,
                    name: 'Vatican City'
                }, {
                    id: 191,
                    name: 'Venezuela'
                }, {
                    id: 192,
                    name: 'Vietnam'
                }, {
                    id: 193,
                    name: 'Yemen'
                }, {
                    id: 194,
                    name: 'Zambia'
                }, {
                    id: 195,
                    name: 'Zimbabweid'
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
                    name: 'Mr.'
                }, {
                    id: '1',
                    name: 'Ms.'
                }, {
                    id: '2',
                    name: 'Mrs.'
                }, {
                    id: '3',
                    name: 'Miss'
                }, {
                    id: '4',
                    name: 'Dr.'
                }, {
                    id: '5',
                    name: 'Prof.'
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
