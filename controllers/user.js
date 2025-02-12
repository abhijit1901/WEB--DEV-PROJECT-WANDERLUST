const user = require("../models/user.js");
const passport = require("passport");

module.exports.renderSignUpForm = (req, res) => {
    res.render("users/signup.ejs");
};

module.exports.signUp = async (req, res) => {
   try{
        let { email, username, password } = req.body;
        const newUser = new user({ email, username });
        // Check if email exists
        const existingEmail = await user.findOne({ email });
        if (existingEmail) {
            req.flash("error", "Email is already registered");
            return res.redirect("/signup");
        }
        const registeredUser = await user.register(newUser, password);
        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }   
            req.flash("success", "Successfully signed up!");
            res.redirect("/listings");
        });
    } 
    //for same username and other type of errors
    catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
}

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
}

module.exports.login =  async (req, res) => {
            req.flash("success", `Welcome back ${req.user.username}!`);
            let redirectUrl = res.locals.redirectUrl || "/listings";
            res.redirect(redirectUrl);
}

module.exports.logout = (req, res,next) => {
    req.logout((err)=>{
        if(err){
            return next(err);
        }
    req.flash("success", "Logged out successfully");
    res.redirect("/listings");
    })
}