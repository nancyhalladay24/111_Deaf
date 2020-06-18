var express = require('express')
var request = require('request')
var router = express.Router()

module.exports = router

router.get('/', function(req, res) {
  /*
  // what's forward and back for this for the journey?
  req.session.gplookup.backUrl = req.body['backUrl'];
  req.session.gplookup.onwardUrl = req.body['onwardUrl'];
  */
  res.render('gp-lookup/index.html');
});

router.post('/', function(req, res) {
  if (req.body['gp-registered'] === 'yes') {
    if (req.session.gpoc) {
      // you're in the GPOC journey demo pal:
      //res.redirect('/gp-lookup/gp-pre-lookup-listing');
      res.redirect('/gp-lookup/gp-lookup');
    }
    /* else {
      res.redirect('/gp-lookup/gp-lookup');
    }*/
    res.redirect('/gp-lookup/gp-lookup');
  } else if (req.body['gp-registered'] === 'no') {
    res.send("No");
  } else if (req.body['gp-registered'] === 'unknown') {
    res.send("Unknown");
  } else {
    res.render('gp-lookup/index.html', {
      error : true
    });
  }
});

router.post('/gp-lookup', function(req, res) {
  // zero out a namespaced session obj
  req.session.usersGP = {};
  req.session.usersGP.name = {};
  req.session.usersGP.address = {};
  // add what's been sent across to the session
  req.session.usersGP.name = req.body['practice-name'];
  req.session.usersGP.address = req.body['practice-address'];
  if (req.session.gpoc) {
    // you're in the GPOC journey demo pal:
    if (req.session.gpoc.type === 'handover') {
      res.redirect('/primary-care-dispositions/iteration-4-gpoc/handover-start');
    } else {
      //var session = querystring.stringify(res.session);
      //console.log(session);
      var gp = encodeURIComponent(req.body['practice-name']);
      res.redirect('https://nhs111-gpoc.herokuapp.com/booking-virtually/start?gp=' + gp);
    }
  } else {
    res.send("posted" + req.body['practice-name']);
  }
});
