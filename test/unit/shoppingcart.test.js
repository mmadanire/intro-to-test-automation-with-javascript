var assert = require('chai').assert;

import { ShoppingCart, Product, LineItem, Shipping } from '../../src/domain';

/**
 * {@link FixedShippingQuoteService} is a utility that we can use with the {@link ShoppingCart}
 * to control how much shipping will cost (before any applicable discounts).
 */
class FixedShippingQuoteService extends Shipping.ShippingQuoteService {
	constructor(fixedCost) {
		super();
		this.cost = fixedCost;
	}

	/**
	 * Override the default implementation in {@link ShippingQuoteService#quote} to
	 * return a fixed cost regardless of the selected service.
	 */
	quote() { return this.cost; }
}

describe('ShoppingCart', () => {

	const shippingInfo = new Shipping.ShippingInfo(
		Shipping.ShippingService.USPSPriorityMail,
		"30 W 21st Street, New York, NY 10010"
	);
	const freeShippingQuoteService = new FixedShippingQuoteService(0);
	const shirt = new Product("SHIRT", "Shirt", 2500);
	const socks = new Product("SOCKS", "Crew socks", 500);
	const discountSocks = new Product("CHEAPSOCKS", "Cheap crew socks", 500, 300);

	describe('empty cart', () => {

		const cart = new ShoppingCart(freeShippingQuoteService);
		cart.updateShipping(shippingInfo);
		const purchase = cart.toPurchase();

		it('should be contain no items', () => {
			assert.equal(purchase.items.length, 0)
		});
		it('should produce an empty object', () => {
			const purchase = cart.toPurchase();
			assert.equal(purchase.items.length, 0);
			assert.equal(purchase.totalPrice, 0);
			assert.equal(purchase.totalDiscount, 0);
		});

	});
});

describe('PromoCodes', () => {

	const shippingInfo = new Shipping.ShippingInfo(
		Shipping.ShippingService.USPSPriorityMail,
		"30 W 21st Street, New York, NY 10010"
	);
	const freeShippingQuoteService = new FixedShippingQuoteService(0);
	const shirt = new Product("SHIRT", "Shirt", 2500);
	const socks = new Product("SOCKS", "Crew socks", 500);
	const discountSocks = new Product("CHEAPSOCKS", "Cheap crew socks", 500, 300);

	describe('FIRSTTIME', () => {
		const shipping = 500; // fixed $5 shipping free
		const freeShippingQuoteService = new FixedShippingQuoteService(shipping);
		const cart = new ShoppingCart(freeShippingQuoteService)
		cart.updateShipping(shippingInfo);
		cart.addProduct(shirt);
		cart.addProduct(socks);
		cart.addPromoCode("FIRSTTIME");
		const purchase = cart.toPurchase();

		it('should apply 10% off entire purchase excluding shipping', () => {
			assert.equal(purchase.totalPrice, ((shirt.price + socks.price) * 0.9) + shipping)
		});
		it('should show the 10% discount on each line item', () => {
			const lineItemForShirt = purchase.items.find(item => item.sku == shirt.sku);
			assert.approximately(lineItemForShirt.totalPrice, shirt.price * 0.9, 0.001)
			assert.approximately(lineItemForShirt.totalDiscount, shirt.price * 0.1, 0.001)
			
			const lineItemForSocks = purchase.items.find(item => item.sku == socks.sku)
			assert.approximately(lineItemForSocks.totalPrice, socks.price * 0.9, 0.001)
			assert.approximately(lineItemForSocks.totalDiscount, socks.price * 0.1, 0.001)
		});

	});
});
