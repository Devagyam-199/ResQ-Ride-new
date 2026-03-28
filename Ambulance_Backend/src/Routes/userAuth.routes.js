import { Router } from "express"
import { verifyTokenController, getMe } from "../Controllers/userAuth.controllers.js"
import jwtVerify from "../Middlewares/jwtVerifier.middlewares.js"

const authRoute = Router()

authRoute.post("/verify", verifyTokenController)
authRoute.get("/user",    jwtVerify, getMe)

export default authRoute