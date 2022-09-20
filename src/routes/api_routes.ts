const express = require('express');
const router = express.Router();
import bug_controller from '../controllers/bug_controller';
import project_controller from '../controllers/project_controller';
import user_controller from '../controllers/user_controller';

// all the routes bellow are prefixed with "/api"

/*** project ***/
router.get('/project', project_controller.getAll);
router.get('/project/:projectId', project_controller.getById);
router.post('/project', project_controller.create);
router.put('/project/:projectId', project_controller.update);
router.delete('/project/:projectId', project_controller.deleteProject);

/*** bug ***/
router.get('/project/:projectId/bug/', bug_controller.getAllBugsByProject);
router.get('/bug/:bugId', bug_controller.getById);
router.post('/project/:projectId/bug', bug_controller.create);
router.put('/bug/:bugId', bug_controller.update);
router.delete('/bug/:bugId', bug_controller.deleteBug);

/***  user ***/
router.get('/user/login', user_controller.login);
router.get('/user/:id', user_controller.getUserById);
router.get('/user', user_controller.getAllUsers);
router.post('/user', user_controller.create);
router.put('/user/:id', user_controller.update);
router.delete('/user/:id', user_controller.deleteUser);

export { router as default };
