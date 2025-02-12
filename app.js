if(process.env.NODE_ENV != "production"){
    require('dotenv').config();    
}


const express = require("express");
const router = express.Router({mergeParams: true});
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const user = require("./models/user.js");

// Import route handlers
const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// Database connection
// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const db_url = process.env.ATLASDB_URL;
main()
    .then(() => {
        console.log("Database connected");
    })
    .catch((err) => {
        console.error("Database connection error:", err);
    });

// Connect to MongoDB
async function main() {
    await mongoose.connect(db_url);
}

const store = MongoStore.create({
    mongoUrl: db_url,
    crypto: {
        secret: process.env.SECRET
    },
    touchAfter: 24 * 3600
});

store.on("error in mongoose session store", ()=> {
    console.log("error in mongoose session store",err);
})

// Start the server
app.listen("8080", () => {
    console.log("Server is running on port 8080");
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie : {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}


// Set up view engine and directories
app.set("view engine", "ejs"); // Use EJS as the templating engine
app.set("views", path.join(__dirname, "views")); // Set views directory for EJS templates

// Middleware setup
app.use(express.urlencoded({ extended: true })); // Parse incoming request bodies
app.use(methodOverride("_method")); // Support PUT and DELETE methods using _method query
app.engine("ejs", ejsMate); // Use ejs-mate for layouts and partials
app.use(express.static(path.join(__dirname, "/public"))); // Serve static files from the public directory
app.use(session(sessionOptions)); // Use session middleware
app.use(flash()); // Use flash middleware 
app.use(passport.initialize()); // Use passport middleware
app.use(passport.session()); // Use passport middleware
passport.use(new LocalStrategy(user.authenticate())); // Use passport-local-mongoose middleware 

passport.serializeUser(user.serializeUser()); // Serialize user
passport.deserializeUser(user.deserializeUser()); // Deserialize user  

app.use((req, res, next) => { // Middleware to set flash messages
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    next();
});

// Define routes

// Root route
app.get("/", (req, res) => {
    res.render("listings/landing.ejs");
});

// Listings routes
app.use("/listings", listingsRouter);

app.use("/", userRouter); // User routes

// Reviews routes
app.use("/listings/:id/reviews", reviewsRouter);

// Catch-all route for undefined paths
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page not found"));
});

// Error handling middleware
app.use((err, req, res, next) => {
    const { statuscode = 500, message = "Something went wrong" } = err;
    res.render("error.ejs", { statuscode, message }); // Render the error page
});
