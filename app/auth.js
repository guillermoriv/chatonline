const session     = require('express-session');
const mongo       = require('mongodb').MongoClient;
const passport    = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

module.exports = function (app, db) {
  
    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser((user, done) => {
      //console.log(user);
      done(null, {id: user.id, provider: user.provider});
    });

    passport.deserializeUser((user, done) => {
      var collection = user.provider === 'github' ? 'chatusers' : 'socialusers';
      db.collection(collection).findOne(
        {id: user.id},
        (err, doc) => {
          done(null, doc);
        }
      );
    });

    passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "https://OccasionalEnviousMozbot--five-nine.repl.co/auth/facebook/callback"
    },
      function(accessToken, refreshToken, profile, done) {
        //console.log(profile);
        db.collection('socialusers').findAndModify(
          {id: profile.id},
          {},
          {$setOnInsert: {
            id: profile.id,
            name: profile.displayName || 'No named',
            gender: profile.gender || 'Not showing',
            provider: 'facebook'
          },$set:{
            last_login: new Date()
          }, $inc: {
            login_count: 1
          }},
          {upsert: true, new: true}, //Inser object if not found, return new object
          (err, doc) => {
            //console.log(doc.value);
            return done(null, doc.value);
          }
        );
      }
    ));

    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "https://OccasionalEnviousMozbot--five-nine.repl.co/auth/github/callback/"
      },
      function(accessToken, refreshToken, profile, done) {
          //console.log(profile);
          db.collection('chatusers').findAndModify(
              {id: profile.id},
              {},
              {$setOnInsert:{
                  id: profile.id,
                  name: profile.displayName || 'Anonymous',
                  photo: profile.photos[0].value || '',
                  email: profile._json.email || 'No public email',
                  created_on: new Date(),
                  provider: profile.provider || '',
                  chat_messages: 0
              },$set:{
                  last_login: new Date()
              },$inc:{
                  login_count: 1
              }},
              {upsert:true, new: true}, //Insert object if not found, Return new object after modify
              (err, doc) => {
                //console.log(doc.value);
                return done(null, doc.value);
              }
          );
      }
    ));
  
}