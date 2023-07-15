
const customerAuth = (req, res, next) => {
    if (!req.session.loggedin) {
        
        console.log("Kindly Logged In!");
      return res.redirect('/');
    }
  
    // User email exists in the session, proceed to the next middleware or route handler
    next();
  };
  
  module.exports = customerAuth;