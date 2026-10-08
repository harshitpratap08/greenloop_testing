export function paymentRoutes(paymentsController) {
  return [{ method: 'POST', path: '/api/payments/mock/webhook', middleware: [], controller: paymentsController.handleWebhook }];
}
