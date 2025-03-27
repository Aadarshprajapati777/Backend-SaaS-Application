import Team from '../models/Team.js';
import User from '../models/User.js';
import createError from '../utils/errorResponse.js';

/**
 * @desc    Create a new team
 * @route   POST /api/teams
 * @access  Private (Business accounts only)
 */
export const createTeam = async (req, res, next) => {
  try {
    // Verify user is a business account
    if (req.user.userType !== 'business') {
      return next(createError('Only business accounts can create teams', 403));
    }

    const { name, description } = req.body;

    if (!name) {
      return next(createError('Please provide a team name', 400));
    }

    // Create team with current user as owner
    const team = await Team.create({
      name,
      description,
      owner: req.user.id,
      members: [{ user: req.user.id, role: 'owner' }]
    });

    res.status(201).json({
      success: true,
      data: team
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all teams for the current user
 * @route   GET /api/teams
 * @access  Private
 */
export const getTeams = async (req, res, next) => {
  try {
    // Find teams where user is a member
    const teams = await Team.find({
      'members.user': req.user.id
    }).populate('members.user', 'name email');

    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single team
 * @route   GET /api/teams/:id
 * @access  Private (Team members only)
 */
export const getTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members.user', 'name email')
      .populate('owner', 'name email');

    if (!team) {
      return next(createError('Team not found', 404));
    }

    // Check if user is a member of the team
    const isMember = team.members.some(member => 
      member.user._id.toString() === req.user.id
    );

    if (!isMember) {
      return next(createError('Not authorized to access this team', 403));
    }

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update team
 * @route   PUT /api/teams/:id
 * @access  Private (Team owner only)
 */
export const updateTeam = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    
    let team = await Team.findById(req.params.id);

    if (!team) {
      return next(createError('Team not found', 404));
    }

    // Check if user is the team owner
    if (team.owner.toString() !== req.user.id) {
      return next(createError('Only the team owner can update the team', 403));
    }

    const updateFields = {};
    if (name) updateFields.name = name;
    if (description) updateFields.description = description;

    team = await Team.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete team
 * @route   DELETE /api/teams/:id
 * @access  Private (Team owner only)
 */
export const deleteTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return next(createError('Team not found', 404));
    }

    // Check if user is the team owner
    if (team.owner.toString() !== req.user.id) {
      return next(createError('Only the team owner can delete the team', 403));
    }

    await team.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Add member to team
 * @route   POST /api/teams/:id/members
 * @access  Private (Team owner or admin only)
 */
export const addTeamMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;

    if (!email) {
      return next(createError('Please provide member email', 400));
    }

    // Valid roles
    const validRoles = ['member', 'admin'];
    if (role && !validRoles.includes(role)) {
      return next(createError(`Role must be one of: ${validRoles.join(', ')}`, 400));
    }

    const team = await Team.findById(req.params.id);

    if (!team) {
      return next(createError('Team not found', 404));
    }

    // Check if user is authorized to add members
    const userMember = team.members.find(member => 
      member.user.toString() === req.user.id
    );

    if (!userMember || (userMember.role !== 'owner' && userMember.role !== 'admin')) {
      return next(createError('Not authorized to add members', 403));
    }

    // Find user to add
    const userToAdd = await User.findOne({ email });
    
    if (!userToAdd) {
      return next(createError('User not found', 404));
    }

    // Check if user is already a member
    const isAlreadyMember = team.members.some(member => 
      member.user.toString() === userToAdd._id.toString()
    );

    if (isAlreadyMember) {
      return next(createError('User is already a team member', 400));
    }

    // Add user to team
    team.members.push({
      user: userToAdd._id,
      role: role || 'member'
    });

    await team.save();

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Remove member from team
 * @route   DELETE /api/teams/:id/members/:userId
 * @access  Private (Team owner or admin only)
 */
export const removeTeamMember = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return next(createError('Team not found', 404));
    }

    // Check if user is authorized to remove members
    const userMember = team.members.find(member => 
      member.user.toString() === req.user.id
    );

    if (!userMember || (userMember.role !== 'owner' && userMember.role !== 'admin')) {
      return next(createError('Not authorized to remove members', 403));
    }

    // Make sure team owner cannot be removed
    if (team.owner.toString() === req.params.userId) {
      return next(createError('Team owner cannot be removed', 400));
    }

    // Check if user to remove exists in team
    const memberIndex = team.members.findIndex(member => 
      member.user.toString() === req.params.userId
    );

    if (memberIndex === -1) {
      return next(createError('User is not a team member', 404));
    }

    // Remove member
    team.members.splice(memberIndex, 1);
    await team.save();

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update member role
 * @route   PUT /api/teams/:id/members/:userId
 * @access  Private (Team owner only)
 */
export const updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    // Valid roles
    const validRoles = ['member', 'admin'];
    if (!role || !validRoles.includes(role)) {
      return next(createError(`Role must be one of: ${validRoles.join(', ')}`, 400));
    }

    const team = await Team.findById(req.params.id);

    if (!team) {
      return next(createError('Team not found', 404));
    }

    // Only team owner can change roles
    if (team.owner.toString() !== req.user.id) {
      return next(createError('Only the team owner can update member roles', 403));
    }

    // Make sure team owner role cannot be changed
    if (team.owner.toString() === req.params.userId) {
      return next(createError('Team owner role cannot be changed', 400));
    }

    // Find member to update
    const member = team.members.find(member => 
      member.user.toString() === req.params.userId
    );

    if (!member) {
      return next(createError('User is not a team member', 404));
    }

    // Update role
    member.role = role;
    await team.save();

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (err) {
    next(err);
  }
}; 