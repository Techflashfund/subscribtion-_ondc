const { v4: uuidv4 } = require('uuid');
const DisbursedLoan = require('../models/disbursed.model');
const Issue = require('../models/issueschema');
const IssueRequestUtils = require('../utils/issuerqst.utils');
const IssueService = require('../services/issue.service');
const IssueMessageIds = require('../models/issuemessageids.model');
const IssueStatus = require('../models/issuestatus.mode');
const Transaction=require('../models/transaction.model');
const SelectThree=require('../models/selectThree.model')
const SchemaSendController = require('../services/schemasend ');
const TempData = require('../models/tempdata');
const { response } = require('express');

class IssueController {
    static async createIssue(req, res) {
        try {
            console.log(req.body);
            
            const { 
                transactionId, 
                name, 
                phone, 
                email, 
                shortDesc, 
                longDesc,
                category,
                sub_category,
                imageUrl
            } = req.body;
            console.log('requesttttt',req.body);
            
            
            const loan = await DisbursedLoan.findOne({ transactionId });
            let loanress=null
            let loanprovider=null
            if(loan){
                loanress=loan.Response
                loanprovider=loan.providerId
            }
            
            let selectThreeData = null;
            let selectresss=null
            let selectProvider=null
            if (!loan) {
                selectThreeData = await SelectThree.findOne({ transactionId });
                selectresss=selectThreeData.selectPayload
                selectProvider=selectThreeData.providerId
                if (!selectThreeData) {
                    return res.status(404).json({ error: 'Transaction not found in DisbursedLoan or SelectThree' });
                }
            }
            
            
            const issuePayload =await IssueRequestUtils.createIssuePayload(loanress ||  selectresss, {
                name, phone, email, shortDesc, longDesc,transactionId,category,imageUrl,
                sub_category
            }, loanprovider || selectProvider);
await SchemaSendController.sendToAnalytics('issue', issuePayload);
            const issueResponse = await IssueService.submitIssue(issuePayload);
await SchemaSendController.sendToAnalytics('issue_response', issueResponse);
            await Issue.create({
                transactionId,
                issueId: issuePayload.message.issue.id,
                category,
                imageUrl,
                sub_category,
                complainantInfo: {
                    name,
                    phone,
                    email
                },
                description: {
                    shortDesc,
                    longDesc,
                    additional_desc: {
                        url: "",
                        content_type: "text/plain"
                    },
                    images: []
                },
                requestDetails: {
                    payload: issuePayload,
                    timestamp: new Date()
                },
                responseDetails: {
                    payload: issueResponse,
                    timestamp: new Date()
                },
                status: 'OPEN'
            });
    

            res.status(200).json({
                message: 'Issue created successfully',
                issueId: issuePayload.message.issue.id,
                response: issueResponse
            });

        } catch (error) {
            console.error('Issue creation failed:', error);
            res.status(500).json({ error: error.message });
        }
    }
    static async onIssue(req, res) {
        try {
            await SchemaSendController.sendToAnalytics('on_issue', req.body);
            const { context, message } = req.body;
            
            // Save request to temp data
            await TempData.create({
                transactionId: context.transaction_id,
                messageId: context.message_id,
                responseData: req.body
            });
    
            // Find and update message ID status
            await IssueMessageIds.findOneAndUpdate(
                { issueId: message.issue.id },
                { status: 'yes' }
            );
    
            // Extract respondent actions
            const respondentActions = message.issue.issue_actions?.respondent_actions?.map(action => ({
                respondentAction: action.respondent_action,
                shortDesc: action.short_desc,
                updatedAt: new Date(action.updated_at),
                updatedBy: {
                    org: {
                        name: action.updated_by?.org?.name
                    },
                    contact: {
                        phone: action.updated_by?.contact?.phone,
                        email: action.updated_by?.contact?.email
                    },
                    person: {
                        name: action.updated_by?.person?.name
                    }
                },
                cascadedLevel: action.cascaded_level
            })) || [];
    
            // Update Issue document
            await Issue.findOneAndUpdate(
                { issueId: message.issue.id },
                {
                    $set: {
                        status: message.issue.issue_actions?.respondent_actions?.[0]?.respondent_action || 'PROCESSING',
                        respondentActions: respondentActions,
                        'responseDetails.payload': req.body,
                        'responseDetails.timestamp': new Date(message.issue.updated_at),
                        'responseDetails.respondentActions': message.issue.issue_actions?.respondent_actions,
                        response: req.body,
                        updatedAt: new Date(message.issue.updated_at)
                    }
                },
                { new: true }
            );
    await SchemaSendController.sendToAnalytics('on_issue_response', {
                message: {
                    ack: {
                        status: "ACK"
                    }
                }
            });
            res.status(200).json({
                message: {
                    ack: {
                        status: "ACK"
                    }
                }
            });
    
        } catch (error) {
            console.error('Issue response processing failed:', error);
            res.status(500).json({ error: error.message });
        }
    }
    static async checkIssueStatusById(req, res) {
        try {
            const { issueId } = req.params;
            const issue = await Issue.findOne({ issueId });
            
            if (!issue) {
                return res.status(404).json({ error: 'Issue not found' });
            }
    
            const messageId = uuidv4();
            const statusPayload = {
                context: {
                    domain: "ONDC:FIS12",
                    location: {
                        country: {
                            code: "IND"
                        },
                        city: {
                            code: "*"
                        }
                    },
                    action: "issue_status",
                    version: "2.0.1",
                    bap_id: issue.requestDetails.payload.context.bap_id,
                    bap_uri: issue.requestDetails.payload.context.bap_uri,
                    bpp_id: issue.requestDetails.payload.context.bpp_id,
                    bpp_uri: issue.requestDetails.payload.context.bpp_uri,
                    transaction_id: issue.transactionId,
                    message_id: messageId,
                    timestamp: new Date().toISOString(),
                    ttl: "PT30S"
                },
                message: {
                    issue_id: issueId
                }
            };
    await SchemaSendController.sendToAnalytics('issue_status', statusPayload);
            // Create issue status record
            await IssueStatus.create({
                transactionId: issue.transactionId,
                messageId,
                issueId,
                status: 'PENDING',
                requestDetails: {
                    payload: statusPayload,
                    timestamp: new Date()
                }
            });
    
            // Send status request
            const statusResponse = await IssueService.checkIssueStatus(statusPayload);
    await SchemaSendController.sendToAnalytics('issue_status_response', statusResponse);
            // Update issue status record
            await IssueStatus.findOneAndUpdate(
                { messageId },
                {
                    $set: {
                        status: 'COMPLETED',
                        responseDetails: {
                            payload: statusResponse,
                            timestamp: new Date()
                        }
                    }
                }
            );
    
            res.status(200).json({
                message: 'Issue status check completed',
                response: statusResponse
            });
    
        } catch (error) {
            console.error('Issue status check failed:', error);
            res.status(500).json({ error: error.message });
        }
    }
    static async getIssueStatus(req, res) {
        try {
            const { userId } = req.body;
    
            // Fetch all transactions for the user
            const transactions = await Transaction.find({ user: userId });
    
            if (!transactions.length) {
                return res.status(404).json({
                    message: "No transactions found for this user"
                });
            }
    
            // Extract transactionIds
            const transactionIds = transactions.map(transaction => transaction.transactionId);
    
            // Find issues for these transactions
            const issues = await Issue.find({
                transactionId: { $in: transactionIds }
            });
    
            if (!issues.length) {
                return res.status(404).json({
                    message: "No issues found for this user's transactions"
                });
            }
    
            // Format the response
            const formattedIssues = issues.map(issue => {
                if (issue.status === 'CLOSED') {
                    // Return resolved status for closed issues
                    return {
                        transactionId: issue.transactionId,
                        issueId: issue.issueId,
                        status: 'RESOLVED',
                        createdAt: issue.createdAt,
                        updatedAt: issue.updatedAt
                    };
                } else if (!issue.issueResponse) {
                    // Basic response when no issueResponse exists
                    return {
                        transactionId: issue.transactionId,
                        issueId: issue.issueId,
                        category: issue.category,
                        sub_category: issue.sub_category,
                        status: 'PROCESSING',
                        createdAt: issue.createdAt,
                        updatedAt: issue.updatedAt
                    };
                } else {
                    // Full response when issueResponse exists
                    const issueResponse = issue.issueResponse;
                    return {
                        transactionId: issue.transactionId,
                        issueId: issue.issueId,
                        status: 'RESPONDED',
                        createdAt: issue.createdAt,
                        response: issueResponse
                    };
                }
            });
    
            res.status(200).json({
                message: 'Issue status request processed',
                totalIssues: formattedIssues.length,
                issues: formattedIssues
            });
    
        } catch (error) {
            console.error('Issue status check failed:', error);
            res.status(500).json({ error: error.message });
        }
    }static async getAllIssues(req, res) {
        try {
            // Get all issues with pagination
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
    
            // Get total count for pagination
            const totalCount = await Issue.countDocuments();
    
            // Find all issues with sorting by latest first
            const issues = await Issue.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
    
            if (!issues.length) {
                return res.status(404).json({
                    success: false,
                    message: "No issues found"
                });
            }
    
            // Format the response
            const formattedIssues = issues.map(issue => {
                const baseResponse = {
                    transactionId: issue.transactionId,
                    issueId: issue.issueId,
                    category: issue.category,
                    image: issue.imageUrl,
                    sub_category: issue.sub_category,
                    createdAt: issue.createdAt,
                    updatedAt: issue.updatedAt,
                    complainantInfo: issue.complainantInfo,
                    description: {
                        shortDesc: issue.description.shortDesc,
                        longDesc: issue.description.longDesc
                    }
                };
    
                if (issue.status === 'CLOSED') {
                    return {
                        ...baseResponse,
                        status: 'RESOLVED',
                        resolution: issue.resolution || null
                    };
                } else if (!issue.issueResponse) {
                    return {
                        ...baseResponse,
                        status: 'PROCESSING'
                    };
                } else {
                    return {
                        ...baseResponse,
                        status: 'RESPONDED',
                        response: issue.issueResponse,
                        respondentActions: issue.respondentActions || []
                    };
                }
            });
    
            res.status(200).json({
                success: true,
                message: 'Issues retrieved successfully',
                data: {
                    issues: formattedIssues,
                    pagination: {
                        totalCount,
                        currentPage: page,
                        totalPages: Math.ceil(totalCount / limit),
                        limit
                    }
                }
            });
    
        } catch (error) {
            console.error('Get all issues failed:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }static async getIssueDetails(req, res) {
        try {
            const { issueId } = req.params;
    
            const issue = await Issue.findOne({ issueId });
            if (!issue) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Issue not found' 
                });
            }
    
            // Format response
            const response = {
                issueId: issue.issueId,
                response: issue.issueResponse,
            };
    
            res.status(200).json({
                success: true,
                data: response
            });
    
        } catch (error) {
            console.error('Get issue details failed:', error);
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }
    static async onIssueStatus(req, res) {
        try {
                await SchemaSendController.sendToAnalytics('on_issue_status', req.body);
            const { context, message } = req.body;
            
            // Save temp data
            await TempData.create({
                transactionId: context.transaction_id,
                messageId: context.message_id,
                responseData: req.body
            });
    
            // Update Issue document with just the response
            await Issue.findOneAndUpdate(
                { issueId: message.issue.id },
                {
                    $set: {
                        'issueResponse': req.body,
                        'updatedAt': new Date(message.issue.updated_at)
                    }
                }
            );
    await SchemaSendController.sendToAnalytics('on_issue_status_response', {
                message: {
                    ack: {
                        status: "ACK"
                    }
                }
            });
            res.status(200).json({
                message: {
                    ack: {
                        status: "ACK"
                    }
                }
            });
    
        } catch (error) {
            console.error('Issue status update failed:', error);
            res.status(500).json({ 
                error: error.message 
            });
        }
    }
    static async completeIssue(req, res) {
        try {
            const { 
                transactionId, 
                issueId,
                shortDesc,
                longDesc 
            } = req.body;
    
            const issue = await Issue.findOne({ issueId });
            if (!issue) {
                return res.status(404).json({ error: 'Issue not found' });
            }
    
            const messageId = uuidv4();
    
            // Create complete payload with new structure
            const completePayload = {
                context: {
                    domain: "ONDC:FIS12",
                    location: {
                        country: {
                            code: "IND"
                        },
                        city: {
                            code: "*"
                        }
                    },
                    action: "issue",
                    version: "2.0.1",
                    bap_id: issue.requestDetails.payload.context.bap_id,
                    bap_uri: issue.requestDetails.payload.context.bap_uri,
                    bpp_id: issue.requestDetails.payload.context.bpp_id,
                    bpp_uri: issue.requestDetails.payload.context.bpp_uri,
                    transaction_id: transactionId,
                    message_id: messageId,
                    timestamp: new Date().toISOString(),
                    ttl: "PT30S"
                },
                message: {
                    issue: {
                        id: issueId,
                        status: "CLOSED",
                        issue_actions: {
                            complainant_actions: [
                                ...issue.issue_actions?.complainant_actions || [],
                                {
                                    complainant_action: "CLOSE",
                                    short_desc: "Complaint closed",
                                    updated_at: new Date().toISOString(),
                                    updated_by: {
                                        org: {
                                            name: issue.requestDetails.payload.context.bap_id
                                        },
                                        contact: {
                                            phone: issue.complainantInfo.phone,
                                            email: issue.complainantInfo.email
                                        },
                                        person: {
                                            name: issue.complainantInfo.name
                                        }
                                    }
                                }
                            ]
                        },
                        rating: "THUMBS-UP",
                        created_at: issue.createdAt.toISOString(),
                        updated_at: new Date().toISOString()
                    }
                }
            };
            await SchemaSendController.sendToAnalytics('issue', completePayload);
            // Save message ID
            await IssueMessageIds.create({
                transactionId,
                messageId,
                issueId,
                type: 'ISSUE_COMPLETE',
                status: 'no'
            });
    
            // Send complete request
            const completeResponse = await IssueService.submitIssue(completePayload);
    await SchemaSendController.sendToAnalytics('issue_response', completeResponse);
            // Update issue status
            await Issue.findOneAndUpdate(
                { issueId },
                {
                    $set: {
                        status: 'CLOSED',
                        'requestDetails.completePayload': completePayload,
                        'responseDetails.completeResponse': completeResponse,
                        updatedAt: new Date()
                    }
                }
            );
    
            // Delete the document from IssueStatus
            await IssueStatus.findOneAndDelete({ transactionId, issueId });
    
            res.status(200).json({
                message: 'Issue marked as complete',
                completeResponse
            });
    
        } catch (error) {
            console.error('Issue completion failed:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
}

module.exports = IssueController;