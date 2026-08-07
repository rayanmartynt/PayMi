const express = require('express');
const router = express.Router();
const db = require('../db/index');
const { eq, gte, lt, lte, and, desc, asc, sql } = require('drizzle-orm');
const { merchants, customers, transactions } = require('../db/schema');
const { auth, merchantAuth, adminAuth } = require('../middleware/auth');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

/**
 * Get merchant analytics overview
 * GET /api/analytics/overview
 */
router.get('/overview', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];
    
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const { period = '7d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch(period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get transactions in period
    const transactionsResult = await db.select()
      .from(transactions)
      .where(and(
        eq(transactions.merchantId, merchant.id),
        gte(transactions.createdAt, startDate),
        eq(transactions.status, 'SUCCESSFUL')
      ));

    // Calculate metrics
    const totalRevenue = transactionsResult.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const transactionCount = transactionsResult.length;
    const averageTransactionValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;

    // Get previous period for comparison
    const previousStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    const previousTransactionsResult = await db.select()
      .from(transactions)
      .where(and(
        eq(transactions.merchantId, merchant.id),
        gte(transactions.createdAt, previousStartDate),
        lt(transactions.createdAt, startDate),
        eq(transactions.status, 'SUCCESSFUL')
      ));

    const previousRevenue = previousTransactionsResult.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    // Payment method breakdown
    const paymentMethods = {};
    transactionsResult.forEach(t => {
      paymentMethods[t.paymentMethod] = (paymentMethods[t.paymentMethod] || 0) + parseFloat(t.amount);
    });

    // Daily revenue trend
    const dailyRevenue = {};
    transactionsResult.forEach(t => {
      const date = t.createdAt.toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + parseFloat(t.amount);
    });

    res.json({
      period,
      totalRevenue,
      transactionCount,
      averageTransactionValue,
      revenueGrowth,
      paymentMethods,
      dailyRevenue,
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ error: 'Failed to get analytics overview' });
  }
});

/**
 * Get revenue analytics with trends
 * GET /api/analytics/revenue
 */
router.get('/revenue', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];
    
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const { period = '30d', granularity = 'daily' } = req.query;

    const now = new Date();
    let startDate;
    
    switch(period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '365d':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const transactionsResult = await db.select()
      .from(transactions)
      .where(and(
        eq(transactions.merchantId, merchant.id),
        gte(transactions.createdAt, startDate),
        eq(transactions.status, 'SUCCESSFUL')
      ))
      .orderBy(asc(transactions.createdAt));

    // Group by granularity
    const revenueData = {};
    transactionsResult.forEach(t => {
      let key;
      const date = new Date(t.createdAt);
      
      switch(granularity) {
        case 'hourly':
          key = date.toISOString().slice(0, 13);
          break;
        case 'daily':
          key = date.toISOString().slice(0, 10);
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().slice(0, 10);
          break;
        case 'monthly':
          key = date.toISOString().slice(0, 7);
          break;
        default:
          key = date.toISOString().slice(0, 10);
      }
      
      if (!revenueData[key]) {
        revenueData[key] = { revenue: 0, count: 0 };
      }
      revenueData[key].revenue += parseFloat(t.amount);
      revenueData[key].count += 1;
    });

    // Convert to array and sort
    const trendData = Object.entries(revenueData).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      count: data.count
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate moving average
    const windowSize = 7;
    trendData.forEach((item, index) => {
      if (index >= windowSize - 1) {
        const sum = trendData.slice(index - windowSize + 1, index + 1)
          .reduce((acc, curr) => acc + curr.revenue, 0);
        item.movingAverage = sum / windowSize;
      }
    });

    res.json({
      period,
      granularity,
      trendData,
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to get revenue analytics' });
  }
});

/**
 * Get customer analytics
 * GET /api/analytics/customers
 */
router.get('/customers', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];
    
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Get unique customers
    const transactionsResult = await db.select()
      .from(transactions)
      .where(and(
        eq(transactions.merchantId, merchant.id),
        eq(transactions.status, 'SUCCESSFUL')
      ));

    const uniqueCustomers = new Set(transactionsResult.map(t => t.customerId).filter(Boolean));
    const customerCount = uniqueCustomers.size;

    // Calculate customer metrics
    const customerTransactions = {};
    transactionsResult.forEach(t => {
      if (t.customerId) {
        if (!customerTransactions[t.customerId]) {
          customerTransactions[t.customerId] = { count: 0, total: 0, firstPurchase: t.createdAt };
        }
        customerTransactions[t.customerId].count += 1;
        customerTransactions[t.customerId].total += parseFloat(t.amount);
      }
    });

    // Calculate average customer value
    const customerValues = Object.values(customerTransactions).map(c => c.total);
    const averageCustomerValue = customerValues.length > 0 
      ? customerValues.reduce((a, b) => a + b, 0) / customerValues.length 
      : 0;

    // Repeat customers (more than 1 transaction)
    const repeatCustomers = Object.values(customerTransactions).filter(c => c.count > 1).length;
    const repeatRate = customerCount > 0 ? (repeatCustomers / customerCount) * 100 : 0;

    res.json({
      totalCustomers: customerCount,
      repeatCustomers,
      repeatRate,
      averageCustomerValue,
      totalTransactions: transactionsResult.length
    });
  } catch (error) {
    console.error('Customer analytics error:', error);
    res.status(500).json({ error: 'Failed to get customer analytics' });
  }
});

/**
 * Get admin platform analytics
 * GET /api/analytics/platform
 */
router.get('/platform', adminAuth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    const now = new Date();
    let startDate;
    
    switch(period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get platform-wide metrics
    const [merchantsResult, customersResult, totalTransactionsResult, successfulTransactionsResult] = await Promise.all([
      db.select().from(merchants),
      db.select().from(customers),
      db.select().from(transactions).where(gte(transactions.createdAt, startDate)),
      db.select().from(transactions).where(and(gte(transactions.createdAt, startDate), eq(transactions.status, 'SUCCESSFUL')))
    ]);

    const totalMerchants = merchantsResult.length;
    const totalCustomers = customersResult.length;
    const totalTransactions = totalTransactionsResult.length;
    const successfulTransactions = successfulTransactionsResult.length;

    // Total revenue
    const totalRevenue = successfulTransactionsResult.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Active merchants (with transactions in period)
    const activeMerchantIds = new Set(successfulTransactionsResult.map(t => t.merchantId));
    const activeMerchants = activeMerchantIds.size;

    // Payment method distribution
    const paymentMethods = {};
    successfulTransactionsResult.forEach(t => {
      paymentMethods[t.paymentMethod] = {
        revenue: (paymentMethods[t.paymentMethod]?.revenue || 0) + parseFloat(t.amount),
        count: (paymentMethods[t.paymentMethod]?.count || 0) + 1
      };
    });

    const paymentMethodStats = Object.entries(paymentMethods).map(([method, data]) => ({
      method,
      revenue: data.revenue,
      count: data.count
    }));

    res.json({
      period,
      totalMerchants,
      totalCustomers,
      totalTransactions,
      successfulTransactions,
      successRate: totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0,
      totalRevenue,
      activeMerchants,
      paymentMethods: paymentMethodStats
    });
  } catch (error) {
    console.error('Platform analytics error:', error);
    res.status(500).json({ error: 'Failed to get platform analytics' });
  }
});

/**
 * Generate custom report
 * POST /api/analytics/custom-report
 */
router.post('/custom-report', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];
    
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const { name, metrics, dateRange, startDate, endDate, groupBy } = req.body;

    // Calculate date range
    const now = new Date();
    let start, end = now;

    switch(dateRange) {
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        start = new Date(startDate);
        end = new Date(endDate);
        break;
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get transactions
    const transactionsResult = await db.select()
      .from(transactions)
      .where(and(
        eq(transactions.merchantId, merchant.id),
        gte(transactions.createdAt, start),
        lte(transactions.createdAt, end),
        eq(transactions.status, 'SUCCESSFUL')
      ))
      .orderBy(asc(transactions.createdAt));

    // Group data based on groupBy
    const groupedData = {};
    transactionsResult.forEach(t => {
      let key;
      const date = new Date(t.createdAt);
      
      switch(groupBy) {
        case 'day':
          key = date.toISOString().slice(0, 10);
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().slice(0, 10);
          break;
        case 'month':
          key = date.toISOString().slice(0, 7);
          break;
        default:
          key = date.toISOString().slice(0, 10);
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          date: key,
          revenue: 0,
          transactions: 0,
          successRate: 0,
          refunds: 0,
          customerCount: new Set()
        };
      }

      groupedData[key].revenue += parseFloat(t.amount);
      groupedData[key].transactions += 1;
      if (t.customerId) {
        groupedData[key].customerCount.add(t.customerId);
      }
    });

    // Convert to array and calculate derived metrics
    const reportData = Object.values(groupedData).map(item => ({
      date: item.date,
      revenue: item.revenue,
      transactions: item.transactions,
      customerCount: item.customerCount.size,
      successRate: 100, // All successful transactions
      refundRate: 0,
      averageTransactionValue: item.transactions > 0 ? item.revenue / item.transactions : 0
    })).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      name,
      dateRange,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      metrics,
      groupBy,
      data: reportData
    });
  } catch (error) {
    console.error('Custom report error:', error);
    res.status(500).json({ error: 'Failed to generate custom report' });
  }
});

/**
 * Export report
 * POST /api/analytics/export
 */
router.post('/export', merchantAuth, async (req, res) => {
  try {
    const { format, data, name } = req.body;

    if (!data || !data.data) {
      return res.status(400).json({ error: 'Report data is required' });
    }

    const reportData = data.data;
    const filename = `paymi-report-${name || 'export'}`;

    switch(format) {
      case 'csv':
        const parser = new Parser();
        const csv = parser.parse(reportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        return res.send(csv);

      case 'excel':
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Report');
        
        // Add headers
        const headers = Object.keys(reportData[0] || {});
        worksheet.addRow(headers);
        
        // Add data
        reportData.forEach(row => {
          worksheet.addRow(Object.values(row));
        });

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
        
        const excelBuffer = await workbook.xlsx.writeBuffer();
        return res.send(excelBuffer);

      case 'pdf':
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
        
        doc.pipe(res);
        
        // Add title
        doc.fontSize(20).text(name || 'PayMi Report', { align: 'center' });
        doc.moveDown();
        
        // Add table
        if (reportData.length > 0) {
          const headers = Object.keys(reportData[0]);
          const cellWidth = 500 / headers.length;
          
          // Draw header row
          doc.fontSize(12).font('Helvetica-Bold');
          headers.forEach((header, i) => {
            doc.text(header, 50 + (i * cellWidth), doc.y, { width: cellWidth - 10 });
          });
          doc.moveDown();
          
          // Draw data rows
          doc.fontSize(10).font('Helvetica');
          reportData.forEach(row => {
            headers.forEach((header, i) => {
              const value = row[header];
              const displayValue = typeof value === 'number' ? value.toFixed(2) : String(value || '');
              doc.text(displayValue, 50 + (i * cellWidth), doc.y, { width: cellWidth - 10 });
            });
            doc.moveDown();
          });
        }
        
        doc.end();
        return;

      default:
        return res.status(400).json({ error: 'Invalid format specified' });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
});

module.exports = router;
