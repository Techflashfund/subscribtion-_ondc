const User = require('../models/user.model');
const UserDetails = require('../models/userdetails.model');

class UserController {
    static async getUserData(req, res) {
        try {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'userId is required'
                });
            }

            // Get user and user details with populated transactions
            const [user, userDetails] = await Promise.all([
                User.findById(userId).select('-password -otp'),
                UserDetails.findOne({ user: userId })
                    .populate('user', '-password -otp')
                    .populate('transactions')
            ]);

            if (!user || !userDetails) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            return res.status(200).json({
                success: true,
                data: {
                    user,
                    userDetails
                }
            });

        } catch (error) {
            console.error('Get user data failed:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
    static async updateUserDetails(req, res) {
        try {
            const { userId } = req.params;
            const updateData = req.body;

            // Remove fields that shouldn't be updated
            delete updateData.user;
            delete updateData.transactions;

            // Validate required fields if present
            if (updateData.employmentType && !['salaried', 'selfEmployed'].includes(updateData.employmentType)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid employment type'
                });
            }

            if (updateData.gender && !['male', 'female', 'transgender'].includes(updateData.gender)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid gender'
                });
            }

            const updatedUserDetails = await UserDetails.findOneAndUpdate(
                { user: userId },
                {
                    ...updateData,
                    lastUpdated: new Date()
                },
                { 
                    new: true,
                    runValidators: true
                }
            );

            if (!updatedUserDetails) {
                return res.status(404).json({
                    success: false,
                    message: 'User details not found'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'User details updated successfully',
                data: updatedUserDetails
            });

        } catch (error) {
            console.error('Update user details failed:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
}

module.exports = UserController;