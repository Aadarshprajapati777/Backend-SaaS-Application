import express from 'express';
import {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  updateMemberRole
} from '../controllers/teams.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Team routes
router.route('/')
  .get(getTeams)
  .post(createTeam);

router.route('/:id')
  .get(getTeam)
  .put(updateTeam)
  .delete(deleteTeam);

// Team member routes
router.route('/:id/members')
  .post(addTeamMember);

router.route('/:id/members/:userId')
  .put(updateMemberRole)
  .delete(removeTeamMember);

export default router; 