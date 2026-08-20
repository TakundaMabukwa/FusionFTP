const logger = require('../utils/logger');

const COLUMNS = [
  'ContactName',
  'EmailAddress',
  'POAddressLine1',
  'POAddressLine2',
  'POAddressLine3',
  'POAddressLine4',
  'POCity',
  'PORegion',
  'POPostalCode',
  'POCountry',
  'InvoiceNumber',
  'Reference',
  'InvoiceDate',
  'DueDate',
  'Total',
  'InventoryItemCode',
  'Description',
  'Quantity',
  'UnitAmount',
  'Discount',
  'AccountCode',
  'TaxType',
  'TaxAmount',
  'TrackingName1',
  'TrackingOption1',
  'Currency',
  'BrandingTheme',
  'EntityID',
  'DocID',
];

const DELIMITER = ';';

function escapeCsvField(value) {
  const str = String(value ?? '');
  if (str.includes(DELIMITER) || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generateCsv(invoices) {
  logger.info('Generating CSV file', { invoiceCount: invoices.length });

  const lines = [];

  lines.push(COLUMNS.join(DELIMITER));

  for (const invoice of invoices) {
    const row = COLUMNS.map((col) => escapeCsvField(invoice[col]));
    lines.push(row.join(DELIMITER));
  }

  const csv = lines.join('\r\n');

  logger.info('CSV file generated successfully', {
    sizeBytes: Buffer.byteLength(csv),
  });

  return Buffer.from(csv, 'utf-8');
}

module.exports = {
  generateCsv,
  COLUMNS,
};
