var module = angular.module('app', ['onsen', 'ngMap', 'ngFileUpload', 'jkAngularRatingStars', 'moment-picker', '720kb.socialshare']);

module.factory('AppShareData', function(){
    return {
        data: {
            user: '',
            lat: '',
            long: '',
            address: '',
            toAddress: '' 
        },
        update: function(userName, latitude, longitude, myAdress, dirAddress) {
            // Improve this method as needed
            this.data.user = userName;
            this.data.lat = latitude;
            this.data.long = longitude;
            this.data.address = myAdress;
            this.data.toAddress = dirAddress;
        }
    };
});

module.factory('imgUtils', function($q) {
    return {
        isImage: function(src) {
        
            var deferred = $q.defer();
        
            var image = new Image();
            image.onerror = function() {
                deferred.resolve(false);
            };
            image.onload = function() {
                deferred.resolve(true);
            };
            image.src = src;
        
            return deferred.promise;
        }
    };
});

module.config(['momentPickerProvider', function (momentPickerProvider) {
    momentPickerProvider.options({
        /* Picker properties */
        locale:        'en-gb',
        format:        'L LT',
        minView:       'month',
        maxView:       'hour',
        startView:     'month',
        autoclose:     true,
        today:         true,
        keyboard:      false,

        /* Extra: Views properties */
        leftArrow:     '&larr;',
        rightArrow:    '&rarr;',
        yearsFormat:   'YYYY',
        monthsFormat:  'MMM',
        daysFormat:    'D',
        hoursFormat:   'HH:[00]',
        hoursStart:    '7',
        hoursEnd:      '19',
        minutesStep:   15
    });
}]);

module.controller('AppController', function($scope, $timeout, $http, NgMap, AppShareData, $interval, $window, Upload, imgUtils) {
    var apiURL = "https://carsone100.com/app/api/apiCalls.php";
    var apiKey = "5b8548dfb0e0520b80d13fca";
    var timerLRCId;

    // app define scope data
    $scope.signUp = [];
    $scope.data = [];
    $scope.login = [];
    $scope.user = [];
    $scope.userLoggedin = false;
    $scope.passInput = "password";
    $scope.book = [];
    $scope.liveWait = "120";
    $scope.login.keepLoggedIn = true;
    $scope.login.updates = true;
    $scope.appNotifyShown = false;
    $scope.appNotifyShownIds = [];
    
    // Appointment Data
    $scope.myAppointID = "";
    $scope.liveConfimApp = [];
    $scope.rsvpConfimApp = [];
    
    // mechanic data
    $scope.curAppointmentList = [];
    $scope.curAppointmentAList = [];
    $scope.NewAddress = "";
    $scope.liveAcceptedApp = [];
    $scope.rsvpAcceptedApp = [];
    $scope.directionsStart = false;
    $scope.payment = [];
    $scope.assessment = [];
    $scope.assessmentPage = 0;
    $scope.assessmentNextPage = 0;
    $scope.assessmentPrePage = 0;
    $scope.assessmentDone = [];
    
    // start of app functions
    // App start up
    $scope.init = function() {
        
        var user = $window.localStorage.getItem('c11email'); 
        var pass = $window.localStorage.getItem('c11password'); 
        
        if (user && pass) {
            $scope.login.username = user;
            $scope.login.password = pass;
            
            $scope.data.errorIcon = 'md-spinner';
            $scope.data.errorIconSpin = true;
            $scope.data.errorCode = '';
            var email = $scope.login.username, password = $scope.login.password;

            $http.post(apiURL, {
                'reqType': 'login',
                'key': apiKey,
                'email': email,
                'password': password})
            .then(function(data){
                console.log("Data:", data.data.html);
                if (data.data.error === 1) {
                    var message = data.data.html.error;
                    ons.notification.alert(message);
                    appNav.pushPage('frontPage.html', { animation : 'fade' });
                } else if (data.data.html.type !== "") {
                    $scope.user.status = data.data.html.status;
                    $scope.user.userID = data.data.html.email;
                    $scope.user.loginDate = data.data.html.loginDate;
                    $scope.user.userKey = data.data.html.userKey;
                    $scope.userLoggedin = true;
                    $scope.user.cellNo = data.data.html.cellNo;
                    $scope.user.firstName = data.data.html.firstName;
                    $scope.user.lastName = data.data.html.lastName;
                    $scope.user.type = data.data.html.type;
                    
                    imgUtils.isImage(data.data.html.imageURL).then(function(result) {
                        if (result) {
                            $scope.user.img = data.data.html.imageURL;
                        } else {
                            $scope.user.img = "images/mechIcon.png";
                        }
                    });
                    
                    $scope.data.errorIcon = 'md-spinner';
                    $scope.data.errorIconSpin = true;
                    $scope.data.errorCode = 'Loading...';
                    AppShareData.update($scope.user.userID, '0.00', '0.00', '', '');

                    if ($scope.user.type === 'customer') {
                        // check if user had previous incomplete inspections
                        var assessmentCurPage = $window.localStorage.getItem('assessmentCurPage'); 
                        var appointID = $window.localStorage.getItem('appointID');
                        
                        if (assessmentCurPage && appointID) {
                            $scope.myAppointID = appointID;
                            ons.notification.alert("The mechanic is still busy with your inspection. You will be taken to progress screen now.");
                            
                            $timeout(function(){
                                var page = assessmentCurPage;
                                
                                $http.post(apiURL, {
                                    'reqType': 'appointmentRead',
                                    'key': apiKey,
                                    'appointID': appointID})
                                .then(function(data){
                                    var result = data.data.html;
                                    if (result) {
                                        $scope.liveConfimApp.address = result.address;
                                        $scope.liveConfimApp.appointID = result.appointID;
                                        $scope.liveConfimApp.carMake = result.mechMake;
                                        $scope.liveConfimApp.date = result.time;
                                        $scope.liveConfimApp.inspectionOnly = result.mechInspectionOnly;
                                        $scope.liveConfimApp.inspectionWarranty = result.mechInspectionWarranty;
                                        $scope.liveConfimApp.mechID = result.mechID;
                                        $scope.liveConfimApp.mechName = result.mechName;
                                        $scope.liveConfimApp.mechCell = result.mechCell;
                                        $scope.liveConfimApp.regNo = result.mechReg;
                                        $scope.liveConfimApp.status = result.status;
                                        
                                        if (page === 'navFrom') {
                                            appNav.pushPage('navigateFrom.html', { animation : 'fade' }); 
                                        } else if (page === 'appPay') {
                                            appNav.pushPage('appointmentPay.html', { animation : 'fade' });
                                        } else if (page === 'assWait') {
                                            appNav.pushPage('assessmentWait.html', { animation : 'fade' });
                                        } else if (page === 'rateMech') {
                                            appNav.pushPage('rateMech.html', { animation : 'fade' });
                                        } else {
                                            ons.notification.alert("Hmmm... Something did not work as accepted.");
                                            appNav.resetToPage('home.html', { animation : 'fade' });
                                        }
                                    }
                                },function(data) {
                                    console.log("Func Data:", data);
                                });
                                
                                
                            },'2000');
                        } else {
                            $timeout(function(){
                                appNav.resetToPage('home.html', { animation : 'fade' });
                            },'2000');
                        }
                    } else if ($scope.user.type === 'mechanic') {
                        $scope.user.carMake = data.data.html.carMake;
                        $scope.user.carReg = data.data.html.carReg;
                        $scope.user.deviceSerial = data.data.html.deviceSerial;
                        $scope.user.imageURL = data.data.html.imageURL;
                        $scope.user.inspectionOnly = data.data.html.inspectionOnly;
                        $scope.user.inspectionWarranty = data.data.html.inspectionWarranty;
                        
                        // check if mech had previous incomplete inspections
                        var assessmentCurPage = $window.localStorage.getItem('assessmentCurPage'); 
                        var appointID = $window.localStorage.getItem('appointID');
                        
                        if (assessmentCurPage && appointID) {
                            ons.notification.alert("You have an incomplete inspection. You will be taken to that inspection now.");
                            $timeout(function(){
                                var page = assessmentCurPage;
                                
                                $http.post(apiURL, {
                                    'reqType': 'appointmentRead',
                                    'key': apiKey,
                                    'appointID': appointID})
                                .then(function(data){
                                    var result = data.data.html;
                                    if (result) {
                                        $scope.liveAcceptedApp.cost = result.cost;
                                        $scope.liveAcceptedApp.address = result.address;
                                        $scope.liveAcceptedApp.appointID = result.appointID;
                                        $scope.liveAcceptedApp.carMake = result.carMake;
                                        $scope.liveAcceptedApp.date = result.time;
                                        $scope.liveAcceptedApp.inspectionOnly = result.inspectionOnly;
                                        $scope.liveAcceptedApp.inspectionWarranty = result.inspectionWarranty;
                                        $scope.liveAcceptedApp.mechID = result.mechID;
                                        $scope.liveAcceptedApp.mechName = result.mechName;
                                        $scope.liveAcceptedApp.userCell = result.userCell;
                                        $scope.liveAcceptedApp.custName = result.custName;
                                        $scope.liveAcceptedApp.regNo = result.regNo;
                                        $scope.liveAcceptedApp.status = result.status;
                                        
                                        if (page === 'navTo') {
                                            appNav.pushPage('mechView/navigateTo.html', { animation : 'fade' });
                                        } else if (page === 'startPay') {
                                            $scope.payment.deviceNum = $scope.user.deviceSerial;
                                            appNav.pushPage('mechView/appPayment.html', { animation : 'fade' });
                                        } else if (page === 'startAss') {
                                            appNav.pushPage('mechView/assessmentStart.html', { animation : 'fade' });
                                        } else if (page <= 21) {
                                            $scope.assessmentCurPage = assessmentCurPage;
                                            
                                            $http.post(apiURL, {
                                                'reqType': 'assesmentList',
                                                'appointID': appointID,
                                                'page': page,
                                                'key': apiKey})
                                            .then(function(data){
                                                myModal.hide();
                                                console.log("Assesment Data:", data);
                                                if (data.status == "200") {
                                                    myModal.show();
                                                    $scope.data.errorIcon = 'md-spinner';
                                                    $scope.data.errorIconSpin = true;
                                                    $scope.data.errorCode = 'Processing...';

                                                    $window.localStorage.setItem('assessmentCurPage',page); 
                                                    $window.localStorage.setItem('appointID',appointID);

                                                    $timeout(function(){
                                                        $scope.assessmentCurPage = page;
                                                        $scope.assessmentNextPage = ++page;
                                                        $scope.assessmentPrePage = --page;
                                                        $scope.assessment = data.data.html;
                                                        appNav.pushPage('mechView/assesmentPage.html', { animation : 'fade' });
                                                        myModal.hide();
                                                    },'1000');
                                                } else {
                                                    var message = data.data.html.error;
                                                    ons.notification.alert(message);
                                                }

                                            },function(data) {
                                                console.log("Data:", data);
                                                myModal.hide();
                                            });
                                        } else {
                                            var message = "Assessment has been completed!";
                                            ons.notification.alert(message);
                                            $timeout(function(){
                                                appNav.pushPage('mechView/assessmentChecklist.html', { animation : 'fade' });
                                                myModal.hide();
                                            },'1000');
                                        }
                                    }
                                },function(data) {
                                    console.log("Func Data:", data);
                                });
                                
                                
                            },'2000');
                        } else {
                            $timeout(function(){
                                appNav.pushPage('mechView/home.html', { animation : 'fade' });
                            },'2000');
                        }
                    }
                } else {
                    
                    var message = data.data.html.error;
                    ons.notification.alert(message);
                    appNav.pushPage('frontPage.html', { animation : 'fade' });
                }

            },function(data) {
                console.log("Data:", data);
            });
            
        } else {
            $timeout(function(){
                appNav.pushPage('frontPage.html', { animation : 'fade' });
            },'2000');
        }
    };

    //side nav tools
    $scope.openMenu = function () {
        var menu = document.getElementById('menu');
        menu.open();
    };

    $scope.loadPage = function (page) {
        var menu = document.getElementById('menu');

        menu.close();
        appNav.resetToPage(page, { animation: 'fade' });
    };
    
    $scope.showPassword = function() {
        $scope.passInput = "text";
    };
    
    $scope.hidePassword = function() {
        $scope.passInput = "password";
    };

    $scope.toStep3 = function() {
        myModal.show();
        $scope.data.errorIcon = 'md-spinner';
        $scope.data.errorIconSpin = true;
        $scope.data.errorCode = 'Loading...';
        var emailRegex = new RegExp("^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$");
        var strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
        
        if (typeof $scope.signUp.email === "undefined" || $scope.signUp.email === '' || typeof $scope.signUp.email2 === "undefined" || $scope.signUp.email2 === '' || typeof $scope.signUp.password === "undefined" || $scope.signUp.password === '' || typeof $scope.signUp.password2 === "undefined" || $scope.signUp.password2 === '' || typeof $scope.signUp.name === "undefined" || $scope.signUp.name === '' || typeof $scope.signUp.surname === "undefined" || $scope.signUp.surname === '' || typeof $scope.signUp.telnumber === "undefined" || $scope.signUp.telnumber === '') {
            var message = "Please complete all the fields";
            myModal.hide();
            ons.notification.alert(message);
        } else if (!emailRegex.test($scope.signUp.email)) {
            var message = "Invalid email address";
            myModal.hide();
            ons.notification.alert(message);
        } else if (!strongRegex.test($scope.signUp.password)) {
            var message = "Invalid password. Password must contain at least one lowercase, one uppercase alphabetical character, one numeric character, one special character (&!@#) and be eight characters or longer";
            myModal.hide();
            ons.notification.alert(message);
        } else if ($scope.signUp.email !== $scope.signUp.email2) {
            var message = "Email addresses did not match, please enter email address carefully.";
            myModal.hide();
            ons.notification.alert(message);
        } else if ($scope.signUp.password !== $scope.signUp.password2) {
            var message = "Passwords did not match, please enter passwords carefully.";
            myModal.hide();
            ons.notification.alert(message);
        } else if (!$scope.signUp.tandc) {
            var message = "Please accept the Terms and Conditions, Terms of Service and Privacy Policy, before you can register.";
            myModal.hide();
            ons.notification.alert(message);
        } else {
            var type = 'customer', firstName = $scope.signUp.name, lastName = $scope.signUp.surname, email = $scope.signUp.email, cellNo = $scope.signUp.telnumber, password = $scope.signUp.password;
            
            $http.post(apiURL, {
                'reqType': 'register',
                'key': apiKey,
                'type': type,
                'firstName': firstName,
                'lastName': lastName,
                'email': email,
                'cellNo': '0'+cellNo,
                'password': password})
            .then(function(data){
                myModal.hide();
                if (data.data.html.status == 'User Registered') {
                    $scope.data.errorIcon = 'md-spinner';
                    $scope.data.errorIconSpin = true;
                    $scope.data.errorCode = 'Loading...';
                    $timeout(function(){
                        appNav.pushPage('welcome.html', { animation : 'fade' });
                        myModal.hide();
                    },'2000');
                } else {
                    $scope.data.errorIcon = 'fa-exclamation-triangle';
                    $scope.data.errorIconSpin = false;
                    $scope.data.errorCode = data.data.html.error;
                    myModal.hide();
                    ons.notification.alert(data.data.html.error);
                }
            },function(data) {
                console.log("Data:", data);
                myModal.hide();
            });
        }
    };

    $scope.completeRegister = function() {
        myModal.show();
        $scope.data.errorIcon = 'md-spinner';
        $scope.data.errorIconSpin = true;
        $scope.data.errorCode = 'Loading...';
        if (typeof $scope.signUp.telnumber === "undefined" || $scope.signUp.telnumber === '') {
            var message = "Please complete the number field";
            myModal.hide();
            ons.notification.alert(message);  
        } else {
            var type = 'customer', firstName = $scope.signUp.name, lastName = $scope.signUp.surname, email = $scope.signUp.email, cellNo = $scope.signUp.telnumber, password = $scope.signUp.password;
            
            $http.post(apiURL, {
                'reqType': 'register',
                'key': apiKey,
                'type': type,
                'firstName': firstName,
                'lastName': lastName,
                'email': email,
                'cellNo': '0'+cellNo,
                'password': password})
            .then(function(data){
                myModal.hide();
                console.log("register Data:", data);
                if (data.data.html.status == 'User Registered') {
                    $scope.data.errorIcon = 'md-spinner';
                    $scope.data.errorIconSpin = true;
                    $scope.data.errorCode = 'Loading...';
                    $timeout(function(){
                        appNav.pushPage('welcome.html', { animation : 'fade' });
                        myModal.hide();
                    },'2000');
                } else {
                    $scope.data.errorIcon = 'fas fa-exclamation-triangle';
                    $scope.data.errorIconSpin = false;
                    $scope.data.errorCode = data.data.html.error;
                    $timeout(function(){
                        appNav.pushPage('signUp.html', { animation : 'fade' });
                        myModal.hide();
                    },'2000');
                }
            },function(data) {
                console.log("Data:", data);
                myModal.hide();
            });
        }
    };
    
    $scope.startLiveRequest = function() {
        $scope.book.curLocation = AppShareData.data.address;
        appNav.pushPage('mechNow.html', { animation : 'fade' });
    };
    
    $scope.liveRequestLookUp = function() {
        myModal.show();
        
        if ($scope.book.otherAddress) {
            $scope.book.address = $scope.book.otherAddress;
        } else {
            $scope.book.address = $scope.book.curLocation;
        }
        
        var addressLine = $scope.book.address;
        $http.get("https://maps.googleapis.com/maps/api/geocode/json?address="+addressLine+"&key=AIzaSyBSsY5dquU2xR5nuMri9DMPl43sLUjQh8c")
        .then(function(data){
            console.log("Address Line:", data.data.results[0].geometry.location);
            var appLat = data.data.results[0].geometry.location.lat;
            var appLng = data.data.results[0].geometry.location.lng;
            
            // send details to server
            $http.post(apiURL, {
                'reqType': 'appointmentMake',
                'key': apiKey,
                'apptype': 'live',
                'customer': $scope.user.userID,
                'address': addressLine,
                'latitude': appLat,
                'longitude': appLng})
            .then(function(data){
                myModal.hide();
                console.log("Live Request Data:",data.data.html);
                $scope.myAppointID = data.data.html.appointID;
                appNav.pushPage('liveAppointWait.html', { animation : 'fade' });
                $scope.book = [];
            },function(data) {
                myModal.hide();
            });
        },function(data) {
            console.log("Error:", data);
            return addressLine;
            myModal.hide();
        });
        /* Old Way
        $http.post(apiURL, {
            'reqType': 'appointmentMake',
            'key': apiKey,
            'apptype': 'live',
            'customer': $scope.user.userID,
            'address': AppShareData.data.address,
            'latitude': AppShareData.data.lat,
            'longitude': AppShareData.data.long})
        .then(function(data){
            myModal.hide();
            console.log("Live Request Data:",data.data.html);
            $scope.myAppointID = data.data.html.appointID;
            appNav.pushPage('liveAppointWait.html', { animation : 'fade' });
            
        },function(data) {
            myModal.hide();
        });
        */
    };
    
    $scope.liveRequestCountdown = function() {
        var countdown = 120;
        var AppApproved = 0;
        timerLRCId = setInterval(function(){
            if (countdown === 0) {
                clearInterval(timerLRCId);
                if (AppApproved === 1) {
                    appNav.pushPage('continueLiveApp.html', { animation : 'fade' });
                    console.log("Appointment Details: ", $scope.liveConfimApp);
                } else if (AppApproved === 2) {
                    
                } else {
                    var message = "Appointment not confirmed";
                    
                    $http.post(apiURL, {
                        'reqType': 'appointmentCancel',
                        'appointID': $scope.myAppointID})
                    .then(function(data){
                        ons.notification.alert(message);
                        appNav.pushPage('scheduleApp.html', { animation : 'fade' });
                    },function(data) {
                        console.log("Func Data:", data);
                    });
                }
            } else {      
                document.getElementById("liveWait").innerHTML = countdown;
                //$scope.liveWait = countdown;
                // get list of appoint
                var remainder = countdown % 2;
                if (remainder === 0){
                    console.log("IgotHere!!")
                    // get list of appoint
                    $http.post(apiURL, {
                        'reqType': 'appointmentRead',
                        'key': apiKey,
                        'appointID': $scope.myAppointID})
                    .then(function(data){
                        var result = data.data.html;
                        if (result.status === "confirmed") {
                            
                            console.log("App Read Data:", result);
                            
                            var message = "Appointment Confirmed, please continue.";
                            ons.notification.alert(message);
                            $scope.liveConfimApp.address = result.address;
                            $scope.liveConfimApp.appointID = result.appointID;
                            $scope.liveConfimApp.carMake = result.mechMake;
                            $scope.liveConfimApp.date = result.time;
                            $scope.liveConfimApp.inspectionOnly = result.mechInspectionOnly;
                            $scope.liveConfimApp.inspectionWarranty = result.mechInspectionWarranty;
                            $scope.liveConfimApp.mechID = result.mechanic;
                            $scope.liveConfimApp.mechName = result.mechName;
                            $scope.liveConfimApp.mechCell = result.mechCell;
                            $scope.liveConfimApp.regNo = result.mechReg;
                            $scope.liveConfimApp.status = result.status;
                            $scope.liveConfimApp.userCell = result.userCell;
                            
                            imgUtils.isImage(result.mechImageURL).then(function(imgresult) {
                                if (imgresult) {
                                    $scope.liveConfimApp.mechImageURL = result.mechImageURL;
                                } else {
                                    $scope.liveConfimApp.mechImageURL = "images/mechIcon.png";
                                }
                            });
                            
                            $scope.liveConfimApp.warranty = false;
                            $scope.liveConfimApp.selectType = true;
                            AppApproved = 1;
                            countdown = 0;
                        }
                    },function(data) {
                        console.log("Func Data:", data);
                    });
                }
                countdown--;
            }
        }, 1000);
    };
    
    $scope.startRSVPRequest = function () {
        $scope.rsvpConfimApp.curLocation = AppShareData.data.address;
        appNav.pushPage('mechAppoint.html', { animation : 'fade' });
    };
    
    $scope.continueRSVP = function () {
        //if ($scope.rsvpConfimApp.otherAddress !== '' || $scope.rsvpConfimApp.otherAddress !== null) {
        if ($scope.rsvpConfimApp.otherAddress) {
            $scope.rsvpConfimApp.address = $scope.rsvpConfimApp.otherAddress;
        } else {
            $scope.rsvpConfimApp.address = $scope.rsvpConfimApp.curLocation;
        }
        $scope.rsvpConfimApp.warranty = false;
        $scope.rsvpConfimApp.NowDate = new Date().toJSON().slice(0, 10);
        appNav.pushPage('continueRSVP.html', { animation : 'fade' });
    };
    
    $scope.awaitRSVPResponse = function () {
        // make rsvp appointment
        myModal.show();
        console.log("RSVP App Details: ", $scope.rsvpConfimApp);
        var addressLine = $scope.rsvpConfimApp.address;
        $http.get("https://maps.googleapis.com/maps/api/geocode/json?address="+addressLine+"&key=AIzaSyBSsY5dquU2xR5nuMri9DMPl43sLUjQh8c")
        .then(function(data){
            console.log("Address Line:", data.data.results[0].geometry.location);
            var appLat = data.data.results[0].geometry.location.lat;
            var appLng = data.data.results[0].geometry.location.lng;
            
            //var dateFields = $scope.rsvpConfimApp.date.split(' ');
            // send details to server
            $http.post(apiURL, {
                'reqType': 'appointmentMake',
                'key': apiKey,
                'apptype': 'scheduled',
                'customer': $scope.user.userID,
                'address': addressLine,
                'latitude': appLat,
                'longitude': appLng,
                'date': $scope.rsvpConfimApp.datepicker,
                'time': $scope.rsvpConfimApp.timepicker})
            .then(function(data){
                myModal.hide();
                console.log("Live Request Data:",data.data.html);
                $scope.myAppointID = data.data.html.appointID;
                appNav.pushPage('awaitRSVPResponse.html', { animation : 'fade' });

            },function(data) {
                myModal.hide();
            });
        },function(data) {
            console.log("Error:", data);
            return addressLine;
            myModal.hide();
        });
    };
    
    $scope.acceptAppCustomer = function () {
        console.log("Warranty Val: ", $scope.liveConfimApp.warranty);
        // send details
        $http.post(apiURL, {
            'reqType': 'appointmentAccept',
            'key': apiKey,
            'mechanic': $scope.liveConfimApp.mechID,
            'warranty': $scope.liveConfimApp.warranty,
            'appointID': $scope.myAppointID})
        .then(function(data){
            var result = data.data.html;
            $scope.liveConfimApp.selectType = false;
            $scope.liveConfimApp.navigate = true;
            console.log("Appointment Accept: ", result);
            AppShareData.update($scope.user.userID, AppShareData.data.lat, AppShareData.data.long, AppShareData.data.address, $scope.liveConfimApp.address);
            $window.localStorage.setItem('assessmentCurPage','navFrom'); 
            $window.localStorage.setItem('appointID',$scope.myAppointID);
            appNav.pushPage('navigateFrom.html', { animation : 'fade' });
        },function(data) {
            console.log("Func Data:", data);
        });
    };
    
    // wait for mech to navigate to address
    $scope.awaitNavResponse = function (appId) {
        var navStarted = 0;
        var timerId = setInterval(function(){           
            if (navStarted === 1) {
                clearInterval(timerId);
                var navComplete = 0;
                var timer1Id = setInterval(function(){           
                    if (navComplete == 1) {
                        $scope.toAddress;
                        clearInterval(timer1Id);
                        $window.localStorage.setItem('assessmentCurPage','appPay'); 
                        $window.localStorage.setItem('appointID',appId);
                        appNav.pushPage('appointmentPay.html', { animation : 'fade' });
                        return false;
                    } else {      
                        $http.post(apiURL, {
                            'reqType': 'appointmentRead',
                            'key': apiKey,
                            'appointID': appId})
                        .then(function(data){
                            var result = data.data.html;
                            console.log("Nav end app read", result);
                            if (!result.navStarted) {
                                navComplete = 1;
                            }
                        },function(data) {
                            console.log("Func Data:", data);
                        });
                    }
                }, 2000);
            } else if (navStarted === 2) {
                clearInterval(timerId);
                ons.notification.alert({
                    message: "The Appointment was cancelled!",
                    title: 'Cancelled!',
                    buttonLabel: 'Continue',
                    animation: 'default',
                    callback: function() {
                        //$scope.liveWait = "120";

                        // Appointment Data
                        $scope.myAppointID = "";
                        $scope.liveConfimApp = [];
                        $scope.rsvpConfimApp = [];

                        // mechanic data
                        $scope.curAppointmentList = [];
                        $scope.curAppointmentAList = [];
                        $scope.NewAddress = "";
                        $scope.liveAcceptedApp = [];
                        $scope.rsvpAcceptedApp = [];
                        $scope.directionsStart = false;
                        $scope.payment = [];
                        $scope.assessment = [];
                        $scope.assessmentPage = 0;
                        $scope.assessmentNextPage = 0;
                        $scope.assessmentPrePage = 0;
                        $scope.assessmentDone = [];
                        
                        $window.localStorage.removeItem('appointID'); 
                        $window.localStorage.removeItem('assessmentCurPage');
                        
                        if ($scope.user.type === 'customer') {
                            appNav.resetToPage('home.html', { animation : 'fade' });
                        } else if ($scope.user.type === 'mechanic') {
                            appNav.resetToPage('mechView/home.html', { animation : 'fade' });
                        }
                    }
                });
            } else {      
                $http.post(apiURL, {
                    'reqType': 'appointmentRead',
                    'key': apiKey,
                    'appointID': appId})
                .then(function(data){
                    var result = data.data.html;
                    console.log("Nav app read", result);
                    if (result.navStarted) {
                        navStarted = 1;
                    } else if (result.status == 'cancelled') {
                        navStarted = 2;
                    }
                },function(data) {
                    console.log("Func Data:", data);
                });
            }
        }, 2000);
    };
        
    // mechanic view appointments
    $scope.getCurrentAppointments = function () {
        myModal.show();
        $http.post(apiURL, {
            'reqType': 'appointmentList'})
        .then(function(data){
            myModal.hide();
            var result = data.data.html;
            console.log("Live Appoint list:", result);
            var arrayLength = result.length;
            $scope.curAppointmentList = [];
            for (var i = 0; i < arrayLength; i++) {
                if (!result[i].mechanic && result[i].status === "made" && result[i].type === 'live') {
                    var nowDate = new Date();
                    nowDate.setHours(0, 0, 0, 0);
                    var compDate = new Date(result[i].date);

                    if (compDate >= nowDate) {
                        $scope.curAppointmentList.push(result[i]);
                    }
                }
            }        
        },function(data) {
            console.log("Func Data:", data);
            myModal.hide();
        });
    };
    
    $scope.getRSVPAppointments = function () {
        myModal.show();
        $http.post(apiURL, {
            'reqType': 'appointmentList'})
        .then(function(data){
            myModal.hide();
            var result = data.data.html;
            console.log("RSVP Appoint list:", result);
            var arrayLength = result.length;
            $scope.curAppointmentList = [];
            $scope.curAppointmentAList = [];
            for (var i = 0; i < arrayLength; i++) {
                if (!result[i].mechanic && result[i].status === "made" && result[i].type === "scheduled") {
                    var nowDate = new Date();
                    nowDate.setHours(0, 0, 0, 0);
                    var compDate = new Date(result[i].date);

                    if (compDate >= nowDate) {
                        $scope.curAppointmentList.push(result[i]);
                    }
                } else if (result[i].mechanic === $scope.user.userID && result[i].status === "accepted" && result[i].type === "scheduled" && !result[i].assessment_done) {
                    $scope.curAppointmentAList.push(result[i]);
                }
            } 
            console.log("Made RSVP Appoint list:", $scope.curAppointmentList);
            console.log("My RSVP Appoint list:", $scope.curAppointmentAList);
        },function(data) {
            console.log("Func Data:", data);
            myModal.hide();
        });
    };
    
    $scope.AcceptCallOut = function (appId) {
        myModal.show();
        console.log("Appointment Confirmed POST DATA: ", 'key ='+apiKey+'&mechanic='+$scope.user.userID+'&appointID='+appId);
        $http.post(apiURL, {
            'reqType': 'appointmentConfirm',
            'key': apiKey,
            'mechanic': $scope.user.userID,
            'appointID': appId})
        .then(function(data){
            $scope.myAppointID = appId;
            console.log("Appointment Confirmed DATA: ", data.data.html);
            myModal.hide();
            if (data.data.html.type === "scheduled") {
                $scope.viewRsvpApp(appId);
                //appNav.pushPage('mechView/home.html', { animation : 'fade' });
            } else {
                var message = "Appointment Confirmed, please stand by!";
                ons.notification.alert(message);
                appNav.pushPage('mechView/appointmentWait.html', { animation : 'fade' });
            }
        },function(data) {
            console.log("Func Data:", data);
            myModal.hide();
        });
    };
    
    $scope.AcceptRSVPCallOut = function (appId) {
        myModal.show();
        console.log("Appointment accepted POST DATA: ", 'key ='+apiKey+'&mechanic='+$scope.user.userID+'&appointID='+appId);
        $http.post(apiURL, {
            'reqType': 'appointmentAccept',
            'key': apiKey,
            'mechanic': $scope.user.userID,
            'appointID': appId})
        .then(function(data){
            $scope.myAppointID = appId;
            console.log("Appointment accepted DATA: ", data.data.html);
            myModal.hide();
            var message = "Appointment Accepted, thank you!";
            ons.notification.alert(message);
            $scope.appNotifyShown = false;
            appNav.pushPage('mechView/home.html', { animation : 'fade' });
        },function(data) {
            console.log("Func Data:", data);
            myModal.hide();
        });
    };
    
    // User wait for mech to accept RSVP appointment
    $scope.AppointmentMechWaitRSVP = function () {
        var AppConfirmed = 0;
        $scope.rsvpConfimApp = [];
        var timerId = setInterval(function(){
            
            if (AppConfirmed == 1) {
                clearInterval(timerId);
                if ($scope.rsvpAcceptedApp.status === "accepted") {
                    //AppShareData.update($scope.user.userID, AppShareData.data.lat, AppShareData.data.long, AppShareData.data.address, $scope.liveAcceptedApp.address);
                    ons.notification.alert({messageHTML:"Appointment Accepted<br><strong>"+$scope.rsvpAcceptedApp.date+"</strong><br>"+$scope.rsvpAcceptedApp.address+"<br>"+$scope.rsvpAcceptedApp.mechName});
                    console.log("Appointment RSVP Details: ", $scope.rsvpAcceptedApp);
                    
                    appNav.pushPage('appointmentConfirmed.html', { animation : 'fade' });
                } else {
                    var message = "Appointment Cancelled";
                    ons.notification.alert(message);
                    appNav.resetToPage('home.html', { animation : 'fade' });
                }
            } else {
                $http.post(apiURL, {
                    'reqType': 'appointmentRead',
                    'key': apiKey,
                    'appointID': $scope.myAppointID})
                .then(function(data){
                    var result = data.data.html;
                    console.log("AppointmentMechWaitRSVP Data:", result);
                    if (result.type === "scheduled" && (result.status === "accepted" || result.status === "cancelled")) {
                        $scope.rsvpAcceptedApp.cost = result.cost;
                        $scope.rsvpAcceptedApp.address = result.address;
                        $scope.rsvpAcceptedApp.appointID = result.appointID;
                        $scope.rsvpAcceptedApp.carMake = result.carMake;
                        $scope.rsvpAcceptedApp.date = result.time;
                        $scope.rsvpAcceptedApp.inspectionOnly = result.inspectionOnly;
                        $scope.rsvpAcceptedApp.inspectionWarranty = result.inspectionWarranty;
                        $scope.rsvpAcceptedApp.mechID = result.mechID;
                        $scope.rsvpAcceptedApp.mechName = result.mechName;
                        $scope.rsvpAcceptedApp.regNo = result.regNo;
                        $scope.rsvpAcceptedApp.status = result.status;
                        AppConfirmed = 1;
                    }
                },function(data) {
                    console.log("Func Data:", data);
                });
            }
        }, 1000);
    };
    
    // Mech wait for user to accept appiontment
    $scope.mechAppointmentWait = function () {
        var AppConfirmed = 0;
        var timerId = setInterval(function(){
            
            if (AppConfirmed == 1) {
                clearInterval(timerId);
                if ($scope.liveAcceptedApp.status === "accepted") {
                    AppShareData.update($scope.user.userID, AppShareData.data.lat, AppShareData.data.long, AppShareData.data.address, $scope.liveAcceptedApp.address);
                    ons.notification.alert({messageHTML:"Appointment Confirmed<br><strong>"+$scope.liveAcceptedApp.date+"</strong><br>"+$scope.liveAcceptedApp.address+""});
                    console.log("Appointment Details: ", $scope.liveAcceptedApp);
                    $window.localStorage.setItem('assessmentCurPage','navTo'); 
                    $window.localStorage.setItem('appointID',$scope.liveAcceptedApp.appointID );
                    $scope.stopRequestLookup();
                    appNav.pushPage('mechView/navigateTo.html', { animation : 'fade' });
                } else {
                    // Appointment Data
                    $scope.myAppointID = "";
                    $scope.liveConfimApp = [];
                    $scope.rsvpConfimApp = [];

                    // mechanic data
                    $scope.curAppointmentList = [];
                    $scope.curAppointmentAList = [];
                    $scope.NewAddress = "";
                    $scope.liveAcceptedApp = [];
                    $scope.rsvpAcceptedApp = [];
                    $scope.directionsStart = false;
                    $scope.payment = [];
                    $scope.assessment = [];
                    $scope.assessmentPage = 0;
                    $scope.assessmentNextPage = 0;
                    $scope.assessmentPrePage = 0;
                    $scope.assessmentDone = [];

                    $window.localStorage.removeItem('appointID'); 
                    $window.localStorage.removeItem('assessmentCurPage');
                    var message = "Appointment Cancelled";
                    ons.notification.alert(message);
                    appNav.resetToPage('mechView/home.html', { animation : 'fade' });
                }
               
            } else {      
                
                $http.post(apiURL, {
                    'reqType': 'appointmentRead',
                    'key': apiKey,
                    'appointID': $scope.myAppointID})
                .then(function(data){
                    var result = data.data.html;
                    if (result.status === "accepted" || result.status === "cancelled") {
                        $scope.liveAcceptedApp.cost = result.cost;
                        $scope.liveAcceptedApp.address = result.address;
                        $scope.liveAcceptedApp.appointID = result.appointID;
                        $scope.liveAcceptedApp.carMake = result.carMake;
                        $scope.liveAcceptedApp.date = result.time;
                        $scope.liveAcceptedApp.inspectionOnly = result.inspectionOnly;
                        $scope.liveAcceptedApp.inspectionWarranty = result.inspectionWarranty;
                        $scope.liveAcceptedApp.mechID = result.mechID;
                        $scope.liveAcceptedApp.mechName = result.mechName;
                        $scope.liveAcceptedApp.userCell = result.userCell;
                        $scope.liveAcceptedApp.custName = result.custName;
                        $scope.liveAcceptedApp.regNo = result.regNo;
                        $scope.liveAcceptedApp.status = result.status;
                        AppConfirmed = 1;
                    }
                },function(data) {
                    console.log("Func Data:", data);
                });
            }
        }, 1000);
    };
    
    // user check if appointment was cancelled
    $scope.checkMechCan = function (appID) {
        var AppCanned = 0;
        var timerId = setInterval(function(){
            
            if (AppCanned == 1) {
                clearInterval(timerId);
                if ($scope.liveAcceptedApp.status === "cancelled") {
                    // Appointment Data
                    $scope.myAppointID = "";
                    $scope.liveConfimApp = [];
                    $scope.rsvpConfimApp = [];

                    // mechanic data
                    $scope.curAppointmentList = [];
                    $scope.curAppointmentAList = [];
                    $scope.NewAddress = "";
                    $scope.liveAcceptedApp = [];
                    $scope.rsvpAcceptedApp = [];
                    $scope.directionsStart = false;
                    $scope.payment = [];
                    $scope.assessment = [];
                    $scope.assessmentPage = 0;
                    $scope.assessmentNextPage = 0;
                    $scope.assessmentPrePage = 0;
                    $scope.assessmentDone = [];

                    $window.localStorage.removeItem('appointID'); 
                    $window.localStorage.removeItem('assessmentCurPage');
                    var message = "Appointment Cancelled by mechanic";
                    ons.notification.alert(message);
                    appNav.resetToPage('home.html', { animation : 'fade' });
                } else if ($scope.liveAcceptedApp.status === "accepted") {
                    clearInterval(timerId);
                }
            } else {      
                
                $http.post(apiURL, {
                    'reqType': 'appointmentRead',
                    'key': apiKey,
                    'appointID': appID})
                .then(function(data){
                    var result = data.data.html;
                    if (result.status === "cancelled" || result.status === "accepted") {
                        $scope.liveAcceptedApp.cost = result.cost;
                        $scope.liveAcceptedApp.address = result.address;
                        $scope.liveAcceptedApp.appointID = result.appointID;
                        $scope.liveAcceptedApp.carMake = result.carMake;
                        $scope.liveAcceptedApp.date = result.time;
                        $scope.liveAcceptedApp.inspectionOnly = result.inspectionOnly;
                        $scope.liveAcceptedApp.inspectionWarranty = result.inspectionWarranty;
                        $scope.liveAcceptedApp.mechID = result.mechID;
                        $scope.liveAcceptedApp.mechName = result.mechName;
                        $scope.liveAcceptedApp.userCell = result.userCell;
                        $scope.liveAcceptedApp.custName = result.custName;
                        $scope.liveAcceptedApp.regNo = result.regNo;
                        $scope.liveAcceptedApp.status = result.status;
                        AppCanned = 1;
                    }
                },function(data) {
                    console.log("Func Data:", data);
                });
            }
        }, 2000);
    };
    
    $scope.viewRsvpApp = function (appID) {
        $scope.viewCurApp = [];
        $http.post(apiURL, {
            'reqType': 'appointmentRead',
            'key': apiKey,
            'appointID': appID})
        .then(function(data){
            var result = data.data.html;
            $scope.viewCurApp.address = result.address;
            $scope.viewCurApp.appointID = result.appointID;
            $scope.viewCurApp.carMake = result.carMake;
            $scope.viewCurApp.date = result.time;
            $scope.viewCurApp.inspectionOnly = result.inspectionOnly;
            $scope.viewCurApp.inspectionWarranty = result.inspectionWarranty;
            $scope.viewCurApp.mechID = result.mechID;
            $scope.viewCurApp.mechName = result.mechName;
            $scope.viewCurApp.regNo = result.regNo;
            $scope.viewCurApp.custName = result.custName;
            $scope.viewCurApp.status = result.status;
            appNav.pushPage('mechView/viewRSVPApp.html', { animation : 'fade' });
        },function(data) {
            console.log("Func Data:", data);
        });
    };
    
    // user check if RSVP appointment was cancelled by user
    $scope.checkUesrCan = function (appID) {
        var AppCanned = 0;
        var timerId = setInterval(function(){
            
            if (AppCanned == 1) {
                clearInterval(timerId);
                if ($scope.viewCurApp.status === "cancelled") {
                    // Appointment Data
                    $scope.myAppointID = "";
                    $scope.liveConfimApp = [];
                    $scope.rsvpConfimApp = [];

                    // mechanic data
                    $scope.curAppointmentList = [];
                    $scope.curAppointmentAList = [];
                    $scope.NewAddress = "";
                    $scope.liveAcceptedApp = [];
                    $scope.rsvpAcceptedApp = [];
                    $scope.viewCurApp = [];
                    $scope.directionsStart = false;
                    $scope.payment = [];
                    $scope.assessment = [];
                    $scope.assessmentPage = 0;
                    $scope.assessmentNextPage = 0;
                    $scope.assessmentPrePage = 0;
                    $scope.assessmentDone = [];

                    $window.localStorage.removeItem('appointID'); 
                    $window.localStorage.removeItem('assessmentCurPage');
                    var message = "Appointment Cancelled by user";
                    ons.notification.alert(message);
                    appNav.resetToPage('mechView/home.html', { animation : 'fade' });
                } else if ($scope.viewCurApp.status === "accepted") {
                    clearInterval(timerId);
                }
            } else {      
                
                $http.post(apiURL, {
                    'reqType': 'appointmentRead',
                    'key': apiKey,
                    'appointID': appID})
                .then(function(data){
                    var result = data.data.html;
                    if (result.status === "cancelled" || result.status === "accepted") {
                        $scope.viewCurApp.cost = result.cost;
                        $scope.viewCurApp.address = result.address;
                        $scope.viewCurApp.appointID = result.appointID;
                        $scope.viewCurApp.carMake = result.carMake;
                        $scope.viewCurApp.date = result.time;
                        $scope.viewCurApp.inspectionOnly = result.inspectionOnly;
                        $scope.viewCurApp.inspectionWarranty = result.inspectionWarranty;
                        $scope.viewCurApp.mechID = result.mechID;
                        $scope.viewCurApp.mechName = result.mechName;
                        $scope.viewCurApp.userCell = result.userCell;
                        $scope.viewCurApp.custName = result.custName;
                        $scope.viewCurApp.regNo = result.regNo;
                        $scope.viewCurApp.status = result.status;
                        AppCanned = 1;
                    }
                },function(data) {
                    console.log("Func Data:", data);
                });
            }
        }, 2000);
    };
    
    // user check for scheduled requests that has nav started
    $scope.checkForSRNStart = function() {
             
        $http.post(apiURL, {
            'reqType': 'userScheduled',
            'key': apiKey,
            'user': $scope.user.userID})
        .then(function(data){
            var result = data.data.html;
            console.log("Notifications Results:", result);
            var arrayLength = result.length;
            for (var i = 0; i < arrayLength; i++) {
                $http.post(apiURL, {
                    'reqType': 'appointmentRead',
                    'key': apiKey,
                    'appointID': result[i].appointID})
                .then(function(data){
                    var result = data.data.html;
                    console.log("AppointmentMechWaitRSVP NAV Data:", result);
                    if (result.error === '' || !result.error) {
                        if (result.navStarted) {
                            $scope.liveConfimApp.address = result.address;
                            $scope.liveConfimApp.appointID = result.appointID;
                            $scope.liveConfimApp.carMake = result.mechMake;
                            $scope.liveConfimApp.date = result.time;
                            $scope.liveConfimApp.inspectionOnly = result.mechInspectionOnly;
                            $scope.liveConfimApp.inspectionWarranty = result.mechInspectionWarranty;
                            $scope.liveConfimApp.mechID = result.mechID;
                            $scope.liveConfimApp.mechName = result.mechName;
                            $scope.liveConfimApp.mechCell = result.mechCell;
                            $scope.liveConfimApp.regNo = result.mechReg;
                            $scope.liveConfimApp.custName = result.custName;
                            $scope.liveConfimApp.status = result.status;

                            imgUtils.isImage(result.mechImageURL).then(function(imgresult) {
                                if (imgresult) {
                                    $scope.liveConfimApp.mechImageURL = result.mechImageURL;
                                } else {
                                    $scope.liveConfimApp.mechImageURL = "images/mechIcon.png";
                                }
                            });

                            $scope.myAppointID = result.appointID;
                            $window.localStorage.setItem('assessmentCurPage','navFrom'); 
                            $window.localStorage.setItem('appointID',result.appointID);
                            appNav.pushPage('navigateFrom.html', { animation : 'fade' }); 
                        } else if (result.invoiceNo !== '') {
                            $scope.liveConfimApp.address = result.address;
                            $scope.liveConfimApp.appointID = result.appointID;
                            $scope.liveConfimApp.carMake = result.mechMake;
                            $scope.liveConfimApp.date = result.time;
                            $scope.liveConfimApp.inspectionOnly = result.mechInspectionOnly;
                            $scope.liveConfimApp.inspectionWarranty = result.mechInspectionWarranty;
                            $scope.liveConfimApp.mechID = result.mechID;
                            $scope.liveConfimApp.mechName = result.mechName;
                            $scope.liveConfimApp.mechCell = result.mechCell;
                            $scope.liveConfimApp.regNo = result.mechReg;
                            $scope.liveConfimApp.custName = result.custName;
                            $scope.liveConfimApp.status = result.status;

                            imgUtils.isImage(result.mechImageURL).then(function(imgresult) {
                                if (imgresult) {
                                    $scope.liveConfimApp.mechImageURL = result.mechImageURL;
                                } else {
                                    $scope.liveConfimApp.mechImageURL = "images/mechIcon.png";
                                }
                            });

                            $scope.myAppointID = result.appointID;
                            $window.localStorage.setItem('assessmentCurPage','assWait'); 
                            $window.localStorage.setItem('appointID',$scope.myAppointID);
                            appNav.pushPage('assessmentWait.html', { animation : 'fade' }); 
                        }
                    }
                },function(data) {
                    console.log("Func Data:", data);
                });
            }
        },function(data) {
            console.log("Func Data:", data);
        });
    };
    
    // mech check for appointments function
    var stop;
    var appCt;
    var appCa;
    var appCid;
    $scope.checkForRequest = function () {
        if ( angular.isDefined(stop) ) return;
        
        stop = $interval(function() {
            if(!$scope.appNotifyShown) {
                $http.post(apiURL, {
                    'reqType': 'appointmentList'})
                .then(function(data){
                    var result = data.data.html;
                    result.reverse();
                    var arrayLength = result.length;
                    for (var i = 0; i < arrayLength; i++) {
                        if (!result[i].mechanic && result[i].status === "made") {

                            // check app list
                            if ($scope.appNotifyShownIds.indexOf(result[i].appointID) === -1) {

                                var nowDate = new Date();
                                nowDate.setMinutes(nowDate.getMinutes() - 30);
                                var compDate = new Date(result[i].date);

                                console.log("Date Now", nowDate);
                                console.log("App Date", compDate);

                                if (compDate >= nowDate) {
                                    appCt = result[i].type;
                                    appCa = result[i].address;
                                    appCid = result[i].appointID;
                                    console.log("App List Data: ",result[i]);
                                    console.log("appNotifyShown: ",$scope.appNotifyShown);
                                    console.log("appNotifyShownId: ",$scope.appNotifyShownId);

                                    $scope.appNotifyShown = true;

                                    ons.notification.confirm({
                                        title: 'A New '+appCt+' Appointment',
                                        messageHTML: 'A new appointment has been made.<br>Address: '+appCa+'<p>Do you accept?</p>',
                                        buttonLabels: ['Accept','Decline']
                                    }).then(function(opt){
                                        console.log(opt); 
                                        if (opt === 0) {
                                            $scope.stopRequestLookup();
                                            $scope.AcceptCallOut(appCid);
                                            $scope.appNotifyShown = false;
                                        } else {
                                            $scope.appNotifyShownIds.push(appCid);
                                            $scope.appNotifyShown = false;
                                            return false;
                                        }
                                    });
                                }
                            }
                            i = arrayLength;
                        }
                    }        
                },function(data) {
                    console.log("Func Data:", data);
                });
            }
        }, 10000);
    };
    $scope.stopRequestLookup = function() {
        if (angular.isDefined(stop)) {
            $interval.cancel(stop);
            stop = undefined;
        }
    };
    $scope.restartRequest = function() {
        $scope.checkForRequest();
    };
    
    $scope.logMeIn = function() {
        myModal.show();
        $scope.data.errorIcon = 'md-spinner';
        $scope.data.errorIconSpin = true;
        $scope.data.errorCode = '';
        if (typeof $scope.login.username === "undefined" || $scope.login.usernamer === '' || typeof $scope.login.password === "undefined" || $scope.login.password === '') {
            var message = "Please complete all the fields!";
            myModal.hide();
            ons.notification.alert(message);  
        } else {
            var email = $scope.login.username, password = $scope.login.password;
            
            $http.post(apiURL, {
                'reqType': 'login',
                'key': apiKey,
                'email': email,
                'password': password})
            .then(function(data){
                myModal.hide();
                console.log("Login Data:", data);
                if (data.data.error === 1) {
                    var message = data.data.html;
                    ons.notification.alert(message);
                } else if (data.data.html.type !== "") {
                    $scope.user.status = data.data.html.status;
                    $scope.user.userID = data.data.html.email;
                    $scope.user.loginDate = data.data.html.loginTime;
                    $scope.user.userKey = data.data.html.userKey;
                    $scope.userLoggedin = true;
                    $scope.user.cellNo = data.data.html.cellNo;
                    $scope.user.firstName = data.data.html.firstName;
                    $scope.user.lastName = data.data.html.lastName;
                    $scope.user.type = data.data.html.type;
                    
                    imgUtils.isImage(data.data.html.imageURL).then(function(result) {
                        if (result) {
                            $scope.user.img = data.data.html.imageURL;
                        } else {
                            $scope.user.img = "images/mechIcon.png";
                        }
                    });
                    
                    myModal.show();
                    $scope.data.errorIcon = 'md-spinner';
                    $scope.data.errorIconSpin = true;
                    $scope.data.errorCode = 'Loading...';
                    AppShareData.update($scope.user.userID, '0.00', '0.00', '', '');
                    
                    if ($scope.login.keepLoggedIn) {
                        $window.localStorage.setItem('c11email',email); 
                        $window.localStorage.setItem('c11password',password);
                    }
                    
                    if ($scope.user.type === 'customer') {
                        // check if user had previous incomplete inspections
                        var assessmentCurPage = $window.localStorage.getItem('assessmentCurPage'); 
                        var appointID = $window.localStorage.getItem('appointID');
                        
                        if (assessmentCurPage && appointID) {
                            $scope.myAppointID = appointID;
                            ons.notification.alert("The mechanic is still busy with your inspection. You will be taken to progress screen now.");
                            
                            $timeout(function(){
                                var page = assessmentCurPage;
                                
                                $http.post(apiURL, {
                                    'reqType': 'appointmentRead',
                                    'key': apiKey,
                                    'appointID': appointID})
                                .then(function(data){
                                    var result = data.data.html;
                                    if (result) {
                                        $scope.liveConfimApp.address = result.address;
                                        $scope.liveConfimApp.appointID = result.appointID;
                                        $scope.liveConfimApp.carMake = result.mechMake;
                                        $scope.liveConfimApp.date = result.time;
                                        $scope.liveConfimApp.inspectionOnly = result.mechInspectionOnly;
                                        $scope.liveConfimApp.inspectionWarranty = result.mechInspectionWarranty;
                                        $scope.liveConfimApp.mechID = result.mechID;
                                        $scope.liveConfimApp.mechName = result.mechName;
                                        $scope.liveConfimApp.mechCell = result.mechCell;
                                        $scope.liveConfimApp.regNo = result.mechReg;
                                        $scope.liveConfimApp.custName = result.custName;
                                        $scope.liveConfimApp.status = result.status;
                                        
                                        if (page === 'navFrom') {
                                            appNav.pushPage('navigateFrom.html', { animation : 'fade' }); 
                                        } else if (page === 'appPay') {
                                            appNav.pushPage('appointmentPay.html', { animation : 'fade' });
                                        } else if (page === 'assWait') {
                                            appNav.pushPage('assessmentWait.html', { animation : 'fade' });
                                        } else if (page === 'assWait') {
                                            appNav.pushPage('rateMech.html', { animation : 'fade' });
                                        } else {
                                            ons.notification.alert("Hmmm... Something did not work as accepted.");
                                            appNav.resetToPage('home.html', { animation : 'fade' });
                                        }
                                    }
                                },function(data) {
                                    console.log("Func Data:", data);
                                });
                                
                                
                            },'2000');
                        } else {
                            $timeout(function(){
                                appNav.resetToPage('home.html', { animation : 'fade' });
                            },'2000');
                        }
                    } else if ($scope.user.type === 'mechanic') {
                        $scope.user.carMake = data.data.html.carMake;
                        $scope.user.carReg = data.data.html.carReg;
                        $scope.user.deviceSerial = data.data.html.deviceSerial;
                        $scope.user.imageURL = data.data.html.imageURL;
                        $scope.user.inspectionOnly = data.data.html.inspectionOnly;
                        $scope.user.inspectionWarranty = data.data.html.inspectionWarranty;
                        
                        // check if mech had previous incomplete inspections
                        var assessmentCurPage = $window.localStorage.getItem('assessmentCurPage'); 
                        var appointID = $window.localStorage.getItem('appointID');
                        
                        if (assessmentCurPage && appointID) {
                            ons.notification.alert("You have an incomplete inspection. You will be taken to that inspection now.");
                            $timeout(function(){
                                var page = assessmentCurPage;
                                
                                $http.post(apiURL, {
                                    'reqType': 'appointmentRead',
                                    'key': apiKey,
                                    'appointID': appointID})
                                .then(function(data){
                                    var result = data.data.html;
                                    if (result) {
                                        $scope.liveAcceptedApp.cost = result.cost;
                                        $scope.liveAcceptedApp.address = result.address;
                                        $scope.liveAcceptedApp.appointID = result.appointID;
                                        $scope.liveAcceptedApp.carMake = result.carMake;
                                        $scope.liveAcceptedApp.date = result.time;
                                        $scope.liveAcceptedApp.inspectionOnly = result.inspectionOnly;
                                        $scope.liveAcceptedApp.inspectionWarranty = result.inspectionWarranty;
                                        $scope.liveAcceptedApp.mechID = result.mechID;
                                        $scope.liveAcceptedApp.mechName = result.mechName;
                                        $scope.liveAcceptedApp.userCell = result.userCell;
                                        $scope.liveAcceptedApp.regNo = result.regNo;
                                        $scope.liveAcceptedApp.custName = result.custName;
                                        $scope.liveAcceptedApp.status = result.status;
                                        
                                        if (page === 'navTo') {
                                            appNav.pushPage('mechView/navigateTo.html', { animation : 'fade' });
                                        } else if (page === 'startPay') {
                                            $scope.payment.deviceNum = $scope.user.deviceSerial;
                                            appNav.pushPage('mechView/appPayment.html', { animation : 'fade' });
                                        } else if (page === 'startAss') {
                                            appNav.pushPage('mechView/assessmentStart.html', { animation : 'fade' });
                                        } else if (page <= 21) {
                                            $scope.assessmentCurPage = assessmentCurPage;
                                            
                                            $http.post(apiURL, {
                                                'reqType': 'assesmentList',
                                                'appointID': appointID,
                                                'page': page,
                                                'key': apiKey})
                                            .then(function(data){
                                                myModal.hide();
                                                console.log("Assesment Data:", data);
                                                if (data.status == "200") {
                                                    myModal.show();
                                                    $scope.data.errorIcon = 'md-spinner';
                                                    $scope.data.errorIconSpin = true;
                                                    $scope.data.errorCode = 'Processing...';

                                                    $window.localStorage.setItem('assessmentCurPage',page); 
                                                    $window.localStorage.setItem('appointID',appointID);

                                                    $timeout(function(){
                                                        $scope.assessmentCurPage = page;
                                                        $scope.assessmentNextPage = ++page;
                                                        $scope.assessmentPrePage = --page;
                                                        $scope.assessment = data.data.html;
                                                        appNav.pushPage('mechView/assesmentPage.html', { animation : 'fade' });
                                                        myModal.hide();
                                                    },'1000');
                                                } else {
                                                    var message = data.data.html.error;
                                                    ons.notification.alert(message);
                                                }

                                            },function(data) {
                                                console.log("Data:", data);
                                                myModal.hide();
                                            });
                                        } else {
                                            var message = "Assessment has been completed!";
                                            ons.notification.alert(message);
                                            $timeout(function(){
                                                appNav.pushPage('mechView/assessmentChecklist.html', { animation : 'fade' });
                                                myModal.hide();
                                            },'1000');
                                        }
                                    }
                                },function(data) {
                                    console.log("Func Data:", data);
                                });
                                
                                
                            },'2000');
                        } else {
                            $timeout(function(){
                                appNav.pushPage('mechView/home.html', { animation : 'fade' });
                            },'2000');
                        }
                    }
                }
                
            },function(data) {
                console.log("Data:", data);
                myModal.hide();
            });
        }
    };
    
    $scope.logout = function() {
        myModal.show();
        $scope.data.errorIcon = 'md-spinner';
        $scope.data.errorIconSpin = true;
        $scope.data.errorCode = 'Loading...';
        $http.post(apiURL, {
            'reqType': 'logout',
            'key': apiKey,
            'userID': $scope.user.userID})
        .then(function(data){
            myModal.hide();
            console.log("Logout Data:", data.data.html);
            if (data.data.html.status == "Logged Out") {
                myModal.show();
                $scope.signUp = [];
                $scope.data = [];
                $scope.login = [];
                $scope.user = [];
                $scope.userLoggedin = false;
                $scope.passInput = "password";
                $scope.book = [];
                $scope.liveWait = "120";
                $scope.login.keepLoggedIn = true;
                $scope.login.updates = true;

                // Appointment Data
                $scope.myAppointID = "";
                $scope.liveConfimApp = [];
                $scope.rsvpConfimApp = [];

                // mechanic data
                $scope.curAppointmentList = [];
                $scope.curAppointmentAList = [];
                $scope.NewAddress = "";
                $scope.liveAcceptedApp = [];
                $scope.rsvpAcceptedApp = [];
                $scope.directionsStart = false;
                $scope.payment = [];
                $scope.assessment = [];
                $scope.assessmentPage = 0;
                $scope.assessmentNextPage = 0;
                $scope.assessmentPrePage = 0;
                $scope.assessmentDone = [];
                $scope.data.errorIcon = 'md-spinner';
                $scope.data.errorIconSpin = true;
                $scope.data.errorCode = 'Processing...';
                $window.localStorage.removeItem('c11email'); 
                $window.localStorage.removeItem('c11password'); 
                
                $scope.stopRequestLookup();
                
                var menu = document.getElementById('menu');                
                
                if (menu.isOpen) {
                    menu.close();
                }
                $timeout(function(){
                    myModal.hide();
                    appNav.pushPage('login.html', { animation : 'fade' });
                },'2000');
            } else {
                var message = data.data.html.error;
                ons.notification.alert(message);
            }

        },function(data) {
            console.log("Data:", data);
            myModal.hide();
        });
    };
    
    $scope.navigateToRSVP = function(appID) {
        ons.notification.confirm({
            title: 'Please note',
            messageHTML: 'By continuing, you will start the navigation process for the appointment.<p>Do you?</p>',
            buttonLabels: ['Accept','Cancel']
        }).then(function(opt){
            console.log(opt); 
            if (opt === 0) {
                $scope.stopRequestLookup();
                console.log("RSVP App ID:", appID);
                $http.post(apiURL, {
                    'reqType': 'appointmentRead',
                    'key': apiKey,
                    'appointID': appID})
                .then(function(data){
                    var result = data.data.html;
                    $scope.liveAcceptedApp.cost = result.cost;
                    $scope.liveAcceptedApp.address = result.address;
                    $scope.liveAcceptedApp.appointID = result.appointID;
                    $scope.liveAcceptedApp.carMake = result.carMake;
                    $scope.liveAcceptedApp.date = result.time;
                    $scope.liveAcceptedApp.inspectionOnly = result.inspectionOnly;
                    $scope.liveAcceptedApp.inspectionWarranty = result.inspectionWarranty;
                    $scope.liveAcceptedApp.mechID = result.mechID;
                    $scope.liveAcceptedApp.mechName = result.mechName;
                    $scope.liveAcceptedApp.regNo = result.regNo;
                    $scope.liveAcceptedApp.custName = result.custName;
                    $scope.liveAcceptedApp.status = result.status;
                    $window.localStorage.setItem('assessmentCurPage','navTo'); 
                    $window.localStorage.setItem('appointID',appID);
                    console.log("RSVP App nav details:", $scope.liveAcceptedApp);
                    appNav.pushPage('mechView/navigateTo.html', { animation : 'fade' });

                },function(data) {
                    console.log("Func Data:", data);
                });
            } else {
                return false;
            }
        });
    };
    // user await complete Payment
    $scope.waitPaymentComplete = function () {
        var payComplete = 0;
        var timerId = setInterval(function(){           
            if (payComplete == 1) {
                clearInterval(timerId);
                $window.localStorage.setItem('assessmentCurPage','assWait'); 
                $window.localStorage.setItem('appointID',$scope.myAppointID);
                appNav.pushPage('assessmentWait.html', { animation : 'fade' });
            } else {      
                $http.post(apiURL, {
                    'reqType': 'appointmentRead',
                    'key': apiKey,
                    'appointID': $scope.myAppointID})
                .then(function(data){
                    var result = data.data.html;
                    console.log("app paid?", result);
                    if (result.invoiceNo != '') {
                        payComplete = 1;
                    }
                },function(data) {
                    console.log("Func Data:", data);
                });
            }
        }, 10000);
    };
    
    // mech to start payment
    $scope.startPayment = function() {
        $scope.payment.deviceNum = $scope.user.deviceSerial;
        var appID = $scope.liveAcceptedApp.appointID !== '' ? $scope.liveAcceptedApp.appointID : $scope.rsvpAcceptedApp.appointID;
        $http.post(apiURL, {
            'reqType': 'stopNav',
            'key': apiKey,
            'appointID': appID})
        .then(function(data){
            console.log("stopNav data:", data);
            $window.localStorage.setItem('assessmentCurPage','startPay'); 
            $window.localStorage.setItem('appointID',appID);
            appNav.pushPage('mechView/appPayment.html', { animation : 'fade' });
        },function(data) {
            console.log("Data:", data);
        });
    };
    
    // mech start assessment
    $scope.toAssessment = function() {
        console.log("Payment Details:", $scope.payment);
        var appID = $scope.liveAcceptedApp.appointID !== '' ? $scope.liveAcceptedApp.appointID : $scope.rsvpAcceptedApp.appointID;
        var ammount = $scope.liveAcceptedApp.cost !== '' ? $scope.liveAcceptedApp.cost : $scope.rsvpAcceptedApp.cost;
        var sellerNum = $scope.payment.sellerNum;
        if ($scope.payment.invoice && $scope.payment.deviceNum && sellerNum) {
            myModal.show();
            $scope.data.errorIcon = 'md-spinner';
            $scope.data.errorIconSpin = true;
            $scope.data.errorCode = 'Loading...';
            $http.post(apiURL, {
                'reqType': 'appointmentPaid',
                'appointID': appID,
                'amount': 770.00,
                'invoiceNo': $scope.payment.invoice,
                'sellerNum': sellerNum,
                'key': apiKey})
            .then(function(data){
                myModal.hide();
                console.log("Payment Data:", data.data.html);
                if (data.data.html.status == "Paid") {
                    myModal.show();
                    $scope.data.errorIcon = 'md-spinner';
                    $scope.data.errorIconSpin = true;
                    $scope.data.errorCode = 'Processing...';
                    $timeout(function(){
                        //$scope.assesmentPage(1); -> hide for now and go to upload page
                        $window.localStorage.setItem('assessmentCurPage','startAss'); 
                        $window.localStorage.setItem('appointID',appID);
                        appNav.pushPage('mechView/assessmentStart.html', { animation : 'fade' });
                        myModal.hide();
                    },'2000');
                } else {
                    var message = data.data.html.error;
                    ons.notification.alert(message);
                }

            },function(data) {
                console.log("Data:", data);
                myModal.hide();
            });
        } else {
            ons.notification.alert("Please complete all the fields.");
        }
    };
    
    // Assessment Start page
    $scope.assessmentStratPage = function (file) {
        myModal.show();
        $scope.data.errorCode = 'Processing, please wait...';
        var appID = $scope.liveAcceptedApp.appointID !== '' ? $scope.liveAcceptedApp.appointID : $scope.rsvpAcceptedApp.appointID;
        if (typeof file === 'undefined' || file === null) {

            myModal.hide();
            ons.notification.alert({
                message: 'Request Failed, try again.',
                title: 'Sorry!',
                buttonLabel: 'OK',
                animation: 'default'
            });
        } else {

            file.upload = Upload.upload({
                url: apiURL,
                method: 'POST',
                file: file,
                data: {
                    'reqType': "uploadScan", 
                    'appointID': appID
                }
            });

            // returns a promise
            file.upload.then(function(resp) {
                // file is uploaded successfully
                console.log('file upload response:', resp);
                console.log('file ' + resp.config.data.file.name + ' is uploaded successfully.');
                myModal.hide();

                if (resp.data.code == 400) {
                    myModal.hide();
                    ons.notification.alert({
                        message: resp.data[0].message,
                        title: 'Sorry!',
                        buttonLabel: 'OK',
                        animation: 'default'
                    });
                } else {
                    myModal.hide();
                    $scope.assessment.vehicle = resp.data[0].message;
                    console.log("Vehicle Data Callback:", resp.data);
                    ons.notification.alert({
                        message: "Thank you!",
                        title: 'Scan Complete!',
                        buttonLabel: 'Continue',
                        animation: 'default',
                        callback: function() {
                            $scope.data = [];
                            appNav.pushPage('mechView/assesmentVehicle.html', { animation : 'fade' });
                            $window.localStorage.setItem('assessmentCurPage',1); 
                            $window.localStorage.setItem('appointID',appID);
                            //$scope.assesmentPage(1);
                        }
                    });
                }
            }, function(resp) {
                if (resp.status > 0) {
                    myModal.hide();
                    $scope.data.result = resp.status + ': ' + resp.data;
                    $scope.data.errorCode = resp.status + ': ' + resp.data;
                    myModal.show();
                }            
            }, function(evt) {
                // progress notify
                console.log('progress: ' + parseInt(100.0 * evt.loaded / evt.total) + '% file :'+ evt.config.data.file.name);
                $scope.data.errorCode = 'progress: ' + parseInt(100.0 * evt.loaded / evt.total) + '%';
            });
        }
    };
    
    //process manully entered VIN NUmber
    $scope.processManualVin = function () {
        myModal.show();
        $scope.data.errorCode = 'Processing, please wait...';
        var appID = $scope.liveAcceptedApp.appointID !== '' ? $scope.liveAcceptedApp.appointID : $scope.rsvpAcceptedApp.appointID;
        
        $http.post(apiURL, {
            'reqType': 'assessmentVehicle',
            'appointID': appID,
            'vin': $scope.assessment.ManVIN,
            'key': apiKey})
        .then(function(resp){
            myModal.hide();
            console.log("Vehicle Data Callback:", resp.data);
            if (resp.data.code == 400) {
                myModal.hide();
                ons.notification.alert({
                    message: resp.data[0].message,
                    title: 'Sorry!',
                    buttonLabel: 'OK',
                    animation: 'default'
                });
            } else {
                myModal.hide();
                $scope.assessment.vehicle = resp.data[0].message;
                console.log("Vehicle Data Callback:", resp.data);
                ons.notification.alert({
                    message: "Thank you!",
                    title: 'Verification Complete!',
                    buttonLabel: 'Continue',
                    animation: 'default',
                    callback: function() {
                        $scope.data = [];
                        appNav.pushPage('mechView/assesmentVehicle.html', { animation : 'fade' });
                        $window.localStorage.setItem('assessmentCurPage',1); 
                        $window.localStorage.setItem('appointID',appID);
                        //$scope.assesmentPage(1);
                    }
                });
            }

        },function(resp) {
            console.log("Data:", resp);
            myModal.hide();
        });
    };
    
    $scope.assesmentPage = function (page) {
        var appID = $scope.liveAcceptedApp.appointID !== '' ? $scope.liveAcceptedApp.appointID : $scope.rsvpAcceptedApp.appointID;
        var con = false;        
        myModal.show();
        $scope.data.errorIcon = 'md-spinner';
        $scope.data.errorIconSpin = true;
        $scope.data.errorCode = 'Loading...';
        
        if (page > 1) {
            var appDP = $scope.assessmentCurPage;
            console.log("Ass Done Data:",  $scope.assessmentDone.results); 
            console.log("Ass submit Page Data:", $scope.assessment);
                        
            var resArr = Object.keys($scope.assessmentDone.results).map(key => ({type: key, value: $scope.assessmentDone.results[key]}));
            console.log("Rebuild Ass Done Data:",  resArr);
            
            var contToNP = false;
            var setcount = 0;
            for (var ad = 0; ad < resArr.length; ad++) {
                console.log("Check ass data checked", resArr[ad]); 
                if (resArr[ad].value.pass === '1' || resArr[ad].value.pass === '0') {
                    setcount++;
                } 
            }
            
            if (setcount === resArr.length) {
                contToNP = true;
            }
            
            if (contToNP) {
                $http.post(apiURL, {
                    'reqType': 'assesmentDone',
                    'appointID': appID,
                    'page': appDP,
                    'key': apiKey,
                    'results': resArr})
                .then(function(data){
                    console.log("Assesment Done Feedback:", data);
                },function(data) {
                    console.log("Data:", data);
                }); 
                $scope.assessmentDone = [];
                con = true;
            } else {
                var message = "Please complete all the checks on the assesment page!";
                ons.notification.alert(message);
                myModal.hide();
            }
        } else {
            con = true;
        }
        
        if (con) {
            if (page <= 21) {
                $http.post(apiURL, {
                    'reqType': 'assesmentList',
                    'appointID': appID,
                    'page': page,
                    'key': apiKey})
                .then(function(data){
                    myModal.hide();
                    console.log("Assesment Data:", data);
                    if (data.status == "200") {
                        myModal.show();
                        $scope.data.errorIcon = 'md-spinner';
                        $scope.data.errorIconSpin = true;
                        $scope.data.errorCode = 'Processing...';
                        
                        $window.localStorage.setItem('assessmentCurPage',page); 
                        $window.localStorage.setItem('appointID',appID);
                        
                        $timeout(function(){
                            $scope.assessmentCurPage = page;
                            $scope.assessmentNextPage = ++page;
                            $scope.assessmentPrePage = --page;
                            $scope.assessment = data.data.html;
                            appNav.pushPage('mechView/assesmentPage.html', { animation : 'fade' });
                            myModal.hide();
                        },'1000');
                    } else {
                        var message = data.data.html.error;
                        ons.notification.alert(message);
                    }

                },function(data) {
                    console.log("Data:", data);
                    myModal.hide();
                });
            } else {
                var message = "Assessment has been completed!";
                ons.notification.alert(message);
                $timeout(function(){
                    appNav.pushPage('mechView/assessmentChecklist.html', { animation : 'fade' });
                    myModal.hide();
                },'1000');
            }
        }
    };
    
    $scope.assessmentComment = function(key) {
        ons.notification.prompt({message: 'Comments'})
        .then(function(comment){
            $scope.assessmentDone.results[key].comment = comment;
        });
    };
    
    $scope.finishAssessment = function() {
        var appID = $scope.liveAcceptedApp.appointID !== '' ? $scope.liveAcceptedApp.appointID : $scope.rsvpAcceptedApp.appointID;
        $http.post(apiURL, {
            'reqType': 'assesmentFinished',
            'appointID': appID,
            'key': apiKey})
        .then(function(data){
            console.log("Assesment FIN Data:", data);
            if (data.data.html.status == "Assessment Completed") {
                myModal.show();
                $scope.data.errorIcon = 'md-spinner';
                $scope.data.errorIconSpin = true;
                $scope.data.errorCode = 'Processing...';
                $timeout(function(){
                     ons.notification.alert("Thank you, information was sent to client.");
                    // Appointment Data
                    $scope.myAppointID = "";
                    $scope.liveConfimApp = [];
                    $scope.rsvpConfimApp = [];

                    // mechanic data
                    $scope.curAppointmentList = [];
                    $scope.curAppointmentAList = [];
                    $scope.NewAddress = "";
                    $scope.liveAcceptedApp = [];
                    $scope.rsvpAcceptedApp = [];
                    $scope.directionsStart = false;
                    $scope.payment = [];
                    $scope.assessment = [];
                    $scope.assessmentPage = 0;
                    $scope.assessmentNextPage = 0;
                    $scope.assessmentPrePage = 0;
                    $scope.assessmentDone = [];
                    $scope.appNotifyShown = false;
                    $scope.appNotifyShownIds = [];
                    
                    // remove inspection storage data
                    $window.localStorage.removeItem('assessmentCurPage'); 
                    $window.localStorage.removeItem('appointID');
                    
                    myModal.hide();
                    appNav.pushPage('mechView/home.html', { animation : 'fade' });
                },'1000');
            } else {
                var message = data.data.html.error;
                ons.notification.alert(message);
            }

        },function(data) {
            console.log("Data:", data);
        });
    };
    
    // USER::Check if assessment is complete
    $scope.checkAssessmentReport = function () {
        var assComp = 0;
        var timerId = setInterval(function(){           
            if (assComp === 1) {
                clearInterval(timerId);
                $window.localStorage.setItem('assessmentCurPage','rateMech'); 
                $window.localStorage.setItem('appointID',$scope.myAppointID);
                appNav.pushPage('rateMech.html', { animation : 'fade' });
            } else {      
                $http.post(apiURL, {
                    'reqType': 'assessmentReport',
                    'key': apiKey,
                    'appointID': $scope.myAppointID})
                .then(function(data){
                    var result = data.data.html;
                    console.log("Assesment Report", result);
                    if (result.status === 'Complete') {
                        assComp = 1;
                    } else {
                        $http.post(apiURL, {
                            'reqType': 'assessmentStep',
                            'key': apiKey,
                            'appointID': $scope.myAppointID})
                        .then(function(data){
                            var result = data.data.html;
                            $scope.liveConfimApp.appStep = result;
                            console.log("Assesment Step", result);
                        },function(data) {
                            console.log("Func Data:", data);
                        });
                    }
                },function(data) {
                    console.log("Func Data:", data);
                });
            }
        }, 5000);
    };
    
    $scope.submitMechRating = function(rating) {
        $http.post(apiURL, {
            'reqType': 'rateMechanic',
            'key': apiKey,
            'appointID': $scope.myAppointID,
            'rating': rating,
            'comment': ''})
        .then(function(data){
            var result = data.data.html;
            console.log("Rate Mechanic:", result);
            if (result.status === 'Mechanic Rated') {
                // Appointment Data
                $scope.myAppointID = "";
                $scope.liveConfimApp = [];
                $scope.rsvpConfimApp = [];
                $scope.data = [];
                $scope.book = [];
                // remove inspection storage data
                $window.localStorage.removeItem('assessmentCurPage'); 
                $window.localStorage.removeItem('appointID');
                $timeout(function(){
                    appNav.pushPage('thankYou.html', { animation : 'fade' });
                },'1000');
            }
        },function(data) {
            console.log("Func Data:", data);
        });
    };
    
    // get user payments
    $scope.paymentHistory = function () {
        $http.post(apiURL, {
            'reqType': 'paymentsHistory',
            'key': apiKey,
            'user': $scope.user.userID})
        .then(function(data){
            var result = data.data.html;
            console.log("payment History:", result);
            $scope.user.payments = result;
            $scope.loadPage('paymentHistory.html');
        },function(data) {
            console.log("Func Data:", data);
        });
    };
    
    // get user notifications
    $scope.userNotes = function () {
        $http.post(apiURL, {
            'reqType': 'userScheduled',
            'key': apiKey,
            'user': $scope.user.userID})
        .then(function(data){
            var result = data.data.html;
            console.log("Notifications Results:", result);
            $scope.user.notifications = result;
            $scope.loadPage('notifications.html');
        },function(data) {
            console.log("Func Data:", data);
        });
    };
    
    // navigate to selected RSVP appointment
    $scope.checkRSVPStatus = function (appID) {
        $http.post(apiURL, {
            'reqType': 'appointmentRead',
            'key': apiKey,
            'appointID': appID})
        .then(function(data){
            var result = data.data.html;
            console.log("AppointmentMechWaitRSVP NAV Data:", result);
            if (!result.navStarted) {
                $scope.rsvpAcceptedApp.cost = result.cost;
                $scope.rsvpAcceptedApp.address = result.address;
                $scope.rsvpAcceptedApp.appointID = result.appointID;
                $scope.rsvpAcceptedApp.carMake = result.carMake;
                $scope.rsvpAcceptedApp.date = result.time;
                $scope.rsvpAcceptedApp.inspectionOnly = result.inspectionOnly;
                $scope.rsvpAcceptedApp.inspectionWarranty = result.inspectionWarranty;
                $scope.rsvpAcceptedApp.mechID = result.mechID;
                $scope.rsvpAcceptedApp.mechName = result.mechName;
                $scope.rsvpAcceptedApp.regNo = result.regNo;
                $scope.rsvpAcceptedApp.status = result.status;
                appNav.pushPage('appointmentConfirmed.html', { animation : 'fade' });   
            } else if (result.invoiceNo !== '') {
                $scope.liveConfimApp.address = result.address;
                $scope.liveConfimApp.appointID = result.appointID;
                $scope.liveConfimApp.carMake = result.mechMake;
                $scope.liveConfimApp.date = result.time;
                $scope.liveConfimApp.inspectionOnly = result.mechInspectionOnly;
                $scope.liveConfimApp.inspectionWarranty = result.mechInspectionWarranty;
                $scope.liveConfimApp.mechID = result.mechID;
                $scope.liveConfimApp.mechName = result.mechName;
                $scope.liveConfimApp.mechCell = result.mechCell;
                $scope.liveConfimApp.regNo = result.mechReg;
                $scope.liveConfimApp.custName = result.custName;
                $scope.liveConfimApp.status = result.status;
                $scope.myAppointID = result.appointID;
                $window.localStorage.setItem('assessmentCurPage','assWait'); 
                $window.localStorage.setItem('appointID',$scope.myAppointID);
                appNav.pushPage('assessmentWait.html', { animation : 'fade' }); 

            } else {
                $scope.liveConfimApp.address = result.address;
                $scope.liveConfimApp.appointID = result.appointID;
                $scope.liveConfimApp.carMake = result.mechMake;
                $scope.liveConfimApp.date = result.time;
                $scope.liveConfimApp.inspectionOnly = result.mechInspectionOnly;
                $scope.liveConfimApp.inspectionWarranty = result.mechInspectionWarranty;
                $scope.liveConfimApp.mechID = result.mechID;
                $scope.liveConfimApp.mechName = result.mechName;
                $scope.liveConfimApp.mechCell = result.mechCell;
                $scope.liveConfimApp.userCell = result.userCell;
                $scope.liveConfimApp.regNo = result.mechReg;
                $scope.liveConfimApp.custName = result.custName;
                $scope.liveConfimApp.status = result.status;
                $scope.myAppointID = appID;
                $window.localStorage.setItem('assessmentCurPage','navFrom'); 
                $window.localStorage.setItem('appointID',result.appointID);
                appNav.pushPage('navigateFrom.html', { animation : 'fade' }); 
            }
        },function(data) {
            console.log("Func Data:", data);
        });
    };
    
    // get user Assessment Reports
    $scope.userAssReport = function () {
        $http.post(apiURL, {
            'reqType': 'userAssReport',
            'key': apiKey,
            'user': $scope.user.userID})
        .then(function(data){
            var result = data.data.html;
            console.log("Assessment Report:", result);
            $scope.user.assessments = result;
            $scope.loadPage('assessmentReports.html');
        },function(data) {
            console.log("Func Data:", data);
        });
    };
    
    $scope.openAssReport = function (appId) {
        window.open('https://apis4africa.com/carsone100/assessment/report/'+appId,'_system','');
    };
    
    // get mech inspections Reports
    $scope.inspectionsReport = function () {
        $http.post(apiURL, {
            'reqType': 'inspectionsReport',
            'key': apiKey,
            'user': $scope.user.userID})
        .then(function(data){
            var result = data.data.html;
            console.log("Inspections Report:", result);
            $scope.user.inspections = result;
            $scope.loadPage('mechView/inspections.html');
        },function(data) {
            console.log("Func Data:", data);
        });
    };
    
    // get mech assessments Report
    $scope.mechAssReport = function () {
        $http.post(apiURL, {
            'reqType': 'assCount',
            'key': apiKey,
            'user': $scope.user.userID})
        .then(function(data){
            var result = data.data.html;
            console.log("Assessments Report:", result);
            $scope.user.assCount = result;
        },function(data) {
            console.log("Func Data:", data);
        });
    };
    
    $scope.cancelRequest = function (appID) {
        clearInterval(timerLRCId);
        timerLRCId = null;
        $http.post(apiURL, {
            'reqType': 'appointmentCancel',
            'appointID': appID})
        .then(function(data){
            ons.notification.alert({
                message: "The Appointment was cancelled successfully.",
                title: 'Cancelled!',
                buttonLabel: 'Continue',
                animation: 'default',
                callback: function() {
                    //$scope.liveWait = "120";

                    // Appointment Data
                    $scope.myAppointID = "";
                    $scope.liveConfimApp = [];
                    $scope.rsvpConfimApp = [];

                    // mechanic data
                    $scope.curAppointmentList = [];
                    $scope.curAppointmentAList = [];
                    $scope.NewAddress = "";
                    $scope.liveAcceptedApp = [];
                    $scope.rsvpAcceptedApp = [];
                    $scope.directionsStart = false;
                    $scope.payment = [];
                    $scope.assessment = [];
                    $scope.assessmentPage = 0;
                    $scope.assessmentNextPage = 0;
                    $scope.assessmentPrePage = 0;
                    $scope.assessmentDone = [];
                    $window.localStorage.removeItem('appointID'); 
                    $window.localStorage.removeItem('assessmentCurPage'); 
                    if ($scope.user.type === 'customer') {
                        appNav.resetToPage('home.html', { animation : 'fade' });
                    } else if ($scope.user.type === 'mechanic') {
                        appNav.resetToPage('mechView/home.html', { animation : 'fade' });
                    }
                }
            });
        },function(data) {
            console.log("Func Data:", data);
        });
    };
    
    function getAddressLine(lat,long) {
        var dest = lat+','+long;
        var addressLine = "";
        $http.get("https://maps.googleapis.com/maps/api/geocode/json?latlng="+dest+"&key=AIzaSyBSsY5dquU2xR5nuMri9DMPl43sLUjQh8c")
        .then(function(data){
            console.log("Address Line:", data.data.results[0].formatted_address);
            
            addressLine = data.data.results[0].formatted_address;
            return addressLine;
        },function(data) {
            console.log("Error:", data);
            return addressLine;
        });
    }
});

// Map Controler
module.controller('mapController', function($scope, $http, $timeout, $interval, NgMap, AppShareData, $window) {
    console.log("navigator.geolocation works well");
    var apiURL = "https://carsone100.com/app/api/apiCalls.php";
    var apiKey = "5b8548dfb0e0520b80d13fca";
    
    var markers = [];
    var infowindow = new google.maps.InfoWindow();
    
    $scope.map;
    $scope.myLat;
    $scope.myLng;
    $scope.machMarkers = [];
    $scope.myAddress;
    $scope.toAddress;
    $scope.user = AppShareData.data.user;
    $scope.directionsStart = false;

    console.log("Map User:", $scope.user);

    var onSuccess = function(position) {

        NgMap.getMap().then(function(map) {
            $scope.map = map;
            $scope.myLat = position.coords.latitude;
            $scope.myLng = position.coords.longitude;
            
            console.log("My lat:" + $scope.myLat + ", My lng:" + $scope.myLng);
            console.log("Map Details:", $scope.map);
            $timeout(userPosUp, 2000);
            $timeout(setmachMarkers, 4000);
        });
    };

    // onError Callback receives a PositionError object
    //
    function onError(error) {
        var message = 'code: ' + error.code + '\n' + 'message: ' + error.message + '\n';
        ons.notification.alert(message);
    }
    
    navigator.geolocation.getCurrentPosition(onSuccess, onError, { maximumAge: 3000, timeout: 5000, enableHighAccuracy: true });
    
    //$interval(userPosUp, 30000);
    //$interval(setmachMarkers, 35000);
    
    // set up user data
    function userPosUp() {
        $http.post(apiURL, {
            'reqType': 'location',
            'key': apiKey,
            'user': $scope.user,
            'latitude': $scope.myLat,
            'longitude': $scope.myLng})
        .then(function(data){
            myModal.hide();
            console.log("location Data:", data.data.html);
            getCurrentAddress();
            AppShareData.update($scope.user, $scope.myLat, $scope.myLng, $scope.myAddress, '');
            $scope.map.setCenter({lat:$scope.myLat, lng:$scope.myLng});
        },function(data) {
            console.log("location error Data:", data);
            myModal.hide();
        });
    }
    
    function setmachMarkers() {
        $http.post(apiURL, {
            'reqType': 'vicinity',
            'key': apiKey,
            'latitude': $scope.myLat,
            'longitude': $scope.myLng})
        .then(function(data){
            myModal.hide();
            console.log("vicinity Data:", data.data.html);
            
            if (data.data.html.length > 0) {
                $scope.mackMarkers = null;
                $scope.mackMarkers = [];
                for (var i=0; i<data.data.html.length; i++) {
                    var store = data.data.html[i];

                    if (markers[i]) {
                        markers[i].setPosition( new google.maps.LatLng( store.latitude,store.longitude ) );
                        $scope.mackMarkers.push(markers[i]); 
                    } else {
                        store.position = new google.maps.LatLng(store.latitude,store.longitude);
                        store.title = store.mechanic;
                        store.icon = 'https://www.carsone100.com/app/images/mapMarker.png';
                        store.html = 'Distance from you: '+store.kms+'km';
                        markers[i] = new google.maps.Marker(store);
                        google.maps.event.addListener(markers[i], 'click', function() {
                            $scope.map.setCenter(this.getPosition());
                            infowindow.setContent(this.html);
                            infowindow.open($scope.map, this);
                        });
                        $scope.mackMarkers.push(markers[i]); 
                        markers[i].setPosition(store.position);
                        markers[i].setMap($scope.map);
                    }
                }
            } else {
                ons.notification.toast({message: 'SORRY!<br>Your area is not covered yet.<br>We will keep you updated.<br><ons-button modifier="large" ng-click="startRSVPRequest()" style="background-color: #333;">Schedule an Appointment</ons-button>'});
            }

        },function(data) {
            console.log("Data:", data);
            myModal.hide();
        });
    }
        
    function getCurrentAddress() {
        var dest = $scope.myLat+','+$scope.myLng;
        $http.get("https://maps.googleapis.com/maps/api/geocode/json?latlng="+dest+"&key=AIzaSyBSsY5dquU2xR5nuMri9DMPl43sLUjQh8c")
        .then(function(data){
            $scope.myAddress = data.data.results[0].formatted_address;
            AppShareData.update($scope.user, $scope.myLat, $scope.myLng, $scope.myAddress, '');
        },function(data) {
            console.log("Error:", data);
        });
    }
        
    $scope.getDirectionTo = function (curAppId) {
        if ($scope.toAddress !== '') {
            var dest = $scope.myLat+','+$scope.myLng;
            var start = $scope.toAddress;
            var request = {
                origin: start,
                destination: dest,
                travelMode: google.maps.TravelMode.DRIVING
            };
            
            $http.post(apiURL, {
                'reqType': 'startNav',
                'key': apiKey,
                'appointID': curAppId})
            .then(function(data){
                $scope.directionsStart = true;
            },function(data) {
                console.log("startNav Data:", data);
            });
        }
    };
    
    $scope.getDirectionFrom = function (appId) {
        
        var navStarted = 0;
        var timerId = setInterval(function(){           
            if (navStarted === 1) {
                clearInterval(timerId);
                var navComplete = 0;
                var timer1Id = setInterval(function(){           
                    if (navComplete == 1) {
                        $scope.toAddress;
                        clearInterval(timer1Id);
                        appNav.pushPage('appointmentPay.html', { animation : 'fade' });
                        return false;
                    } else {      
                        $http.post(apiURL, {
                            'reqType': 'appointmentRead',
                            'key': apiKey,
                            'appointID': appId})
                        .then(function(data){
                            var result = data.data.html;
                            console.log("Nav end app read", result);
                            if (!result.navStarted) {
                                navComplete = 1;
                            }
                        },function(data) {
                            console.log("Func Data:", data);
                        });
                    }
                }, 2000);
            } else {      
                $http.post(apiURL, {
                    'reqType': 'appointmentRead',
                    'key': apiKey,
                    'appointID': appId})
                .then(function(data){
                    var result = data.data.html;
                    console.log("Nav app read", result);
                    if (result.navStarted) {
                        //$scope.toAddress = result.address;
                        $http.post(apiURL, {
                            'reqType': 'vicinity',
                            'key': apiKey,
                            'latitude': $scope.myLat,
                            'longitude': $scope.myLng})
                        .then(function(data){
                            console.log("vicinity Data:", data.data.html);

                            if (data.data.html.length > 0) {
                                for (var i = 0; i < data.data.html.length; i++) {
                                    if (data.data.html[i].mechID === result.mechanic) {
                                                                               
                                    }
                                } 
                            } 
                            
                        },function(data) {
                            console.log("Data:", data);
                        });
                        navStarted = 1;
                    }
                },function(data) {
                    console.log("Func Data:", data);
                });
            }
        }, 2000);
    };
});

// Map Mech Controler
module.controller('mapMechController', function($scope, $http, $timeout, $interval, $window, NgMap, AppShareData, $window) {
    console.log("navigator.geolocation works well");
    var apiURL = "https://carsone100.com/app/api/apiCalls.php";
    var apiKey = "5b8548dfb0e0520b80d13fca";
    
    var markers = [];
    var infowindow = new google.maps.InfoWindow();
    
    $scope.map;
    $scope.myLat;
    $scope.myLng;
    $scope.machMarkers = [];
    $scope.myAddress;
    $scope.toAddress = AppShareData.data.toAddress;
    $scope.user = AppShareData.data.user;
    $scope.navigateStarted = 'no';
    $scope.directionsStart = false;
    $scope.navToURL = '';

    console.log("Map User:", $scope.user);

    var onSuccess = function(position) {

        NgMap.getMap().then(function(map) {
            $scope.map = map;
            $scope.myLat = position.coords.latitude;
            $scope.myLng = position.coords.longitude;
            
            console.log("My lat:" + $scope.myLat + ", My lng:" + $scope.myLng);
            console.log("Map Details:", $scope.map);
            $timeout(userPosUp, 2000);
            setmachMarkers;
        });
    };

    // onError Callback receives a PositionError object
    //
    function onError(error) {
        var message = 'code: ' + error.code + '\n' + 'message: ' + error.message + '\n';
        ons.notification.alert(message);
    }

    //$interval(userPosUp, 30000);
    
    navigator.geolocation.getCurrentPosition(onSuccess, onError, { maximumAge: 3000, timeout: 5000, enableHighAccuracy: true });
    
    // set up user data
    function userPosUp() {
        $http.post(apiURL, {
            'reqType': 'location',
            'key': apiKey,
            'user': $scope.user,
            'latitude': $scope.myLat,
            'longitude': $scope.myLng})
        .then(function(data){
            myModal.hide();
            console.log("location Data:", data.data.html);
            getCurrentAddress();
            AppShareData.update($scope.user, $scope.myLat, $scope.myLng, $scope.myAddress, '');
            $scope.map.setCenter({lat:$scope.myLat, lng:$scope.myLng});
        },function(data) {
            console.log("Data:", data);
            myModal.hide();
        });
    }
    
    function setmachMarkers() {
        $http.post(apiURL, {
            'reqType': 'vicinity',
            'key': apiKey,
            'latitude': $scope.myLat,
            'longitude': $scope.myLng})
        .then(function(data){
            myModal.hide();
            console.log("vicinity Data:", data.data.html);
            

            $scope.mackMarkers = [];
            for (var i=0; i<data.data.html.length; i++) {
                var store = data.data.html[i];
                
                if (markers[i]) {
                    markers[i].setPosition( new google.maps.LatLng( store.latitude,store.longitude ) );
                    $scope.mackMarkers.push(markers[i]); 
                } else {
                    store.position = new google.maps.LatLng(store.latitude,store.longitude);
                    store.title = store.mechanic;
                    store.animation = google.maps.Animation.DROP;
                    store.icon = 'https://www.carsone100.com/app/images/mapMarker.png';
                    store.html = 'Distance from you: '+store.kms+'km';
                    markers[i] = new google.maps.Marker(store);
                    google.maps.event.addListener(markers[i], 'click', function() {
                        $scope.map.setCenter(this.getPosition());
                        infowindow.setContent(this.html);
                        infowindow.open($scope.map, this);
                        //getDirections(this.getPosition());
                    });
                    $scope.mackMarkers.push(markers[i]); 
                    markers[i].setPosition(store.position);
                    markers[i].setMap($scope.map);
                }
            }

        },function(data) {
            console.log("Data:", data);
            myModal.hide();
        });
    }
    
    function getCurrentAddress() {
        var dest = $scope.myLat+','+$scope.myLng;
        $http.get("https://maps.googleapis.com/maps/api/geocode/json?latlng="+dest+"&key=AIzaSyBSsY5dquU2xR5nuMri9DMPl43sLUjQh8c")
        .then(function(data){
            $scope.myAddress = data.data.results[0].formatted_address;
            AppShareData.update($scope.user, $scope.myLat, $scope.myLng, $scope.myAddress, '');
        },function(data) {
            console.log("Error:", data);
        });
    }
    
    $scope.getDirectionTo = function (curAppId, address = '') {
        if ($scope.toAddress !== '' || address !== '') {
            var start = $scope.myLat+','+$scope.myLng;
            var dest = $scope.toAddress;
            
            $http.post(apiURL, {
                'reqType': 'startNav',
                'key': apiKey,
                'appointID': curAppId})
            .then(function(data){
                console.log("startNav Data:", data);
                $scope.directionsStart = true;
                $scope.navToURL = "https://www.google.com/maps/dir/?api=1&destination="+dest+"&travelmode=driving";
                $window.localStorage.setItem('assessmentCurPage','navTo'); 
                $window.localStorage.setItem('appointID',curAppId);
            },function(data) {
                console.log("startNav Data:", data);
            });
        }
    };
});