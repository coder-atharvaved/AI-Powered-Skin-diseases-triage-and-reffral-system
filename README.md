# AI-Powered Skin Disease Triage & Referral System

> **Prototype** — Interpretable AI for dermatology triage using Concept Bottleneck Models (CBM) + EfficientNet-B0

---

## 🎯 Problem Statement

- **Dermatologist shortage** in India: ~1 per 100,000 patients
- **Delayed diagnosis** → worse outcomes for skin cancer, infections, chronic conditions
- **Primary care physicians** lack dermatology expertise for triage

**Our Solution:** An AI system that **explains its reasoning** — not just *what* disease, but *why* — enabling confident referrals.

---

## 🧠 Approach: Concept Bottleneck Model (CBM)

```
Image → EfficientNet-B0 → 96 Clinical Concepts → 6 Disease Classes
              ↓                    ↓                    ↓
        Visual Features      Interpretable Concepts   Final Prediction
        (black box)          (scaling, erythema,      (Vitiligo, Tinea,
                             well-defined borders,     Cruris, Tinea
                             central clearing, etc.)   Corporis, Scabies,
                                                         Acne, Psoriasis)
```

**Why CBM?**
- ✅ **Interpretable** — Doctors see *which clinical concepts* drove the prediction
- ✅ **Trustworthy** — Can verify/correct concept predictions
- ✅ **Regulatory-friendly** — Explainability required for medical AI
- ✅ **Grad-CAM** — Visual heatmap shows *where* model looks

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │    Backend      │     │   ML Pipeline   │
│   (React 19)    │────▶│   (FastAPI)     │────▶│   (PyTorch)     │
│                 │     │                 │     │                 │
│ • Patient UI    │     │ • REST API      │     │ • EfficientNet-B0│
│ • Doctor Queue  │     │ • Auth (JWT)    │     │ • CBM Head      │
│ • Admin Charts  │     │ • SQLite/Postgres│    │ • Grad-CAM      │
│ • PDF Reports   │     │ • File Upload   │     │ • Triage Logic  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Data Flow:**
1. Patient uploads lesion image + symptoms
2. Backend preprocesses → EfficientNet-B0 extracts features
3. CBM predicts 96 clinical concepts → 6 disease probabilities
4. Grad-CAM generates attention heatmap on last conv layer
5. Triage logic assigns severity + referral urgency
6. Frontend displays: **Diagnosis + Confidence + Heatmap + Concept Explanations**
7. Doctor reviews uncertain cases → adds feedback (retraining signal)

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### Backend
```bash
cd skin-triage-backend

# Install dependencies
pip install -r models/requirements.txt

# Run server (port 8081)
uvicorn app.main:app --reload --port 8081
```

### Frontend
```bash
cd skin-triage-frontend

# Install dependencies
npm install

# Run dev server (port 5173)
npm run dev
```

### Access
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8081
- **API Docs (Swagger):** http://localhost:8081/docs

---

## 🎬 Demo Walkthrough

### 1. Patient Flow
```
Landing → Register/Login → Upload Photo + Symptoms → AI Analysis → Results
                                                              ↓
                                        Disease + Confidence + Severity
                                        Grad-CAM Heatmap (slider overlay)
                                        CBM Concept Explanations
                                        Download Medical Report (PDF)
```

### 2. Doctor Flow
```
Login (Doctor) → Review Queue → View Case + Heatmap → Add Feedback → Verify/Modify
```

### 3. Admin Flow
```
Login (Admin) → Dashboard → Statistics Charts → User Management
```

---

## 📊 Model Performance (Prototype)

| Metric | Value |
|--------|-------|
| **Top-1 Accuracy** | ~79% (6 classes) |
| **Concept F1 (avg)** | ~0.72 |
| **Inference Time** | ~200ms (CPU) |
| **Model Size** | ~20 MB (EfficientNet-B0) |

**Disease Classes:** Vitiligo, Tinea Cruris, Tinea Corporis, Scabies, Acne, Psoriasis

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **ML Backbone** | EfficientNet-B0 (timm) |
| **Architecture** | Concept Bottleneck Model (custom) |
| **Explainability** | Grad-CAM + Concept Scores |
| **Backend** | FastAPI, SQLAlchemy, SQLite |
| **Frontend** | React 19, Vite, Tailwind CSS v4 |
| **Charts** | Recharts |
| **PDF** | Custom React-PDF renderer |
| **Auth** | JWT (prototype) / Session (current) |

---

## 📁 Project Structure

```
AI-Powered-Skin-diseases-triage-and-reffral-system/
├── skin-triage-backend/
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py              # FastAPI app, all endpoints
│   ├── models/
│   │   ├── requirements.txt     # Python dependencies
│   │   ├── cbm_effnet_top6_v1(1).pth
│   │   └── cbm_top6_v3_79acc.pth
│   └── SkinTriage_Report_pred-20260803-0041.txt
│
├── skin-triage-frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── Auth.jsx
│   │   │   ├── PatientDashboard.jsx
│   │   │   ├── DoctorDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── MedicalReportPDF.jsx
│   │   ├── services/
│   │   │   └── api.js           # API client + mock Grad-CAM
│   │   ├── App.jsx              # Routing + state
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Tailwind imports
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── README.md                    # This file
├── architecture.png             # Architecture diagram
└── demo-video.mp4               # 2-min demo recording
```

---

## 🔮 Roadmap (Post-Prototype)

- [ ] **Production Auth** — JWT, refresh tokens, role-based access
- [ ] **PostgreSQL** — Replace SQLite for concurrency
- [ ] **Docker & CI/CD** — Containerize, auto-deploy
- [ ] **Model Improvements** — More classes, calibration, ensemble
- [ ] **Real-time** — WebSocket for doctor queue updates
- [ ] **Mobile App** — React Native for field workers
- [ ] **Teledermatology Integration** — Direct referral to specialists
- [ ] **Clinical Validation** — Partner with dermatology departments

---

## 👨‍💻 Team

**Atharva Ved** — Full Stack + ML Engineering  
*Solo prototype for National Hackathon*

---

## 📄 License

MIT License — See LICENSE file for details.

---

## 🙏 Acknowledgments

- **Concept Bottleneck Models** — Koh et al., ICML 2020
- **EfficientNet** — Tan & Le, ICML 2019
- **Grad-CAM** — Selvaraju et al., ICCV 2017
- **ISIC Archive** — Skin lesion dataset inspiration
- **Open Source Community** — PyTorch, FastAPI, React, Tailwind

---

> **Built for hackathon prototype demonstration.**  
> **Production hardening planned post-event.**