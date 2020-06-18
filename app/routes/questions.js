var express = require('express')
var fs = require('fs')
var router = express.Router()

module.exports = router

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Creating question journeys from files - June 2018 +++++++++++++++++++++++++++
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

router.get('/', function(req, res) {
  res.redirect('/questions/start');
});

router.get('/start', function(req, res) {
  raw = fs.readFileSync('./data/question-sets/' + req.query.slug + '.json');
  questionSet = JSON.parse(raw);
  res.redirect('/questions/0');
});

router.get('/:num', function(req, res) {

  var count = parseInt(req.params.num);

  if (count == '0') {
    // zero out a namespaced session obj
    req.session.disposition = {};
    req.session.disposition.questionset = questionSet.questionset;
    req.session.disposition.revisiting = false;
  }

  var next = eval(count)+1;
  var prev = eval(count)-1
  if (count === questionSet.questions.length-1) {
    next = questionSet.disposition
  }
  res.render('questions/question.html', {
    question: questionSet.questions[count].question,
    help: questionSet.questions[count].help,
    answers: questionSet.questions[count].answers,
    count: count,
    next: next,
    prev: prev
  });
});

router.post('/question-handler', function(req, res) {
  if (req.session.disposition.revisiting == true) {
    res.redirect('/edge');
  } else {
    var nextQuestion = req.body.next;
    req.session.disposition.number = req.body.num;
    req.session.disposition.question = req.body.question;
    req.session.disposition.help = req.body.help;
    req.session.disposition.answer = req.body.answer;
    res.redirect(nextQuestion);
  }
});
