const Verification = require("../services/jsonWebToken");
const User = require("../models/user.model");

exports.getUserFromToken = async (jwttoken, refreshtoken) => {
    const check = Verification.verifyJwt(jwttoken, refreshtoken);
    if (!check) {
        throw new Error("Unauthorized");
    }

    const payload = check.credentials.payload;

    const user = await User.findOne({ email: payload.email });
    if (!user) {
        throw new Error("User not found");
    }

    return user;
};
