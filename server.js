const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
//const cors = require('cors');
//const fs = require('fs')

let RedisStore = require("connect-redis").default;
const Redis = require("ioredis");

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

const path = require('path');

const myred = require('./myred.js');

//const isProd = process.env.NODE_ENV === 'production' 


const app = express();


app.use(express.json());
app.use(cookieParser());

app.use(session(
  {
    name: "linkx",
    store: new RedisStore({ client: redisClient ,ttl: 86400000}),
    saveUninitialized: false,
    resave: false,
    secret: uuidv4(),
    cookie: {
      secure: false,
      maxAge: 86400000
    }
  }));



  app.use(express.static(path.join(__dirname, 'dist')));


const new_session = (req) => {

  return  myred.check_key(req.session.key, req.session.uid).then(ans => {
    if (ans) {
      myred.reset_key(req.session.key)
    }
 
  req.session.uid = uuidv4();
  return myred.new_key(req.session.uid).then(rep => {
    if (rep.key) {
      req.session.key = rep.key;
    } else {
      delete req.session.uid; 
    }
    return rep;
  });
})
}

const data_session = (req) => {
  return  myred.check_key(req.session.key, req.session.uid).then(ans => {
    if (ans) {
     return  myred.json_data(req.session.key, "").then(rep => { return rep; })
    } else {
     return  new_session(req).then(rep =>{return rep;})
    }
  })
}

const set_session =(req,val) => {
  return  myred.check_key(req.session.key, req.session.uid).then(ans => {
    if (ans) {
      return myred.set_data(req.session.key, val || "").then(rep => { return rep; })
    } else {
     return  new_session(req).then(rep =>{return set_session(req,val);})
    }
  })
}

const add_session =(req,key) => {
  return  myred.check_key(req.session.key, req.session.uid).then(ans => {
    if (ans) {
     return  myred.add_key(req.session.key, key).then(rep => {return rep;})
    } else {
     return  new_session(req).then(rep =>{return add_session(req,key);})
    }
  })
}

const clean_session =(req) => {
  return  myred.check_key(req.session.key, req.session.uid).then(ans => {
    if (ans) {
     return  myred.clean_keys(req.session.key).then(rep => {return rep;})
    } else {
     return  new_session(req)
    }
  })
}


app.get('/hb', (req, res) => {
    clean_session(req).then(rep =>{res.json(rep);})
});

app.get('/new', (req, res) => {
   new_session(req).then(rep =>{res.json(rep);})
})

app.get('/set', (req, res) => {
  set_session(req,req.query.val).then(rep =>{res.json(rep);})
});

app.get('/add', (req, res) => {
  add_session(req,req.query.key).then(rep =>{res.json(rep);})
    })

app.get('/clean', (req, res) => {
      clean_session(req).then(rep =>{res.json(rep);})
        })


app.get('^/:qkey([0-9]{6})', function (req, res) {
  add_session(req,req.params.qkey).then(rep =>{res.redirect('/');})
});


const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`EXPRESS LISTENING : http://localhost:${port}`);
});