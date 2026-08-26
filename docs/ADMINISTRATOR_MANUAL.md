# Administrator Manual - ANR Dairy Management System (v1.0.0)

This manual provides instructions for system administrators managing users, pricing engines, financial cycles, backups, and configurations.

---

## 1. User Directory Management

Only users with the role `admin` can access the user management dashboard:
1. Navigate to **User Directory** under System Administration.
2. **Add User**: Click "Add User", specify name, unique phone number, select role (`Admin` or `Employee`), and set a password that complies with the password security policy (min 8 characters, uppercase, lowercase, numbers, and special symbols).
3. **Change Status**: Set status to `Active`, `Inactive` (disabled), or `Suspended` (suspended immediately invalidates all active login sessions).
4. **Reset Password**: Reset passwords for employees if forgotten.

---

## 2. Managing Rate Charts (Pricing Engine)

1. Go to **Rate Configuration** to manage pricing.
2. Select between:
   - **Formula-Based**: Set a base rate, standard FAT/SNF targets, and premium add-ons per FAT/SNF point.
   - **Matrix-Based**: Upload or enter a grid lookup map matching precise FAT and SNF ranges.
3. Mark a rate chart as `Active` to apply it to milk collection entries. Only one chart per milk type (Cow/Buffalo) can be active at a time.

---

## 3. Cyclic Billing & Invoices

1. Go to **Generate Bill** inside the invoicing panel.
2. Select the cycle period (e.g., last 10 days) and click **Process Invoices**.
3. Review draft sheets detailing gross weights, average metrics, bonuses, deductions, and net amounts.
4. Click **Generate Bills** to finalize. Automated notifications will be sent to farmers with invoice download links.

---

## 4. Backups, Restores, & Security Audits

- **Backup Manager**: Trigger manual JSON backups, download files locally, or select automatic scheduled intervals (Daily/Weekly/Monthly) with retention periods.
- **Restore Manager**: Drop a valid backup file, review file compatibility details (checks version parameters), and click restore. *Note: An automatic safety backup of the database is created before any restoration overwrite is executed.*
- **Security Portal**: View security logs tracking login locations, IP addresses, browser types, and configuration changes. Terminate individual active sessions or click "Logout All Other Devices" to revoke active JWT tokens.
- **System Settings**: Control rate calculation modes, currencies, timezones, themes, and WhatsApp/SMS gateway credentials.
- **About Diagnostics**: Review backend connectivity health, collection records volume, and last backup stats.
