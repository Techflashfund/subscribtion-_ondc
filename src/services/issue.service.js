const axios = require("axios");
const nacl = require("tweetnacl");
const blake = require("blakejs");
const CONFIG = require("../config/search.config");

class IssueService {
    static signMessage(message) {
        if (!message) {
            throw new Error("Message to sign cannot be empty");
        }

        if (!CONFIG.PRIVATE_KEY) {
            throw new Error("Private key is not configured");
        }

        try {
            const privateKey = Buffer.from(CONFIG.PRIVATE_KEY, "base64");
            if (privateKey.length !== 64) {
                throw new Error("Invalid private key length");
            }

            const messageUint8Array = new TextEncoder().encode(message);
            const signature = nacl.sign.detached(messageUint8Array, privateKey);
            return Buffer.from(signature).toString("base64");
        } catch (error) {
            console.error("Error signing message:", error);
            throw error;
        }
    }

    static generateAuthHeader(hashedBody) {
        const created = Math.floor(Date.now() / 1000) - 10000;
        const expires = Math.floor((Date.now() + CONFIG.SIGNATURE_VALIDITY) / 1000);
        
        const signingString = `(created): ${created}\n(expires): ${expires}\ndigest: BLAKE-512=${hashedBody}`;
        const signature = this.signMessage(signingString);

        return {
            authHeader: `Signature keyId="${CONFIG.KEY_ID}",algorithm="ed25519",created="${created}",expires="${expires}",headers="(created) (expires) digest",signature="${signature}"`,
            created,
            expires
        };
    }

    static async submitIssue(payload) {
        try {
            console.log('Submitting issue with payload:', JSON.stringify(payload, null, 2));

            const hashedBody = blake.blake2bHex(Buffer.from(JSON.stringify(payload)));
            const base64HashedBody = Buffer.from(hashedBody, 'hex').toString('base64');
            const { authHeader } = this.generateAuthHeader(base64HashedBody);
            console.log('veer',payload.context);
            
            const response = await axios.post(
                `${payload.context.bpp_uri}/issue`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authHeader
                    }
                }
            );

            console.log('Issue submission response:', response.data);
            return response.data;

        } catch (error) {
            console.error('Issue submission failed:', error);
            throw error;
        }
    }
    static async checkIssueStatus(payload) {
        try {
            console.log('Checking issue status with payload:', JSON.stringify(payload, null, 2));

            const hashedBody = blake.blake2bHex(Buffer.from(JSON.stringify(payload)));
            const base64HashedBody = Buffer.from(hashedBody, 'hex').toString('base64');
            const { authHeader } = this.generateAuthHeader(base64HashedBody);

            const response = await axios.post(
                `${payload.context.bpp_uri}/issue_status`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authHeader,
                        'Accept': 'application/json'
                    }
                }
            );

            console.log('Issue status check response:', response.data);
            return response.data;

        } catch (error) {
            console.error('Issue status check failed:', error);
            throw error;
        }
    }
}

module.exports = IssueService;