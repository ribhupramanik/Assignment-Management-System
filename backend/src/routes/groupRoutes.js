import { Router } from 'express'

import { createGroup, getMyGroups} from '../controllers/groupController.js'

import { authorizeRoles, protect} from '../middleware/authMiddleware.js'

const router = Router()

router.use(protect)
router.use(authorizeRoles('student'))

router.post('/', createGroup)
router.get('/mine', getMyGroups)

export default router