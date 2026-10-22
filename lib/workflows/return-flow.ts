
import {
  createReturn,
  getOrder,
  notifyReturnInProcess,
  preauthorizeRefund,
} from "@/lib/api";

import type { Order, Return } from "@/lib/types";

export async function returnFlow(
  orderId: string,
  reason: string
) {
  "use workflow";

  // Step 1: Retrieve the order.
  const order = await getOrderStep(orderId);

  // Step 2: Notify the customer.
  await notifyReturnInProcessStep(orderId);

  // Step 3: Preauthorize the refund.
  await preauthorizeRefundStep(orderId);

  // Step 4: File the actual return.
  const filed = await createReturnStep(order, reason);

  return {
    orderId,
    returnId: filed.id,
  };
}

// Durable step: Fetch order details.
async function getOrderStep(
  orderId: string
): Promise<Order> {
  "use step";

  return getOrder(orderId);
}

// Durable step: Notify customer.
async function notifyReturnInProcessStep(
  orderId: string
): Promise<void> {
  "use step";

  await notifyReturnInProcess(orderId);
}

// Durable step: Preauthorize refund.
async function preauthorizeRefundStep(
  orderId: string
): Promise<void> {
  "use step";

  await preauthorizeRefund(orderId);
}

// Durable step: Create return.
async function createReturnStep(
  order: Order,
  reason: string
): Promise<Return> {
  "use step";

  return createReturn({
    orderId: order.id,

    items: order.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),

    reason,
  });
}
