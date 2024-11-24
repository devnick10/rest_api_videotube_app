import { Router } from 'express';
import {
    getChannelStats,
    getChannelVideos,
} from "../controllers/dashboard.controller"
import isAuthenticated from '../middlewares/auth.middleware';

const router = Router();

router.use(isAuthenticated);

router.route("/stats").get(getChannelStats);
router.route("/videos").get(getChannelVideos);

export default router