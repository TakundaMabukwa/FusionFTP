const cron = require('node-cron');
const app = require('./app');
const config = require('./config/env');
const invoiceService = require('./services/invoice.service');
const logger = require('./utils/logger');

cron.schedule(config.cron.schedule, async () => {
  logger.info('Cron job triggered: exporting next batch of invoices');
  try {
    await invoiceService.exportNextInvoices();
    logger.info('Cron job completed successfully');
  } catch (error) {
    logger.error('Cron job failed', { error: error.message });
  }
});

app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`, {
    env: config.nodeEnv,
  });
});
