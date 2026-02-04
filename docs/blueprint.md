# **App Name**: GadaiAlert

## Core Features:

- Admin Login: Admin login page with Firebase Authentication (email/password). Redirect to dashboard upon successful login.
- Customer Data Dashboard: Dashboard displaying customer data (name, phone number, due date, transaction type, priority) from Firestore. Filtering by due date or priority.
- Auto-Prioritization System: Rule-based AI system (implemented directly in Nextjs code, triggered from the dashboard page) to automatically assign priority labels (high/medium/low) based on due date and loan value.
- Send Broadcast Notification: Button on each customer row to trigger a broadcast notification.

## Style Guidelines:

- Primary color: Teal (#008080) for a sense of trust and reliability, reflecting the established nature of the financial institution.
- Background color: Light grayish-teal (#E0EEEE), desaturated to maintain a professional, uncluttered look.
- Accent color: Yellow-Green (#9ACD32) to highlight important actions or information.
- Body and headline font: 'PT Sans', a humanist sans-serif that is both modern and has a touch of warmth, which is important for a service dealing with personal finances.
- Use simple, clear icons for navigation and actions.
- Clean, card-based layout for customer data to facilitate easy scanning and filtering.