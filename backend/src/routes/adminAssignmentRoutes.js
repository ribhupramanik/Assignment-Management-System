import { Router } from 'express'

import {
  createAssignment,
  getAdminAssignments,
} from '../controllers/assignmentController.js'

import {
  authorizeRoles,
  protect,
} from '../middleware/authMiddleware.js'

const router = Router()

router.use(protect)
router.use(authorizeRoles('admin'))

router.post('/', createAssignment)
router.get('/', getAdminAssignments)

export default router