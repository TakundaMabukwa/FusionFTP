const invoiceService = require('../services/invoice.service');
const logger = require('../utils/logger');

async function exportNextInvoices(req, res, next) {
  try {
    const { invoiceNumber } = req.body;
    const result = await invoiceService.exportNextInvoices(invoiceNumber);

    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  exportNextInvoices,
};
