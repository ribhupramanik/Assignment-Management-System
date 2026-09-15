import { Router } from 'express'

import { addGroupMember, createGroup, getGroupMembers, getMyGroups} from '../controllers/groupController.js'

import { authorizeRoles, protect} from '../middleware/authMiddleware.js'

const router = Router()

router.use(protect)
router.use(authorizeRoles('student'))

router.post('/', createGroup)
router.get('/mine', getMyGroups)

router.post('/:groupId/members', addGroupMember)
router.get('/:groupId/members', getGroupMembers)

export default router