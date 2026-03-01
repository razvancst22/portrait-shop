# Order Workflow – Implementation Notes

Notes for future implementation of e-commerce order features. See also the plan in `.cursor/plans/`.

---

## 1. Shipping Address

### Current Status

**Shipping address is NOT stored in the database.**

- Stripe Checkout collects it when `shipping_address_collection` is enabled (art print orders only).
- In the Stripe webhook (`app/api/webhooks/stripe/route.ts`), the address is read from:
  - `session.collected_information?.shipping_details`, or
  - `session.customer_details?.address`
- It is passed directly to Printful for fulfillment and then discarded.
- The `orders` table has no `shipping_*` columns.

### To Add Shipping Address on Order Detail Page

1. **Migration** – add columns to `orders`:
   ```sql
   ALTER TABLE orders
     ADD COLUMN shipping_name VARCHAR(255),
     ADD COLUMN shipping_line1 VARCHAR(255),
     ADD COLUMN shipping_line2 VARCHAR(255),
     ADD COLUMN shipping_city VARCHAR(255),
     ADD COLUMN shipping_state VARCHAR(100),
     ADD COLUMN shipping_postal_code VARCHAR(50),
     ADD COLUMN shipping_country VARCHAR(2);
   ```

2. **Stripe webhook** – when processing art print orders, persist `shippingDetails` to these columns before calling Printful.

3. **API** – include `shipping*` in `GET /api/my-orders/[orderId]` response.

4. **UI** – show shipping address on order detail page only when order has physical items (`art_print`).

---

## 2. Refund Request

### What “Full Refund-Request API That Creates Tickets” Means

**Tickets = admin-facing support records.**

- User clicks “Request refund” on order detail page.
- API validates ownership, creates a row in a `refund_requests` or `support_tickets` table.
- Admin (you) sees a list: order number, customer email, reason, date.
- Admin can then process the refund in Stripe Dashboard (or via Stripe API) and mark the ticket resolved.

**Simpler option (no tickets):**

- “Request refund” opens a `mailto:` link with pre-filled subject/body (order number, email, “I would like to request a refund because…”).
- **Implemented:** Links to `/contact?refund=1&order=XXX`. Configure support email in `app/contact/page.tsx`.

**Full API option (with tickets) – for future:**

- `POST /api/refund-request` with `{ orderId, orderNumber, email, reason }`.
- Backend validates ownership, inserts into `refund_requests` table.
- Optional: admin page or email notification when a new request is created.
- You process refunds from Stripe Dashboard and update the ticket status.

---

## 3. Romanian e-Factura / SPV

See `docs/EFACTURA_SETUP.md` for implementation notes on Romanian e-invoicing compliance.

---

## 4. Other Pending Items

| Item | Status | Notes |
|------|--------|-------|
| Download link visibility | Done | Only shown when `status === 'delivered'` |
| Order status timeline | Done | Stepper on order detail page |
| Printful tracking | Done | Migration + webhook store `tracking_number`, `tracking_url` |
| Stripe receipt URL | Done | Fetched from Charge, returned as `receiptUrl` |
| Product images for packs | Pending | Static images in `public/products/` |
| Refund policy link | Done | Link on order detail page |
| Refund request CTA | Done | Links to /contact?refund=1&order=XXX |
