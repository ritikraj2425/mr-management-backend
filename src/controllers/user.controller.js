const { getUserFromToken } = require("../utils/userDetails.utils");

exports.getUser = async (req, res) => {
    const {jwttoken, refreshtoken} = req.headers;
    if (!jwttoken || !refreshtoken) {
        return res.status(401).json({message: "Unauthorized"});
    }
    const user = await getUserFromToken(jwttoken, refreshtoken);
    if (!user) {
        return res.status(401).json({message: "Unauthorized"});
    }
    return res.status(200).json({data: user});
}