# Advance booking with 3D pre-ordering — plan

## The step that is missing today

Booking and ordering are the same moment. The booking door holds a table *now*
and drops the guest straight into the menu, so there is no way to reserve a
table for Friday at 7:30, and no way for the kitchen to know what is coming
before the party walks in. Everything downstream — the service timeline, the
per-dish preparation times, the table hold — already works, but it all starts
at the moment someone sits down.

What is missing is a **reservation that exists before the visit**: a table held
for a slot in the future, owned by a customer who can come back to it, with the
food optionally chosen in advance from the 3D menu, and a **check-in** that
turns that reservation into the live visit the rest of the system already
understands.

```
today      [ sit down ] ───────────────────────────► [ order ] → [ cook ] → [ serve ]

planned    [ reserve a slot ] → [ pre-order in 3D ] → [ arrive ] → [ check in ]
                                                                        │
                                                       the live visit ◄──┘
                                                       [ order ] → [ cook ] → [ serve ]
```

## The flow, end to end

| # | Step | Who | What happens |
|---|---|---|---|
| 1 | Sign in to book | Customer | Phone + one-time code on the booking door. The reservation belongs to a verified account, so they can come back, change or cancel it, and staff can call them. |
| 2 | Choose the slot | Customer | Date, time and party size. |
| 3 | Choose the table | Customer | Only tables free *for that slot* are offered — seats are matched to party size, and a table already reserved in an overlapping window is shown as taken. |
| 4 | Pre-order (optional) | Customer | Browse the menu in 3D and pick dishes for the slot, or skip and order on arrival. Each dish's preparation time is carried onto the reservation. |
| 5 | Confirmed | — | The reservation is held. The table is **not** occupied yet — it is reserved for the window, so walk-ins can still use it before then. |
| 6 | Arrive and check in | Customer or staff | The table is held for real, the pre-order becomes a live order, and the kitchen sees it. |
| 7 | Cook and serve | Kitchen | Unchanged — the existing kitchen flow and service timeline take over from here. |
| 8 | Table released | — | Unchanged — the hold ends when the food is served. |

### Why the pre-order is not an order until check-in

A reservation's dishes are stored **on the reservation**, not as an `Order`. An
order that exists before the visit would appear in the kitchen queue, in
revenue, in GST and in the service timeline days early, and every one of those
would be wrong. The order is created at check-in, from the snapshot the
reservation holds, which is also the point the kitchen should start cooking.

## Data

### `Booking` (new)

| Field | Why |
|---|---|
| `userId`, `customerPhone`, `customerName` | Whose reservation it is — a verified customer, so it can be found again. |
| `partySize` | Matched against table seats. |
| `tableNumber` | The reserved table. |
| `scheduledFor` | When they are expected. |
| `durationMinutes` | How long the table is held for (default 90). Together with `scheduledFor` this is the window two reservations must not overlap in. |
| `status` | `reserved` → `seated` → `completed`, or `cancelled` / `no-show`. |
| `statusHistory` | Same shape as an order's, so the admin timeline can read both. |
| `preOrderItems[]` | Dish snapshot with `prepTimeMinutes`, taken when the pre-order is saved. |
| `estimatedPrepMinutes` | The longest dish, as on an order. |
| `orderId` | Set at check-in — the live order this reservation turned into. |

### Changes to what exists

- `Table` — unchanged. A reservation does not hold a table; check-in does, through
  the `hold()` that already exists.
- `Order` — gains `bookingId`, so a served order can be traced back to the
  reservation that produced it.

## Endpoints

| Method | Path | Who | Purpose |
|---|---|---|---|
| `GET` | `/api/bookings/availability` | public | Tables free for a slot, with seats matched to party size |
| `POST` | `/api/bookings` | customer | Create a reservation |
| `GET` | `/api/bookings/mine` | customer | Their reservations |
| `PUT` | `/api/bookings/:id/pre-order` | customer | Set or replace the pre-ordered dishes |
| `POST` | `/api/bookings/:id/check-in` | customer or staff | Arrive: hold the table, create the order |
| `PATCH` | `/api/bookings/:id/cancel` | customer or staff | Cancel |
| `GET` | `/api/bookings` | admin | Every upcoming reservation |
| `PATCH` | `/api/bookings/:id/status` | admin | Mark `no-show` or `completed` |

A slot is free for a table when no `reserved` or `seated` booking for it
overlaps `[scheduledFor, scheduledFor + durationMinutes)`, and — for a slot
starting now — when nobody is currently sitting at it.

## Screens

**Customer**
- `/login/book` — phone + one-time code, the door into booking.
- `/customer/book` — the wizard: slot → table → pre-order in 3D → confirm.
- `/customer/bookings` — their reservations, with check-in and cancel.

**Admin**
- `/admin/bookings` — today and upcoming, with check-in, cancel and no-show.
- The dashboard's service timeline gains `Table reserved` and `Guest checked in`
  events, so a visit reads from reservation to served in one list.

## Order of work

1. `Booking` model, availability rule, and the booking endpoints.
2. Check-in: hold the table, create the order from the snapshot, emit the events.
3. The booking door's sign-in, and the customer wizard.
4. The customer's own reservations screen.
5. The admin screen and the new timeline events.

## Decisions taken, and what they cost

- **Phone + one-time code to book.** A reservation needs an owner who can return
  to it. The cost is that a walk-up cannot reserve without a phone; they use the
  existing guest door instead, which is unchanged.
- **Pre-ordering is optional.** Requiring it would turn away anyone who has not
  decided yet. The kitchen gets a pre-order when there is one and behaves as it
  does today when there is not.
- **90-minute hold, no deposit, no cancellation window.** Simple defaults, all
  easy to change later; none of them is load-bearing in the code.

## Deliberately out of scope

- Taking payment or a deposit at booking time.
- Reminder emails or SMS — the SMS gateway is still stubbed out.
- Automatically releasing a table when a party never arrives: a reservation
  stays `reserved` until someone marks it `no-show`. Worth adding once the
  rest is in use.
