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
mongo.connect(process.env.DATABASE, { useUnifiedTopology: true }, (err, client) => {
  let db = client.db('advancednode');
  if(err) console.log('Database error: ' + err);

  auth(app, db);
  routes(app, db);
    
  http.listen(process.env.PORT || 3000);


  //start socket.io code  
  // variable to save the currentUsers
  var currentUsers = 0;
  //connected users
  var connectedUsers = [];

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


    //when a user connects
    connectedUsers.push(socket.request.user.name);

    //emit the actual state of the user
    io.emit('user', { name: socket.request.user.name, currentUsers: currentUsers, connected: true, color: rand});
    

    //remember node.js code is asynchronous
    //use socket.reques.user.name to see if the user is CONNECTED or no and then think for the connected === true?
    db.collection('chatusers').find().toArray((err, docs) => {
      //console.log(docs);
      var users = docs.map(doc => {
        return {name: doc.name, provider: doc.provider};
      }); //this return an array of all the users in the database
      //console.log(users);
      //io.emit to emit all the users in the database
      io.emit('users', {users: users, connectedUsers: connectedUsers});
    });

    socket.on('chat message', (message) => {
      io.emit('chat message', {name: socket.request.user.name, message: message, color: rand});
    });

    //here we are using socket just for one client, if one cliente is disconnecting form the server then just -1 the current user then emit to the all server a console.log for the current users
    socket.on('disconnect', () => {
      console.log('The ' + socket.request.user.name + ' has disconnected !');
      --currentUsers;

      for (let i = 0; i < connectedUsers.length; i++) {
        if (socket.request.user.name === connectedUsers[i]) {
          connectedUsers.splice(i, 1);
          db.collection('chatusers').find().toArray((err, docs) => {
            //console.log(docs);
            var users = docs.map(doc => {
              return {name: doc.name, provider: doc.provider};
            }); //this return an array of all the users in the database
            //console.log(users);
            //io.emit to emit all the users in the database
            io.emit('users', {users: users, connectedUsers: connectedUsers});
          });
        }
      }

      io.emit('user', { name: socket.request.user.name, currentUsers: currentUsers, connected: false});
    });
  });

  //end socket.io code
});
