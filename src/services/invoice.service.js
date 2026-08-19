const supabaseService = require('./supabase.service');
const excelService = require('./excel.service');
const sftpService = require('./sftp.service');
const { formatFilenameDate } = require('../utils/date');
const logger = require('../utils/logger');

async function exportNextInvoices(invoiceNumber) {
  const startTime = Date.now();

  if (invoiceNumber) {
    logger.info('Starting single-invoice export', { invoiceNumber });

    const invoices = await supabaseService.fetchSingleInvoice(invoiceNumber);

    if (invoices.length === 0) {
      logger.info('Invoice not found', { invoiceNumber });
      return {
        success: true,
        invoiceCount: 0,
        filename: null,
        message: `Invoice ${invoiceNumber} not found`,
      };
    }

    const excelBuffer = await excelService.generateExcel(invoices);

    const now = new Date();
    const filename = `invoice_${invoiceNumber}_${formatFilenameDate(now)}.xlsx`;

    const uploadResult = await sftpService.uploadToSFTP(excelBuffer, filename);

    const duration = Date.now() - startTime;

    logger.info('Single-invoice export completed', {
      invoiceNumber,
      filename,
      duration,
    });

    return {
      success: true,
      invoiceCount: 1,
      invoiceNumber,
      filename,
      remotePath: uploadResult.remotePath,
      sizeBytes: uploadResult.sizeBytes,
      duration,
    };
  }

  const lastInvoiceNumber = await supabaseService.getLastExportedInvoiceNumber();
  const startFrom = lastInvoiceNumber + 1;

  logger.info('Starting sequence-based export', {
    lastInvoiceNumber,
    startFrom,
  });

  const invoices = await supabaseService.fetchInvoicesFrom(startFrom);

  if (invoices.length === 0) {
    logger.info('No new invoices to export', { startFrom });
    return {
      success: true,
      invoiceCount: 0,
      filename: null,
      message: `No invoices found after number ${lastInvoiceNumber}`,
      lastInvoiceNumber,
    };
  }

  const invoiceNumbers = invoices.map((inv) => parseInt(inv.InvoiceNumber, 10));
  const maxInvoiceNumber = Math.max(...invoiceNumbers);

  const excelBuffer = await excelService.generateExcel(invoices);

  const now = new Date();
  const filename = `invoice_${formatFilenameDate(now)}_batch.xlsx`;

  const uploadResult = await sftpService.uploadToSFTP(excelBuffer, filename);

  await supabaseService.logExport(maxInvoiceNumber, invoices.length, filename);

  const duration = Date.now() - startTime;

  logger.info('Sequence-based export completed', {
    invoiceCount: invoices.length,
    minInvoice: Math.min(...invoiceNumbers),
    maxInvoice: maxInvoiceNumber,
    filename,
    duration,
  });

  return {
    success: true,
    invoiceCount: invoices.length,
    minInvoice: Math.min(...invoiceNumbers),
    maxInvoice: maxInvoiceNumber,
    filename,
    remotePath: uploadResult.remotePath,
    sizeBytes: uploadResult.sizeBytes,
    duration,
  };
}

module.exports = {
  exportNextInvoices,
};
