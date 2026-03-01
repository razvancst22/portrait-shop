# Lista produselor vândute – pentru discuție cu contabilul

Document pentru analiza fiscală și contabilă a tuturor produselor vândute pe platformă. Actualizat conform codului și planurilor de dezvoltare.

---

## Procesul complet și fluxul tranzacțiilor

### Flux general (toate produsele)

```
Utilizator → Site (creare portret / alegere produs) → Checkout Stripe → Plată
     → Webhook Stripe (confirmare plată) → Acțiuni automate (livrare digitală SAU trimitere la Printful)
     → Factură B2C (e-Factura) → Client
```

### Flux detaliat pe tip produs

**Produse digitale (Get your Portrait, Pachete):**
1. Utilizator plătește pe Stripe Checkout
2. Stripe trimite webhook `checkout.session.completed` către backend
3. Backend: marchează comanda ca plătită, generează link descărcare (sau acordă credite)
4. Email cu link / confirmare trimis clientului
5. Factură B2C emisă (e-Factura) – manual sau prin integrare

**Produse fizice (Art Print – Printful):**
1. Utilizator plătește pe Stripe Checkout (cu adresă livrare)
2. Stripe trimite webhook către backend
3. Backend: marchează comanda plătită, apelează API Printful cu imaginea + adresa clientului
4. Printful: produce printul, îl expediază direct la client
5. Printful trimite webhook când a expediat → actualizăm status livrare
6. Factură B2C emisă clientului; factură B2B primită de la Printful (costuri)

### Rolul Printful

| Rol | Descriere |
|-----|-----------|
| **Printful** | Furnizor B2B – produce și expediază printurile la comanda noastră. Nu interacționează cu clientul final. |
| **Noi** | Vânzător B2C – primim plata de la client, emitem factură clientului, comandăm de la Printful. |
| **Flux bunuri** | Client plătește → Noi comandăm la Printful (cu imaginea generată) → Printful livrează la adresa clientului |

Printful ne facturează (cost produs + livrare). Nu avem stoc – fiecare comandă este produsă la cerere (Print on Demand).

---

## Exemple de achiziții (din perspectiva utilizatorului)

### Exemplu 1: Un singur download digital

**Utilizator:** Creează un portret, apasă „Get your Portrait”, plătește $14.99.

| Etapă | Ce se întâmplă |
|-------|----------------|
| Plată | Stripe încasează $14.99 (+ TVA dacă e cazul) |
| După plată | Link descărcare trimis pe email în câteva secunde |
| Facturare | Emitem 1 factură B2C: „Get your Portrait” – $14.99 |
| Printful | Nu intervine |

---

### Exemplu 2: Un print fizic (Art Print 12×16")

**Utilizator:** Creează portret, alege „Art Print Pack” 12×16", introduce adresa, plătește $119.

| Etapă | Ce se întâmplă |
|-------|----------------|
| Plată | Stripe încasează $119 (+ TVA) |
| După plată | Backend trimite comandă la Printful: imagine + adresă client |
| Printful | Produce printul, îl expediază la client (3–7 zile) |
| Facturare | Emitem 1 factură B2C: „Art Print Pack 12×16"” – $119 |
| Cheltuieli | Printful ne facturează (ex. ~$35 cost + livrare) – factură B2B de păstrat |

---

### Exemplu 3: Pachet digital + print (comandă mixtă)

**Utilizator:** Cumpără Starter Pack ($19.99) și un Art Print 8×10" ($89) în aceeași sesiune (sau două comenzi separate).

| Produs | Preț | Ce primește |
|--------|-----|-------------|
| Starter Pack | $19.99 | 5 credite generare + 1 descărcare HD – instant |
| Art Print 8×10" | $89 | Print livrat de Printful la domiciliu |

| Etapă | Ce se întâmplă |
|-------|----------------|
| Plată | Stripe încasează $108.99 total |
| Digital | Creditele sunt acordate imediat |
| Fizic | Comandă trimisă la Printful, livrare ulterioară |
| Facturare | 1 factură B2C cu 2 linii: Starter Pack + Art Print 8×10" |

---

## Rezumat

| Categorie | Tip | Livrare | TVA | Drept retragere |
|-----------|-----|---------|-----|-----------------|
| Digital – download | Get your Portrait | Instant (link) | 21% / OSS | Nu (OUG 34/2014 art. 16 lit. c) |
| Digital – credite | Pachete (Starter, Creator, Artist) | Instant (credite în cont) | 21% / OSS | Nu |
| Fizic | Art Print Pack | Livrare Printful | 21% / OSS | Da, 14 zile |
| Fizic (în plan) | Art Print + framing | Livrare Printful | 21% / OSS | Da, 14 zile |

---

## 1. Produse digitale

### 1.1 Get your Portrait (download upscale)

| Câmp | Valoare |
|------|---------|
| **Denumire factură** | Get your Portrait / Portret digital rezoluție mare |
| **product_type (DB)** | `get_your_portrait` |
| **Descriere** | Un singur portret AI generat: upgrade la 4K, fără watermark, descărcare digitală |
| **Preț** | $14.99 (sau $9.99 cu reducere 1h după generare) |
| **Livrare** | Link de descărcare trimis pe email imediat după plată |
| **Natură** | Serviciu digital – livrare instantanee |

**Note pentru contabil:**
- Produs digital – TVA conform țarii clientului (România 21%, OSS pentru UE)
- Fără drept de retragere (serviciu executat cu consimțământ – OUG 34/2014 art. 16 lit. c)
- Stripe Tax poate calcula TVA automat

---

### 1.2 Pachete digitale (Add Credits)

Credite pentru generări AI și descărcări. Clientul cumpără un pachet și primește credite în cont.

| Pachet | Preț | Generări | Descărcări HD | Preț/artwork (orientativ) |
|--------|------|----------|---------------|---------------------------|
| **Starter Pack** | $19.99 | 5 | 1 | — |
| **Creator Pack** | $49.99 | 20 | 10 | $4.99 |
| **Artist Pack** | $139.99 | 50 | 50 | $2.37 |

| Câmp | Valoare |
|------|---------|
| **Denumire factură** | Starter Pack / Creator Pack / Artist Pack |
| **product_type (DB)** | `digital_pack_starter`, `digital_pack_creator`, `digital_pack_artist` |
| **Descriere** | Pachet de credite: X generări AI + Y descărcări rezoluție mare |
| **Livrare** | Instant – creditele apar în cont imediat după plată |
| **Natură** | Serviciu digital – livrare instantanee |

**Note pentru contabil:**
- Același regim TVA ca Get your Portrait
- Fără drept de retragere
- Contabilizare: venit la momentul vânzării (nu la utilizarea creditelor)

---

## 2. Produse fizice

### 2.1 Art Print Pack (print portret)

Print fizic de calitate muzeu, livrat de Printful (Print on Demand). Clientul alege dimensiunea.

| Dimensiune | Preț |
|------------|------|
| 8×10" (20×25 cm) | $89 |
| 12×16" (30×40 cm) | $119 |
| 18×24" (45×60 cm) | $199 |
| 24×36" (60×90 cm) | $299 |

| Câmp | Valoare |
|------|---------|
| **Denumire factură** | Art Print Pack – [dimensiune] |
| **product_type (DB)** | `art_print` |
| **Câmp suplimentar** | `print_dimensions` (ex: `8×10"`, `12×16"`) |
| **Descriere** | Print portret pe hârtie muzeu, livrare la domiciliu |
| **Livrare** | Printful – producție + expediere direct către client |
| **Natură** | Bun fizic – vânzare cu amănuntul online |

**Note pentru contabil:**
- **Achiziție B2B:** Printful ne facturează (cost produs + livrare). Păstrăm facturile ca cheltuieli.
- **Vânzare B2C:** Emitem factură clientului (e-Factura) – preț de vânzare + TVA.
- **TVA:** Clientul plătește TVA (inclus în preț). Pentru achiziția de la Printful: reverse charge posibil dacă suntem înregistrați TVA și Printful livrează din UE.
- **Drept de retragere:** 14 zile, conform OUG 34/2014.
- **CAEN 4791** acoperă această activitate.

---

### 2.2 Framing (înramare) – ÎN PLAN

Opțiune de cadru pentru printuri. Va fi adăugată în UI: framed vs unframed, eventual stil/culoare cadru.

| Câmp | Valoare |
|------|---------|
| **Denumire factură** | Art Print Pack – [dimensiune] – [cu/să cadru] |
| **Status** | În dezvoltare – variante Printful (Framed Poster vs Unframed) |
| **Livrare** | Printful – același flux ca Art Print Pack |
| **Natură** | Bun fizic – același regim ca Art Print Pack |

**Note pentru contabil:**
- Același regim fiscal ca Art Print Pack
- Prețurile vor varia în funcție de dimensiune + framed/unframed (de stabilit la implementare)

---

## 3. Flux facturare (rezumat)

```
Client plătește (Stripe) → Tu emiți factură B2C (e-Factura) → ANAF
                              ↓
Pentru printuri: Printful te facturează (B2B) → Tu păstrezi factura pentru contabilitate
```

---

## 4. Coduri și clasificări

| Element | Valoare |
|---------|---------|
| **CAEN principal (existent)** | 6310 – Activități de prelucrare a datelor, hosting |
| **CAEN secundar (de adăugat)** | 4791 – Comerț cu amănuntul prin Internet |
| **TVA România** | 21% |
| **OSS** | Recomandat dacă vânzări în UE (peste prag) |

---

## 5. Întrebări pentru contabil

1. **Produse digitale:** Confirmare că nu se acordă drept de retragere (OUG 34/2014 art. 16 lit. c)?
2. **Pachete credite:** Momentul recunoașterii venitului – la vânzare sau la utilizarea creditelor?
3. **Printful B2B:** Procedură pentru facturile primite de la Printful (reverse charge, deductibilitate)?
4. **OSS:** Prag și obligații pentru înregistrare OSS la vânzări B2C în UE?
5. **Framing:** La implementare – clasificare fiscală identică cu Art Print Pack?

---

## 6. Referințe în cod

| Produs | Fișier principal |
|--------|------------------|
| Prețuri | `lib/pricing/constants.ts` |
| Checkout | `app/api/checkout/route.ts` |
| Fulfillment Printful | `lib/fulfillment/printful.ts`, `lib/fulfillment/process-printful-order.ts` |
| Pachete credite | `lib/pack-credits.ts` |
