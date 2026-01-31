import { Router } from "express";
import wa from "./wa";
import msg from "./msg";
import chat from "./chat";
// import cloudinary from '@/routes/cloudinary.routes'

const router = Router();

router.use("/wa", wa);
router.use("/msg", msg);
router.use("/chat", chat);
// router.use('/cloudinary', cloudinary)

export default router;
