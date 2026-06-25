const EMI = require('../models/EMI');
const { sendNotification } = require('../services/notificationService');

exports.getEMIs = async (req, res) => {
  try {
    const emis = await EMI.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
    
    const mappedEMIs = emis.map(emi => {
      const remaining = emi.remainingAmount;
      const monthly = emi.monthlyAmount;
      const monthsLeft = monthly > 0 ? Math.ceil(remaining / monthly) : 0;
      
      return {
        id: emi._id.toString(),
        title: emi.name,
        type: emi.loanType,
        monthlyInstallment: emi.monthlyAmount,
        remainingBalance: emi.remainingAmount,
        totalPrincipal: emi.totalAmount,
        monthsLeft: monthsLeft,
        isFinished: emi.status === 'Completed' || emi.remainingAmount <= 0
      };
    });

    res.status(200).json(mappedEMIs);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching EMIs' });
  }
};

exports.addEMI = async (req, res) => {
  const { title, type, totalPrincipal, monthlyInstallment, monthsLeft } = req.body;
  
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (monthsLeft || 12));
    
    const newEMI = new EMI({
      user: req.user.id,
      name: title || 'New Loan EMI',
      loanType: type || 'Personal',
      totalAmount: totalPrincipal || 0,
      monthlyAmount: monthlyInstallment || 0,
      startDate: startDate,
      endDate: endDate,
      dueDateOfMonth: startDate.getDate(),
      paidAmount: 0,
      status: 'Active'
    });
    
    const savedEMI = await newEMI.save();

    await sendNotification(
      req,
      req.user.id,
      'New Commitment Added',
      `You've added ${savedEMI.name} of ₹${savedEMI.monthlyAmount}/month.`
    );
    
    res.status(201).json({
      id: savedEMI._id.toString(),
      title: savedEMI.name,
      type: savedEMI.loanType,
      monthlyInstallment: savedEMI.monthlyAmount,
      remainingBalance: savedEMI.remainingAmount,
      totalPrincipal: savedEMI.totalAmount,
      monthsLeft: monthsLeft || 12,
      isFinished: savedEMI.status === 'Completed' || savedEMI.remainingAmount <= 0
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error adding EMI' });
  }
};

exports.payEMI = async (req, res) => {
  try {
    const emi = await EMI.findOne({ _id: req.params.id, user: req.user.id });
    if (!emi) return res.status(404).json({ message: 'EMI not found' });
    
    if (emi.remainingAmount <= 0 || emi.status === 'Completed') {
      return res.status(400).json({ message: 'EMI is already completed' });
    }

    emi.paidAmount += emi.monthlyAmount;
    emi.remainingAmount = emi.totalAmount - emi.paidAmount;
    emi.lastPaidDate = new Date();
    
    if (emi.remainingAmount <= 0) {
      emi.remainingAmount = 0;
      emi.status = 'Completed';
    }
    
    const savedEMI = await emi.save();
    
    const monthsLeft = savedEMI.monthlyAmount > 0 ? Math.ceil(savedEMI.remainingAmount / savedEMI.monthlyAmount) : 0;

    if (savedEMI.status === 'Completed') {
      await sendNotification(
        req,
        req.user.id,
        'EMI Completed! 🎉',
        `Congratulations! You've fully paid off your ${savedEMI.name}.`
      );
    } else {
      await sendNotification(
        req,
        req.user.id,
        'EMI Payment Logged',
        `You paid ₹${savedEMI.monthlyAmount} for ${savedEMI.name}. Remaining: ₹${savedEMI.remainingAmount}`
      );
    }

    res.status(200).json({
      id: savedEMI._id.toString(),
      title: savedEMI.name,
      type: savedEMI.loanType,
      monthlyInstallment: savedEMI.monthlyAmount,
      remainingBalance: savedEMI.remainingAmount,
      totalPrincipal: savedEMI.totalAmount,
      monthsLeft: monthsLeft,
      isFinished: savedEMI.status === 'Completed' || savedEMI.remainingAmount <= 0
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error processing EMI payment' });
  }
};
