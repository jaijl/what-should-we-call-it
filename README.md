# What Should We Call It?

A lightweight collaborative naming app that helps teams and groups decide on names through simple polls and voting.

This project was built as part of a CX Engineer take-home assessment to demonstrate how I explore, build, debug, and iterate inside Bolt.

## 🚀 Live App

👉 **Public app link:**  
https://team-naming-poll-yk4g.bolt.host

---

## ✨ Overview

Naming things is hard.  
This app makes it easier by letting users:

- Create a naming poll
- Add name options
- Vote on suggestions
- See results update in real time

The focus of the project is **clarity, correctness, and simplicity**, rather than polish or over-engineering.

---

## 🧩 Core Features

- **Authentication**
  - Email + password sign up and log in
  - Auth-protected routes

- **Poll Management**
  - Create polls with a title and description
  - Edit poll details
  - Delete polls

- **Options & Voting**
  - Add name options to a poll
  - Edit or delete individual options
  - Vote on options
  - View live vote counts

- **Data Integrity**
  - User-scoped data via row-level security
  - Polls and votes are correctly associated with authenticated users

- **Published App**
  - Deployed using Bolt’s hosting
  - Publicly accessible for review

---

## 🧠 Product Intent

This app is intentionally small and opinionated.

It is not meant to be a full-featured polling platform — instead, it focuses on a **single, common coordination problem**:
> *How do we quickly agree on a name without endless back-and-forth?*

The UI and feature set were kept minimal to reduce cognitive load and surface clear user flows.

---

## 💳 Stripe & AI (Bonus Feature Notes)

### Intended Design
The original plan was to include:
- **AI-powered name generation**
  - Generate name ideas from a short description
  - Free users limited to 2 generations
  - Unlimited generations for Pro users

- **Stripe Integration**
  - Trigger upgrade flow once usage limits were exceeded
  - Simple subscription unlock (no complex billing logic)

### Current State
While implementing this flow, I reached a point where:
- Stripe checkout and usage-limit logic were nearly complete
- The app entered a broken state during final wiring
- I ran out of Bolt credits before fully stabilizing the integration

Rather than submitting a partially broken app, I **intentionally reverted** to the last fully working version to preserve:
- App correctness
- Reviewability
- A clean discussion baseline for later interview stages

I’m happy to walk through:
- The intended schema changes
- The Stripe trigger logic
- Where the implementation failed and how I would complete it with more iteration time

---

## 🔍 How to Experience the App

If you’d like a quick way to explore the core functionality:

1. **Create an account**
   - Sign up with an email and password
   - You’ll be redirected to the poll list after logging in

2. **Create a naming poll**
   - Click “Create Poll”
   - Add a title / description (e.g. *“New internal tool name”*)

3. **Add name options**
   - Enter a few candidate names
   - Submit them to see them appear immediately

4. **Vote on options**
   - Cast a vote on one of the names
   - Watch the vote count update in real time

5. **Edit and manage content**
   - Edit a poll’s title or description
   - Edit or delete individual name options within a poll
   - Delete a poll when it’s no longer needed

This flow demonstrates the core create / read / update / delete functionality, as well as authenticated data access and user-scoped permissions.

---

## ⚠️ Known Limitations & Tradeoffs

- **Security audit warnings**
  - Bolt surfaces several security warnings related to RLS policies, SECURITY DEFINER views, and mutable search paths on database functions.
  - These were identified during development, but I was unable to apply Bolt’s automated fixes before running out of credits.
  - Given the scope of this take-home (non-production, single-tenant demo app), these issues were not blockers for demonstrating core functionality, but they would be addressed before any real-world deployment.

- **User display name**
  - A display name is captured during sign-up and was working earlier in development.
  - In the current deployed version, new users appear with the fallback name “User” when voting.
  - This appears to be a regression introduced during later iteration and would be investigated and resolved with additional debugging time.

---

## 🛠️ Tech & Implementation Notes

- Built entirely using **Bolt**
- GitHub integration enabled early to preserve commit history
- Styling kept minimal to prioritize behavior and data flow

---

## 🚀 Live App

👉 **Public app link:**  
https://bolt.new/hosting/request-access/NjMwNjI4NDM.UuDdlz4vJdR_8_UsnYHgYautclmrIp4nfy0OxbQARbw

---

## 📌 Final Note

This project prioritizes **thoughtful iteration, debugging discipline, and clear user flows** over feature breadth.

With additional time and credits, the AI + Stripe functionality would be the next step, but I chose to submit a stable, working product rather than an incomplete premium flow.
