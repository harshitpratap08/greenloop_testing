export function datasetRoutes(datasetController, requireAuth) {
  return [
    { method: 'GET', path: '/api/dataset', middleware: [requireAuth], controller: datasetController.get },
    { method: 'PATCH', path: '/api/profile', middleware: [requireAuth], controller: datasetController.updateProfile },
  ];
}
