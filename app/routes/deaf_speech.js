var express = require('express')
var router = express.Router()

module.exports = router

router.post('/EP-start', function(req, res) {
  res.redirect ('regular-avenues')
});

router.post('/regular-avenues', function (req,res){
  req.session.regularAvenues = req.body['regular-avenues-open']
  if (req.body['regular-avenues-open'] === "true") {
    res.redirect ('regular-avenues-open');
  }
  else {
    res.redirect ('time-till-dose');
  }
});

//Directed to own pharmacist//

//Directed to EP journey//
router.post('/time-till-dose', function (req,res){
  req.session.nextDoseDue = req.body ['next-dose-due']
  req.body ['next-dose-due']
  res.redirect ('get-help-from-a-service');
});

router.post('/name', function(req,res){
  req.session.name = req.body['firstname']
  req.session.name = req.body['secondname']
  res.redirect('number1');
});

router.post('/number1', function(req, res) {
  req.session.number = req.body['tel']
  if (req.body['tel'] === "07777801108"){
    res.redirect ('check-details-mvp');
  }
  else {
    res.redirect('interpreter');
  }
});

//Check details TextNumber

router.post('/interpreter', function(req, res){
  req.session.interpreter = req.body['interpreter']
  if (req.body['interpreter'] === "true"){
    res.redirect ('language');
  }
  else {
    res.redirect ('check-details-neither');
  }
});

router.post('/language', function (req,res){
  req.session.langauge = req.body['language']
  res.redirect ('check-details-mvp-language');
})
