# Flowdesk — Security

**Version:** 1.0  
**Last Updated:** 2026-04-05  

---

## 1. Threat Model

### Assets to Protect

- User credentials (email + password)
- Client personal data (name, email, pseudo)
- Contract financial data (prices, invoices, payment method choice)
- Anthropic and Resend API keys
- Expo push tokens (device identifiers)
- Deliverable links (access to client's digital product)

### Threat Actors

- **Unauthenticated user:** Attempts to read or write data without a valid session
- **Authenticated wrong-role user:** A client trying to access freelancer functions or vice versa
- **Authenticated user crossing contract boundaries:** A freelancer accessing another freelancer's contracts
- **API key leakage:** Keys exposed in client bundle or version control
- **Push token abuse:** Sending unsolicited notifications to users

### Key Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| API keys in client bundle | Medium | High | All keys in Convex environment variables, never in Expo app |
| Unauthorized contract access | Medium | High | Ownership check on every Convex function |
| Cross-role data access | Low | Medium | Role check in every function |
| Deliverable link exposure | Low | High | Link only released after payment confirmed |
| Push token harvesting | Low | Low | Tokens stored in Convex, not exposed via queries |

---

## 2. Authentication & Authorization

**Auth method:** Convex Auth (JWT-based, managed session)

**Token storage:** Managed by Convex client SDK; token cached internally, not directly accessible to app code. App stores only the user role and ID in AsyncStorage for navigation purposes — never the raw JWT.

**Session expiry:** <!-- assumed: 30-day refresh token, 1-hour access token (Convex Auth default) -->

**Roles:** `freelancer` | `client` — set at registration, immutable

**Key permission rules:**
- `contracts:create` — freelancer only
- `contracts:accept` / `contracts:decline` — client only, must be the contract's named client
- `tasks:*` — freelancer only, must own the contract
- `invoices:generate` / `invoices:send` / `invoices:update` — freelancer only
- `invoices:simulatePayment` — client only, must be the contract's client
- `messages:send` — any authenticated user who is a party to the contract
- All queries check that the caller is a party to the requested contract

---

## 3. Data Security

**Password hashing:** Handled by Convex Auth (bcrypt under the hood)

**PII fields:** `email`, `name`, `pseudo` — stored in Convex, never logged in actions

**Transit encryption:** All Convex communication uses TLS (WebSocket Secure). Resend and Anthropic APIs use HTTPS.

**At-rest encryption:** Convex encrypts data at rest by default on their infrastructure.

**SQLite local cache:** Not encrypted in v1 — acceptable for demo. Production would use `expo-secure-store` or SQLCipher for sensitive fields. <!-- assumed: not required for mobile dev final project -->

---

## 4. Secrets Management

**Development:** All secrets in `.env` file, listed in `.gitignore`. Never committed to version control.

**Convex environment variables:** Anthropic API key and Resend API key stored in Convex environment variables (set via `npx convex env set`). Accessed only in Convex actions via `process.env`. Never passed to the client.

**Expo app:** Only `EXPO_PUBLIC_CONVEX_URL` is in the Expo bundle (public by design). All other keys are server-side only.

**Production secret manager:** <!-- assumed: Convex environment variables are sufficient for v1; move to AWS Secrets Manager or Doppler at scale -->

**Rotation policy:** API keys should be rotated every 90 days and immediately on any suspected exposure.

---

## 5. API Security

**Input validation:** All Convex mutations use Convex's `v` validator (Zod-equivalent built-in). Invalid input throws `VALIDATION_ERROR` before any business logic runs.

**Rate limiting:** Expo push sends are fire-and-forget; Anthropic calls are limited to one per contract by checking for existing invoice. No client-side rate limiting in v1.

**CORS:** Not applicable — Convex WebSocket connections are origin-agnostic; security is enforced by session token, not origin.

**Webhook verification:** No incoming webhooks in v1 (payments are simulated). If real Stripe/NabooPay webhooks are added in v2, Stripe webhook signature verification (HMAC-SHA256) must be implemented in a Convex HTTP action.

---

## 6. Dependency Security

**Audit process:** Run `npm audit` before every release and after adding any dependency.

**Automated updates:** Dependabot or Renovate recommended for production. Not configured in v1. <!-- assumed: not required for final project -->

**CVE policy:** Any high or critical CVE in a direct dependency blocks release until patched or mitigated.

---

## 7. Incident Response

1. **Detect** — Monitor Convex dashboard logs and Resend delivery logs for anomalous patterns
2. **Contain** — Revoke affected API keys immediately via Convex env and Anthropic/Resend dashboards
3. **Assess** — Review Convex function logs to determine scope of data accessed
4. **Notify** — Inform affected users via email if PII was exposed
5. **Fix** — Patch the vulnerability, rotate all secrets, re-deploy
6. **Post-mortem** — Document root cause, timeline, and preventive measures taken
