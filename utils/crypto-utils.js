// crypto-utils.js
const crypto = require('crypto');
const _sodium = require('libsodium-wrappers');

/**
 * Derives an AES key from the shared secret
 * @param {Buffer} sharedKey - The shared secret key
 * @returns {Buffer} - 32-byte key suitable for AES-256
 */
function deriveAESKey(sharedKey) {
    return crypto.createHash('sha256').update(sharedKey).digest();
}

/**
 * Creates a shared key from private and public keys
 * @param {string} privateKeyB64 - Base64 encoded private key
 * @param {string} publicKeyB64 - Base64 encoded public key
 * @returns {Buffer} - Derived AES key
 */
function createSharedKey(privateKeyB64, publicKeyB64) {
    try {
        // Create private key object
        const privateKey = crypto.createPrivateKey({
            key: Buffer.from(privateKeyB64, 'base64'),
            format: 'der',
            type: 'pkcs8'
        });

        // Create public key object
        const publicKey = crypto.createPublicKey({
            key: Buffer.from(publicKeyB64, 'base64'),
            format: 'der',
            type: 'spki'
        });

        // Generate shared secret
        const sharedSecret = crypto.diffieHellman({
            privateKey: privateKey,
            publicKey: publicKey
        });

        // Derive AES key from shared secret
        return deriveAESKey(sharedSecret);
    } catch (error) {
        console.error('Error creating shared key:', error);
        throw new Error(`Failed to create shared key: ${error.message}`);
    }
}

/**
 * Decrypts data using AES-256-ECB
 * @param {Buffer} key - 32-byte AES key
 * @param {string} encryptedB64 - Base64 encoded encrypted data
 * @returns {string} - Decrypted string
 */
function decryptAES256ECB(key, encryptedB64) {
    try {
        // Convert base64 to buffer
        const encrypted = Buffer.from(encryptedB64, 'base64');
        
        // Create decipher (ECB mode doesn't use IV)
        const decipher = crypto.createDecipheriv('aes-256-ecb', key, null);
        decipher.setAutoPadding(true);
        
        // Decrypt
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        return decrypted.toString('utf8');
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error(`Decryption failed: ${error.message}`);
    }
}

/**
 * Signs a message using Ed25519
 * @param {string} signingString - String to sign
 * @param {string} privateKeyB64 - Base64 encoded private key
 * @returns {Promise<string>} - Base64 encoded signature
 */
async function signMessage(signingString, privateKeyB64) {
    await _sodium.ready;
    const sodium = _sodium;
    
    try {
        const signedMessage = sodium.crypto_sign_detached(
            signingString,
            sodium.from_base64(privateKeyB64, sodium.base64_variants.ORIGINAL)
        );
        
        return sodium.to_base64(signedMessage, sodium.base64_variants.ORIGINAL);
    } catch (error) {
        console.error('Signing error:', error);
        throw new Error(`Signing failed: ${error.message}`);
    }
}

module.exports = {
    createSharedKey,
    decryptAES256ECB,
    signMessage
};