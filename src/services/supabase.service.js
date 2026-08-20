const { createClient } = require('@supabase/supabase-js');
const config = require('../config/env');
const logger = require('../utils/logger');

const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey
);

async function getLastExportedInvoiceNumber() {
  const { data, error } = await supabase
    .from('invoice_export_log')
    .select('last_invoice_number')
    .order('exported_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      logger.warn('No export log found, starting from invoice 0');
      return 0;
    }
    logger.error('Failed to fetch export log', { error: error.message });
    throw new Error(`Failed to fetch export log: ${error.message}`);
  }

  return data.last_invoice_number;
}

async function logExport(lastInvoiceNumber, invoiceCount, filename) {
  const { error } = await supabase
    .from('invoice_export_log')
    .insert({
      last_invoice_number: lastInvoiceNumber,
      invoice_count: invoiceCount,
      filename,
      exported_at: new Date().toISOString(),
    });

  if (error) {
    logger.error('Failed to log export', { error: error.message });
    throw new Error(`Failed to log export: ${error.message}`);
  }

  logger.info('Export logged', { lastInvoiceNumber, invoiceCount, filename });
}

async function fetchInvoicesFrom(startInvoiceNumber) {
  logger.info('Fetching invoices from number', { startInvoiceNumber });

  const { data: costCenters, error: costError } = await supabase
    .from('cost_centers')
    .select('cost_code, company, email, physical_address_1, physical_address_2, physical_address_3, physical_area, physical_code')
    .not('cost_code', 'is', null)
    .order('id', { ascending: true });

  if (costError) {
    logger.error('Failed to fetch cost centers', { error: costError.message });
    throw new Error(`Failed to fetch cost centers: ${costError.message}`);
  }

  const costMap = new Map();
  for (const cc of costCenters) {
    if (!costMap.has(cc.cost_code)) {
      costMap.set(cc.cost_code, cc);
    }
  }

  let results = [];

  const { data: accountInvoices, error: aiError } = await supabase
    .from('account_invoices')
    .select('*')
    .gt('invoice_number', startInvoiceNumber)
    .order('invoice_number', { ascending: true });

  if (aiError) {
    logger.error('Failed to fetch account_invoices', { error: aiError.message });
    throw new Error(`Failed to fetch account_invoices: ${aiError.message}`);
  }

  for (const ai of accountInvoices || []) {
    const cost = costMap.get(ai.account_number);
    const lineItems = ai.line_items || [];

    const total = lineItems.reduce((sum, li) => {
      return sum + parseFloat(
        li.total_including_vat || li.total_incl_vat || li.totalIncl || li.total_incl || li.total_amount || 0
      );
    }, 0);

    const unitAmount = lineItems.reduce((sum, li) => {
      return sum + parseFloat(
        li.unit_price_without_vat || li.amountExcludingVat || li.total_excl_vat || li.unitPrice || li.unit_price || 0
      );
    }, 0);

    const taxAmount = lineItems.reduce((sum, li) => {
      return sum + parseFloat(li.vat_amount || li.vatAmount || 0);
    }, 0);

    const description = lineItems.length > 0
      ? lineItems.map(li => `${li.description || li.item_code || 'Item'} x${li.quantity || li.units || '1'}`).join(' | ')
      : 'Subscription/Rental';

    const invoiceDate = new Date(ai.invoice_date);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);

    results.push({
      ContactName: cost?.company || '',
      EmailAddress: cost?.email || '',
      POAddressLine1: cost?.physical_address_1 || '',
      POAddressLine2: cost?.physical_address_2 || '',
      POAddressLine3: cost?.physical_address_3 || '',
      POAddressLine4: '',
      POCity: cost?.physical_area || '',
      PORegion: '',
      POPostalCode: cost?.physical_code || '',
      POCountry: 'South Africa',
      InvoiceNumber: ai.invoice_number,
      Reference: ai.account_number,
      InvoiceDate: `${String(invoiceDate.getDate()).padStart(2, '0')}/${String(invoiceDate.getMonth() + 1).padStart(2, '0')}/${invoiceDate.getFullYear()}`,
      DueDate: `${String(dueDate.getDate()).padStart(2, '0')}/${String(dueDate.getMonth() + 1).padStart(2, '0')}/${dueDate.getFullYear()}`,
      Total: Math.round(total * 100) / 100,
      InventoryItemCode: '',
      Description: description,
      Quantity: 1,
      UnitAmount: Math.round(unitAmount * 100) / 100,
      Discount: 0,
      AccountCode: '200',
      TaxType: 'OUTPUT2',
      TaxAmount: Math.round(taxAmount * 100) / 100,
      TrackingName1: '',
      TrackingOption1: '',
      Currency: 'ZAR',
      BrandingTheme: '',
      EntityID: '',
      DocID: '',
    });
  }

  const { data: invoices, error: invError } = await supabase
    .from('invoices')
    .select('*')
    .gt('invoice_number', startInvoiceNumber)
    .order('invoice_number', { ascending: true });

  if (invError) {
    logger.error('Failed to fetch invoices', { error: invError.message });
    throw new Error(`Failed to fetch invoices: ${invError.message}`);
  }

  for (const inv of invoices || []) {
    const cost = costMap.get(inv.account_number);
    const lineItems = inv.line_items || [];

    const total = lineItems.reduce((sum, li) => {
      return sum + parseFloat(
        li.total_incl || li.total_incl_vat || li.total_including_vat || li.totalIncl || li.total_amount || 0
      );
    }, 0);

    const unitAmount = lineItems.reduce((sum, li) => {
      return sum + parseFloat(
        li.unit_price_without_vat || li.amountExcludingVat || li.total_excl_vat || li.unitPrice || (parseFloat(li.unit_price) * parseFloat(li.quantity || 1)) || 0
      );
    }, 0);

    const taxAmount = lineItems.reduce((sum, li) => {
      return sum + parseFloat(li.vat_amount || li.vatAmount || 0);
    }, 0);

    const description = lineItems.length > 0
      ? lineItems.map(li => `${li.description || li.item_code || 'Item'} x${li.quantity || li.units || '1'}`).join(' | ')
      : inv.client_name;

    const invoiceDate = new Date(inv.invoice_date);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);

    results.push({
      ContactName: cost?.company || inv.client_name || '',
      EmailAddress: cost?.email || '',
      POAddressLine1: cost?.physical_address_1 || '',
      POAddressLine2: cost?.physical_address_2 || '',
      POAddressLine3: cost?.physical_address_3 || '',
      POAddressLine4: '',
      POCity: cost?.physical_area || '',
      PORegion: '',
      POPostalCode: cost?.physical_code || '',
      POCountry: 'South Africa',
      InvoiceNumber: inv.invoice_number,
      Reference: inv.account_number,
      InvoiceDate: `${String(invoiceDate.getDate()).padStart(2, '0')}/${String(invoiceDate.getMonth() + 1).padStart(2, '0')}/${invoiceDate.getFullYear()}`,
      DueDate: `${String(dueDate.getDate()).padStart(2, '0')}/${String(dueDate.getMonth() + 1).padStart(2, '0')}/${dueDate.getFullYear()}`,
      Total: Math.round(total * 100) / 100,
      InventoryItemCode: '',
      Description: description,
      Quantity: 1,
      UnitAmount: Math.round(unitAmount * 100) / 100,
      Discount: 0,
      AccountCode: '200',
      TaxType: 'OUTPUT2',
      TaxAmount: Math.round(taxAmount * 100) / 100,
      TrackingName1: '',
      TrackingOption1: '',
      Currency: 'ZAR',
      BrandingTheme: '',
      EntityID: '',
      DocID: '',
    });
  }

  results.sort((a, b) => {
    const numA = parseInt(a.InvoiceNumber, 10) || 0;
    const numB = parseInt(b.InvoiceNumber, 10) || 0;
    return numA - numB;
  });

  logger.info('Batch invoices fetched', { count: results.length });
  return results;
}

async function fetchSingleInvoice(invoiceNumber) {
  logger.info('Fetching single invoice', { invoiceNumber });

  const { data: costCenters, error: costError } = await supabase
    .from('cost_centers')
    .select('cost_code, company, email, physical_address_1, physical_address_2, physical_address_3, physical_area, physical_code')
    .not('cost_code', 'is', null)
    .order('id', { ascending: true });

  if (costError) {
    logger.error('Failed to fetch cost centers', { error: costError.message });
    throw new Error(`Failed to fetch cost centers: ${costError.message}`);
  }

  const costMap = new Map();
  for (const cc of costCenters) {
    if (!costMap.has(cc.cost_code)) {
      costMap.set(cc.cost_code, cc);
    }
  }

  let results = [];

  const { data: accountInvoices, error: aiError } = await supabase
    .from('account_invoices')
    .select('*')
    .eq('invoice_number', invoiceNumber);

  if (aiError) {
    logger.error('Failed to fetch account_invoices', { error: aiError.message });
    throw new Error(`Failed to fetch account_invoices: ${aiError.message}`);
  }

  for (const ai of accountInvoices || []) {
    const cost = costMap.get(ai.account_number);
    const lineItems = ai.line_items || [];

    const total = lineItems.reduce((sum, li) => {
      return sum + parseFloat(
        li.total_including_vat || li.total_incl_vat || li.totalIncl || li.total_incl || li.total_amount || 0
      );
    }, 0);

    const unitAmount = lineItems.reduce((sum, li) => {
      return sum + parseFloat(
        li.unit_price_without_vat || li.amountExcludingVat || li.total_excl_vat || li.unitPrice || li.unit_price || 0
      );
    }, 0);

    const taxAmount = lineItems.reduce((sum, li) => {
      return sum + parseFloat(li.vat_amount || li.vatAmount || 0);
    }, 0);

    const description = lineItems.length > 0
      ? lineItems.map(li => `${li.description || li.item_code || 'Item'} x${li.quantity || li.units || '1'}`).join(' | ')
      : 'Subscription/Rental';

    const invoiceDate = new Date(ai.invoice_date);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);

    results.push({
      ContactName: cost?.company || '',
      EmailAddress: cost?.email || '',
      POAddressLine1: cost?.physical_address_1 || '',
      POAddressLine2: cost?.physical_address_2 || '',
      POAddressLine3: cost?.physical_address_3 || '',
      POAddressLine4: '',
      POCity: cost?.physical_area || '',
      PORegion: '',
      POPostalCode: cost?.physical_code || '',
      POCountry: 'South Africa',
      InvoiceNumber: ai.invoice_number,
      Reference: ai.account_number,
      InvoiceDate: `${String(invoiceDate.getDate()).padStart(2, '0')}/${String(invoiceDate.getMonth() + 1).padStart(2, '0')}/${invoiceDate.getFullYear()}`,
      DueDate: `${String(dueDate.getDate()).padStart(2, '0')}/${String(dueDate.getMonth() + 1).padStart(2, '0')}/${dueDate.getFullYear()}`,
      Total: Math.round(total * 100) / 100,
      InventoryItemCode: '',
      Description: description,
      Quantity: 1,
      UnitAmount: Math.round(unitAmount * 100) / 100,
      Discount: 0,
      AccountCode: '200',
      TaxType: 'OUTPUT2',
      TaxAmount: Math.round(taxAmount * 100) / 100,
      TrackingName1: '',
      TrackingOption1: '',
      Currency: 'ZAR',
      BrandingTheme: '',
      EntityID: '',
      DocID: '',
    });
  }

  if (results.length > 0) {
    logger.info('Invoice found in account_invoices', { count: results.length });
    return results;
  }

  const { data: invoices, error: invError } = await supabase
    .from('invoices')
    .select('*')
    .eq('invoice_number', invoiceNumber);

  if (invError) {
    logger.error('Failed to fetch invoices', { error: invError.message });
    throw new Error(`Failed to fetch invoices: ${invError.message}`);
  }

  for (const inv of invoices || []) {
    const cost = costMap.get(inv.account_number);
    const lineItems = inv.line_items || [];

    const total = lineItems.reduce((sum, li) => {
      return sum + parseFloat(
        li.total_incl || li.total_incl_vat || li.total_including_vat || li.totalIncl || li.total_amount || 0
      );
    }, 0);

    const unitAmount = lineItems.reduce((sum, li) => {
      return sum + parseFloat(
        li.unit_price_without_vat || li.amountExcludingVat || li.total_excl_vat || li.unitPrice || (parseFloat(li.unit_price) * parseFloat(li.quantity || 1)) || 0
      );
    }, 0);

    const taxAmount = lineItems.reduce((sum, li) => {
      return sum + parseFloat(li.vat_amount || li.vatAmount || 0);
    }, 0);

    const description = lineItems.length > 0
      ? lineItems.map(li => `${li.description || li.item_code || 'Item'} x${li.quantity || li.units || '1'}`).join(' | ')
      : inv.client_name;

    const invoiceDate = new Date(inv.invoice_date);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);

    results.push({
      ContactName: cost?.company || inv.client_name || '',
      EmailAddress: cost?.email || '',
      POAddressLine1: cost?.physical_address_1 || '',
      POAddressLine2: cost?.physical_address_2 || '',
      POAddressLine3: cost?.physical_address_3 || '',
      POAddressLine4: '',
      POCity: cost?.physical_area || '',
      PORegion: '',
      POPostalCode: cost?.physical_code || '',
      POCountry: 'South Africa',
      InvoiceNumber: inv.invoice_number,
      Reference: inv.account_number,
      InvoiceDate: `${String(invoiceDate.getDate()).padStart(2, '0')}/${String(invoiceDate.getMonth() + 1).padStart(2, '0')}/${invoiceDate.getFullYear()}`,
      DueDate: `${String(dueDate.getDate()).padStart(2, '0')}/${String(dueDate.getMonth() + 1).padStart(2, '0')}/${dueDate.getFullYear()}`,
      Total: Math.round(total * 100) / 100,
      InventoryItemCode: '',
      Description: description,
      Quantity: 1,
      UnitAmount: Math.round(unitAmount * 100) / 100,
      Discount: 0,
      AccountCode: '200',
      TaxType: 'OUTPUT2',
      TaxAmount: Math.round(taxAmount * 100) / 100,
      TrackingName1: '',
      TrackingOption1: '',
      Currency: 'ZAR',
      BrandingTheme: '',
      EntityID: '',
      DocID: '',
    });
  }

  logger.info('Single invoice fetched', { count: results.length });
  return results;
}

module.exports = {
  getLastExportedInvoiceNumber,
  logExport,
  fetchInvoicesFrom,
  fetchSingleInvoice,
};
