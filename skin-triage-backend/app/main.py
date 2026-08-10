from __future__ import annotations

import base64
import hashlib
import io
import sqlite3
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Literal

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    import torch
    import numpy as np
    import torch.nn as nn
    from torchvision import transforms, models
    from PIL import Image
except ImportError:  # pragma: no cover - optional runtime dependency
    torch = None
    np = None
    nn = None
    transforms = None
    models = None
    Image = None

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "dermatriage.db"
MODEL_DIR = BASE_DIR / "models"
DATA_DIR.mkdir(parents=True, exist_ok=True)
MODEL_DIR.mkdir(parents=True, exist_ok=True)

MODEL_CLASS_NAMES = [
    "Vitiligo",
    "Tinea Cruris",
    "Tinea Corporis",
    "Scabies",
    "Acne",
    "Psoriasis",
]
MODEL_CHECKPOINT_NAME = "cbm_effnet_top6_v1(1).pth"
NUM_CONCEPTS = 96
CONFIDENCE_THRESHOLD = 50.0  # below this, flag as uncertain and recommend review

app = FastAPI(title="DermaTriage API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    specialization TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS assessments (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    symptoms TEXT,
    duration TEXT,
    itching TEXT,
    pain TEXT,
    spread TEXT,
    disease_name TEXT NOT NULL,
    confidence REAL NOT NULL,
    severity TEXT NOT NULL,
    referral TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    llm_explanation TEXT NOT NULL,
    date TEXT NOT NULL,
    image TEXT NOT NULL,
    heatmap TEXT NOT NULL,
    doctor_feedback TEXT,
    doctor_replied INTEGER NOT NULL DEFAULT 0,
    doctor_replied_at TEXT,
    FOREIGN KEY(patient_id) REFERENCES users(id)
);
"""


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)
    role: Literal["patient", "doctor", "admin"]


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1)
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)
    role: Literal["patient", "doctor", "admin"]


class AssessmentPayload(BaseModel):
    patientId: str
    patientName: str
    age: int
    gender: str
    symptoms: str = ""
    duration: str = "1 week"
    itching: str = "Mild"
    pain: str = "None"
    spread: str = "Slow"
    image: str


class DoctorFeedbackPayload(BaseModel):
    assessmentId: str
    feedback: str = Field(..., min_length=1)


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ----------------------------------------------------------------------------
# ML MODEL: EfficientNet-B0 + Concept Bottleneck Model
# ----------------------------------------------------------------------------
class EfficientCBM(nn.Module if nn is not None else object):
    def __init__(self, num_concepts, num_classes, pretrained=False):
        super().__init__()
        base = models.efficientnet_b0(weights=None)  # weights loaded from our checkpoint, not ImageNet, at inference time
        self.features = base.features        # conv feature extractor -> genuinely spatial feature maps
        self.avgpool = base.avgpool
        feat_dim = base.classifier[1].in_features  # 1280 for EfficientNet-B0

        self.concept_head = nn.Sequential(
            nn.Linear(feat_dim, 256), nn.ReLU(inplace=True), nn.Dropout(0.3),
            nn.Linear(256, num_concepts),
        )
        self.classifier = nn.Sequential(
            nn.Linear(feat_dim + num_concepts, 256), nn.ReLU(inplace=True), nn.Dropout(0.3),
            nn.Linear(256, num_classes),
        )

    def forward(self, x):
        spatial_feats = self.features(x)                        # (B, 1280, 7, 7)
        pooled = torch.flatten(self.avgpool(spatial_feats), 1)  # (B, 1280)
        concept_logits = self.concept_head(pooled)
        combined = torch.cat([pooled, concept_logits], dim=1)
        class_logits = self.classifier(combined)
        return concept_logits, class_logits


EVAL_TRANSFORM = None
if transforms is not None:
    EVAL_TRANSFORM = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])


# ----------------------------------------------------------------------------
# GRAD-CAM: EfficientNet is a pure CNN, so this is a clean, standard Grad-CAM
# on genuine spatial conv feature maps -- no permute/attention-sink workaround
# needed (unlike the earlier Swin Transformer backbone).
# ----------------------------------------------------------------------------
def compute_gradcam(model, tensor, target_idx):
    try:
        model.zero_grad()
        feats = model.features(tensor)   # (1, 1280, 7, 7) -- already channels-first, spatial
        feats.retain_grad()

        pooled = torch.flatten(model.avgpool(feats), 1)
        concept_logits = model.concept_head(pooled)
        combined = torch.cat([pooled, concept_logits], dim=1)
        class_logits = model.classifier(combined)

        score = class_logits[0, target_idx]
        score.backward()

        grads = feats.grad[0]            # (C, H, W)
        activations = feats[0].detach()  # (C, H, W)
        weights = grads.mean(dim=[1, 2])  # (C,) channel importance

        cam = torch.zeros(activations.shape[1:], dtype=torch.float32)
        for i, w in enumerate(weights):
            cam += w * activations[i]
        cam = torch.relu(cam)

        # Percentile-based normalization (kept from the Swin version as a general
        # safety measure against any outlier activations)
        cam_flat = cam.flatten()
        clip_value = torch.quantile(cam_flat, 0.95)
        cam = torch.clamp(cam, max=clip_value.item())
        cam = cam / (clip_value.item() + 1e-8)
        return cam.detach().numpy()
    except Exception as e:
        print(f"[GradCAM] Failed to compute: {e}")
        return None


def overlay_heatmap(orig_img, cam) -> str:
    cam_img = Image.fromarray(np.uint8(cam * 255)).resize(orig_img.size, Image.BILINEAR)
    cam_arr = np.array(cam_img).astype(np.float32) / 255.0

    r = np.clip(1.5 - np.abs(4 * cam_arr - 3), 0, 1)
    g = np.clip(1.5 - np.abs(4 * cam_arr - 2), 0, 1)
    b = np.clip(1.5 - np.abs(4 * cam_arr - 1), 0, 1)
    heat_rgb = (np.stack([r, g, b], axis=-1) * 255).astype(np.uint8)
    heat_img = Image.fromarray(heat_rgb).convert("RGB")

    orig_rgb = orig_img.convert("RGB")
    blended = Image.blend(orig_rgb, heat_img, alpha=0.5)

    buf = io.BytesIO()
    blended.save(buf, format="JPEG", quality=85)
    encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{encoded}"


def load_model_checkpoint() -> Any | None:
    if torch is None or models is None:
        print("[AI Model] torch/torchvision not installed, skipping model load.")
        return None

    checkpoint_path = MODEL_DIR / MODEL_CHECKPOINT_NAME
    if not checkpoint_path.exists():
        print(f"[AI Model] Checkpoint not found at {checkpoint_path}")
        return None

    try:
        model = EfficientCBM(num_concepts=NUM_CONCEPTS, num_classes=len(MODEL_CLASS_NAMES), pretrained=False)
        state_dict = torch.load(checkpoint_path, map_location="cpu")
        model.load_state_dict(state_dict)
        model.eval()
        print(f"[AI Model] Loaded successfully from {checkpoint_path}")
        return model
    except Exception as e:
        print(f"[AI Model] Failed to load: {e}")
        return None


MODEL_PREDICTOR = load_model_checkpoint()


def init_db() -> None:
    conn = get_connection()
    conn.executescript(SCHEMA)

    existing_users = conn.execute("SELECT COUNT(*) AS count FROM users").fetchone()["count"]
    if existing_users == 0:
        now = datetime.utcnow().isoformat()
        seed_users = [
            {
                "id": "usr-patient-1",
                "name": "Rahul Sharma",
                "email": "patient@demo.com",
                "password_hash": hash_password("password"),
                "role": "patient",
                "specialization": None,
                "created_at": now,
            },
            {
                "id": "usr-doctor-1",
                "name": "Dr. Anjali Mehta",
                "email": "doctor@demo.com",
                "password_hash": hash_password("password"),
                "role": "doctor",
                "specialization": "Dermatologist",
                "created_at": now,
            },
            {
                "id": "usr-admin-1",
                "name": "System Admin",
                "email": "admin@demo.com",
                "password_hash": hash_password("password"),
                "role": "admin",
                "specialization": None,
                "created_at": now,
            },
        ]
        conn.executemany(
            """
            INSERT INTO users (id, name, email, password_hash, role, specialization, created_at)
            VALUES (:id, :name, :email, :password_hash, :role, :specialization, :created_at)
            """,
            seed_users,
        )

    existing_assessments = conn.execute("SELECT COUNT(*) AS count FROM assessments").fetchone()["count"]
    if existing_assessments == 0:
        sample_date = (datetime.utcnow() - timedelta(days=1)).isoformat()
        sample_assessments = [
            {
                "id": "ast-101",
                "patient_id": "usr-patient-1",
                "patient_name": "Rahul Sharma",
                "age": 28,
                "gender": "Male",
                "symptoms": "Red patches, mild scaling on elbows and knees, occasional itching.",
                "duration": "3 weeks",
                "itching": "Moderate",
                "pain": "None",
                "spread": "Slow",
                "disease_name": "Psoriasis",
                "confidence": 84.5,
                "severity": "Moderate",
                "referral": "Dermatologist Visit",
                "recommendation": "Recommend booking a face-to-face consultation. Avoid scrubbing the scales. Moisturize frequently with ointment.",
                "llm_explanation": "The AI model has detected Psoriasis with high confidence. This is a common autoimmune skin condition characterized by plaques of thick, red skin with silver scales. Symptoms match moderate scaling and localized patches. It is recommended to consult a dermatologist for topical corticosteroid treatment.",
                "date": sample_date,
                "image": "https://images.unsplash.com/photo-1584617508493-21b2c4825902?w=400&auto=format&fit=crop&q=60",
                "heatmap": "https://images.unsplash.com/photo-1584617508493-21b2c4825902?w=400&auto=format&fit=crop&q=60",
                "doctor_feedback": "Verified. Looks like plaque psoriasis. Scheduled topical cream therapy.",
                "doctor_replied": 1,
                "doctor_replied_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
            }
        ]
        conn.executemany(
            """
            INSERT INTO assessments (
                id, patient_id, patient_name, age, gender, symptoms, duration, itching, pain, spread,
                disease_name, confidence, severity, referral, recommendation, llm_explanation, date,
                image, heatmap, doctor_feedback, doctor_replied, doctor_replied_at
            ) VALUES (
                :id, :patient_id, :patient_name, :age, :gender, :symptoms, :duration, :itching, :pain, :spread,
                :disease_name, :confidence, :severity, :referral, :recommendation, :llm_explanation, :date,
                :image, :heatmap, :doctor_feedback, :doctor_replied, :doctor_replied_at
            )
            """,
            sample_assessments,
        )

    conn.commit()
    conn.close()


def decode_base64_image(image_str: str):
    """payload.image is a base64 data URL, e.g. 'data:image/jpeg;base64,XXXX'."""
    if "," in image_str:
        image_str = image_str.split(",", 1)[1]
    image_bytes = base64.b64decode(image_str)
    return Image.open(io.BytesIO(image_bytes)).convert("RGB")


def build_response(disease_name: str, confidence: float) -> dict[str, Any]:
    """Maps a predicted disease + confidence into severity/referral/recommendation."""
    if confidence < CONFIDENCE_THRESHOLD:
        return {
            "diseaseName": f"Possible {disease_name} (uncertain)",
            "confidence": confidence,
            "severity": "Moderate",
            "referral": "Visit a Dermatologist",
            "recommendation": "The model's confidence is low for this image. Please consult a dermatologist for an accurate diagnosis rather than relying on this result alone.",
            "llmExplanation": f"The AI model's top guess is {disease_name}, but confidence is below the reliable threshold. Manual review by a specialist is recommended.",
        }

    if disease_name == "Psoriasis":
        return {
            "diseaseName": disease_name,
            "confidence": confidence,
            "severity": "Moderate",
            "referral": "Visit a Dermatologist",
            "recommendation": "Recommend booking a face-to-face consultation. Avoid scrubbing the scales. Moisturize frequently with ointment.",
            "llmExplanation": "The AI model detected Psoriasis. This is a common autoimmune skin condition characterized by plaques of thick, red skin with silver scales. A dermatologist consult is recommended for topical corticosteroid treatment.",
        }
    if disease_name in ("Tinea Corporis", "Tinea Cruris"):
        return {
            "diseaseName": disease_name,
            "confidence": confidence,
            "severity": "Mild",
            "referral": "Stay at Home",
            "recommendation": "Use over-the-counter topical antifungal cream (like Clotrimazole) twice daily for 2 weeks. Keep the area clean and dry. Avoid sharing towels.",
            "llmExplanation": f"The AI model detected a fungal infection pattern consistent with {disease_name}. Standard antifungal treatment and skin hygiene are the appropriate home-care guidance. If symptoms don't improve within 2 weeks, seek a dermatologist.",
        }
    if disease_name == "Scabies":
        return {
            "diseaseName": disease_name,
            "confidence": confidence,
            "severity": "Moderate",
            "referral": "Visit a Dermatologist",
            "recommendation": "Scabies requires prescription treatment (e.g., permethrin cream). Please consult a dermatologist. Wash all bedding/clothing in hot water to prevent spread.",
            "llmExplanation": "The AI model detected patterns consistent with Scabies, a contagious skin infestation. Prescription treatment and household decontamination are needed.",
        }
    if disease_name == "Vitiligo":
        return {
            "diseaseName": disease_name,
            "confidence": confidence,
            "severity": "Mild",
            "referral": "Visit a Dermatologist",
            "recommendation": "Vitiligo is a chronic pigmentation condition. While not medically urgent, a dermatologist can discuss treatment options (topical steroids, phototherapy) and rule out other causes.",
            "llmExplanation": "The AI model detected depigmented patches consistent with Vitiligo. This is an autoimmune condition affecting melanocytes.",
        }
    # Acne (default)
    return {
        "diseaseName": disease_name,
        "confidence": confidence,
        "severity": "Mild",
        "referral": "Stay at Home",
        "recommendation": "Maintain a gentle skincare routine using salicylic acid or benzoyl peroxide cleansers. Avoid picking or squeezing lesions. Consult a dermatologist if it persists.",
        "llmExplanation": "The AI model detected Acne, a common condition from clogged hair follicles. Mild severity, suitable for home care.",
    }


def predict_condition(payload: AssessmentPayload) -> tuple[dict[str, Any], str | None]:
    if MODEL_PREDICTOR is not None and EVAL_TRANSFORM is not None:
        try:
            img = decode_base64_image(payload.image)
            tensor = EVAL_TRANSFORM(img).unsqueeze(0)

            with torch.no_grad():
                _, class_logits = MODEL_PREDICTOR(tensor)
                probs = torch.softmax(class_logits, dim=1)
                confidence = float(probs.max().item() * 100.0)
                predicted_index = int(torch.argmax(probs, dim=1).item())
                predicted_name = MODEL_CLASS_NAMES[predicted_index]

            heatmap_data_url = None
            cam = compute_gradcam(MODEL_PREDICTOR, tensor, predicted_index)
            if cam is not None:
                heatmap_data_url = overlay_heatmap(img, cam)

            return build_response(predicted_name, confidence), heatmap_data_url
        except Exception as e:
            print(f"[AI Model] Prediction failed, falling back to rule-based: {e}")

    # Fallback: simple rule-based logic (safety net if model fails to load/predict)
    if payload.itching == "Severe":
        return build_response("Psoriasis", 70.0), None
    return build_response("Acne", 75.0), None


@app.on_event("startup")
def startup_event() -> None:
    init_db()


@app.get("/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "model_loaded": MODEL_PREDICTOR is not None}


@app.post("/api/auth/login")
def login(payload: LoginRequest) -> dict[str, Any]:
    conn = get_connection()
    user = conn.execute(
        "SELECT * FROM users WHERE email = ? AND role = ?",
        (payload.email.strip().lower(), payload.role),
    ).fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email, password, or role combination.")

    if user["password_hash"] != hash_password(payload.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email, password, or role combination.")

    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "specialization": user["specialization"],
    }


@app.post("/api/auth/register")
def register(payload: RegisterRequest) -> dict[str, Any]:
    conn = get_connection()
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (payload.email.strip().lower(),)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists.")

    user_id = f"usr-{uuid.uuid4().hex[:8]}"
    now = datetime.utcnow().isoformat()
    conn.execute(
        """
        INSERT INTO users (id, name, email, password_hash, role, specialization, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            payload.name.strip(),
            payload.email.strip().lower(),
            hash_password(payload.password),
            payload.role,
            None if payload.role != "doctor" else "Dermatologist",
            now,
        ),
    )
    conn.commit()
    conn.close()

    return {
        "id": user_id,
        "name": payload.name.strip(),
        "email": payload.email.strip().lower(),
        "role": payload.role,
        "specialization": None if payload.role != "doctor" else "Dermatologist",
    }


@app.post("/api/assessments")
def submit_assessment(payload: AssessmentPayload) -> dict[str, Any]:
    conn = get_connection()
    patient_exists = conn.execute("SELECT id FROM users WHERE id = ?", (payload.patientId,)).fetchone()
    if not patient_exists:
        conn.close()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient account not found.")

    prediction, heatmap = predict_condition(payload)
    assessment_id = f"ast-{uuid.uuid4().hex[:8]}"
    now = datetime.utcnow().isoformat()

    row = {
        "id": assessment_id,
        "patient_id": payload.patientId,
        "patient_name": payload.patientName.strip(),
        "age": int(payload.age),
        "gender": payload.gender,
        "symptoms": payload.symptoms.strip(),
        "duration": payload.duration,
        "itching": payload.itching,
        "pain": payload.pain,
        "spread": payload.spread,
        "disease_name": prediction["diseaseName"],
        "confidence": float(prediction["confidence"]),
        "severity": prediction["severity"],
        "referral": prediction["referral"],
        "recommendation": prediction["recommendation"],
        "llm_explanation": prediction["llmExplanation"],
        "date": now,
        "image": payload.image,
        "heatmap": heatmap if heatmap else payload.image,
        "doctor_feedback": None,
        "doctor_replied": 0,
        "doctor_replied_at": None,
    }

    conn.execute(
        """
        INSERT INTO assessments (
            id, patient_id, patient_name, age, gender, symptoms, duration, itching, pain, spread,
            disease_name, confidence, severity, referral, recommendation, llm_explanation, date,
            image, heatmap, doctor_feedback, doctor_replied, doctor_replied_at
        ) VALUES (
            :id, :patient_id, :patient_name, :age, :gender, :symptoms, :duration, :itching, :pain, :spread,
            :disease_name, :confidence, :severity, :referral, :recommendation, :llm_explanation, :date,
            :image, :heatmap, :doctor_feedback, :doctor_replied, :doctor_replied_at
        )
        """,
        row,
    )
    conn.commit()
    conn.close()

    return {
        "id": row["id"],
        "patientId": row["patient_id"],
        "patientName": row["patient_name"],
        "age": row["age"],
        "gender": row["gender"],
        "symptoms": row["symptoms"],
        "duration": row["duration"],
        "itching": row["itching"],
        "pain": row["pain"],
        "spread": row["spread"],
        "diseaseName": row["disease_name"],
        "confidence": row["confidence"],
        "severity": row["severity"],
        "referral": row["referral"],
        "recommendation": row["recommendation"],
        "llmExplanation": row["llm_explanation"],
        "date": row["date"],
        "image": row["image"],
        "heatmap": row["heatmap"],
        "doctorFeedback": row["doctor_feedback"],
        "doctorReplied": False,
        "doctorRepliedAt": None,
    }


@app.get("/api/assessments/history/{patient_id}")
def get_history(patient_id: str) -> list[dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM assessments WHERE patient_id = ? ORDER BY date DESC",
        (patient_id,),
    ).fetchall()
    conn.close()

    return [
        {
            "id": row["id"],
            "patientId": row["patient_id"],
            "patientName": row["patient_name"],
            "age": row["age"],
            "gender": row["gender"],
            "symptoms": row["symptoms"],
            "duration": row["duration"],
            "itching": row["itching"],
            "pain": row["pain"],
            "spread": row["spread"],
            "diseaseName": row["disease_name"],
            "confidence": row["confidence"],
            "severity": row["severity"],
            "referral": row["referral"],
            "recommendation": row["recommendation"],
            "llmExplanation": row["llm_explanation"],
            "date": row["date"],
            "image": row["image"],
            "heatmap": row["heatmap"],
            "doctorFeedback": row["doctor_feedback"],
            "doctorReplied": bool(row["doctor_replied"]),
            "doctorRepliedAt": row["doctor_replied_at"],
        }
        for row in rows
    ]


@app.get("/api/doctor/queue")
def get_doctor_queue() -> list[dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT * FROM assessments
        WHERE severity IN ('Moderate', 'Severe') OR referral <> 'Stay at Home'
        ORDER BY date DESC
        """
    ).fetchall()
    conn.close()

    return [
        {
            "id": row["id"],
            "patientId": row["patient_id"],
            "patientName": row["patient_name"],
            "age": row["age"],
            "gender": row["gender"],
            "symptoms": row["symptoms"],
            "duration": row["duration"],
            "itching": row["itching"],
            "pain": row["pain"],
            "spread": row["spread"],
            "diseaseName": row["disease_name"],
            "confidence": row["confidence"],
            "severity": row["severity"],
            "referral": row["referral"],
            "recommendation": row["recommendation"],
            "llmExplanation": row["llm_explanation"],
            "date": row["date"],
            "image": row["image"],
            "heatmap": row["heatmap"],
            "doctorFeedback": row["doctor_feedback"],
            "doctorReplied": bool(row["doctor_replied"]),
            "doctorRepliedAt": row["doctor_replied_at"],
        }
        for row in rows
    ]


@app.post("/api/doctor/feedback")
def submit_doctor_feedback(payload: DoctorFeedbackPayload) -> dict[str, Any]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM assessments WHERE id = ?", (payload.assessmentId,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found.")

    now = datetime.utcnow().isoformat()
    conn.execute(
        "UPDATE assessments SET doctor_feedback = ?, doctor_replied = 1, doctor_replied_at = ? WHERE id = ?",
        (payload.feedback.strip(), now, payload.assessmentId),
    )
    conn.commit()
    updated = conn.execute("SELECT * FROM assessments WHERE id = ?", (payload.assessmentId,)).fetchone()
    conn.close()

    return {
        "id": updated["id"],
        "patientId": updated["patient_id"],
        "patientName": updated["patient_name"],
        "age": updated["age"],
        "gender": updated["gender"],
        "symptoms": updated["symptoms"],
        "duration": updated["duration"],
        "itching": updated["itching"],
        "pain": updated["pain"],
        "spread": updated["spread"],
        "diseaseName": updated["disease_name"],
        "confidence": updated["confidence"],
        "severity": updated["severity"],
        "referral": updated["referral"],
        "recommendation": updated["recommendation"],
        "llmExplanation": updated["llm_explanation"],
        "date": updated["date"],
        "image": updated["image"],
        "heatmap": updated["heatmap"],
        "doctorFeedback": updated["doctor_feedback"],
        "doctorReplied": bool(updated["doctor_replied"]),
        "doctorRepliedAt": updated["doctor_replied_at"],
    }


@app.get("/api/admin/stats")
def get_admin_stats() -> dict[str, Any]:
    conn = get_connection()
    assessments = conn.execute("SELECT * FROM assessments ORDER BY date DESC").fetchall()
    users = conn.execute("SELECT * FROM users").fetchall()
    conn.close()

    disease_counts: dict[str, int] = {}
    severity_counts = {"Mild": 0, "Moderate": 0, "Severe": 0}
    referral_counts = {"Stay at Home": 0, "Visit a Dermatologist": 0, "Seek Emergency Care": 0}

    for row in assessments:
        disease_counts[row["disease_name"]] = disease_counts.get(row["disease_name"], 0) + 1
        severity_counts[row["severity"]] = severity_counts.get(row["severity"], 0) + 1

        if "Emergency" in row["referral"]:
            referral_counts["Seek Emergency Care"] += 1
        elif "Dermatologist" in row["referral"]:
            referral_counts["Visit a Dermatologist"] += 1
        else:
            referral_counts["Stay at Home"] += 1

    activity_data = []
    for offset in range(4, -1, -1):
        day = datetime.utcnow() - timedelta(days=offset)
        label = day.strftime("%b %d")
        count = sum(1 for row in assessments if datetime.fromisoformat(row["date"]).date() == day.date())
        activity_data.append({"date": label, "count": count})

    recent_assessments = [
        {
            "id": row["id"],
            "patientName": row["patient_name"],
            "age": row["age"],
            "gender": row["gender"],
            "diseaseName": row["disease_name"],
            "confidence": row["confidence"],
            "severity": row["severity"],
            "referral": row["referral"],
            "doctorReplied": bool(row["doctor_replied"]),
        }
        for row in assessments[:5]
    ]

    return {
        "totalAssessments": len(assessments),
        "totalUsers": len(users),
        "totalPatients": sum(1 for user in users if user["role"] == "patient"),
        "totalDoctors": sum(1 for user in users if user["role"] == "doctor"),
        "diseaseData": [{"name": name, "value": value} for name, value in disease_counts.items()],
        "severityData": [{"name": name, "value": value} for name, value in severity_counts.items()],
        "referralData": [{"name": name, "value": value} for name, value in referral_counts.items()],
        "activityData": activity_data,
        "recentAssessments": recent_assessments,
    }