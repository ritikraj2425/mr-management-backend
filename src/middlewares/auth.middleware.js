const jwt = require("jsonwebtoken");
const Verification = require("../services/jsonWebToken");
const secretApiKey = process.env.API_KEY;

const checkForApiKey = (req, res, next) => {
    const {apikey} = req.headers;
    if(!apikey){
        return res.status(404).json({
            message:"api key not found"
        })
    }
    if(apikey != secretApiKey){
        return res.status(400).json({
            message:"invalid api key"
        })
    }
    next()
};


const verifyJWT = (req,res,next) =>{
    const { jwttoken, refreshtoken } = req.headers;
    const check = Verification.verifyJwt(jwttoken, refreshtoken);
    if (!check) {
        return res.status(401).json({
            message: "You are not authorized to access this api"
        });
    } else {
        next();
}
}




module.exports = {checkForApiKey,verifyJWT};