import { Router } from 'express'

import { getDashboardAnalytics} from '../controllers/adminAnalyticsController.js'

import { authorizeRoles, protect} from '../middleware/authMiddleware.js'

const router = Router()

router.use(protect)
router.use(authorizeRoles('admin'))

router.get('/analytics', getDashboardAnalytics)

export default router