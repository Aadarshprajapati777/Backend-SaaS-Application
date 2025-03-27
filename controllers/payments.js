import User from '../models/User.js';
import { Subscription, getPlanLimits } from '../models/Subscription.js';
import createError from '../utils/errorResponse.js';

// Mock available plans with details
const availablePlans = {
  free: {
    name: 'Free',
    price: 0,
    description: 'Basic access with limited features',
    features: getPlanLimits('free')
  },
  basic: {
    name: 'Basic',
    price: 9.99,
    description: 'Essential features for individuals and small teams',
    features: getPlanLimits('basic')
  },
  premium: {
    name: 'Premium',
    price: 29.99,
    description: 'Advanced features for professionals and growing businesses',
    features: getPlanLimits('premium')
  },
  enterprise: {
    name: 'Enterprise',
    price: 99.99,
    description: 'Full access with priority support for large organizations',
    features: getPlanLimits('enterprise')
  }
};

/**
 * @desc    Get available subscription plans
 * @route   GET /api/payments/plans
 * @access  Private
 */
export const getPlans = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: availablePlans
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get current subscription
 * @route   GET /api/payments/subscription
 * @access  Private
 */
export const getCurrentSubscription = async (req, res, next) => {
  try {
    // Find active subscription for the user
    const subscription = await Subscription.findOne({
      user: req.user.id,
      status: { $in: ['active', 'trialing'] }
    });

    if (!subscription) {
      return res.status(200).json({
        success: true,
        data: {
          plan: 'free',
          status: 'active',
          features: getPlanLimits('free')
        }
      });
    }

    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Subscribe to a plan (mock implementation)
 * @route   POST /api/payments/subscribe
 * @access  Private
 */
export const subscribe = async (req, res, next) => {
  try {
    const { plan, paymentMethod } = req.body;

    if (!plan || !availablePlans[plan]) {
      return next(createError('Please select a valid plan', 400));
    }

    // Check if user already has an active subscription
    let subscription = await Subscription.findOne({
      user: req.user.id,
      status: { $in: ['active', 'trialing'] }
    });

    if (subscription) {
      // Update existing subscription
      subscription.plan = plan;
      subscription.paymentMethod = paymentMethod || 'credit_card';
      subscription.features = getPlanLimits(plan);
      subscription.status = 'active';
      
      // If upgrading from free, set renewal date
      if (subscription.plan === 'free' && plan !== 'free') {
        const renewalDate = new Date();
        renewalDate.setMonth(renewalDate.getMonth() + 1);
        subscription.renewalDate = renewalDate;
      }
    } else {
      // Create new subscription
      const renewalDate = new Date();
      renewalDate.setMonth(renewalDate.getMonth() + 1);
      
      subscription = await Subscription.create({
        user: req.user.id,
        plan,
        paymentMethod: paymentMethod || 'credit_card',
        status: 'active',
        startDate: Date.now(),
        renewalDate: plan === 'free' ? null : renewalDate,
        features: getPlanLimits(plan)
      });
    }

    // For a real implementation, this is where you'd integrate with Stripe or another payment processor
    // For now, we'll just mock the payment and subscription
    
    // Update user's plan
    await User.findByIdAndUpdate(req.user.id, { plan });

    await subscription.save();

    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Cancel subscription
 * @route   POST /api/payments/cancel
 * @access  Private
 */
export const cancelSubscription = async (req, res, next) => {
  try {
    const { reason } = req.body;

    // Find active subscription
    const subscription = await Subscription.findOne({
      user: req.user.id,
      status: { $in: ['active', 'trialing'] }
    });

    if (!subscription) {
      return next(createError('No active subscription found', 404));
    }

    // For a real implementation, this is where you'd cancel via Stripe or another payment processor
    
    // Update subscription status
    subscription.status = 'canceled';
    subscription.cancellationReason = reason;
    await subscription.save();

    // Update user to free plan
    await User.findByIdAndUpdate(req.user.id, { plan: 'free' });

    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get payment history
 * @route   GET /api/payments/history
 * @access  Private
 */
export const getPaymentHistory = async (req, res, next) => {
  try {
    // Find all subscriptions for the user
    const subscriptions = await Subscription.find({
      user: req.user.id
    }).sort('-createdAt');

    // Extract invoices
    const invoices = subscriptions.reduce((allInvoices, sub) => {
      if (sub.invoices && sub.invoices.length > 0) {
        return [...allInvoices, ...sub.invoices];
      }
      return allInvoices;
    }, []);

    // For demonstration, generate some mock invoices if none exist
    let mockInvoices = [];
    if (invoices.length === 0) {
      // Create some mock payment history
      const today = new Date();
      
      for (let i = 0; i < 3; i++) {
        const invoiceDate = new Date();
        invoiceDate.setMonth(today.getMonth() - i);
        
        mockInvoices.push({
          invoiceId: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
          amount: subscriptions[0]?.plan === 'free' ? 0 : availablePlans[subscriptions[0]?.plan || 'basic'].price,
          currency: 'USD',
          paid: true,
          paidAt: invoiceDate,
          invoiceDate,
          invoiceUrl: '#'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: invoices.length > 0 ? invoices : mockInvoices
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update payment method (mock implementation)
 * @route   PUT /api/payments/method
 * @access  Private
 */
export const updatePaymentMethod = async (req, res, next) => {
  try {
    const { paymentMethod, details } = req.body;

    if (!paymentMethod) {
      return next(createError('Please provide a payment method', 400));
    }

    // Find active subscription
    const subscription = await Subscription.findOne({
      user: req.user.id,
      status: { $in: ['active', 'trialing'] }
    });

    if (!subscription) {
      return next(createError('No active subscription found', 404));
    }

    // Update payment method
    subscription.paymentMethod = paymentMethod;
    subscription.paymentMethodDetails = details || {};
    await subscription.save();

    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (err) {
    next(err);
  }
}; 