// index.js
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const { createSharedKey, decryptAES256ECB, signMessage } = require('./utils/crypto-utils');

// Configuration constants
const port = process.env.PORT || 3000;
const ENCRYPTION_PRIVATE_KEY = "MC4CAQAwBQYDK2VuBCIEIGjFVUt48vlWpiNYkuxoD6Jx5Eo83ewPrt6RmzaDYJJB";
const ONDC_PUBLIC_KEY = "MCowBQYDK2VuAyEAa9Wbpvd9SsrpOZFcynyt/TO3x0Yrqyys4NUGIvyxX2Q=";
const REQUEST_ID = "sedctfvbhwxdfcvg41fh2a";
const SIGNING_PRIVATE_KEY = 'F53zG3C1NJWuQVFLOS8AOYfM1dJK6DjdF2SU7YrH1ksZCRiwnZc9cF1ka7isBtCRZoeVNzNCWPKNeinFoMiQhg==';

// HTML template for site verification
const htmlFile = `
<!--Contents of ondc-site-verification.html. -->
<!--Please replace SIGNED_UNIQUE_REQ_ID with an actual value-->
<html>
  <head>
    <meta
      name="ondc-site-verification"
      content="SIGNED_UNIQUE_REQ_ID"
    />
  </head>
  <body>
    ONDC Site Verification Page
  </body>
</html>
`;

// Create Express application
const app = express();
app.use(bodyParser.json());

// Create shared key once at startup
const sharedKey = createSharedKey(ENCRYPTION_PRIVATE_KEY, ONDC_PUBLIC_KEY);

// Route for handling subscription requests
app.post('/on_subscribe', async (req, res) => {
    try {
        const { challenge } = req.body;
        console.log('Received challenge:', challenge);
        
        const answer = decryptAES256ECB(sharedKey, challenge);
        console.log('Decrypted answer:', answer);
        
        res.status(200).json({ answer });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ 
            error: 'Failed to process subscription',
            details: error.message 
        });
    }
});

// Route for serving verification file
app.get('/ondc-site-verification.html', async (req, res) => {
    try {
        const signedContent = await signMessage(REQUEST_ID, SIGNING_PRIVATE_KEY);
        const modifiedHTML = htmlFile.replace(/SIGNED_UNIQUE_REQ_ID/g, signedContent);
        res.send(modifiedHTML);
    } catch (error) {
        console.error('Verification file error:', error);
        res.status(500).send('Error generating verification file');
    }
});

// Health check route
app.get('/health', (req, res) => res.send('Health OK!!'));

// Default route
app.get('/', (req, res) => res.send('ONDC Subscription Server'));

// Subscribe endpoint
app.post('/triggersubscribe', async (req, res) => {
    try {
        // Implementation of subscribe function
        // You'll need to implement this based on your requirements
        res.status(200).json({ message: 'Subscription triggered' });
    } catch (error) {
        console.error('Trigger subscribe error:', error);
        res.status(500).json({ error: 'Failed to trigger subscription' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`ONDC Subscription Server listening on port ${port}`);
    console.log('Server initialized with shared key');
}); 