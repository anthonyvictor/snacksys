import { handler_deleteChats } from "@/controllers/chat/deleteChats";
import { handler_getChats } from "@/controllers/chat/getChats";
import { Router } from "express";

const router = Router();

router.get("/", handler_getChats);
router.delete("/", handler_deleteChats);

export default router;
