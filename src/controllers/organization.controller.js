const Organization = require("../models/organization.model");
const User = require("../models/user.model");

exports.createOrganization = async (req, res) => {
    try {
        const { orgName, orgEmail } = req.body;
        if (!orgName || !orgEmail) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const emailParts = orgEmail.split("@");
        if (emailParts.length !== 2) {
            return res.status(400).json({ message: "Invalid organization email format." });
        }
        const [address, domain] = emailParts;
        const genericDomains = ['gmail.com', 'yahoo.com', 'hotmail.com'];
        if (genericDomains.includes(domain)) {
            return res.status(400).json({ message: "Invalid organization email. Please use your organization domain." });
        }
        const existingOrg = await Organization.findOne({ orgDomain: domain });
        if (existingOrg) {
            return res.status(400).json({ message: `Organization already exists admin email: ${existingOrg.orgEmail}` });
        }

        const userWithDomain = await User.findOne({ email: orgEmail });
        if (!userWithDomain) {
            return res.status(400).json({ message: "No user found with the provided email.Please create account first" });
        }
        if (!userWithDomain.isAdmin) {
            userWithDomain.isAdmin = true;
            await userWithDomain.save();
        }

        const organization = new Organization({ orgName, orgEmail, orgDomain: domain, members: [userWithDomain] });
        await organization.save();

        res.status(201).json({ message: "Organization created successfully", organization });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
