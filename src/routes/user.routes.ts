import { Router } from "express";
const router = Router();
import { loginUser, logoutUser, refreshAcessTOken, registerUser } from "../controllers/user.controller";
import { upload } from "../middlewares/multer.middleware";


router.route("/register").post(upload.fields(
    [
        {
         name:"avatar",
         maxCount:1
        },{
            name:"coverImage",
            maxCount:1
        }
    ]
),registerUser);

router.route('/login').post(loginUser)
router.route('/temp').post(refreshAcessTOken)
router.route('/logout').post(logoutUser)



export default router;