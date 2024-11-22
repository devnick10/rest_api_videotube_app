import { Router } from "express";
import isAuthenticated from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
import {
    deleteVideo,
     getAllVideos, 
     getVideoById, 
     publishAVideo,
     togglePublishStatus,
     updateVideo,
    } from "../controllers/video.controller";
const router = Router();


router.route("/all").get(isAuthenticated,getAllVideos)
router.route("/publish").post(isAuthenticated,upload.fields(
    [
        {
            name:"video",
            maxCount:1
        },
        {
            name:"thumbnail",
            maxCount:1
        },
    ]
),publishAVideo);

router.route("/:videoId")
.get(isAuthenticated,getVideoById)
.delete(isAuthenticated,deleteVideo)
.patch(isAuthenticated,togglePublishStatus);

router.route("/update/:videoId").patch(isAuthenticated,upload.single("thumbnail"),updateVideo);



export default router;