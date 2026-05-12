# Roadmap: School Event Coordinator

This app is a dynamic event coordination tool for school homeroom parents. It allows for multi-event creation, item/volunteer sign-ups, and monetary donations.

## 🛠️ Tech Stack
- **Frontend:** React 19 (Vite)
- **Backend:** Firebase Firestore (Atomic Batch Operations)
- **Auth:** Firebase Authentication (Google, Email, & Anonymous)
- **Styling:** Premium Glassmorphism (CSS)

## 🎯 Development Status

### Phase 1: Foundation (COMPLETED ✅)
- [x] Project Initialization (React + Vite)
- [x] Firebase Config & Auth Integration
- [x] Modern UI/UX Design System (Glassmorphism)
- [x] Authentication Workflow & Context API

### Phase 2: Event Management (COMPLETED ✅)
- [x] **Dashboard:** View and manage created events.
- [x] **Event Creator:** Dynamic form builder for "Needs" (People, Items, Money).
- [x] **Hybrid Signup Modes:** Implementation of Instant vs. Fair Allocation modes.

### Phase 3: Public Sign-up & User Intent (COMPLETED ✅)
- [x] **Event Landing Page:** Public view for volunteers.
- [x] **Instant Signup:** Immediate slot claiming for first-come-first-serve.
- [x] **Volunteer Intent (Wishlist):** Ranked preference submission for fair allocation.

### Phase 4: Fair Allocation Engine (COMPLETED ✅)
- [x] **Allocation Manager:** Dashboard for event organizers.
- [x] **Fair Allocation Algorithm:** Multi-pass, shuffled assignment logic to eliminate time-bias.
- [x] **Firestore Security Rules:** Granular access control and data privacy.

### Phase 5: Polish & Scale (UPCOMING 🚀)
- [ ] **Email Notifications:** Automated "Assignment Confirmed" triggers.
- [ ] **Waitlist Management:** Intelligent fallback if a volunteer cancels.
- [ ] **Calendar Integration:** Export assigned slots to Google/iCal.

## 🛡️ Security & Environment Notes
- **Firestore Status:** PROVISIONED (Rules enforced for creator-only management).
- **Admin Access:** Managed via Firebase Auth with scoped read/write permissions.
