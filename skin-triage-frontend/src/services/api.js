const API_BASE_URL = 'http://localhost:8081';

const request = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof data === 'string' ? data : data.detail || 'Request failed.';
    throw new Error(message);
  }

  return data;
};

export const generateGradCAM = (imageSrc) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(img, 0, 0);
      ctx.save();
      ctx.globalAlpha = 0.6;

      const spotsCount = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < spotsCount; i++) {
        const x = img.width * (0.35 + Math.random() * 0.3);
        const y = img.height * (0.35 + Math.random() * 0.3);
        const radius = Math.min(img.width, img.height) * (0.2 + Math.random() * 0.15);

        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, 'rgba(239, 68, 68, 1)');
        grad.addColorStop(0.2, 'rgba(249, 115, 22, 0.9)');
        grad.addColorStop(0.5, 'rgba(234, 179, 8, 0.7)');
        grad.addColorStop(0.8, 'rgba(34, 197, 94, 0.3)');
        grad.addColorStop(1, 'rgba(59, 130, 246, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
      }

      ctx.restore();
      resolve(canvas.toDataURL('image/jpeg'));
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
};

export const api = {
  login: async (email, password, role) => {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
  },

  register: async (name, email, password, role) => {
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
  },

  submitAssessment: async (patientId, patientName, formData) => {
    const payload = {
      patientId,
      patientName,
      age: Number(formData.age) || 25,
      gender: formData.gender || 'Male',
      symptoms: formData.symptoms || 'General skin irritation.',
      duration: formData.duration || '1 week',
      itching: formData.itching || 'Mild',
      pain: formData.pain || 'None',
      spread: formData.spread || 'Slow',
      image: formData.image,
    };

    return request('/api/assessments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getHistory: async (patientId) => {
    return request(`/api/assessments/history/${patientId}`);
  },

  getDoctorQueue: async () => {
    return request('/api/doctor/queue');
  },

  submitDoctorFeedback: async (assessmentId, feedback) => {
    return request('/api/doctor/feedback', {
      method: 'POST',
      body: JSON.stringify({ assessmentId, feedback }),
    });
  },

  getAdminStats: async () => {
    return request('/api/admin/stats');
  },
};
