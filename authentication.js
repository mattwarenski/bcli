const express = require('express');
const opn = require('opn');
const fs = require('fs');
const settings = require('settings');

//Initialize SDK
var BoxSDK = require('box-node-sdk');

const tokenFile = "data/token.json"


const credentials = {
  client: {
    id: settings.appid,
    secret: settings.secret
  },
  auth: {
    tokenHost: 'https://account.box.com',
    authorizePath: '/api/oauth2/authorize',
    tokenPath: '/api/oauth2/token'
  }
};

// Initialize the OAuth2 Library
const oauth2 = require('simple-oauth2').create(credentials);

const authPath = oauth2.authorizationCode.authorizeURL({
  redirect_uri: 'http://localhost:8080/token',
});

function authorize(callback){
  const app = express();

  opn(authPath);
  let server = app.listen(8080);

  app.get('/token', (req, res)=>{
    const code = req.query.code;
    const options = {
      code,
    };

    oauth2.authorizationCode.getToken(options, (error, result) => {
      if (error) {
        console.error('Access Token Error', error.message);
        return res.json('Authentication failed');
      }

      res.status(200)
        .json("Success!");

      return callback(server, result);
    });
  });

}

function writeTokenFile(token){
  fs.writeFileSync(tokenFile, JSON.stringify(token)); 
}

function getToken(callback){
  function cb(app, tokenObj){
    if(app){
      app.close(); 
    }

    writeTokenFile(tokenObj);
    let access_token = oauth2.accessToken.create(tokenObj);
    if(access_token.expired()){
      access_token.refresh((err, refreshedToken)=>{
        if(err){
          return console.error("error refreshing token:", err); 
        }  
        callback(refreshedToken);
      });
    } else{
      callback(access_token);
    }
  }
  let tokenObj;

  if(fs.existsSync(tokenFile)){
    return cb(null, JSON.parse(fs.readFileSync(tokenFile)));
  } else{
    authorize(cb);
  }
}

function init_box(callback){
  var sdk = new BoxSDK({
    clientID: settings.appid,
    clientSecret: settings.secret 
  });

  getToken((token)=>{
    // Create a basic API client
    var client = sdk.getBasicClient(token.token.access_token);

    return callback(client);
  });


}

module.exports = {
  init_box : init_box
}
