# Spectora schedule connection — read-only contract

## Purpose

MPI Field Tools may retrieve Spectora inspection scheduling data so inspectors and authorized office staff can see the correct daily appointments and plan travel. Spectora remains the system of record.

## Absolute write boundary

The MPI integration is read-only. It must never call a Spectora create, update, upload, publish, confirm, cancel, reschedule, or delete operation. It must never change an appointment, client, agent, service, report, attachment, or inspection record.

Only Spectora's read-only Inspections endpoint may be used. The integration account should be a dedicated Spectora staff account, and the key must be stored only in a protected backend secret store. It must never be placed in `index.html`, `admin.html`, browser JavaScript, the iOS bundle, Firestore documents, source control, logs, screenshots, or support messages.

## Fields copied into the MPI schedule cache

Copy only the operational fields MPI needs:

- Spectora inspection ID
- property address
- scheduled start/end
- assigned inspector ID and name
- client name and phone when returned by the authorized read endpoint
- agent name/contact when returned
- service and add-on names
- job notes needed by the inspector
- inspection state needed to exclude canceled/deleted work

Do not copy prices, payment details, report narratives, report photos, agreements, internal Spectora metadata, or credentials.

## Data flow

```text
Spectora read-only Inspections API
  -> protected MPI backend
  -> allowlisted/projection-only schedule records
  -> inspector's private `spectoraScheduleDays` cache
  -> My Day and authorized Office route planner
```

The public web app and native app read only the projected cache. They never receive the Spectora API key and never call Spectora directly.

## Synchronization behavior

- Use Spectora inspection webhooks to learn when an inspection is created, confirmed, canceled, published, or deleted.
- After a webhook, retrieve the affected inspection with a read-only GET and rebuild only the relevant inspector/day cache.
- Use a modest scheduled reconciliation as a backup, not constant full-history polling.
- Preserve the Spectora inspection ID as the stable job key so inserted jobs cannot open another appointment's route.
- Sort appointments by scheduled start after every refresh.
- Remove canceled/deleted appointments from the active MPI day without deleting MPI workflow/audit history already recorded for work performed.
- Label phone/calendar-derived data as a fallback. Never label fallback data as Spectora.

## Current activation requirement

The Build 171 interface and route planner accept the projected `spectoraScheduleDays` records and show the source clearly. Activating the live feed still requires MPI to obtain early-access Spectora API access, create the dedicated API account/key, and install that key in the protected backend. Until then, the existing inspector schedule synchronization remains the temporary fallback.
