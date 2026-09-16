import { Router } from "express";

import { getAdminGroups } from "../controllers/adminGroupController.js";

import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);
router.use(authorizeRoles("admin"));

router.get("/", getAdminGroups);

export default router;
