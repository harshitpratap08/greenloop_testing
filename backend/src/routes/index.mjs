import { authRoutes } from './auth.routes.mjs';
import { datasetRoutes } from './dataset.routes.mjs';
import { actionRoutes } from './actions.routes.mjs';
import { uploadRoutes } from './uploads.routes.mjs';

export function createRoutes({ authController, datasetController, actionsController, uploadsController, requireAuth, systemController }) {
  return [
    { method: 'GET', path: '/api/health', middleware: [], controller: systemController.health },
    ...authRoutes(authController),
    ...datasetRoutes(datasetController, requireAuth),
    ...actionRoutes(actionsController, requireAuth),
    ...uploadRoutes(uploadsController, requireAuth),
    { method: '*', path: '/api/*', middleware: [requireAuth], controller: () => false },
  ];
}
