import { Router } from "express";
const router = Router();
import { loginUser, registerUser } from "../controllers/user.controller";
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



export default router;