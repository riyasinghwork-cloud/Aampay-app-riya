# AAMPAY Home Loan Prototype

Interactive Next.js click-through prototype based on `PRD.md` and `designsystem.md`.

## Run locally

```bash
export PATH="$HOME/.local/node/bin:$PATH"
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Prototype behaviour

- No real auth, OTP, or APIs
- Document upload boxes toggle to an uploaded state on click
- Verification doc rows cycle: Not started → Uploaded → Under review → Accepted
- **Reset demo** in the header restores the initial state
