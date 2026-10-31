# SupremeAI Mobile Application

This workspace is a React web app packaged with Capacitor; it is not a React Native project. The release workflow can build an Android debug APK when manually dispatched with client builds enabled. iOS signing, App Store delivery, and native push-notification setup are not configured here.

## Current scope

- A mobile-first customer workspace with chat, activity, account, and service-health screens.
- Chat uses the configured SupremeAI guest gateway endpoint. Health status is fetched from the current health endpoint.
- Activity, client, and usage examples are explicitly sample data; they are not live account records.
- The admin interface is a development-only design preview. Approval, client-management, and emergency-control buttons are disabled.

## Not implemented

- Sign-in, tenant isolation, server-derived customer/admin roles, or production authorization.
- Live agent/run/usage data, notifications, approval APIs, audit-event APIs, or an emergency-stop API.
- iOS native project setup, signing, release automation, or app-store publication.

Do not treat the admin preview as an authorization boundary. Privileged actions must be authenticated and enforced by the server. The current chat request does not include a user credential; do not send confidential data until the gateway's authentication and data-handling contract is in place.

## Build

From the repository root, run `npm ci` and `npm run build --workspace=mobile`. Capacitor consumes the generated `mobile/dist` directory; the relative asset paths in the Vite configuration are required for local app-bundle loading.
