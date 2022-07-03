const express = require('express');
const router = express.Router();
import project_controller from '../controllers/project_controller';

/*** project ***/
router.get('/project', project_controller.getAll);
router.get('/project/:projectId', project_controller.getById);
router.post('/project', project_controller.create);
router.put('/project/:projectId', project_controller.update);
router.delete('/project/:projectId', project_controller.deleteProject);

/*** bug ***/



export { router as default };