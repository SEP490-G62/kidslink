const mongoose = require('mongoose');

const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');

const extractTransactionMeta = (meta = {}) => ({
  transactionTime: meta.transactionDateTime
    || meta.transactionDate
    || meta.transaction_time
    || meta.paymentTime
    || new Date().toISOString(),
  transactionId: meta.transactionId
    || meta.reference
    || meta.id
    || meta.payos_transaction_id
    || null
});

const markInvoicesPaid = async (invoices = [], meta = {}) => {
  if (!invoices || invoices.length === 0) return [];

  const { transactionTime, transactionId } = extractTransactionMeta(meta);

  const updatedInvoiceIds = [];
  await Promise.all(invoices.map(async (invoice) => {
    if (!invoice || invoice.status === 1) return;

    const amountNumber = invoice.amount_due ? parseFloat(invoice.amount_due.toString()) : 0;
    const payment = await Payment.create({
      payment_time: transactionTime,
      payment_method: 1, // 1: online (PayOS)
      total_amount: mongoose.Types.Decimal128.fromString(amountNumber.toFixed(2))
    });

    invoice.status = 1;
    invoice.payment_id = payment._id;
    invoice.updatedAt = new Date();
    if (transactionId) {
      invoice.payos_transaction_id = transactionId;
    }
    await invoice.save();
    updatedInvoiceIds.push(invoice._id);
  }));

  return updatedInvoiceIds;
};

/**
 * PayOS webhook callback
 * Reference body (simplified):
 * {
 *   "code": "00",
 *   "desc": "success",
 *   "data": {
 *     "orderCode": 1234567890,
 *     "amount": 1500000,
 *     "status": "PAID",
 *     "transactionDateTime": "2024-03-04 10:00:00",
 *     ...
 *   },
 *   "signature": "..."
 * }
 */
const handlePayOSWebhook = async (req, res) => {
  try {
    const payload = req.body || {};
    const data = payload.data || {};
    const orderCode = data.orderCode || data.order_code || payload.orderCode;

    if (!orderCode) {
      return res.status(400).json({
        success: false,
        message: 'Missing orderCode'
      });
    }

    const invoices = await Invoice.find({ payos_order_code: Number(orderCode) });

    if (!invoices || invoices.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoices not found for orderCode',
        orderCode
      });
    }

    // NOTE: Chưa verify chữ ký PayOS vì cần định dạng chính xác.
    // TODO: khi PayOS cung cấp chuẩn ký, hãy bổ sung verify bằng checksum_key.

    const status = (data.status || data.state || payload.status || '').toString().toUpperCase();
    const isSuccess =
      status === 'PAID' ||
      status === 'COMPLETED' ||
      status === 'SUCCEEDED' ||
      status === 'SUCCESS' ||
      status === 'PAYMENT_SUCCESS' ||
      payload.code === '00';

    if (!isSuccess) {
      return res.json({
        success: true,
        message: 'Webhook received but status is not paid',
        status
      });
    }

    const updatedInvoices = await markInvoicesPaid(invoices, data);

    return res.json({
      success: true,
      message: 'Invoices updated successfully',
      orderCode,
      updatedInvoices
    });
  } catch (error) {
    console.error('handlePayOSWebhook error:', error);
    return res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
    });
  }
};

module.exports = {
  handlePayOSWebhook,
  markInvoicesPaid
};

