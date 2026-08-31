import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clientsRouter from "./clients";
import servicesRouter from "./services";
import materialsRouter from "./materials";
import ordersRouter from "./orders";
import summaryRouter from "./summary";
import companyRouter from "./company";
import checklistRouter from "./checklist";

const router: IRouter = Router();

router.use(healthRouter);
router.use(clientsRouter);
router.use(servicesRouter);
router.use(materialsRouter);
router.use(ordersRouter);
router.use(summaryRouter);
router.use(companyRouter);
router.use(checklistRouter);

export default router;
