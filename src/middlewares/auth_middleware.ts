import { Request, Response, NextFunction } from "express"
import jwt, { JsonWebTokenError } from "jsonwebtoken"
import { userRepository } from "../data_source";

const loggedIn = async (req: Request, res: Response, next: NextFunction) => {
    if (
        req.headers.authorization && 
        req.headers.authorization.startsWith('Bearer')
    ) {

        try {
            // Get token from header
            const token = req.headers.authorization.split(' ')[1]

            if(token == null) {
                res.status(401).end()
                return
            }

            // Verify token
            if(process.env.JWT_SECRET == null) {
                res.status(401).end()
                return
            }

            const decodedToken = jwt.verify(token, process.env.JWT_SECRET)

            if (
                decodedToken == null ||
                !(decodedToken instanceof Object) ||
                !("id" in (decodedToken as any)) 
            ) 
            {
                res.status(401).end()
                return
            }

            const user = await userRepository.findOneBy({ id: (decodedToken as any).id })
            if(user == null) {
                res.status(401).end()
                return
            }

            //@ts-ignore 
            req.loggedUser = user

            next()

        } catch(err) {
            console.log(err)
            if(err instanceof JsonWebTokenError) {
                res.status(401).end()
                return
            }
            res.status(500).end()
        }
    }
    else {
        res.status(401).end()
    }
}

export default {
    loggedIn
}