import "server-only";
import { getDataSource, config } from "@/lib/erpnext/source";
import { getCart, clearCart } from "@/lib/cart/service";
import type { CheckoutInput, PlacedOrder } from "./dto";

/**
 * Place an order: re-validate the cart against ERPNext (price + stock are server-derived),
 * find/create the Customer, and create a DRAFT Sales Order. Payment (Step 2) will submit it.
 */
export async function placeOrder(input: CheckoutInput): Promise<PlacedOrder> {
  const ds = await getDataSource();
  const priceList = config.defaultPriceList; // B2C guest = Retail; B2B price lists later

  // getCart() already re-derives prices and caps quantities to live stock.
  const cart = await getCart(priceList);
  if (cart.items.length === 0) {
    throw new Error("Your cart is empty.");
  }
  for (const line of cart.items) {
    if (!line.inStock || line.qty > line.availableQty) {
      throw new Error(`Insufficient stock for ${line.name}.`);
    }
  }

  const customer = await ds.findOrCreateCustomer({ email: input.email, name: input.name });

  const salesOrder = await ds.createSalesOrder({
    customer,
    currency: cart.currency,
    priceList,
    items: cart.items.map((l) => ({
      itemCode: l.productId,
      qty: l.qty,
      rate: l.unitPrice.amount, // server-validated price
    })),
    shipping: {
      name: input.name,
      line1: input.address1,
      city: input.city,
      state: input.state,
      postalCode: input.postalCode,
      country: input.country,
    },
  });

  await clearCart(priceList);
  return { salesOrder, itemCount: cart.itemCount, total: cart.subtotal };
}
