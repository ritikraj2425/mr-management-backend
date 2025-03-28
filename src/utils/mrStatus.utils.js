const axios = require("axios");
const Group = require("../models/group.model");

async function getMRStatus(mrLink, groupId) {
    try {
        const group = await Group.findById(groupId);
        if (!group) throw new Error("Group not found.");

        let apiUrl;
        let headers = {};

        if (mrLink.includes("github.com") && group.tokens.github) {
            const match = mrLink.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
            if (!match) throw new Error("Invalid GitHub MR link");
            const [_, owner, repo, prNumber] = match;
            apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`;
            headers = { Authorization: `token ${group.tokens.github}` };

        } else if (mrLink.includes("gitlab.com") && group.tokens.gitlab) {
            const match = mrLink.match(/gitlab\.com\/([^/]+)\/([^/]+)\/-\/merge_requests\/(\d+)/);
            if (!match) throw new Error("Invalid GitLab MR link");
            const [_, owner, repo, mrNumber] = match;
            apiUrl = `https://gitlab.com/api/v4/projects/${encodeURIComponent(owner + '/' + repo)}/merge_requests/${mrNumber}`;
            headers = { "PRIVATE-TOKEN": group.tokens.gitlab };

        } else if (mrLink.includes("bitbucket.org") && group.tokens.bitbucket) {
            const match = mrLink.match(/bitbucket\.org\/([^/]+)\/([^/]+)\/pull-requests\/(\d+)/);
            if (!match) throw new Error("Invalid Bitbucket MR link");
            const [_, owner, repo, prNumber] = match;
            apiUrl = `https://api.bitbucket.org/2.0/repositories/${owner}/${repo}/pullrequests/${prNumber}`;
            headers = { Authorization: `Bearer ${group.tokens.bitbucket}` };

        // } else if (mrLink.includes("dev.azure.com") && group.tokens.azure) {
        //     const match = mrLink.match(/dev\.azure\.com\/([^/]+)\/([^/]+)\/_git\/([^/]+)\/pullrequest\/(\d+)/);
        //     if (!match) throw new Error("Invalid Azure DevOps PR link");
        //     const [_, org, project, repo, prNumber] = match;
        //     apiUrl = `https://dev.azure.com/${org}/${project}/_apis/git/repositories/${repo}/pullrequests/${prNumber}?api-version=6.0`;
        //     headers = { Authorization: `Basic ${Buffer.from(":" + group.tokens.azure).toString("base64")}` };

        } else {
            throw new Error("MR link platform not authorized or supported.");
        }

        // Fetch MR Status
        const response = await axios.get(apiUrl, { headers });
        return response.data.state || response.data.status || "unknown"; // 'open', 'merged', 'closed'

    } catch (error) {
        console.error(`Failed to fetch MR status: ${error.message}`);
        return "unknown";
    }
}

module.exports = { getMRStatus };
