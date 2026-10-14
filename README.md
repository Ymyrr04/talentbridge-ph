# Talentbridge Ph

Build the foundation for TalentHub, a standalone job marketplace connecting employers to Filipino remote talent: authentication, roles and routing only, with no feature pages yet.

Accounts
Three roles: applicant, client, admin. Users pick applicant or client at signup. Admin is assigned manually in the database. Store roles in a separate user_roles table that users cannot write to. One email equals one role. Require email verification. Add login, logout and forgot/reset password.

Public pages
Landing page with a headline and two buttons, “Sign up as an Applicant” and “Sign up as a Client”, going to separate signup pages. The applicant signup has a required checkbox: “I agree to the Privacy Policy” (placeholder link).

Routing
/applicant/dashboard for applicants only, /client/dashboard for clients only, /admin/dashboard for admins only. A wrong role is redirected to their own dashboard. Logged-out users go to /login. Each dashboard is an empty page with its own top nav, a welcome line and a logout button.

Data (Supabase, RLS on)

profiles: user id, name, email. Users can read and edit only their own row. Admins can read all.

user_roles: user id, role. Users can read only their own role. No one can write from the app.

Design
Clean, modern, professional and credible, with a simple color palette of your choice. Mobile responsive.

Do not build: any other pages, matching, AI, payments, video, messaging, or CV uploads.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://talentbridge-ph.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f064e37e-94d1-465a-afb1-073b6ee5a63b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
