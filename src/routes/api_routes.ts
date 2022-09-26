const express = require('express');
const router = express.Router();
import bug_controller from '../controllers/bug_controller';
import project_controller from '../controllers/project_controller';
import user_controller from '../controllers/user_controller';
import auth_middleware from '../middlewares/auth_middleware';

// all the routes bellow are prefixed with "/api", see index.ts

/*** project ***/
router.get('/project', project_controller.getAll);
router.get('/project/:projectId', project_controller.getById);
router.post('/project', auth_middleware.loggedIn, project_controller.create);
router.put('/project/:projectId', auth_middleware.loggedIn, project_controller.update);
router.delete('/project/:projectId', auth_middleware.loggedIn, project_controller.deleteProject);

/*** bug ***/
router.get('/project/:projectId/bug/', bug_controller.getAllBugsByProject);
router.get('/bug/:bugId', bug_controller.getById);
router.post('/project/:projectId/bug', auth_middleware.loggedIn, bug_controller.create);
router.put('/bug/:bugId', auth_middleware.loggedIn, bug_controller.update);
router.delete('/bug/:bugId', auth_middleware.loggedIn, bug_controller.deleteBug);

/***  user ***/
router.post('/user/login', user_controller.login);
router.get('/user/:id', user_controller.getUserById);
router.get('/user', user_controller.getAllUsers);
router.post('/user', user_controller.create);
router.put('/user/:id', auth_middleware.loggedIn, user_controller.update);
router.delete('/user/:id', auth_middleware.loggedIn, user_controller.deleteUser);

export { router as default };
