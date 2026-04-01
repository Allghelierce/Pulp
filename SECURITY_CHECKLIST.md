# Pre-Deployment Security Checklist

Use this checklist before every deployment to ensure security best practices.

## Code Review Checklist

### Input Validation
- [ ] All API endpoints validate input type and length
- [ ] Query parameters are sanitized
- [ ] Request bodies are validated before processing
- [ ] File uploads have size limits
- [ ] User-provided URLs are validated (no SSRF)
- [ ] No SQL injection vulnerabilities (using parameterized queries)

### Output Encoding
- [ ] User content is sanitized before rendering as HTML
- [ ] No use of `eval()` or `Function()` constructors
- [ ] JSON responses are properly formatted
- [ ] Error messages don't leak sensitive information
- [ ] File downloads have proper MIME types

### Authentication & Authorization
- [ ] Sensitive operations require authentication
- [ ] Password changes require current password verification
- [ ] Account deletion requires password verification
- [ ] Session tokens are properly handled
- [ ] Roles/permissions are enforced server-side
- [ ] No hardcoded credentials in code

### API Security
- [ ] All endpoints that modify data use POST/PUT/DELETE
- [ ] GET requests don't modify data
- [ ] Rate limiting is implemented
- [ ] No exposure of internal error details
- [ ] API keys are never in client-side code
- [ ] CORS is properly configured

### Data Protection
- [ ] Sensitive data is not stored in localStorage (or encrypted)
- [ ] HTTPS is enforced in production
- [ ] Database queries use parameterized statements
- [ ] Passwords are hashed (not stored as plain text)
- [ ] PII is not logged
- [ ] Data at rest is encrypted

### Frontend Security
- [ ] No inline JavaScript
- [ ] CSP header is properly configured
- [ ] No use of dangerouslySetInnerHTML without sanitization
- [ ] Input fields use proper types (not all text)
- [ ] Form submissions include CSRF tokens (if applicable)

---

## Environment & Configuration Checklist

### Environment Variables
- [ ] API keys are in `.env.local` (not in code)
- [ ] `.env.local` is in `.gitignore`
- [ ] Server-side keys use non-`NEXT_PUBLIC_` prefix
- [ ] Database credentials are secure
- [ ] No placeholder/default values in production
- [ ] Environment variables are documented

### Dependencies
- [ ] No known vulnerabilities in dependencies (`npm audit`)
- [ ] Dependencies are pinned to specific versions
- [ ] Dev dependencies are separate from production
- [ ] Unused dependencies are removed
- [ ] Security patches are applied promptly

### Build & Deployment
- [ ] Production build is tested
- [ ] Source maps are not exposed in production
- [ ] API endpoints are HTTPS only
- [ ] Database backups are configured
- [ ] Error logging is configured
- [ ] Monitoring/alerting is in place

---

## HTTP Security Headers Checklist

- [ ] `Content-Security-Policy` header is set
- [ ] `X-Frame-Options` is set to DENY
- [ ] `X-Content-Type-Options` is set to nosniff
- [ ] `Strict-Transport-Security` is set (HTTPS only)
- [ ] `Referrer-Policy` is configured
- [ ] `Permissions-Policy` is configured
- [ ] `X-XSS-Protection` is set for older browsers

Check headers:
```bash
curl -I https://yourdomain.com | grep -i "^[A-Za-z-]*:"
```

---

## Testing Checklist

### Security Testing
- [ ] SSRF prevention tested
- [ ] Rate limiting tested
- [ ] Input validation tested
- [ ] XSS prevention tested
- [ ] CSRF protection tested (if applicable)
- [ ] SQL injection prevention tested
- [ ] Authentication tests passed
- [ ] Authorization tests passed

### Functional Testing
- [ ] All user flows work correctly
- [ ] Error handling works properly
- [ ] Edge cases are handled
- [ ] Performance meets requirements
- [ ] Mobile/responsive design works

### Penetration Testing (if applicable)
- [ ] External security audit completed
- [ ] Vulnerabilities are documented
- [ ] Fixes are planned and implemented
- [ ] Retesting confirms fixes

---

## Monitoring & Logging Checklist

### Logging
- [ ] Error logging is configured
- [ ] Access logs are captured
- [ ] Suspicious activity is logged
- [ ] No sensitive data in logs
- [ ] Log retention policy is set
- [ ] Logs are secure and backed up

### Monitoring
- [ ] Error rate monitoring is active
- [ ] Performance monitoring is active
- [ ] Security alerts are configured
- [ ] Rate limit violations are monitored
- [ ] Failed authentication attempts are logged
- [ ] Database performance is monitored

### Alerting
- [ ] Critical errors trigger alerts
- [ ] Security events trigger alerts
- [ ] High error rates trigger alerts
- [ ] Downtime monitoring is configured
- [ ] Alert contacts are updated

---

## Data & Privacy Checklist

### Data Security
- [ ] Data encryption in transit (HTTPS)
- [ ] Data encryption at rest (if applicable)
- [ ] Secure key management
- [ ] Regular security patches applied
- [ ] Data backup and recovery tested
- [ ] Disaster recovery plan exists

### Privacy
- [ ] Privacy policy is updated
- [ ] Terms of service are updated
- [ ] GDPR/privacy requirements met
- [ ] User consent is obtained for data collection
- [ ] Data retention policy is clear
- [ ] User data can be deleted upon request

---

## Deployment Checklist

### Pre-Deployment
- [ ] Code review completed and approved
- [ ] All tests pass
- [ ] Security checklist reviewed
- [ ] Database migrations are tested
- [ ] Backup is current
- [ ] Rollback plan is documented

### Deployment
- [ ] Code is deployed to staging first
- [ ] Staging environment is tested
- [ ] Health checks pass
- [ ] Monitoring is active
- [ ] Database migrations are applied
- [ ] Cache is cleared if needed

### Post-Deployment
- [ ] Health checks pass in production
- [ ] Error logs are normal
- [ ] Performance metrics are normal
- [ ] User-facing features work correctly
- [ ] Analytics are tracking correctly
- [ ] Team is notified of deployment

---

## API Endpoint Security Checklist

For each API endpoint, verify:

### [Endpoint Name: _______________]

#### General Security
- [ ] Input validation implemented
- [ ] Input length limits enforced
- [ ] Rate limiting enabled
- [ ] HTTPS only (no HTTP)
- [ ] Proper HTTP method used (GET/POST/PUT/DELETE)

#### Authentication & Authorization
- [ ] Requires authentication (if applicable)
- [ ] Checks user permissions
- [ ] Session/token is validated
- [ ] No privilege escalation possible

#### Data Protection
- [ ] Sensitive data is sanitized
- [ ] SQL injection prevention
- [ ] XSS prevention (if returning HTML)
- [ ] Response is properly encoded

#### Error Handling
- [ ] Errors don't leak sensitive info
- [ ] Errors are logged server-side
- [ ] Appropriate HTTP status codes
- [ ] Rate limit errors return 429

---

## Third-Party Integration Checklist

### External APIs
- [ ] API keys are stored securely
- [ ] API calls are validated
- [ ] Error handling for API failures
- [ ] Rate limiting respected
- [ ] Timeout is configured

### OAuth/SSO
- [ ] Secrets are stored securely
- [ ] Redirects are validated (no open redirects)
- [ ] PKCE is used (if applicable)
- [ ] State parameter is validated
- [ ] Token expiration is handled

### Webhooks
- [ ] Webhook signatures are verified
- [ ] Webhook endpoints are HTTPS
- [ ] Webhook payloads are validated
- [ ] Webhook retries are limited
- [ ] Rate limiting for incoming webhooks

---

## Incident Response Checklist

### In Case of Security Incident
- [ ] Incident is reported to security team
- [ ] System is isolated if necessary
- [ ] Evidence is preserved
- [ ] Timeline of incident is documented
- [ ] Affected users are notified
- [ ] Root cause analysis is performed
- [ ] Fix is implemented
- [ ] Prevention measures are taken
- [ ] Post-mortem is conducted

### Breach Disclosure
- [ ] Legal team is involved
- [ ] Regulatory requirements are met
- [ ] Users are notified within required timeframe
- [ ] Credit monitoring is offered (if applicable)
- [ ] Media statement is prepared
- [ ] Insurance claim is filed (if applicable)

---

## Continuous Security Checklist

### Regular Tasks
- [ ] Run `npm audit` weekly
- [ ] Review logs for suspicious activity (daily)
- [ ] Check error rates (daily)
- [ ] Review failed login attempts (daily)
- [ ] Update dependencies (monthly)
- [ ] Security patch updates (as needed)
- [ ] Full security audit (annually)

### Monitoring Tools
- [ ] Set up Snyk or similar for dependency scanning
- [ ] Set up GitHub security alerts
- [ ] Configure SIEM/log aggregation
- [ ] Set up uptime monitoring
- [ ] Configure error tracking (Sentry, etc.)

---

## Quick Pre-Deployment Commands

Run these before deploying:

```bash
# Check for vulnerabilities
npm audit

# Run linter
npm run lint

# Run tests
npm run test

# Check TypeScript
npm run build

# Check environment variables
grep NEXT_PUBLIC .env.local

# Check git for sensitive data
git log --all --full-history -- '*.env*'

# View security headers
curl -I https://yourdomain.com

# Check CSP
curl https://yourdomain.com | grep -i content-security-policy
```

---

## Deployment Sign-Off

Before deploying to production, confirm:

- [ ] **Security Lead**: _________________ Date: _______
  - Confirms security checklist is complete

- [ ] **DevOps/Infrastructure**: _________________ Date: _______
  - Confirms infrastructure security

- [ ] **Product Manager**: _________________ Date: _______
  - Confirms feature is ready

- [ ] **QA Lead**: _________________ Date: _______
  - Confirms testing is complete

---

## Notes & Issues Found

```
[Document any issues, workarounds, or notes here]
```

---

**Last Updated**: 2026-04-01
**Version**: 1.0
