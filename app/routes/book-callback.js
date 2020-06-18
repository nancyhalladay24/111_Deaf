var express = require('express')
var request = require('request')
var naturalSort = require('javascript-natural-sort')
var moment = require('moment-timezone')
var router = express.Router()

module.exports = router

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Book callback - July 2018 +++++++++++++++++++++++++++++++++++++++++++++++++++
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

router.get('/', function(req, res) {
  // zero out a namespaced session obj
  req.session.callBooking = {};
  req.session.callBooking.name = {};
  req.session.callBooking.name.firstname = '';
  req.session.callBooking.name.secondname = '';
  //req.session.callBooking.homePostcode = 'SE1 6LH'; // dummy hardcoded
  //req.session.callBooking.confirmedHome = 'null';
  req.session.callBooking.tel = '';
  req.session.callBooking.backUrl = req.query.backUrl;
  req.session.callBooking.forwardUrl = req.query.forwardUrl;
  res.redirect('/book-callback/number');
});

router.post('/', function(req, res) {
  // zero out a namespaced session obj
  req.session.callBooking = {};
  req.session.callBooking.name = {};
  req.session.callBooking.name.firstname = '';
  req.session.callBooking.name.secondname = '';
  //req.session.callBooking.homePostcode = 'SE1 6LH'; // dummy hardcoded
  //req.session.callBooking.confirmedHome = false
  req.session.callBooking.tel = '';
  req.session.callBooking.backUrl = req.body['backUrl'];
  req.session.callBooking.forwardUrl = req.body['forwardUrl'];
  req.session.callBooking.renderTemplate = req.body['renderTemplate'];
  if (req.body['tel'] === '') {
    res.render(req.session.callBooking.renderTemplate, {
      error: {
        general: '<a href="#tel">We need a valid number to call</a>',
        tel: 'Enter a valid number'
      }
    });
  } else {
    req.session.callBooking.tel = req.body['tel'];
    //res.redirect('/book-callback/you-or-someone-else');
    res.redirect('/book-callback/name');
  }
});

// -----------------------------------------------------------------------------

router.post('/number', function(req, res) {
  if (req.body['tel'] === '') {
    res.render('book-callback/number.html', {
      error: true
    });
  } else {
    req.session.callBooking.tel = req.body['tel'];
    //res.redirect('/book-callback/you-or-someone-else');
    res.redirect('/book-callback/name');
  }
});

// -----------------------------------------------------------------------------

router.post('/name', function(req, res) {
  var error_present = false;
  var error_firstname = false;
  var error_lastname = false;

  if (req.body['firstname'] !== '' || req.body['secondname'] !== '') {
    // If there's value in either field then do the error check
    if (req.body['firstname'] === '') {
      error_firstname = true;
      error_present = true;
    }
    if (req.body['secondname'] === '') {
      error_lastname = true;
      error_present = true;
    }
  }

  req.session.callBooking.name.firstname = req.body['firstname'];
  req.session.callBooking.name.secondname = req.body['secondname'];

  if (error_present !== true) {
    // Do we have a DOB?
    if (req.session.demographics.dob.supplied === true) {
      res.redirect('/book-callback/route-address');
    } else {
      // route through a DOB ask
      res.redirect('/book-callback/date-of-birth');
    }
  } else {
    res.render('book-callback/name.html', {
      error: {
        firstname: error_firstname,
        lastname: error_lastname
      }
    });
  }
});

// -----------------------------------------------------------------------------
// Catch DOB if it wasn't given at the start
router.get('/date-of-birth', function(req, res) {
  res.render('book-callback/date-of-birth.html');
});

router.post('/date-of-birth', function(req, res) {
  var error_present = false;

  var day = req.body['dob-day'];
  var month = req.body['dob-month'];
  var year = req.body['dob-year'];

  req.session.demographics.dob.year = year;
  req.session.demographics.dob.month = month;
  req.session.demographics.dob.day = day;

  if (day !== '' || month !== '' || year !== '') {
    // If there's value in any field then do the error check
    if (day === '') {
      error_present = true;
    }
    if (month === '') {
      error_present = true;
    }
    if (year === '') {
      error_present = true;
    }
  }

  if (error_present === true) {
    res.render('book-callback/date-of-birth.html', {
      error: true
    });
  } else {
    res.redirect('/book-callback/route-address');
  }
});

// -----------------------------------------------------------------------------
// Handle address scenarios
router.get('/route-address', function(req, res) {
  // 1: at home and have given a postcode
  if (req.session.postcodesource === 'user' && req.session.userlocation === 'home') {
    res.redirect('/book-callback/confirm-home-address');
  }
  // 2: somewhere else and have given a postcode
  else if (req.session.postcodesource === 'user' && req.session.userlocation === 'away') {
    res.redirect('/book-callback/confirm-location-address');
  }
  // 3: somewhere else and have given a geolocation - ie we're not 100%
  else {
    res.redirect('/book-callback/attempt-address-confirmation');
  }
});

// -----------------------------------------------------------------------------
// 1: at home and have given a postcode

router.get('/confirm-home-address', function(req, res) {
  if (req.query.backstopTest) {
    req.session.postcode = req.query.backstopTest
  }
  var query = req.session.postcode.replace(/\s+/g, '').toLowerCase();
  request('https://api.getAddress.io/v2/uk/' + query + '/?api-key=' + process.env.POSTCODE_API + '&format=true', function (error, response, body) {
    if (!error) {
      if (response.statusCode == 200) {
        var parsed = JSON.parse(body);
        var addresses = parsed['Addresses'];
        addresses.sort(naturalSort);
        req.session.addressResults = addresses;
        if (addresses.length === 1) {
          res.render('book-callback/confirm-home-single-address.html');
        } else {
          res.render('book-callback/confirm-home-address.html');
        }
      } else {
        res.render('book-callback/address-not-found.html');
      }
    } else {
      res.send("REQUEST NPM BROKE");
    }
  });
});

// confirm (or not) a single address address result
router.post('/confirm-home-single-address', function(req, res) {
  if (req.body['correct-address'] === 'true') {
    res.redirect('/book-callback/confirm-number?selected=0');
  } else if (req.body['correct-address'] === 'false') {
    res.send('address FAIL');
  } else {
    res.render('book-callback/confirm-home-single-address', {
      error : true
    });
  }
});

// -----------------------------------------------------------------------------
// 2: somewhere else and have given a postcode

router.get('/confirm-location-address', function(req, res) {
  if (req.query.backstopTest) {
    req.session.postcode = req.query.backstopTest
  }
  var query = req.session.postcode.replace(/\s+/g, '').toLowerCase();
  request('https://api.getAddress.io/v2/uk/' + query + '/?api-key=' + process.env.POSTCODE_API + '&format=true', function (error, response, body) {
    if (!error) {
      if (response.statusCode == 200) {
        var parsed = JSON.parse(body);
        var addresses = parsed['Addresses'];
        addresses.sort(naturalSort);
        req.session.addressResults = addresses;
        if (addresses.length === 1) {
          res.render('book-callback/confirm-location-single-address.html');
        } else {
          res.render('book-callback/confirm-location-address.html');
        }
      }
    } else {
      res.send("IT BROKE");
    }
  });
});

// confirm (or not) a single address address result (for a non-home location)
router.post('/confirm-location-single-address', function(req, res) {
  if (req.body['correct-address'] === 'true') {
    // try to get home postcode
    res.redirect('/book-callback/home-postcode?selected=0');
  } else if (req.body['correct-address'] === 'false') {
    res.send('address FAIL');
  } else {
    res.render('book-callback/confirm-location-single-address.html', {
      error : true
    });
  }
});

// -----------------------------------------------------------------------------
// "Address not found" scenarios:

// 1: Change postcode
router.post('/change-postcode', function(req, res) {
  if (req.body['postcode'] !== '') {
    req.session.postcode = req.body['postcode'];
    res.redirect('/book-callback/route-address');
  } else {
    res.render('book-callback/change-postcode.html', {
      error : true
    });
  }
});

// 2: Manual address entry
router.post('/manual-address', function(req, res) {
  if (req.body['address_0'] !== '' && req.body['postcode'] !== '') {
    if (req.session.userlocation === 'home') {
      res.redirect('/book-callback/confirm-number');
    } else {
      res.redirect('/book-callback/home-postcode');
    }
  } else {
    res.render('book-callback/manual-address.html', {
      error : true
    });
  }
});


// -----------------------------------------------------------------------------
// Try for home postcode

router.get('/home-postcode', function(req, res) {
  if (req.query['selected']) {
    req.session.userAddressIndex = req.query['selected']
  }
  res.render('book-callback/home-postcode.html');
});

router.post('/home-postcode', function(req, res) {
  req.session.pdsPostcode = req.body['postcode'];
  res.redirect('/book-callback/confirm-number');
});

// -----------------------------------------------------------------------------
// Confirm phone number

router.get('/confirm-number', function(req, res) {
  if (req.query.backstopTest) {
    req.session.callBooking = {};
    req.session.callBooking.tel = req.query.backstopTest
  }
  if (req.query['selected']) {
    req.session.userAddressIndex = req.query['selected']
  }
  res.render('book-callback/confirm-number.html');
});

// -----------------------------------------------------------------------------
// CHANGE phone number

router.get('/change-number', function(req, res) {
  res.render('book-callback/number.html');
});

router.post('/change-number', function(req, res) {
  if (req.body['tel'] !== '') {
    req.session.callBooking.tel = req.body['tel'];
    res.redirect(req.session.callBooking.forwardUrl);
  } else {
    res.render('book-callback/number.html', {
      error: true
    });
  }
});
