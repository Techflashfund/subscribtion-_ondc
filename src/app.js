const express = require('express');
const mongoose = require('mongoose');
const { mongoURI } = require('./config/db.config');

const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const searchRoutes = require('./routes/search.routes');
const selectRoutes = require('./routes/select.routes');
const confirmRoutes = require('./routes/confirm.routes');
const userdetailsroute = require('./routes/userdetails.routes');
const amountRoutes = require('./routes/amount.routes');
const statusRoutes = require('./routes/status.routes');
const initRoutes = require('./routes/init.routes');
const updateRoutes = require('./routes/update.routes');
const bankdetailsRoutes = require('./routes/bankdetails.routes');
const offerRoutes=require('./routes/offer.routes');
const kycRoutes=require('./routes/kyc.routes')
const  kycstatusRoutes=require('./routes/kyc.status.routes')
const mandateRoutes=require('./routes/mandate.routes') 
const mandatestatusRoutes=require('./routes/mandatestatus.routes') 
const documentRoutes=require('./routes/document.routes')
const docstatusRoutes=require('./routes/docstatus.routes')
const nostatsRoutes=require('./routes/noform.routes')
const forclosureRoutes=require('./routes/forclosure.routes');
const checkLoanStatus = require('./routes/checkloanstatus.routes');
const checDisbursalStatus = require('./routes/disbursal.routes');
const checkcompletedloan = require('./routes/completed.routes');
const prepaymentRoutes = require('./routes/prepart.routes');
const issueRoutes = require('./routes/issue.routes');
const issuestatusRoutes = require('./routes/issuestatus.routes');
const paymentupdateRoutes = require('./routes/paymenturl.routes');
const dashboardroutes=require('./routes/dashboard.routes')
const adminroutes=require('./routes/admin.routes')
const merchantFormRoutes = require('./routes/merchantdata.routes');
const customerRoutes = require('./routes/pfcustomer.routes');
const pfOfferRoutes = require('./routes/pf.offerselect.routes');
const onboardingRoutes = require('./routes/finvu.routes')
const userRoutes = require('./routes/getuser.routes')
const searchIdsRoutes = require('./routes/dasboardflow.routes');
const app = express();

// Middleware
app.use(express.json());

// Enable CORS for localhost:3000
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://personal-loan-571d4n33v-techflashfunds-projects.vercel.app',
        'https://personal-loan-ui.vercel.app',
       'https://personal-loan-dashboard.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors());


app.use((req, res, next) => {
    const endpoint = req.path.replace('/', '');
    // Blue text using ANSI escape code
    console.log('\x1b[36m%s\x1b[0m', `→ ${endpoint}`);
    next();
});
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/on_search', searchRoutes);
app.use('/on_select', selectRoutes);
app.use('/form', userdetailsroute);
app.use('/on_status', statusRoutes);
app.use('/on_init', initRoutes);
app.use('/amount', amountRoutes);
app.use('/submit-bank-details', bankdetailsRoutes);
app.use('/agrement', confirmRoutes);
app.use('/on_confirm', confirmRoutes);
app.use('/consent', updateRoutes);
app.use('/on_update', updateRoutes);
app.use('/loan', offerRoutes);
app.use('/kyc-form',kycRoutes)
app.use('/kyc',kycstatusRoutes)
app.use('/mandate-form',mandateRoutes)
app.use('/mandate-status',mandatestatusRoutes)
app.use('/document-form',documentRoutes)
app.use('/document-status',docstatusRoutes)
app.use('/noform-status',nostatsRoutes)
app.use('/foreclosure',forclosureRoutes)
app.use('/check-loan-status',checkLoanStatus)
app.use('/check-disbursal-status',checDisbursalStatus)
app.use('/check-completed',checkcompletedloan)
app.use('/prepayment', prepaymentRoutes);
app.use('/missedemi', prepaymentRoutes);
app.use('/issues', issueRoutes);
app.use('/on_issue', issueRoutes);
app.use('/issue_status', issuestatusRoutes);
app.use('/on_issue_status', issuestatusRoutes);
app.use('/api/merchant', merchantFormRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/pfoffer', pfOfferRoutes);
app.use('/onboarding', onboardingRoutes);
app.use('/user', userRoutes);
app.use('/records', searchIdsRoutes);

// ...existing code...
app.use('/admin',dashboardroutes)
app.use('/auth/admin',adminroutes)
app.use('/api/userdetails', userdetailsroute);

// ...existing code...


app.use('/payment-url', paymentupdateRoutes);

// ...existing code...
app.get('/api/test', (req, res) => {
    res.json({ message: 'CORS is working!' });
});

// Connect to MongoDB
console.log("Using MongoDB URI:", mongoURI); 
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
