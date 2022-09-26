import chai from "chai"
import sinon, { SinonSpy } from "sinon"
import sinonChai from "sinon-chai"
import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import auth_middleware from "../../src/middlewares/auth_middleware"
import { userRepository } from "../../src/data_source"
import { User } from "../../src/entities/User"
import { assert } from "console"

require("dotenv").config()

const expect = chai.expect
chai.use(sinonChai)

describe("auth_middleware", () => {
    let req: Partial<Request>
    let res: Partial<Response>
    const next: NextFunction = () => {}

    // because res.status returns a new instance of res (see below)
    let statusJsonSpy: SinonSpy;
    let statusEndSpy: SinonSpy;

    const sandbox = sinon.createSandbox()
    const user1: User = {
        id: 1,
        username: "user1",
        email: "user1@user1.user1",
        passwordHash: bcrypt.hashSync("1234", 10)
    }

    const reset = function () {
        sinon.restore()
        sandbox.restore()

        req = {}

        statusJsonSpy = sinon.spy();
        statusEndSpy = sinon.spy();
        res = {
            json: sinon.spy(),
            status: (sinon.stub().returns({ 
                json: statusJsonSpy,
                end: statusEndSpy 
            })),
            // because res.status returns a new instance of res
            // so we return a new mock of a Response object with our spy for res.json
        }
    } 
    beforeEach(reset)

    it("should set req.loggedUser to the authenticated user on success", async () => {
        req.headers = {
            authorization: "Bearer " + jwt.sign({ id: 1 }, process.env.JWT_SECRET as string)
        }

        userRepository.findOneBy = sandbox.stub().resolves(user1)

        await auth_middleware.loggedIn(req as Request, res as Response, next)

        expect("loggedUser" in req).to.be.true
        expect((req as any).loggedUser).to.equal(user1)
        expect(userRepository.findOneBy as SinonSpy).to.have.been.calledOnce
    })

    it("should call res.status with 401 if the req.headers.authorization is not set", async () => {
        req.headers = {}
        
        await auth_middleware.loggedIn(req as Request, res as Response, next)

        expect(res.status as SinonSpy).to.have.been.calledOnceWith(401)
    })

    // see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization
    it("should call res.status with 401 if the req.headers.authorization does not use Bearer <auth-scheme>", async () => {
        req.headers = {
            authorization: "Basic " + jwt.sign({ id: 1 }, process.env.JWT_SECRET as string)
        }

        await auth_middleware.loggedIn(req as Request, res as Response, next)

        expect(res.status as SinonSpy).to.have.been.calledOnceWith(401)
    })

    // if the part after Bearer is empty in the header
    it("should call res.status with 401 if there is no token in req.headers.authorization", async () => {
        req.headers = {
            authorization: "Bearer "
        }
        
        await auth_middleware.loggedIn(req as Request, res as Response, next)

        expect(res.status as SinonSpy).to.have.been.calledOnceWith(401)
    })

    it("should call res.status with 401 if the decoded token does not contain an id", async () => {
        req.headers = {
            authorization: "Bearer " + jwt.sign("notAnId", process.env.JWT_SECRET as string)
        }

        await auth_middleware.loggedIn(req as Request, res as Response, next)

        expect(res.status as SinonSpy).to.have.been.calledOnceWith(401)

        reset()
        
        req.headers = {
            authorization: "Bearer " + jwt.sign({ notAnId: 1 }, process.env.JWT_SECRET as string)
        }

        await auth_middleware.loggedIn(req as Request, res as Response, next)

        expect(res.status as SinonSpy).to.have.been.calledOnceWith(401)
    })

    it("should call res.status with 401 if there is no user corresponding to the id in the database", async () => {
        req.headers = {
            authorization: "Bearer " + jwt.sign({ id: 1 }, process.env.JWT_SECRET as string)
        }

        userRepository.findOneBy = sandbox.stub().resolves(null)

        await auth_middleware.loggedIn(req as Request, res as Response, next)

        expect(res.status as SinonSpy).to.have.been.calledOnceWith(401)
    })
})

