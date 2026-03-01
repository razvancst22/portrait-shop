# CAEN, Stripe și Conformitate Legală – Portrete AI (România)

Ghid pentru societatea care vinde portrete AI generate (digital + fizic). Pentru setup tehnic Stripe, vezi [STRIPE_SETUP.md](./STRIPE_SETUP.md).

---

## 1. Cod CAEN pentru vânzare online

### Cod recomandat: **4791**

| Cod CAEN | Denumire |
|----------|----------|
| **4791** | Comerț cu amănuntul prin intermediul caselor de comenzi sau prin Internet |

Acoperă vânzarea B2C prin site propriu, indiferent dacă produsul este digital (download) sau fizic (printuri livrate).

**Cum îl adaugi:** Cerere la ONRC (Oficiul Național al Registrului Comerțului) pentru modificarea obiectului de activitate – adăugare cod secundar 4791. Poți folosi un contabil sau avocat pentru acte.

**Notă:** Dacă ai deja 6310 ca cod principal (activități de prelucrare a datelor, hosting), 4791 ca cod secundar este suficient pentru a vinde legal online.

---

## 2. Integrarea în Stripe

Stripe **nu cere cod CAEN**. Cere datele companiei pentru verificare și taxe.

### Ce completezi în Stripe Dashboard

1. **Settings → Business settings → Company**
   - Business name (denumirea SRL)
   - Tax ID (CUI-ul companiei, fără RO)
   - Adresa sediului social
   - Țara: Romania

2. **Stripe Tax (pentru TVA)**
   - Settings → Tax → Enable Stripe Tax
   - Adaugă înregistrarea TVA pentru România (CUI + număr TVA intracomunitar dacă ai)
   - Pentru vânzări în UE: înregistrare OSS – [ANAF OSS](https://www.anaf.ro/anaf/internet/ANAF/servicii_online/one_stop_shop/)

3. **Tax codes pentru produse**
   - Digital: `txcd_10000000` (digital goods)
   - Physical (printuri): `txcd_99999999` sau cod specific pentru artă

### Modificări tehnice sugerate

- Activează **Stripe Tax** în Dashboard și în sesiunile de checkout (`automatic_tax`).
- Transmite `customer_details.address.country` din Stripe session la webhook pentru facturare (e-Factura).

---

## 3. Conformitate legală în România

### 3.1 Obligații ANPC (site-ul)

Pe prima pagină, vizibil, trebuie afișate:

- Denumirea societății
- Codul unic de înregistrare (din care rezultă obiectele de activitate – CAEN)
- Autorizații/avize (dacă există)

**Implementare:** Footer sau header cu bloc „Informații legale” – vezi `app/terms/page.tsx` și `app/privacy/page.tsx`.

### 3.2 Informații precontractuale (OUG 34/2014)

Înainte de comandă, consumatorul trebuie să vadă:

- Caracteristici principale ale produselor
- Identitatea și sediul profesionistului
- Prețul cu toate taxele incluse
- Modalitatea de plată și livrare
- Dreptul la retragere (14 zile) și cine plătește returul
- Garanție și servicii post-vânzare
- Mecanism de soluționare a reclamațiilor (ANPC, etc.)

**Implementare:** Pagină „Termeni și condiții” + informații pe pagina de checkout.

### 3.3 GDPR

- Politică de confidențialitate (`app/privacy/page.tsx`)
- Banner pentru cookie-uri cu consimțământ
- Securizarea datelor (plăți prin Stripe, nu stocare carduri)

### 3.4 TVA și e-Factura

- **TVA:** 21% în România. Stripe Tax poate calcula automat.
- **e-Factura:** Obligatorie din 1 ian 2025 pentru B2C. Vezi [EFACTURA_SETUP.md](./EFACTURA_SETUP.md).

### 3.5 Produse digitale vs fizice

- **Digital:** Livrare instantanee, fără drept de retragere (OUG 34/2014, art. 16 lit. c).
- **Fizic (printuri):** Drept de retragere 14 zile, costuri de retur conform termenilor afișați.

---

## 4. Checklist acțiuni

| Prioritate | Acțiune |
|------------|---------|
| 1 | Adăugare CAEN 4791 ca cod secundar la ONRC |
| 2 | Completare Business settings în Stripe (CUI, adresă) |
| 3 | Activare Stripe Tax și înregistrare TVA România (+ OSS dacă vinde în UE) |
| 4 | Afișare denumire, CUI, obiecte de activitate pe site (footer/header) |
| 5 | Pagină Termeni și condiții cu drept de retragere, livrare, garanție |
| 6 | Banner cookie-uri și politică de confidențialitate actualizată |
| 7 | Integrare e-Factura (Contazen/Socrate) după webhook Stripe |

---

## 5. Resurse utile

- [CAEN 4791 – Comerț online](https://www.rrf.ro/caen/4791/)
- [Stripe Tax – România](https://docs.stripe.com/tax/supported-countries/european-union/romania)
- [ANAF OSS](https://www.anaf.ro/anaf/internet/ANAF/servicii_online/one_stop_shop/)
- [ANPC – Fișă control online](https://anpc.ro/wp-content/uploads/2024/05/Fisa-de-control-ON-LINE.pdf)
