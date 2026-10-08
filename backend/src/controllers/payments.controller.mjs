import { readRawBody } from '../middleware/validation.middleware.mjs';
import { sendJson } from './response.mjs';

export function createPaymentsController(paymentService) {
  return {
    async handleWebhook({ req, res }) {
      const rawBody = await readRawBody(req);
      const result = paymentService.recordWebhook(rawBody, req.headers['x-mock-provider-signature']);
      sendJson(res, 200, result);
      return true;
    },
  };
}
