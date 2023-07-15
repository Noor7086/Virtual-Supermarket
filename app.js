// server.js
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path-browserify');
const session = require('express-session');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const algorithm = 'aes-256-cbc'; //Using AES encryption
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);
const stripeSecretKey = "sk_test_4eC39HqLyjWDarjtT1zdp7dc"
const stripePublicKey = "pk_test_TYooMQauvdEDq54NiTphI7jx"
const stripe = require('stripe')(stripeSecretKey)
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const app = express();
const ejs = require('ejs');

app.set('view engine', 'ejs');
const axios = require('axios');
const customerAuth = require('./middleware/customerAuth');
const superMarketAuth = require('./middleware/superMarketAuth');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'mamart'
});
// Session middleware
app.use(session({
  secret: 'mySecretKey',
  resave: false,
  saveUninitialized: false
}));

// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve static files
app.use(express.static(__dirname + '/public'));
app.use('/build/', express.static(path.join(__dirname, 'node_modules/three/build')))
app.use('/jsm/', express.static(path.join(__dirname, 'node_modules/three/examples/jsm')))



// Middleware to enable CORS
app.use((req, res, next) => {
  // Allow requests from any origin
  res.header('Access-Control-Allow-Origin', '*');

  // Allow specified headers
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  // Allow specified methods
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  // Set the Access-Control-Max-Age header to preflight caching
  res.header('Access-Control-Max-Age', '86400');

  // Continue to the next middleware
  next();
});


// Configure Google authentication strategy
passport.use(new GoogleStrategy({

  clientID: '1099381221500-363hfoaq5j43ntkfvvdhbfic38t6iqff.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: '/auth/google/callback'

}, (accessToken, refreshToken, profile, done) => {
  // You can customize what to do with the profile data here
  console.log(profile);
  return done(null, profile);
}));

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Google authentication routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Successful authentication, redirect to home page
    const { id, displayName, emails } = req.user;
    const email = emails[0].value;


    connection.query('SELECT * FROM customers WHERE email = ? AND google_id = ? ', [email,id], function(error, results, fields) {
      if (results.length > 0) {
           
        if (results[0].status === 'active' && results[0].verified === 'Yes' ) {

          req.session.loggedin = true;
          
          req.session.userId  = results[0].id;
          
          res.redirect('/');

        } else {
          res.redirect('/');
        }
       
      } else {
          


      

        const query = `INSERT INTO customers (google_id, name, email,verified) VALUES ('${id}', '${displayName}', '${email}','Yes')`;
        connection.query(query, (error, results) => {
          if (error) {
            console.error(error);
            res.cookie('errorMessage', 'Account is already registered by signup method!. Kindly login by entering email and password.');
            
            return res.redirect('/');
          }
    
          req.session.loggedin = true;
                
          req.session.userId  = results.insertId;
    
    
          res.redirect('/');
        });
        

       

      }
      
  });


  });

 

  app.get('/view_product',customerAuth, function(req, res) {

    const pid = req.query.id;
    console.log(pid);
    // Query the database to get the user record
    connection.query('SELECT products.*,productcategories.name as cname,brands.name as bname FROM products inner join productcategories on products.productcategory_id = productcategories.id inner join brands on  products.brand_id = brands.id WHERE products.id = ?', [pid], function(error, results, fields) {
      if (error) throw error;

      // Render the profile view with the user record
      res.render('view_product', { product: results[0],userId:req.session.userId });
    });

 
});

  app.post('/create-payment-intent',customerAuth, async function(req, res){
    
      var token = generateOrderToken(); 
      var address = req.body.address;
      var other_description = req.body.other_description;
      const payable_amount =  req.body.payable_amount;
      const payable_amount_in_cents = await convertToUSDCents( req.body.payable_amount);
      console.log(payable_amount_in_cents);
          try {
            const charge = await stripe.charges.create({
              amount: payable_amount_in_cents,
              source: req.body.stripeTokenId,
              currency: 'usd',
              description: "payment" 
            });
            console.log('Charge Successful')
            for (const productId in req.session.cart) {
              const cartItem = req.session.cart[productId];
             
              var total = cartItem[1] * cartItem[0];

              connection.query("select * from products where id = ? and qty > 0",[productId],function(err,res){
                if (err) {
                  console.error(err);
                  return res.status(500).json("Error Qty");
                }
                connection.query("update products set qty = ? where id = ?",[parseInt(res[0].qty)-parseInt(cartItem[0]),productId]);
              });
      
              connection.query("insert into orders(customer_id,product_id,qty,token,total,created_at,updated_at) values (?,?,?,?,?,?,?) ",[req.session.userId,productId,cartItem[0],token,total,current_datetime(),current_datetime()]);
            }
            if(req.session.applied_coupon){
              connection.query("INSERT INTO `invoices`(`customer_id`,`token`, `payment_method`, `coupen_id`, `address`, `other_description`, `payable_amount`,`payment_status`, `created_at`, `updated_at`) VALUES (?,?,?,?,?,?,?,?,?,?)",[req.session.userId,token,'stripe card',req.session.applied_coupon[0],address,other_description,payable_amount,'paid',current_datetime(),current_datetime()]);
            }
            else{
              connection.query("INSERT INTO `invoices`(`customer_id`,`token`, `payment_method`, `address`, `other_description`, `payable_amount`, `payment_status`, `created_at`, `updated_at`) VALUES (?,?,?,?,?,?,?,?,?)",[req.session.userId,token,'stripe card',address,other_description,payable_amount,'paid',current_datetime(),current_datetime()]);
           
            }

            connection.query("select * from customers where id = ?",[req.session.userId],function(error,result,fields){
  
              // send_email(result[0].email)
     
             });
            
         
             
             // clear the cart after order is placed
             req.session.cart = {};
             


            res.json({ message: 'Order placed successfully.', order_number: token })
          } catch (err) {
            console.log('Charge Fail')
            res.status(500).end()
          }
          
          
         
          //////////////////////////////////
  

})



async function convertToUSDCents(payable_amount) {
  const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
  const exchangeRate = response.data.rates.PKR / response.data.rates.USD;
  const payable_amount_usd = Math.round(payable_amount / exchangeRate * 100);
  return payable_amount_usd;
}



app.get('/signup', function(req, res) {

  if (req.session.loggedin) {

    res.redirect('/');

  }
  else{
     res.render('signup',{userId:req.session.userId});
  }
});

app.get('/check_attach_coupon',customerAuth, function(req, res) {

    const applied_coupon = req.session.applied_coupon || {};
    res.json({ applied_coupon: applied_coupon });
 
});

app.get('/remove_coupon',customerAuth, function(req, res) {

   req.session.applied_coupon = [];
   console.log( req.session.applied_coupon)
  res.json({ applied_coupon: req.session.applied_coupon });

});


app.post('/verify_coupon',customerAuth,function(req,res){
  const date = new Date();
  const current_datetime = date.toISOString().slice(0, 16);
  var coupon = req.body.input_coupon;
  var subtotal = req.body.subtotal;

  connection.query("SELECT * FROM coupons WHERE code = ?", [coupon], function(error, result, fields) {
    if (error) {
      console.error(error);
      return res.status(500).json("Error checking coupon existence.");
    }
    console.log("result ", result[0]);
    if (result.length > 0) {
      if (result[0].status === "active") {
        if (Date.parse(result[0].valid_at) > Date.parse(current_datetime)) {
          console.log("sub"+subtotal);
          if(parseInt(result[0].valid_amount) <= parseInt(subtotal)){

           
            req.session.applied_coupon = [String(result[0].id),result[0].code,result[0].discount,result[0].valid_at,result[0].status,result[0].valid_amount];
  
            console.log( req.session.applied_coupon);
            
            res.json('Coupon Applied' );
          }
          else{
            return res.status(401).json("Your purschase should worth Atleast"+result[0].valid_amount);
          }
        } else {
          return res.status(401).json( 'Coupon Date Expired.' );
        }
      } else {
        return res.status(401).json( 'This Coupon is not active at the moment.' );
      }
    } else {
      return res.status(401).json( 'Invalid Coupon.' );
    }
  });
  
  })




app.post('/signup', async function(req, res) {

  if (req.session.loggedin) {

    res.redirect('/');

  }
  else{


    

    const { name, email, contact, password, address } = req.body;

    connection.query('SELECT COUNT(*) as count FROM customers WHERE email = ?', [email], function(err, result) {
      if (err) {
        console.error(err);
        return res.status(500).json("Error checking email existence.");
      }
      
      if (result[0].count > 0) {
        return res.status(400).json("Email already exists.");
      }
  
      connection.query('SELECT COUNT(*) as count FROM customers WHERE contact = ?', [contact], function(err, result) {
        if (err) {
          console.error(err);
          return res.status(500).json("Error checking contact existence.");
        }
        
        if (result[0].count > 0) {
          return res.status(400).json("Contact already exists.");
        }
  
      const record = {
        name,
        email,
        contact,
        password,
        address
      };
      if(isPasswordStrong([password])===true){
      connection.query('INSERT INTO customers SET ?', record, async function(err, result) {
        if (err) {
          console.error(err);
          return res.status(500).json("Error creating account.");
        }

        const token = encrypt(email);
          
     
   
        connection.query("UPDATE customers SET token=? WHERE email = ?", [ token,email], function(err, result) {
          if (err) {
            console.error(err);
            return res.status(500).json("Error updating account.");
          }

            // Send a verification email to the user
          sendVerificationEmail(email,
            `
          <p>Please click the following link to verify your email address:</p>
          <a href="http://localhost:3000/verify/${token}">Verify your email</a>
        `,
        'Please verify your email address'
        );

          res.json("Verification email is sended on your email address kindly verify it!");
        
        });
      });
    }
    else{
      res.status(500).json("Password should be at least 8 characters,contain at least one uppercase letter, one lowercase letter, one digit, and one special character");
    }
    });
    
    });

  }

});




// POST Login

/*
app.post('/login', function(req, res) {
  const email = req.body.email;
  const password = req.body.password;

  connection.query("SELECT * FROM customers WHERE email = ? AND password = ? AND google_id = ? ", [email, password,'No'], function(error, results, fields) {
      if (results.length > 0) {
           
        if (results[0].status === 'active' && results[0].verified === 'Yes') {

          req.session.loggedin = true;
          
          req.session.userId  = results[0].id;
          res.json('Logged in successfully!');

        } 
        else if(results[0].verified !== 'Yes'){

          
//


const token = encrypt(email);
          
     
   
connection.query("UPDATE customers SET token=? WHERE email = ?", [ token,email], function(err, result) {
  if (err) {
    console.error(err);
    return res.status(500).json("Error updating account.");
  }

    // Send a verification email to the user
  sendVerificationEmail(email, token);

  res.json("Email not verified. Verification email is sended on your email address!");

});

         
        }
        else {
            res.json('Your account is not active. Please contact support.');
        }
       
      } else {
          res.json('Incorrect email or password');
      }
      res.json('Network issue');
  });
});
*/


// POST Login
app.post('/login', function(req, res) {
  const { email, password } = req.body;

  connection.query("SELECT * FROM customers WHERE email = ? AND google_id = ? ", [email, 'No'], function(error, results, fields) {
    if (error) {
      console.error(error);
      return res.status(500).json( 'Internal server error' );
    }

    if (results.length === 0) {
      return res.status(401).json( 'Incorrect email or password' );
    }

    const user = results[0];

    if (user.verified !== 'Yes') {
      const token = encrypt(email);

      connection.query("UPDATE customers SET token=? WHERE email = ?", [token, email], function(err, result) {
        if (err) {
          console.error(err);
          return res.status(500).json('Error updating account');
        }

        // Send a verification email to the user
        sendVerificationEmail(email,
          `
        <p>Please click the following link to verify your email address:</p>
        <a href="http://localhost:3000/verify/${token}">Verify your email</a>
      `,
      'Please verify your email address'
      );

        res.status(401).json('Email not verified. Verification email is sended on your email address');
      });
    } else if (user.status !== 'active') {
      res.status(401).json('Your account is not active. Please contact support');
    } else {
      // Verify the password (this should be done with bcrypt or a similar library)
      if (user.password !== password) {
        return res.status(401).json( 'Incorrect email or password' );
      }

      req.session.loggedin = true;
      req.session.userId = user.id;
      res.json('Logged in successfully' );
    }
  });
});


app.post('/forget_password_verify_email',(req,res)=>{
  const email = req.body.email;

  const timestamp = Date.now();
  const token  = encrypt(email+timestamp);
  console.log(email);
  connection.query("SELECT * from customers WHERE email = ? and google_id = 'No'",[email],function(err,result){
    if (err) {
      console.error(err);
    }
    if (result.length > 0) {
      console.log(result[0].email);
      connection.query("UPDATE customers SET forget_code= ? WHERE email = ?", [token,email], function(err, result) {
        if (err) {
          console.error(err);
          return res.status(500).json("Error updating forget code.");
        }})


      sendVerificationEmail(email,
      `
      <p>Please click the following link to reset your password:</p>
      <a href="http://localhost:3000/reset_pass/${token}">Reset Password</a>
    `,
    'MA Mart Reset Password'
    );
      return res.json({msg:"Reset password link sent on your email address"});
    }
    else{
      return res.status(401).json('Invalid Email');
    }
  })
})


app.get('/reset_pass/:token', (req, res) => {
  const token = req.params.token;

  connection.query("Select * from customers where forget_code = ?",[token], function(err,result){
    if (err) {
      console.error(err);
    }
    if (result.length > 0){
       res.render("reset_password",{token:token});
       }
       else{
        res.render("404");
       }
  })
})



  



app.post('/reset_pass/:token', (req, res) => {

  const password = req.body.password;
  const token = req.body.token;

    console.log(password)
      connection.query("UPDATE customers SET password= ?, forget_code = '' WHERE forget_code = ?",[password,token],function(err,result){
        if (err) {
          console.error(err);
          return res.status(500).json("Error updating account.");
        }

        res.render('PasswordChange');
      })
 
  })



// Route for verifying the user's email address
app.get('/verify/:token', (req, res) => {
  const token = req.params.token;
    connection.query("UPDATE customers SET verified='Yes' WHERE token = ?", [token], function(err, result) {
      if (err) {
        console.error(err);
        return res.status(500).json("Error updating account.");
      }

    res.render('account_verified');
    

    
    });
    

});




//Encrypting text
function encrypt(text) {
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return  encrypted.toString('hex') ;
}


// Function for sending a verification email
function sendVerificationEmail(email, htmlmessage,subject) {
  // Create a transport object for sending emails
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: 'huzaifaprojects648@gmail.com',
      pass: 'vjyvwpztgdbvtacp',
    }
  });

  // Define the email message
  const message = {
    from: 'huzaifaprojects648@gmail.com',
    to: email,
    subject: subject,
    html: htmlmessage
  };

  // Send the email
  transporter.sendMail(message, (err, info) => {
    if (err) {
      console.log(err);
    } else {
      console.log(info);
    }
  });
}



app.get('/', function(req, res) {

  
      res.render('index',{userId:req.session.userId});
  
});


function send_email(email){
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: 'huzaifaprojects648@gmail.com',
      pass: 'vjyvwpztgdbvtacp',
    }
  });

  // Define the email message
  const message = {
    from: 'huzaifaprojects648@gmail.com',
    to: email,
    subject: 'MAMART Order Placed',
    html: `
      <p>Your order placed successfully!</p>
      
    `
  };

  // Send the email
  transporter.sendMail(message, (err, info) => {
    if (err) {
      console.log(err);
    } else {
      console.log(info);
    }
  });
}


app.get('/super_market',superMarketAuth, function(req, res) {

 


    var advertise_videos;
    connection.query('SELECT * FROM advertise_videos', function(error, results, fields) {
      if (error) throw error;
      advertise_videos= results[0];
      console.log(advertise_videos);

      connection.query("SELECT * FROM products where status = 'active' and qty > 0", function(error2, results2, fields) {
        if (error2) throw error2;

        console.log(results2);
        res.render('super_market',{userId:req.session.userId,advertise_videos:advertise_videos,models:results2});

      });

  });

});




app.get('/profile',customerAuth, function(req, res) {

  
    
    // Query the database to get the user record
    connection.query('SELECT * FROM customers WHERE id = ?', [req.session.userId], function(error, results, fields) {
      if (error) throw error;

      // Render the profile view with the user record
      res.render('profile', { user: results[0],userId:req.session.userId });
    });

 
});




app.get('/view_cart',customerAuth, function(req, res) {

  
 // req.session.cart = { '6': [ 3, '100', 'shan' ] };
    connection.query("select  * from customers where id = ?",[req.session.userId],function(error,result,fields){

      console.log(req.session.cart);
      var customer_address =result[0].address
      res.render('view_cart', {  stripePublicKey: stripePublicKey,userId:req.session.userId,customer_address:customer_address });

    });
    

});



app.get('/orders',customerAuth, function(req, res) {

 
  
  
      connection.query("select invoices.*,coupons.code as coupon_code,coupons.discount as coupon_discount  from invoices LEFT join coupons on invoices.coupen_id = coupons.id  where invoices.customer_id = ? order by  invoices.id desc",[req.session.userId],function(error,orders_result,fields){


              connection.query("select orders.*,products.name from orders inner join products on orders.product_id = products.id  where orders.customer_id = ? ",[req.session.userId],function(error,order_detail_result,fields){

                   res.render('orders', { userId:req.session.userId,invoices_result:orders_result,order_detail:order_detail_result });

              });
    
  });
    
 
});




app.post('/clear_cart',customerAuth, function(req, res) {
 
   
        req.session.cart =  {};
        res.send('Cart clear successfully!');

});


app.post('/renew_order',customerAuth, function(req, res) {
  
    var id = req.body.id;
    connection.query("select * from invoices where invoices.customer_id = ? and invoices.id = ? ",[req.session.userId,id],function(error,orders_result,fields){
      connection.query("select orders.*,products.id as pid,products.name as product_name,products.price_per_item,products.qty as available_qty from orders inner join products on orders.product_id = products.id  where orders.customer_id = ? and orders.token = ? and products.status = ? ",[req.session.userId,orders_result[0].token,'active'],function(error,order_detail_result,fields){
        req.session.cart = req.session.cart || {};
        for(var i = 0; i<order_detail_result.length;i++){


          if(order_detail_result[i].qty <= order_detail_result[i].available_qty){
             req.session.cart[order_detail_result[i].pid] = [order_detail_result[i].qty,order_detail_result[i].price_per_item,order_detail_result[i].product_name];
          }
          else{
            req.session.cart[order_detail_result[i].pid] = [1,order_detail_result[i].price_per_item,order_detail_result[i].product_name];
          }
       
        }
        console.log(req.session.cart);
        // send response to client
        res.send('Order renewed successfully!');
      });    
    });
 
});



function generateOrderToken() {
  const timestamp = Date.now();
  const randomNumber = Math.floor(Math.random() * 1000000);
  return `${timestamp}-${randomNumber}`;
}


function current_datetime(){
const date = new Date();
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0');
const day = String(date.getDate()).padStart(2, '0');
const hours = String(date.getHours()).padStart(2, '0');
const minutes = String(date.getMinutes()).padStart(2, '0');
const seconds = String(date.getSeconds()).padStart(2, '0');
const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
return formattedDate;
}


app.post('/place_order_cash_on_delivery',customerAuth, function(req, res) {

  

    var token = generateOrderToken();

    var address = req.body.address;
    var other_description = req.body.other_description;
    var payable_amount = req.body.payable_amount;
    

    
         for (const productId in req.session.cart) {
          const cartItem = req.session.cart[productId];
         
          var total = cartItem[1] * cartItem[0];

          connection.query("select * from products where id = ? and qty > 0",[productId],function(err,res){
            if (err) {
              console.error(err);
              return res.status(500).json("Error Qty");
            }
            connection.query("update products set qty = ? where id = ?",[parseInt(res[0].qty)-parseInt(cartItem[0]),productId]);
          });


          connection.query("insert into orders(customer_id,product_id,qty,token,total,created_at,updated_at) values (?,?,?,?,?,?,?) ",[req.session.userId,productId,cartItem[0],token,total,current_datetime(),current_datetime()]);
        }
        if(req.session.applied_coupon){
          connection.query("INSERT INTO `invoices`(`customer_id`,`token`, `payment_method`, `coupen_id`, `address`, `other_description`, `payable_amount`, `created_at`, `updated_at`) VALUES (?,?,?,?,?,?,?,?,?)",[req.session.userId,token,'cash on delivery',req.session.applied_coupon[0],address,other_description,payable_amount,current_datetime(),current_datetime()]);
        }
        else{
          connection.query("INSERT INTO `invoices`(`customer_id`,`token`, `payment_method`, `address`, `other_description`, `payable_amount`, `created_at`, `updated_at`) VALUES (?,?,?,?,?,?,?,?)",[req.session.userId,token,'cash on delivery',address,other_description,payable_amount,current_datetime(),current_datetime()]);
       
        }


        connection.query("select * from customers where id = ?",[req.session.userId],function(error,result,fields){

          send_email(result[0].email)

        });
       
    
        
        // clear the cart after order is placed
        req.session.cart = {};

        res.json({ success: true, message: "Order placed successfully." ,order_number:token});

  

});


app.post('/profile',customerAuth, function(req, res) {
  const { name, email, contact,address } = req.body;

  connection.query('SELECT COUNT(*) as count FROM customers WHERE email = ? AND id <> ?', [email, req.session.userId], function(err, result) {
    if (err) {
      console.error(err);
      return res.status(500).json("Error checking email existence.");
    }
    
    if (result[0].count > 0) {
      return res.status(400).json("Email already exists.");
    }

    connection.query('SELECT COUNT(*) as count FROM customers WHERE contact = ? AND id <> ?', [contact, req.session.userId], function(err, result) {
      if (err) {
        console.error(err);
        return res.status(500).json("Error checking contact existence.");
      }
      
      if (result[0].count > 0) {
        return res.status(400).json("Contact already exists.");
      }

      const record = {
        name,
        email,
        contact,
        address
      };

      connection.query('UPDATE customers SET ? WHERE id = ?', [record, req.session.userId], function(err, result) {
        if (err) {
          console.error(err);
          return res.status(500).json("Error updating account.");
        }
        res.json("Account updated successfully!");
      });
 
    });
  });
});



app.post('/add-to-cart',customerAuth, function(req, res) {
  // Get the item id and quantity from the request body
  const itemId = req.body.itemId;
  const itemQty = req.body.itemQty;
  const itemPrice = req.body.itemPrice;
  const itemName = req.body.itemName;
  
  // Store the item id and quantity in the session
  req.session.cart = req.session.cart || {};
  req.session.cart[itemId] = [itemQty,itemPrice,itemName];
  
  // Send a response back to the client
  res.json({ success: true });
});


app.post('/update-cart-quantity',customerAuth, function(req, res) {
  // Get the item id and operation from the request body
  const itemId = req.body.itemId;
  const operation = req.body.operation;

  // Update the item quantity in the session cart object
  if (req.session.cart && req.session.cart[itemId]) {
    if (operation === "plus") {
      // check if quantity in cart is less than available quantity
      const cartQty = req.session.cart[itemId][0];
      const itemQty = connection.query('SELECT qty FROM products WHERE id = ?', itemId, function (error, results, fields) {
        if (error) throw error;

        const availableQty = results[0].qty;
        
        if (req.session.cart[itemId][0] < availableQty) {
          req.session.cart[itemId][0]++;
          // Send a response back to the client

          console.log(req.session.cart[itemId][0] + " " + availableQty);

      
        
            res.json({ success: true   });
          
        }
        
        else{
            
          res.json({ limit_error: true });
        } 
        
      });
    } else if (operation === "minus") {
      if (req.session.cart[itemId][0] > 1) {
        req.session.cart[itemId][0]--;
      }
      // Send a response back to the client
      res.json({ success: true });
    }
  }
});


app.post('/update_qty_by_input_cart',customerAuth, function(req, res) {
  // Get the item id and operation from the request body
  const itemId = req.body.itemId;
  const value = req.body.value;

  // Update the item quantity in the session cart object
  if (req.session.cart && req.session.cart[itemId]) {
   
      // check if quantity in cart is less than available quantity

      connection.query('SELECT qty FROM products WHERE id = ?', itemId, function (error, results, fields) {
        if (error) throw error;

        const availableQty = results[0].qty;
        
        if (value <= availableQty) {


          req.session.cart[itemId][0] = value;
          // Send a response back to the client

         
        
            res.json({ success: true   });
          
        }
        
        else{
            
          res.json({ limit_error: true });
        } 
        
      });
   
  }
});



app.post('/remove-to-cart',customerAuth, function(req, res) {
  // Get the item id and quantity from the request body
  const itemId = req.body.itemId;

  
    // Remove the item from the session
    delete req.session.cart[itemId];

  // Send a response back to the client
  res.json({ success: true });
});



app.get('/cart',customerAuth, function(req, res) {
  const cartItems = req.session.cart || {};

    
    res.json({ items: cartItems });
  
});

app.get('/check_order',customerAuth, function(req, res) {
  

  connection.query('SELECT * FROM invoices WHERE customer_id = ? and status != ? and  status != ?', [req.session.userId,'delivered','cancelled'], function (error, results, fields) {
    if (error) throw error;

       const data = results;

       res.json({ success: true,data: data });


    });

    
    
  
});




app.post('/check-qty-limit',customerAuth,function(req,res){


  const itemId = req.body.itemId;

  connection.query('SELECT qty FROM products WHERE id = ?', itemId, function (error, results, fields) {
    if (error) throw error;

       const availableQty = results[0].qty;

       res.json({ success: true,availableQty: availableQty });


    });

});

app.get('/logout', function(req, res){
  req.session.destroy(function(){
    console.log("User logged out.");
    
  });
  
  res.redirect('/');
});



app.post('/contact', function(req, res) {
  const { name, email, subject, message } = req.body;

    const record = {
      name,
      email,
      subject,
      message
    };
    
    connection.query('INSERT INTO messages SET ?', record, function(err, result) {
      if (err) {
        console.error(err);
        return res.status(500).json("Error sending message.");
      }
      res.json("Submitted successfully!");
    });
 
  });
  









function isPasswordStrong(password) {
  // Define the regular expressions for the criteria
  const lengthRegex = /.{8,}/;
  const uppercaseRegex = /[A-Z]/;
  const lowercaseRegex = /[a-z]/;
  const digitRegex = /\d/;
  const specialRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;
  const commonPasswordRegex = /^(password|123456|12345678|1234|qwerty|12345|dragon|baseball|football|letmein|monkey|696969|abc123|mustang|michael|shadow|master|jennifer|111111|2000|jordan|superman|harley|1234567|hello)$/;
  const dictionaryWordRegex = /[a-z]{4,}/;

  // Check if the password meets the criteria
  if (!lengthRegex.test(password)) {
    return false;
  }
  if (!uppercaseRegex.test(password)) {
    return false;
  }
  if (!lowercaseRegex.test(password)) {
    return false;
  }
  if (!digitRegex.test(password)) {
    return false;
  }
  if (!specialRegex.test(password)) {
    return false;
  }
  if (commonPasswordRegex.test(password)) {
    return false;
  }
  if (dictionaryWordRegex.test(password)) {
    return false;
  }

  // If the password passes all the checks, return true
  return true;
}



app.listen(3000, function() {
  console.log('listening on *:3000');
});
