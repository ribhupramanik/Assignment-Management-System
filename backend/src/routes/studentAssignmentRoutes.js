import { Router } from 'express'

import { getStudentAssignmentById, getStudentAssignments } from '../controllers/studentAssignmentController.js'

import { confirmSubmission, getSubmissionStatus } from '../controllers/submissionController.js'

import { authorizeRoles, protect } from '../middleware/authMiddleware.js'

const router = Router()

router.use(protect)
router.use(authorizeRoles('student'))

router.get('/', getStudentAssignments)
router.get('/:assignmentId', getStudentAssignmentById)

router.get('/:assignmentId/submission', getSubmissionStatus)

router.post('/:assignmentId/submission/confirm', confirmSubmission)

export default router