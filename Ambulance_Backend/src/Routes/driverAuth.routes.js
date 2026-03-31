import { Router } from "express"
import driverRegister from "../Controllers/driverAuth.controllers.js"
import uploadDriverDocs from "../Middlewares/multerStorage.middlewares.js"

const driverAuthRoute = Router()

driverAuthRoute.post("/register", uploadDriverDocs, driverRegister)

export default driverAuthRoute;