const cron = require('node-cron');
const EMI = require('../models/EMI');
const { emitNotification } = require('./notificationService');

const startEmiCronJob = () => {
  // Run every day at 10:00 AM (server time)
  cron.schedule('0 10 * * *', async () => {
    console.log('Running daily EMI check...');
    try {
      const today = new Date();
      const currentDayOfMonth = today.getDate();

      // Find all EMIs that are active
      const activeEmis = await EMI.find({ status: 'Active' });

      for (const emi of activeEmis) {
        // We want to notify 5 days before the due date
        // e.g. if due is 15th, and today is 10th (15 - 5 = 10)
        let targetNotifyDay = emi.dueDateOfMonth - 5;
        
        // Handle month wrapping (e.g. if due date is the 3rd, 5 days before is late in previous month)
        // For simplicity, we just notify if current day is targetNotifyDay.
        // A more robust implementation would check date diffs properly.
        const dueDate = new Date(today.getFullYear(), today.getMonth(), emi.dueDateOfMonth);
        
        // If due date is already passed for this month, look at next month
        if (dueDate < today) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }

        // Check if already paid for the current month
        if (emi.lastPaidDate) {
          const paidDate = new Date(emi.lastPaidDate);
          if (paidDate.getMonth() === today.getMonth() && paidDate.getFullYear() === today.getFullYear()) {
            continue; // Skip notifying because user already paid it this month
          }
        }

        const diffTime = Math.abs(dueDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // If it's within 5 days before due date, notify daily
        if (diffDays <= 5 && diffDays > 0) {
          await emitNotification(
            emi.user.toString(),
            diffDays === 1 ? 'Payment Due Tomorrow ⚠️' : 'Upcoming Payment Due 📅',
            `Your EMI '${emi.name}' of ₹${emi.monthlyAmount} is due in ${diffDays} days (on the ${emi.dueDateOfMonth}th). Make sure your account is funded!`
          );
        }
      }
    } catch (error) {
      console.error('Error in EMI Cron Job:', error);
    }
  });
};

module.exports = { startEmiCronJob };
