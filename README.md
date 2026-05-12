# St. Paul Volunteer Sign-Up & Fair Allocation Tool

> **Live Demo:** [https://st-paul-sign-up.web.app/](https://st-paul-sign-up.web.app/)
> 
> **Recruiter Account:** Use `recruiter@example.com` / `password123` to view the Dashboard and Allocation Manager.

*A PM-led solution to the "First-Come, First-Served" problem in school volunteer management.*

## 📋 The Problem
Traditional volunteer tools (like SignUpGenius) rely on a **"First-Come, First-Served"** model. This creates an equity issue: parents who work full-time or lack desk access at "drop noon" are often shut out of popular events. The "noon scramble" is stressful and rewards availability over community intent.

## 🚀 The Solution: Hybrid Signup Models
This application offers two distinct models to accommodate different event types:

### 1. Instant Model (Traditional)
For small, urgent needs, the **Instant Model** allows for immediate signups. This is the standard "first-come, first-served" approach.

### 2. Fair Allocation Model (Innovative)
Designed for high-demand events (like the Spring Bake Sale or Field Day), this model replaces the "scramble" with a **Wishlist-based Allocation System**. 
Instead of rushing to click a button, parents submit their preferences over a period of days. The system then runs a fair allocation algorithm that:
1. **Eliminates Time Bias:** Shuffles all requests to remove submission-time or alphabetical advantages.
2. **Prioritizes Fairness:** Uses a multi-pass approach (Round 1: Everyone's #1 choice, Round 2: Everyone's #2, etc.) to ensure as many unique volunteers as possible get their top preferences.
3. **Respects Limits:** Automatically enforces per-event and per-user caps to prevent hoarding and ensure broad participation.

---

## 🛠 Tech Stack & Architecture
Built with a focus on modern UX, scalability, and security.

- **Frontend:** React 19 + Vite (Ultra-fast HMR and build times).
- **Backend-as-a-Service:** Firebase (Firestore, Auth, Hosting).
- **Styling:** Vanilla CSS with a **Glassmorphism** design system for a premium, modern feel.
- **Security:** Granular Firestore Security Rules ensuring data privacy (only organizers can see specific volunteer contact info; volunteers can only edit their own requests).

---

## 🔐 Security & Data Privacy
As a Product Manager with a background in security, I implemented robust guardrails:
- **RBAC (Role-Based Access Control):** Creators have full event management rights; volunteers have scoped access to their own data.
- **Private Wishlists:** Volunteer preferences are hidden from other parents to prevent social pressure or coordination.
- **Atomic Operations:** Uses Firestore `writeBatch` for the allocation engine to ensure data consistency during bulk assignments.

---

## 🧠 The Algorithm (Inside `AllocationView.jsx`)
```javascript
// A simplified look at the fair allocation logic:
const runAllocation = () => {
  // 1. Shuffle to remove submission-time bias
  const shuffledRequests = [...requests].sort(() => Math.random() - 0.5);

  // 2. Multi-pass allocation (Fairness first)
  for (let priority = 0; priority < maxWishlistLength; priority++) {
    for (let r of shuffledRequests) {
      if (userAssignedCount[r.userId] < userCaps[r.userId]) {
        // Assign if spot available and user under cap...
      }
    }
  }
}
```

---

## 🏃‍♂️ Getting Started

### Local Development
1. Clone the repo: `git clone ...`
2. Install dependencies: `npm install`
3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Firebase configuration keys.
4. Start the dev server: `npm run dev`

### Production Build
1. Create build: `npm run build`
2. Preview locally: `npm run preview`
3. Deploy to Firebase: `firebase deploy`

---

## 📈 Future Roadmap
- [ ] **Email Notifications:** Automated "You've been assigned!" emails via SendGrid/Firebase Functions.
- [ ] **Waitlist Management:** Intelligent waitlisting if an assigned volunteer cancels.
- [ ] **Multi-School Support:** Organization-level dashboards.

---

*Developed to support the St. Paul School community.*
