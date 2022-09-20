import chai from "chai"
import sinon, { promise, SinonSpy, SinonStub } from "sinon"
import sinonChai from "sinon-chai"
import { NextFunction, Request, Response } from "express"
import user_controller from "../../src/controllers/user_controller"
import { userRepository } from "../../src/data_source"
import { User } from "../../src/entities/User"
import bcrypt from "bcrypt"

const expect = chai.expect
chai.use(sinonChai)

describe("user_controller", () => {

    let req: Partial<Request>
    let res: Partial<Response>
    const next: NextFunction = () => {}

    // because res.status returns a new instance of res (see below)
    let statusJsonSpy: SinonSpy;
    let statusEndSpy: SinonSpy;

    const sandbox = sinon.createSandbox()
    beforeEach(function () {
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
    })


    describe("login", () => {
        const salt = bcrypt.genSaltSync(10)
        const user1: User = {
            id: 1,
            username: "user",
            email: "user@user.user",
            passwordHash: bcrypt.hashSync("1234", salt)
        }

        it("should call res.json with a loggin message and res.status with 200 on success", async () => {
            req.body = {
                email: "user@user.user",
                password: "1234"
            }

            let expectedResult = {
                message: `${user1.id} logged in`
            }

            userRepository.findOne = sandbox.stub().returns(Promise.resolve(user1))

            await user_controller.login(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(200)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 404 and res.json with an appropriate error message if no user matching the email is found", async () => {
            req.body = {
                email: "user@user.user",
                password: "1234"
            }

            userRepository.findOne = sandbox.stub().returns(Promise.resolve(null))

            await user_controller.login(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(404)
        })

        it("should call res.status with 400 and res.json with an appropriate error message if req.body is missing", async () => {
            req.body = {}
            
            let expectedResult = {
                message: "Body missing."
            }
            
            await user_controller.login(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(400)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 400 and res.json with an appropriate error message if some required keys are mising in the request", async () => {
            req.body = {
                email: "user@user.user",
            }
            
            let expectedResult = {
                message: "Some keys are invalid or missing."
            }
            
            await user_controller.login(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(400)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 400 and res.json with an appropriate error message if req.body contains unallowed keys", async () => {
            req.body = {
                email: "user@user.user",
                password: "1234",
                unvalidKey: true
            }
            
            let expectedResult = {
                message: "Some keys are invalid or missing."
            }
            
            await user_controller.login(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(400)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 400 and res.json with an appropriate error message if req.body.email is not an email", async () => {
            req.body = {
                email: "user.@user",
                password: "1234"
            }

            let expectedResult = {
                message: "Some values are invalid."
            }

            await user_controller.login(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(400)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 400 and res.json with an appropriate error message if req.body.password is not a valid password string ", async () => {
            req.body = {
                email: "user.@user",
                password: true
            }

            let expectedResult = {
                message: "Some values are invalid."
            }

            await user_controller.login(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(400)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 400 and res.json with an appropriate error message if req.body.password does not match the user's password", async () => {
            req.body = {
                email: "user@user.user",
                password: "wrong password"
            }

            let expectedResult = {
                message: "Wrong credentials."
            }

            userRepository.findOne = sandbox.stub().returns(Promise.resolve(user1))

            await user_controller.login(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(400)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })
    })

    describe("getAllUsers", () => {

        it("should call res.json with the array of all users (without password hash for each user) on success", async () => {
            const users: User[] = [
                {
                    id: 1,
                    username: "user1",
                    email: "user1@user1.user1",
                    passwordHash: ""
                },
                {
                    id: 2,
                    username: "user2",
                    email: "user2@user2.user2",
                    passwordHash: ""
                },
                {
                    id: 3,
                    username: "user3",
                    email: "user3@user3.user3",
                    passwordHash: ""
                },
                {
                    id: 4,
                    username: "user4",
                    email: "user4@user4.user4",
                    passwordHash: ""
                },
            ]

            userRepository.find = sandbox.stub().returns(Promise.resolve(users))

            await user_controller.getAllUsers(req as Request, res as Response, next);

            let expectedResult = [...users]
            for(let user of users) {
                delete (user as any).passwordHash
            }

            expect(res.status as SinonStub).to.have.been.calledOnceWith(200)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })
    })

    describe("getUserById", () => {

        it("should call res.json with user data without password hash on success", async () => {
            req.params = {
                id: "1"
            }

            const user: User = {
                id: 1,
                username: "user",
                email: "user@user.user",
                passwordHash: ""
            }

            let expectedResult = {...user}
            delete (expectedResult as any).passwordHash

            userRepository.findOne = sandbox.stub().returns(Promise.resolve(user))

            await user_controller.getUserById(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(200)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 400 if the id is unvalid", async () => {
            req.params = {
                id: "not a number"
            }

            const user: User = {
                id: 1,
                username: "user",
                email: "user@user.user",
                passwordHash: ""
            }

            let expectedResult = {
                message: "Unvalid id"
            }

            userRepository.findOne = sandbox.stub().returns(Promise.resolve(user))

            await user_controller.getUserById(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(400)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 404 if the user is not found in db", async () => {
            req.params = {
                id: "3"
            }

            userRepository.findOne = sandbox.stub().returns(Promise.resolve(null))

            await user_controller.getUserById(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(404)
        })
    })

    describe("create", () => {

        it("should call res.json with createdUser and res.status with 200 on success", async () => {
            req.body = {
                username: "user",
                email: "user@user.user",
                password: "1234",
                password2: "1234"
            }

            let expectedResult = {
                id: 1,
                username: "user",
                email: "user@user.user"
            }

            userRepository.findOneBy = sandbox.stub().resolves(null)

            userRepository.create = sandbox.stub().callsFake((arg) => {
                return Promise.resolve({
                    ...arg,
                    id: 1
                })
            })

            userRepository.save = sandbox.stub().resolves()

            await user_controller.create(req as Request, res as Response, next)

            const controllerHashedPassword = (userRepository.create as SinonStub).getCall(0).args[0].passwordHash
            const passwordHashOk = await bcrypt.compare(req.body.password, controllerHashedPassword)

            expect(passwordHashOk).true
            expect(res.status as SinonStub).to.have.been.calledOnceWith(200)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 400 and res.json with an appropriate error message if req.body is missing", async () => {
            req.body = {}
            
            let expectedResult = {
                message: "Body missing."
            }
            
            await user_controller.create(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(400)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 400 and res.json with an appropriate error message if some required keys are mising in the request", async () => {
            req.body = {
                email: "user@user.user",
                username: "user",
                password: "1234"
            }
            
            let expectedResult = {
                message: "Some keys are invalid or missing."
            }
            
            await user_controller.create(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(400)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 400 and res.json with an appropriate error message if req.body contains unallowed keys", async () => {
            req.body = {
                email: "user@user.user",
                username: "user",
                password: "1234",
                password2: "1234",
                unvalidKey: true
            }
            
            let expectedResult = {
                message: "Some keys are invalid or missing."
            }
            
            await user_controller.create(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(400)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 400 and res.json with an appropriate error message if req.body.email is not an email", async () => {
            req.body = {
                email: "user.user@user",
                username: "user",
                password: "1234",
                password2: "1234"
            }

            let expectedResult = {
                message: "Some values are invalid."
            }

            await user_controller.create(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(400)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 400 and res.json with an appropriate error message if req.body.userame is not a valid username", async () => {
            req.body = {
                email: "user@user.user",
                username: false,
                password: "1234",
                password2: "1234"
            }

            let expectedResult = {
                message: "Some values are invalid."
            }

            await user_controller.create(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(400)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 400 and res.json with an appropriate error message if req.body.password is not a valid password string", async () => {
            req.body = {
                email: "user@user.user",
                username: "user",
                password: false,
                password2: "1234"
            }

            let expectedResult = {
                message: "Some values are invalid."
            }

            await user_controller.create(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(400)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 400 and res.json with an appropriate error message if req.body.password2 is not a valid password string", async () => {
            req.body = {
                email: "user@user.user",
                username: "user",
                password: "1234",
                password2: false
            }

            let expectedResult = {
                message: "Some values are invalid."
            }

            await user_controller.create(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(400)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 400 and res.json with an appropriate error message if req.body.password req.body.password2 don't match", async () => {
            req.body = {
                email: "user@user.user",
                username: "user",
                password: "false",
                password2: "1234"
            }

            let expectedResult = {
                message: "Some values are invalid."
            }

            await user_controller.create(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(400)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 409 and res.json with an appropriate error message if req.body.username already exists", async () => {
            req.body = {
                username: "user",
                email: "user@user.user",
                password: "1234",
                password2: "1234"
            }

            let expectedResult = {
                message: "An account with the provided email already exists."
            }

            userRepository.findOneBy = sandbox.stub().callsFake(({ where }) => {
                if("email" in where) {
                    return Promise.resolve({
                        id: 2,
                        email: "user@user.user",
                        username: "user2"
                    })
                }
                else {
                    return Promise.resolve(null)
                }
            })

            await user_controller.create(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(409)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 409 and res.json with an appropriate error message if req.body.email already exists", async () => {
            req.body = {
                username: "user",
                email: "user@user.user",
                password: "1234",
                password2: "1234"
            }

            let expectedResult = {
                message: "Username is not available."
            }

            userRepository.findOneBy = sandbox.stub().callsFake(({ where }) => {
                if("username" in where) {
                    return Promise.resolve({
                        id: 2,
                        email: "user2@user2.user2",
                        username: "user"
                    })
                }
                else {
                    return Promise.resolve(null)
                }
            })

            await user_controller.create(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(409)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })
    })

    describe("update", () => {
        it("should call res.json with updatedUser and res.status with 200 on success", async () => {
            req.params = {
                id: "1"
            }
            req.body = {
                username: "user1",
                email: "user1@user1.user1",
                password: "12345",
                password2: "12345"
            }

            const user: User = {
                id: 1,
                username: "user",
                email: "user@user.user",
                passwordHash: ""
            }

            const expectedResult = {
                id: 1,
                username: "user1",
                email: "user1@user1.user1"
            }

            userRepository.findOneBy = sandbox.stub().callsFake(({ id, where }) => {
                if(id != null || "id" in where) {
                    return Promise.resolve(user)
                }

                return Promise.resolve(null)
            })

            userRepository.merge = sandbox.stub().callsFake((original, modifications) => {
                for(let [key, value] of Object.entries(modifications)) {
                    switch(key) {
                        case "id":
                            (original.id as any) = value
                            break;
                        case "username":
                            (original.username as any) = value
                            break;
                        case "email":
                            (original.email as any) = value
                            break;
                        case "passwordHash":
                            (original.passwordHash as any) = value
                            break;
                    }
                }
            })

            userRepository.save = sandbox.stub().resolvesArg(0)

            await user_controller.update(req as Request, res as Response, next)

            const controllerHashedPassword = (userRepository.merge as SinonStub).getCall(0).args[1].passwordHash
            const passwordHashOk = await bcrypt.compare(req.body.password, controllerHashedPassword)

            expect(passwordHashOk).true
            expect(res.status as SinonStub).to.have.been.calledOnceWith(200)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 400 if the id is unvalid", async () => {
            req.params = {
                id: "not a number"
            }

            let expectedResult = {
                message: "Unvalid id"
            }

            await user_controller.update(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(400)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 404 if the user is not found in db", async () => {
            req.params = {
                id: "1"
            }
            req.body = {
                username: "user1",
                email: "user1@user1.user1",
                password: "12345",
                password2: "12345"
            }

            userRepository.findOneBy = sandbox.stub().resolves(null)

            await user_controller.update(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(404)
        })

        it("should call res.status with 400 and res.json with an appropriate error message if req.body is missing", async () => {
            req.params = {
                id: "1"
            }

            let expectedResult = {
                message: "Body missing."
            }

            await user_controller.update(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(400)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 400 and res.json with an appropriate error message if req.body contains unallowed keys", async () => {
            req.params = {
                id: "1"
            }
            req.body = {
                username: "user1",
                email: "user1@user1.user1",
                notAValidKey: true
            }

            let expectedResult = {
                message: "Some keys are not allowed or missing."
            }

            await user_controller.update(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(400)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 400 and res.json with an appropriate error message if req.body.email is not an email", async () => {
            req.params = {
                id: "1"
            }
            req.body = {
                username: "user1",
                email: "user1@user1.user1@@@@@",
            }

            let expectedResult = {
                message: "Some values are invalid."
            }

            await user_controller.update(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(400)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult) 
        })

        it("should call res.status with 400 and res.json with an appropriate error message if req.body.userame is not a valid username", async () => {
            req.params = {
                id: "1"
            }
            req.body = {
                username: false,
                email: "user1@user1.user1",
            }

            let expectedResult = {
                message: "Some values are invalid."
            }

            await user_controller.update(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(400)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 400 and res.json with an appropriate error message if req.body.password is not a valid password string", async () => {
            req.params = {
                id: "1"
            }
            req.body = {
                username: "user1",
                email: "user1@user1.user1",
                password: 12345,
                password2: "12345"
            }

            let expectedResult = {
                message: "Some values are invalid."
            }

            await user_controller.update(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(400)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 400 and res.json with an appropriate error message if req.body.password2 is not a valid password string", async () => {
            req.params = {
                id: "1"
            }
            req.body = {
                username: "user1",
                email: "user1@user1.user1",
                password: "12345",
                password2: 12345
            }

            let expectedResult = {
                message: "Some values are invalid."
            }

            await user_controller.update(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(400)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 400 and res.json with an appropriate error message if req.body.password is provided without req.body.password2", async () => {
            req.params = {
                id: "1"
            }
            req.body = {
                password: "12345"
            }

            let expectedResult = {
                message: "Some keys are not allowed or missing."
            }

            await user_controller.update(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(400)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 400 and res.json with an appropriate error message if req.body.password2 is provided without req.body.password", async () => {
            req.params = {
                id: "1"
            }
            req.body = {
                password2: "12345"
            }

            let expectedResult = {
                message: "Some keys are not allowed or missing."
            }

            await user_controller.update(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(400)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 400 and res.json with an appropriate error message if req.body.password req.body.password2 don't match", async () => {
            req.params = {
                id: "1"
            }
            req.body = {
                password: "not matching",
                password2: "12345"
            }

            let expectedResult = {
                message: "Some values are invalid."
            }

            await user_controller.update(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(400)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 409 and res.json with an appropriate error message if req.body.username already exists", async () => {
            req.params = {
                id: "1"
            }
            req.body = {
                username: "user"
            }

            let expectedResult = {
                message: "An account with the provided username already exists."
            }

            userRepository.findOneBy = sandbox.stub().callsFake(({ id, where }) => {
                if(id != null || "id" in where) {
                    return Promise.resolve({

                    })
                }
                else if("username" in where) {
                    return Promise.resolve({
                        id: 2,
                        email: "user2@user2.user2",
                        username: "user"
                    })
                }
                else {
                    return Promise.resolve(null)
                }
            })

            await user_controller.update(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(409)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 409 and res.json with an appropriate error message if req.body.email already exists", async () => {
            req.params = {
                id: "1"
            }
            req.body = {
                email: "user2@user2.user2"
            }

            let expectedResult = {
                message: "An account with the provided email already exists."
            }

            userRepository.findOneBy = sandbox.stub().callsFake(({ id, where }) => {
                if(id != null || "id" in where) {
                    return Promise.resolve({

                    })
                }
                else if("email" in where) {
                    return Promise.resolve({
                        id: 2,
                        email: "user2@user2.user2",
                        username: "user2"
                    })
                }
                else {
                    return Promise.resolve(null)
                }
            })

            await user_controller.update(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(409)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })
    })

    describe("deleteUser", () => {

        it("should call res.status with 200 on success", async () => {
            req.params = {
                id: "1"
            }

            const user: User = {
                id: 1,
                username: "user",
                email: "user@user.user",
                passwordHash: ""
            }

            userRepository.findOne = sandbox.stub().returns(Promise.resolve(user))

            userRepository.delete = sandbox.stub().resolves()

            await user_controller.deleteUser(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(200)
        })

        it("should call res.status with 400 if the id is unvalid", async () => {
            req.params = {
                id: "not a number"
            }

            let expectedResult = {
                message: "Unvalid id"
            }

            await user_controller.deleteUser(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(400)
            expect(statusJsonSpy).to.have.been.calledOnceWith(expectedResult)
        })

        it("should call res.status with 404 if the user is not found in db", async () => {
            req.params = {
                id: "3"
            }

            userRepository.findOne = sandbox.stub().returns(Promise.resolve(null))
            userRepository.findOneBy = sandbox.stub().returns(Promise.resolve(null))

            await user_controller.deleteUser(req as Request, res as Response, next)

            expect(res.status as SinonStub).to.have.been.calledOnceWith(404)
        })
    })
})