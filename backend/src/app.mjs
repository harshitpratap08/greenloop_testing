import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './database/openDatabase.mjs';
import { ApiError, requireThat } from './validation.mjs';
import { createDatasetModel } from './models/dataset.model.mjs';
import { createSessionModel } from './models/session.model.mjs';
import { createUploadModel } from './models/upload.model.mjs';
import { createUserModel } from './models/user.model.mjs';
import { requireAuthentication } from './middleware/auth.middleware.mjs';
import { createSecurityMiddleware } from './middleware/security.middleware.mjs';
import { createActionService } from './services/action.service.mjs';
import { createAuthService } from './services/auth.service.mjs';
import { createDatasetService } from './services/dataset.service.mjs';
import { createUploadService } from './services/upload.service.mjs';
import { createActionsController } from './controllers/actions.controller.mjs';
import { createAuthController } from './controllers/auth.controller.mjs';
import { createDatasetController } from './controllers/dataset.controller.mjs';
import { createSystemController } from './controllers/system.controller.mjs';
import { createUploadsController } from './controllers/uploads.controller.mjs';
import { createRoutes } from './routes/index.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function matchRoute(route, method, path) {
  if (route.method !== '*' && route.method !== method) return null;
  if (route.path.endsWith('/*')) return path.startsWith(route.path.slice(0, -1)) ? {} : null;
  const names = [];
  const pattern = route.path.split('/').map(segment => {
    if (!segment.startsWith(':')) return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    names.push(segment.slice(1));
    return '([^/]+)';
  }).join('/');
  const matched = new RegExp(`^${pattern}$`).exec(path);
  if (!matched) return null;
  return Object.fromEntries(names.map((name, index) => [name, matched[index + 1]]));
}

function serveFrontend(req, res, path) {
  requireThat(['GET', 'HEAD'].includes(req.method), 'Method not allowed.', 405);
  const dist = resolve(root, 'frontend/dist');
  const requested = resolve(dist, `.${decodeURIComponent(path)}`);
  requireThat(requested.startsWith(dist + '/') || requested.startsWith(dist + '\\') || requested === dist, 'Invalid path.', 400);
  const staticFile = Boolean(extname(requested));
  if (staticFile) requireThat(existsSync(requested) && statSync(requested).isFile(), 'File not found.', 404);
  const file = staticFile ? requested : resolve(dist, 'index.html');
  requireThat(existsSync(file), 'Build the frontend with npm run build, or run npm run dev.', 404);
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp4': 'video/mp4' }[extname(file)] ?? 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': file.endsWith('index.html') ? 'no-cache' : 'public, max-age=3600' });
  res.end(req.method === 'HEAD' ? undefined : readFileSync(file));
}

export function createBackend(options = {}) {
  const production = process.env.NODE_ENV === 'production';
  requireThat(!production || process.env.PUBLIC_ORIGIN?.startsWith('https://'), 'Set an HTTPS PUBLIC_ORIGIN for production.', 500);
  const dataDir = options.dataDir ?? resolve(root, 'server/data');
  const db = openDatabase(dataDir);
  const datasetModel = createDatasetModel(db);
  const sessionModel = createSessionModel(db);
  const uploadModel = createUploadModel(db);
  const userModel = createUserModel(db);
  datasetModel.initialize();

  const datasetService = createDatasetService({ datasetModel, userModel });
  const authService = createAuthService({ userModel, sessionModel, datasetModel, dataDir, production });
  const actionService = createActionService({ datasetModel, datasetService, userModel, uploadModel });
  const uploadService = createUploadService({ uploadModel, datasetService });
  const requireAuth = requireAuthentication(authService);
  const authController = createAuthController(authService);
  const datasetController = createDatasetController(datasetService);
  const actionsController = createActionsController(actionService);
  const uploadsController = createUploadsController(uploadService);
  const systemController = createSystemController();
  const routes = createRoutes({ authController, datasetController, actionsController, uploadsController, requireAuth, systemController });
  const allowedOrigins = new Set(options.origins ?? (production ? [process.env.PUBLIC_ORIGIN] : [process.env.PUBLIC_ORIGIN ?? 'http://localhost:5173', 'http://localhost:3001', 'http://localhost:4173', 'http://localhost:5199']));
  const security = createSecurityMiddleware({ allowedOrigins });

  const server = createServer(async (req, res) => {
    let path;
    try {
      const url = new URL(req.url, 'http://localhost');
      path = url.pathname;
      security.apply(req, res);
      for (const route of routes) {
        const params = matchRoute(route, req.method, path);
        if (params === null) continue;
        const context = { req, res, path, url, params, user: undefined };
        for (const middleware of route.middleware) await middleware(req, res, context);
        if (await route.controller(context)) return;
        break;
      }
      if (path.startsWith('/api/')) throw new ApiError(404, 'API endpoint not found.');
      serveFrontend(req, res, path);
    } catch (error) {
      if (!res.headersSent) {
        const status = error.status ?? 500;
        const message = error.status ? error.message : 'An unexpected server error occurred.';
        res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify({ error: message }));
      } else {
        res.end();
      }
      if (!error.status) console.error(error);
    }
  });
  server.on('close', () => db.close());
  return server;
}
