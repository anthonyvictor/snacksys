import { handler_receivedMessage } from "@/controllers/msg/receivedMessage";
import { Router } from "express";

const router = Router();

router.post("/", handler_receivedMessage);

export default router;
