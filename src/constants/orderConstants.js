/**
 * Constants for order management
 */

// Order statuses
const ORDER_STATUSES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Valid order statuses array
const VALID_ORDER_STATUSES = Object.values(ORDER_STATUSES);

// Role-based status transitions
const ORDER_STATUS_TRANSITIONS = {
  cook: {
    [ORDER_STATUSES.PENDING]: [ORDER_STATUSES.IN_PROGRESS],
    [ORDER_STATUSES.IN_PROGRESS]: [ORDER_STATUSES.COMPLETED],
    [ORDER_STATUSES.COMPLETED]: [],
    [ORDER_STATUSES.CANCELLED]: []
  },
  waiter: {
    // Waiters can start preparing orders and cancel any order
    allowedTransitions: (currentStatus, newStatus) => {
      if (newStatus === ORDER_STATUSES.CANCELLED) return true;
      if (currentStatus === ORDER_STATUSES.PENDING && newStatus === ORDER_STATUSES.IN_PROGRESS) return true;
      return false;
    }
  },
  admin: {
    // Admins can make any transition
    allowedTransitions: () => true
  }
};

// Order filters by role
const ORDER_FILTERS_BY_ROLE = {
  cook: {
    status: {
      [require('sequelize').Op.in]: [ORDER_STATUSES.PENDING, ORDER_STATUSES.IN_PROGRESS]
    }
  },
  waiter: {
    // Waiters can see all orders (may filter by table)
  },
  admin: {
    // Admins can see all orders
  }
};

module.exports = {
  ORDER_STATUSES,
  VALID_ORDER_STATUSES,
  ORDER_STATUS_TRANSITIONS,
  ORDER_FILTERS_BY_ROLE
};
