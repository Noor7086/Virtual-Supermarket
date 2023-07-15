
const superMarketAuth = (req, res, next) => {
    if (!req.session.loggedin) {
        
        res.cookie('errorMessage', 'Kindly log in to enter in the supar market!');
        console.log("Kindly Logged In!");
      return res.redirect('/');
    }
  
    // User email exists in the session, proceed to the next middleware or route handler
    next();
  };
  
  module.exports = superMarketAuth;