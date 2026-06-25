const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

exports.getFinanceData = async (req, res) => {
  try {
    const accounts = await Account.find({ user: req.user.id }).lean();
    const transactions = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
    
    // Map _id to id to match Frontend UI expectations exactly
    const mappedAccounts = accounts.map(acc => ({
      id: acc._id.toString(),
      name: acc.name,
      balance: acc.balance,
      iconType: acc.iconType,
      linkedAccountId: acc.linkedAccountId ? acc.linkedAccountId.toString() : undefined
    }));

    const mappedTransactions = transactions.map(tx => ({
      id: tx._id.toString(),
      title: tx.title,
      cat: tx.cat,
      date: tx.date,
      amt: tx.amt,
      isExpense: tx.isExpense,
      numericAmount: tx.numericAmount,
      sourceAccountName: tx.sourceAccountName
    }));

    res.status(200).json({ accounts: mappedAccounts, transactions: mappedTransactions });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching finance data' });
  }
};

exports.addAccount = async (req, res) => {
  const { name, startingBalance, iconType, linkedAccountId } = req.body;
  try {
    const newAccount = new Account({
      user: req.user.id,
      name,
      balance: startingBalance || 0,
      iconType,
      linkedAccountId: linkedAccountId || null
    });
    const saved = await newAccount.save();
    
    res.status(201).json({
      id: saved._id.toString(),
      name: saved.name,
      balance: saved.balance,
      iconType: saved.iconType,
      linkedAccountId: saved.linkedAccountId ? saved.linkedAccountId.toString() : undefined
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding account' });
  }
};

exports.linkAccount = async (req, res) => {
  const { walletId, bankId } = req.body;
  try {
    const wallet = await Account.findOne({ _id: walletId, user: req.user.id });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

    wallet.linkedAccountId = bankId || null;
    await wallet.save();

    res.status(200).json({ message: 'Link updated', linkedAccountId: wallet.linkedAccountId });
  } catch (error) {
    res.status(500).json({ message: 'Error linking account' });
  }
};

exports.addTransaction = async (req, res) => {
  const { title, cat, date, amt, isExpense, numericAmount, sourceAccountId } = req.body;
  try {
    const sourceAcc = await Account.findOne({ _id: sourceAccountId, user: req.user.id });
    if (!sourceAcc) return res.status(404).json({ message: 'Source account not found' });

    // Save transaction
    const newTx = new Transaction({
      user: req.user.id,
      title,
      cat,
      date,
      amt,
      isExpense,
      numericAmount,
      sourceAccountId: sourceAcc._id,
      sourceAccountName: sourceAcc.name
    });
    const savedTx = await newTx.save();

    // Update source account balance directly
    if (isExpense) {
      sourceAcc.balance -= numericAmount;
    } else {
      sourceAcc.balance += numericAmount;
    }
    await sourceAcc.save();

    res.status(201).json({
      transaction: {
        id: savedTx._id.toString(),
        title: savedTx.title,
        cat: savedTx.cat,
        date: savedTx.date,
        amt: savedTx.amt,
        isExpense: savedTx.isExpense,
        numericAmount: savedTx.numericAmount,
        sourceAccountName: savedTx.sourceAccountName
      },
      updatedAccount: {
        id: sourceAcc._id.toString(),
        balance: sourceAcc.balance
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error processing transaction' });
  }
};
