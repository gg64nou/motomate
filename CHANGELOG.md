# Changelog

## 0.2.4

- You can now disable public sign-up by setting `AUTH_ALLOW_REGISTRATION=false`
- The changelog is now accessible from your profile settings
- Fix: Magic link sign-in no longer creates new accounts when registration is disabled

## 0.2.3

- Maintenance trackers can now be set to reminder-only. You can get notified when service is due without polluting your timeline
- Fix: reminder entries are now correctly saved alongside your service logs
- Fix: filters on the maintenance view no longer reset when you navigate away from the page
- Fix: reminders are now properly scheduled with cron (#33)
- Fix: alerts like odometer reminders no longer repeat every day once they have already been sent (#35)