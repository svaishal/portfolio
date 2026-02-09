# Security

This project includes several security controls by default:

- CSRF protection for non-GET requests
- Session checks for protected routes
- Rate limiting for login and contact requests
- Optional Cloudflare Turnstile verification
- Security headers via Vercel and middleware

For the full remediation and verification list, see [SECURITY_CHECKLIST.md](../SECURITY_CHECKLIST.md).
