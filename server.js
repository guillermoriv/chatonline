'use strict';

const express     = require('express');
const session     = require('express-session');
const bodyParser  = require('body-parser');
const auth        = require('./app/auth.js');
const routes      = require('./app/routes.js');
const mongo       = require('mongodb').MongoClient;
const passport    = require('passport');
const cookieParser= require('cookie-parser')
const app         = express();
const http        = require('http').Server(app);
const sessionStore = new session.MemoryStore();
const io = require('socket.io')(http);
const passportSocketIo = require('passport.socketio');
const helmet = require('helmet');

app.use('/public', express.static(process.cwd() + '/public'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet.noSniff()); //this is for security
app.use(helmet.xssFilter()); //this is for security
app.set('view engine', 'pug');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  key: 'express.sid',
  store: sessionStore,
}));

//here we connect to the database with mongo
mongo.connect(process.env.DATABASE, (err, client) => {
  let db = client.db('advancednode');
  if(err) console.log('Database error: ' + err);

  auth(app, db);
  routes(app, db);
    
  http.listen(process.env.PORT || 3000);


  //start socket.io code  
  // variable to save the currentUsers
  var currentUsers = 0;

  //this is a middleware to deserialize the actual cookie
  io.use(passportSocketIo.authorize({
    cookieParser: cookieParser,
    key:          'express.sid',
    secret:       process.env.SESSION_SECRET,
    store:        sessionStore
  }));

  //the io is the server emiting for all the users
  //and socket is for that actual user
  io.on('connection', socket => {
    //console.log(socket.request.user);
    console.log('The ' + socket.request.user.name + ' has connected !');
    ++currentUsers;

    //this is for the random colors of the messages any time a user connect to the application
    var back = ["#ff0000", "blue", "gray", "green", "orange", "yellow", "black", "red", "pink"];
    var rand = back[Math.floor(Math.random() * back.length)];

    //io.emit('user count', currentUsers);
    io.emit('user', { name: socket.request.user.name, currentUsers: currentUsers, connected: true, color: rand});

    socket.on('chat message', (message) => {
      io.emit('chat message', {name: socket.request.user.name, message: message, color: rand});
    });

    //here we are using socket just for one client, if one cliente is disconnecting form the server then just -1 the current user then emit to the all server a console.log for the current users
    socket.on('disconnect', () => {
      console.log('The ' + socket.request.user.name + ' has disconnected !');
      --currentUsers;
      io.emit('user', { name: socket.request.user.name, currentUsers: currentUsers, connected: false});
    });
  });

  //end socket.io code
});
