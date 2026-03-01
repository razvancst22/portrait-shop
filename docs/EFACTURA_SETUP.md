# Romanian e-Factura / SPV – Implementation Notes

Romanian law (mandatory from 1 Jan 2025 for B2C) requires all invoices to be submitted to ANAF via e-Factura/SPV. Stripe does not handle this – it is a payment processor only.

---

## Architecture

```
Stripe (payment)  →  Your backend  →  Romanian e-invoicing API  →  SPV / ANAF
```

- **Stripe:** Handles payment. Already integrated.
- **Romanian provider:** Creates e-Factura compliant invoices, submits to SPV. Integrate via their API.

---

## Provider Options

| Provider | API | Docs |
|---------|-----|------|
| **Contazen** | REST, `POST /invoices/{id}/send-to-spv` | https://docs.contazen.ro |
| **Socrate** | GraphQL | https://docs.socrate.io |
| **Factureaza.ro** | OAuth2, Romanian market | — |

---

## Integration Flow (To Implement)

1. **Stripe webhook** fires (`checkout.session.completed`) – already have this.
2. **After** order is updated in DB, call Romanian invoicing API with:
   - Your company: CUI, address (from provider config)
   - Customer: email, name, address (B2C) or CUI (B2B)
   - Line items: product name, quantity, unit price, VAT rate
   - Order number, date, total
3. Provider creates UBL-compliant invoice and submits to SPV.
4. Optionally store `efactura_id` or invoice number on order for “View invoice” link.

---

## Prerequisites (Your Company)

- Qualified digital signature certificate (for ANAF)
- Company registered in provider (Contazen/Socrate) with correct CUI, address
- OAuth authorization with ANAF completed in provider dashboard
- Test environment: use SPV sandbox before production

---

## Data to Send per Order

From `orders` and `order_items`:

- `order_number`, `created_at`, `total_usd`, `customer_email`, `customer_name`
- For each item: `product_type` (map to product name), `quantity`, `unit_price_usd`, `subtotal_usd`
- VAT: depends on customer country; may need `customer_country` from Stripe session

---

## Environment Variables (When Implemented)

```env
# Example for Contazen
CONTAZEN_API_KEY=...
CONTAZEN_ENVIRONMENT=test  # or production
```

---

## UI

- **View receipt** → Stripe `receipt_url` (payment proof)
- **View invoice** → Link to provider’s invoice URL or PDF (if they expose it), or “Invoice submitted to ANAF” with invoice number
