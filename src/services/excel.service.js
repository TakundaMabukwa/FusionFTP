const ExcelJS = require('exceljs');
const logger = require('../utils/logger');

const COLUMNS = [
  { header: 'ContactName', key: 'ContactName', width: 30 },
  { header: 'EmailAddress', key: 'EmailAddress', width: 30 },
  { header: 'POAddressLine1', key: 'POAddressLine1', width: 25 },
  { header: 'POAddressLine2', key: 'POAddressLine2', width: 25 },
  { header: 'POAddressLine3', key: 'POAddressLine3', width: 25 },
  { header: 'POAddressLine4', key: 'POAddressLine4', width: 15 },
  { header: 'POCity', key: 'POCity', width: 20 },
  { header: 'PORegion', key: 'PORegion', width: 15 },
  { header: 'POPostalCode', key: 'POPostalCode', width: 15 },
  { header: 'POCountry', key: 'POCountry', width: 15 },
  { header: 'InvoiceNumber', key: 'InvoiceNumber', width: 20 },
  { header: 'Reference', key: 'Reference', width: 20 },
  { header: 'InvoiceDate', key: 'InvoiceDate', width: 15 },
  { header: 'DueDate', key: 'DueDate', width: 15 },
  { header: 'Total', key: 'Total', width: 15 },
  { header: 'InventoryItemCode', key: 'InventoryItemCode', width: 20 },
  { header: 'Description', key: 'Description', width: 40 },
  { header: 'Quantity', key: 'Quantity', width: 10 },
  { header: 'UnitAmount', key: 'UnitAmount', width: 15 },
  { header: 'Discount', key: 'Discount', width: 10 },
  { header: 'AccountCode', key: 'AccountCode', width: 12 },
  { header: 'TaxType', key: 'TaxType', width: 12 },
  { header: 'TaxAmount', key: 'TaxAmount', width: 15 },
  { header: 'TrackingName1', key: 'TrackingName1', width: 15 },
  { header: 'TrackingOption1', key: 'TrackingOption1', width: 15 },
  { header: 'Currency', key: 'Currency', width: 10 },
  { header: 'BrandingTheme', key: 'BrandingTheme', width: 15 },
  { header: 'EntityID', key: 'EntityID', width: 10 },
  { header: 'DocID', key: 'DocID', width: 10 },
];

async function generateExcel(invoices) {
  logger.info('Generating Excel file', { invoiceCount: invoices.length });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Solflo FTP Fusion';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Invoices');

  sheet.columns = COLUMNS;

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  invoices.forEach((invoice) => {
    sheet.addRow(invoice);
  });

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell, colNumber) => {
        const col = COLUMNS[colNumber - 1];
        if (col && (col.key === 'Total' || col.key === 'UnitAmount' || col.key === 'TaxAmount')) {
          cell.numFmt = '#,##0.00';
        }
      });
    }
  });

  sheet.autoFilter = {
    from: 'A1',
    to: `A${invoices.length + 1}`,
  };

  const buffer = await workbook.xlsx.writeBuffer();

  logger.info('Excel file generated successfully', {
    sizeBytes: buffer.length,
  });

  return buffer;
}

module.exports = {
  generateExcel,
};
