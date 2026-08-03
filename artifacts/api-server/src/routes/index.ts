import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clientsRouter from "./clients";
import servicesRouter from "./services";
import materialsRouter from "./materials";
import ordersRouter from "./orders";
import summaryRouter from "./summary";

const router: IRouter = Router();

router.use(healthRouter);
router.use(clientsRouter);
router.use(servicesRouter);
router.use(materialsRouter);
router.use(ordersRouter);
router.use(summaryRouter);

export default router;
