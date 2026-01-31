import { handler_waConnect } from "@/controllers/wa/waConnect";
import { Router } from "express";

const router = Router();

router.post("/connect", handler_waConnect);

export default router;
