import mongoose from 'mongoose';

// Define plan limits based on subscription type
const getPlanLimits = (plan) => {
  const limits = {
    free: {
      maxDocuments: 10,
      maxModels: 2,
      maxStorage: 100 * 1024 * 1024, // 100MB
      maxTeamMembers: 1,
      supportLevel: 'basic',
      apiAccess: false
    },
    basic: {
      maxDocuments: 50,
      maxModels: 5,
      maxStorage: 1024 * 1024 * 1024, // 1GB
      maxTeamMembers: 3,
      supportLevel: 'standard',
      apiAccess: true
    },
    premium: {
      maxDocuments: 200,
      maxModels: 15,
      maxStorage: 5 * 1024 * 1024 * 1024, // 5GB
      maxTeamMembers: 10,
      supportLevel: 'priority',
      apiAccess: true
    },
    enterprise: {
      maxDocuments: 'unlimited',
      maxModels: 'unlimited',
      maxStorage: 20 * 1024 * 1024 * 1024, // 20GB
      maxTeamMembers: 'unlimited',
      supportLevel: 'dedicated',
      apiAccess: true
    }
  };
  
  return limits[plan] || limits.free;
};

const SubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'past_due', 'canceled', 'trialing'],
    default: 'active',
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  endDate: {
    type: Date
  },
  renewalDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'bank_transfer', 'none'],
    default: 'none'
  },
  paymentMethodDetails: {
    type: Object
  },
  customerId: {
    type: String
  },
  subscriptionId: {
    type: String
  },
  trialEndsAt: {
    type: Date
  },
  cancellationReason: {
    type: String
  },
  features: {
    type: Object,
    default: {
      maxDocuments: 10,
      maxModels: 2,
      maxStorage: 100 * 1024 * 1024, // 100MB in bytes
      maxTeamMembers: 1,
      supportLevel: 'basic',
      apiAccess: false
    }
  },
  invoices: [{
    invoiceId: {
      type: String
    },
    amount: {
      type: Number
    },
    currency: {
      type: String,
      default: 'USD'
    },
    paid: {
      type: Boolean,
      default: false
    },
    paidAt: {
      type: Date
    },
    invoiceDate: {
      type: Date
    },
    invoiceUrl: {
      type: String
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
SubscriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add method to get plan limits
SubscriptionSchema.methods.getPlanLimits = function() {
  return getPlanLimits(this.plan);
};

const Subscription = mongoose.model('Subscription', SubscriptionSchema);

export { Subscription, getPlanLimits };
export default Subscription; 