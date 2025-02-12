const mongoose=require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL="mongodb://127.0.0.1:27017/wanderlust";
main()
    .then(()=>{
    console.log("database conected")
    })
    .catch((err)=>{
        console.log(err)
    })
async function main(){
    await mongoose.connect(MONGO_URL);
}
const initDb=async ()=>{
    await Listing.deleteMany({});
    initData.data=initData.data.map((obj)=>({
    ...obj,
    owner : "679e0d4a48e18bebbdb17c44"
    }))
    await Listing.insertMany(initData.data);
    console.log("data was initialized")
 }
initDb();