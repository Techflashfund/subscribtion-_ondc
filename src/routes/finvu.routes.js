const crypto = require('crypto');
const express = require('express');
const router = express.Router();

// Constants from original code
const secretKey = 'X3IpVB7IhVe4vuzN';
const fi = 'flshfund-lsp-prod'; // Default FI value, can be overridden in request

/**
 * Encrypts the given string using AES-256-CBC with PBKDF2 key derivation
 * @param {string} strToEncrypt - Data to encrypt
 * @param {string} salt - Salt for key derivation
 * @returns {string} Base64 URL encoded encrypted data
 */
function encrypt(strToEncrypt, salt) {
    try {
        // Create key using PBKDF2
        const key = crypto.pbkdf2Sync(
            secretKey, 
            Buffer.from(salt), 
            65536, 
            32, 
            'sha256'
        );
        
        // Fixed IV (same as Java version)
        const iv = Buffer.alloc(16, 0);
        
        // Create cipher
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        
        // Encrypt and encode
        let encrypted = cipher.update(strToEncrypt, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        
        // Convert to URL-safe Base64
        return encrypted.replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    } catch (e) {
        console.error('Encryption error:', e);
        return null;
    }
}

/**
 * Decrypts the given Base64 URL encoded string
 * @param {string} strToDecrypt - Base64 URL encoded data to decrypt
 * @param {string} salt - Salt for key derivation
 * @returns {string} Decrypted data as string
 */
function decrypt(strToDecrypt, salt) {
    try {
        // Convert from URL-safe Base64
        const base64Data = strToDecrypt
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
        // Pad if needed
        const paddedData = base64Data + '='.repeat((4 - base64Data.length % 4) % 4);
        
        // Create key using PBKDF2
        const key = crypto.pbkdf2Sync(
            secretKey, 
            Buffer.from(salt), 
            32, 
            'sha256'
        );
        
        // Fixed IV (same as Java version)
        const iv = Buffer.alloc(16, 0);
        
        // Create decipher
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        
        // Decrypt
        let decrypted = decipher.update(paddedData, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (e) {
        console.error('Decryption error:', e);
        return null;
    }
}

/**
 * XOR utility function
 * @param {Buffer} a - Data to XOR
 * @param {Buffer} key - Key for XOR operation
 * @returns {Buffer} XORed data
 */
function xor(a, key) {
    const out = Buffer.alloc(a.length);
    for (let i = 0; i < a.length; i++) {
        out[i] = a[i] ^ key[i % key.length];
    }
    return out;
}

/**
 * Encrypts a value using XOR and encodes with Base64
 * @param {string} value - Value to encrypt
 * @param {string} key - Key for XOR operation
 * @returns {string} Base64 encoded XORed data
 */
function encryptValueToXor(value, key) {
    return Buffer.from(xor(Buffer.from(value), Buffer.from(key))).toString('base64');
}

/**
 * Decrypts a Base64 encoded XORed value
 * @param {string} xoredValue - Base64 encoded XORed data
 * @param {string} key - Key for XOR operation
 * @returns {string} Decrypted value
 */
function decryptXoredValue(xoredValue, key) {
    return xor(Buffer.from(xoredValue, 'base64'), Buffer.from(key)).toString();
}

/**
 * Generate current timestamp in the specified format (ddmmyyyyhh24misss in UTC)
 * @returns {string} Formatted timestamp
 */
function generateTimestamp() {
    const now = new Date();
    
    const day = String(now.getUTCDate()).padStart(2, '0');
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const year = now.getUTCFullYear();
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    const milliseconds = String(now.getUTCMilliseconds()).padStart(3, '0');
    
    return `${day}${month}${year}${hours}${minutes}${seconds}${milliseconds}`;
}

/**
 * Validate timestamp to be within 180 seconds
 * @param {string} timestamp - Timestamp in ddmmyyyyhh24misss format
 * @returns {boolean} True if valid, false otherwise
 */
function validateTimestamp(timestamp) {
    try {
        // Parse the timestamp
        const day = parseInt(timestamp.substring(0, 2));
        const month = parseInt(timestamp.substring(2, 4)) - 1; // JS months are 0-based
        const year = parseInt(timestamp.substring(4, 8));
        const hours = parseInt(timestamp.substring(8, 10));
        const minutes = parseInt(timestamp.substring(10, 12));
        const seconds = parseInt(timestamp.substring(12, 14));
        const milliseconds = parseInt(timestamp.substring(14, 17));
        
        const timestampDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds, milliseconds));
        const now = new Date();
        
        // Calculate difference in seconds
        const diffSeconds = Math.abs((now - timestampDate) / 1000);
        
        // Valid if within 180 seconds
        return diffSeconds <= 180;
    } catch (e) {
        console.error('Timestamp validation error:', e);
        return false;
    }
}

/**
 * Format array parameter for ecreq
 * @param {string|Array} value - Array or comma-separated string
 * @returns {string} Formatted array string
 */
function formatArrayParam(value) {
    if (!value) return '';
    
    // For multiple consent handles, we'll concatenate them with commas
    if (Array.isArray(value)) {
        return value.join(',');
    }
    
    return value;
}

// Main onboarding route
router.post('/', (req, res) => {
    try {
        const consentHandle = req.body.consentHandle;
        
        if (!consentHandle) {
            return res.status(400).json({ error: 'Consent handle is required' });
        }
        
        // Generate reqdate if not provided
        const reqdate = req.body.reqdate || generateTimestamp();
        
        // Validate reqdate if provided
        if (req.body.reqdate && !validateTimestamp(req.body.reqdate)) {
            return res.status(400).json({ error: 'Invalid timestamp - must be within 180 seconds of current time' });
        }
        
        // Set fi value - either from request or default
        const fiValue = req.body.fi || fi;
        
        // Set requestor type
        const requestorType = req.body.requestorType || 'FIU';
        
        // Generate UUID for txnid if not provided
        const uuid = () => {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };

        // Handle multiple consent handles
        const consentHandles = req.body.consentHandle 
            ? (Array.isArray(req.body.consentHandle) 
                ? req.body.consentHandle 
                : req.body.consentHandle.split(','))
            : [];

        // Build ecreq payload with ordered parameters
        // Start with txnid and sessionid
        let ecreqParams = [
            `txnid=${req.body.txnid || uuid()}`,
            `sessionid=${req.body.sessionid || `session-${Date.now()}`}`
        ];
        
        // Add srcref parameters (one for each consent handle)
        consentHandles.forEach(handle => {
            if (handle && handle.trim()) {
                ecreqParams.push(`srcref=${handle.trim()}`);
            }
        });
        
        // Add remaining parameters
        if (req.body.userid) {
            ecreqParams.push(`userid=${req.body.userid}`);
        }
        if (req.body.redirect) {
            ecreqParams.push(`redirect=${encodeURIComponent(req.body.redirect)}`);
        }
        if (req.body.fipid) {
            const fipids = Array.isArray(req.body.fipid) 
                ? req.body.fipid 
                : req.body.fipid.split(',');
                
            fipids.forEach(fip => {
                if (fip && fip.trim()) {
                    ecreqParams.push(`fipid=${fip.trim()}`);
                }
            });
        }
        
        // Join parameters with &
        const ecreqStr = ecreqParams.join('&');
        
        // Encrypt ecreq
        const ecreq = encrypt(ecreqStr, reqdate);
        
        // Encrypt fi and requestorType using XOR
        const encryptedFi = encryptValueToXor(fiValue, reqdate);
        const encryptedRequestorType = requestorType ? encryptValueToXor(requestorType, reqdate) : undefined;
        
        // Build final URL
        const baseUrl = 'https://webvwlive.finvu.in/onboarding';
        const finalUrl = `${baseUrl}?fi=${encryptedFi}&reqdate=${reqdate}&ecreq=${ecreq}${requestorType ? `&requestorType=${encryptedRequestorType}` : ''}`;
        
        // Return response
        res.json({
            url: finalUrl,
            params: {
                fi: encryptedFi,
                reqdate,
                ecreq,
                requestorType: encryptedRequestorType
            },
            originalParams: {
                fi: fiValue,
                reqdate,
                ecreq: ecreqStr,
                requestorType
            }
        });
    } catch (error) {
        console.error('Error in onboarding route:', error);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
});

// Test route to validate encryption/decryption
router.post('/test', (req, res) => {
    try {
        const { reqdate, payload, fi: fiValue } = req.body;
        
        if (!reqdate || !payload) {
            return res.status(400).json({ 
                error: 'Both reqdate and payload are required',
                usage: 'POST with {"reqdate": "ddmmyyyyhh24misss", "payload": "value"}'
            });
        }
        
        // Encrypt payload and fi
        const ecreq = encrypt(payload, reqdate);
        const encryptedFi = encryptValueToXor(fiValue || fi, reqdate);
        
        res.json({
            reqdate,
            payload,
            ecreq,
            decryptedPayload: decrypt(ecreq, reqdate),
            fi: fiValue || fi,
            encryptedFi,
            decryptedFi: decryptXoredValue(encryptedFi, reqdate)
        });
    } catch (error) {
        console.error('Error in test route:', error);
        res.status(500).json({ error: 'An error occurred while processing the test request' });
    }
});

module.exports = router;