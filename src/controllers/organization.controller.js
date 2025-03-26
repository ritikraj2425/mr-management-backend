const Organization = require("../models/organization.model");

exports.createOrganization = async (req, res) => {
    try {
        const { name, address, email, phone } = req.body;

        // Check if organization already exists
        const existingOrg = await Organization.findOne({ email });
        if (existingOrg) {
            return res.status(400).json({ message: "Organization already exists" });
        }

        // Create new organization
        const organization = new Organization({ name, address, email, phone });
        await organization.save();

        res.status(201).json({ message: "Organization created successfully", organization });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
