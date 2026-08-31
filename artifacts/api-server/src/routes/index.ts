import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import healthRouter from "./health";
import clientsRouter from "./clients";
import servicesRouter from "./services";
import materialsRouter from "./materials";
import ordersRouter from "./orders";
import summaryRouter from "./summary";
import companyRouter from "./company";
import checklistRouter from "./checklist";
import orderPhotosRouter from "./order-photos";
import authRouter from "./auth";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(storageRouter);

router.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
});

router.use(clientsRouter);
router.use(servicesRouter);
router.use(materialsRouter);
router.use(ordersRouter);
router.use(summaryRouter);
router.use(companyRouter);
router.use(checklistRouter);
router.use(orderPhotosRouter);

export default router;
