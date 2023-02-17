const jwt = require('jsonwebtoken');

//define a middleware, the rest of the req and res (outer) are not supposed to be called until next() is invoked
var authenticate = (req, res, next) => {
  //get 
  var token = req.header('x-auth');

  //authenticate
  const key = process.env.CBA_SECRET;
  var decoded = jwt.verify(token, key, (err, token) => {
    if (err) {
      res.status(401).send(err.message);
    } else {
      req.token = token;
      next();
    }
  });

  // User.findByToken(token).then((user) => {
  //   if (!user) {
  //     return Promise.reject();
  //   }

  //   req.user = user;
  //   req.token = token;
  //   next();
  // }).catch((e) => {
  //   res.status(401).send();
  // });
};


module.exports = { authenticate };
