import { Router } from 'express'

import { createAssignment, getAdminAssignmentById, getAdminAssignments, updateAssignment } from '../controllers/assignmentController.js'

import { authorizeRoles, protect } from '../middleware/authMiddleware.js'

const router = Router()

router.use(protect)
router.use(authorizeRoles('admin'))

router.post('/', createAssignment)
router.get('/', getAdminAssignments)

router.get('/:assignmentId', getAdminAssignmentById)
router.patch('/:assignmentId', updateAssignment)

export default router