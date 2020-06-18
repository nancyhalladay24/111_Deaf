if (process.env.NODE_ENV !== 'production') require('dotenv').config()

var path = require('path')
var express = require('express')
var session = require('express-session')
var favicon = require('serve-favicon')
var nunjucks = require('nunjucks')
var dateFilter = require('nunjucks-date-filter')
var request = require('request')
var bodyParser = require('body-parser')
var utils = require('./lib/utils.js')
var config = require('./app/config.js')

var index = require('./app/routes/index');
var start = require('./app/routes/start');
var findingPathways = require('./app/routes/finding-pathways');
var weirdQuestions = require('./app/routes/weird-questions');
var questions = require('./app/routes/questions');
var forcedCallback = require('./app/routes/forced-callback');
var callbackOffered = require('./app/routes/callback-offered');
var bookCallback = require('./app/routes/book-callback');
var serviceDisplay = require('./app/routes/service-display');
var primaryCareDispositions = require('./app/routes/primary-care-dispositions');
var gpoc = require('./app/routes/gpoc');

var emergencyPrescriptionWizard = require('./app/routes/emergency-prescription-wizard');
var gpLookup = require('./app/routes/gp-lookup');

var userJourneys = require('./app/routes/user-journeys');

var coronavirus = require('./app/routes/coronavirus');
var deaf_speech = require('./app/routes/deaf_speech');

var app = express()

// Grab environment variables specified in Procfile or as Heroku config vars
var username = process.env.USERNAME
var password = process.env.PASSWORD
var appEnvironment = process.env.NODE_ENV || 'development'
var useAuth = process.env.USE_AUTH || config.useAuth
var useHttps = process.env.USE_HTTPS || config.useHttps
var gpLookupURL = process.env.GP_LOOKUP_URL
var gpocNHSUKurl = process.env.GPOC_NHSUK_URL
var mapsKey = process.env.GOOGLE_MAPS_API_KEY

appEnvironment = appEnvironment.toLowerCase()
useAuth = useAuth.toLowerCase()
useHttps = useHttps.toLowerCase()

// Force HTTPs on production connections
if (appEnvironment === 'production' && useHttps === 'true') {
  app.use(utils.forceHttps)
}

// Authenticate against the environment-provided credentials, if running
// the app in production (Heroku, effectively)
if (appEnvironment === 'production' && useAuth === 'true') {
  app.use(utils.basicAuth(username, password))
}

// Disallow search index
app.use(function (req, res, next) {
  // Setting headers stops pages being indexed even if indexed pages link to them.
  res.setHeader('X-Robots-Tag', 'noindex')
  next()
})

// Support session data
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: Math.round(Math.random() * 100000).toString()
}))

// Add variables that are available in all views
app.use(function (req, res, next) {
  res.locals.cookieText = config.cookieText
  res.locals.session = req.session
  res.locals.jsNow = new Date();
  res.locals.gpLookupURL = gpLookupURL;
  next()
})

var myLogger = function (req, res, next) {
  console.log(req.session);
  next();
};
app.use(myLogger);

// Handle form POSTS
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

// Middleware to serve static assets
app.use('/', express.static(path.join(__dirname, '/public')))

// Application settings
app.set('view engine', 'html')

var env = nunjucks.configure('./app/views', {
    autoescape: true,
    express: app,
    noCache: true
});
env.addFilter('date', dateFilter);

// ROUTES
app.use('/', index);
app.use('/start', start);
app.use('/finding-pathways', findingPathways);
app.use('/weird-questions', weirdQuestions);
app.use('/questions', questions);
app.use('/forced-callback', forcedCallback);
app.use('/callback-offered', callbackOffered);
app.use('/book-callback', bookCallback);
app.use('/service-display', serviceDisplay);
app.use('/primary-care-dispositions', primaryCareDispositions);
app.use('/gpoc', gpoc);

app.use('/emergency-prescription-wizard', emergencyPrescriptionWizard);
app.use('/gp-lookup', gpLookup);

app.use('/user-journeys', userJourneys);

app.use('/coronavirus', coronavirus);
app.use('/deaf_speech', deaf_speech);

// auto render any view that exists
app.get(/^\/([^.]+)$/, function (req, res) {
  var path = (req.params[0])

  res.render(path, function (err, html) {
    if (err) {
      res.render(path + '/index', function (err2, html) {
        if (err2) {
          console.log(err)
          res.status(404).send(err + '<br>' + err2)
        } else {
          res.end(html)
        }
      })
    } else {
      res.end(html)
    }
  })
});

app.get('/robots.txt', function (req, res) {
  res.type('text/plain')
  res.send('User-agent: *\nDisallow: /')
})


// start the app
utils.findAvailablePort(app, function (port) {
  console.log('Listening on port ' + port + '   url: http://localhost:' + port)
  app.listen(port)
})
