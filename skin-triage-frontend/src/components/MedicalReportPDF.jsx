// Medical Report Generator Utility for DermaTriage

export const downloadMedicalReport = (assessment) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Medical Triage Report - ${assessment.id}</title>
        <style>
          body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            color: #1e293b; 
            line-height: 1.6; 
            padding: 40px; 
            max-width: 800px; 
            margin: 0 auto; 
            background-color: #ffffff;
          }
          .header { 
            border-bottom: 3px solid #0d9488; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
          }
          .logo { 
            font-size: 26px; 
            font-weight: 800; 
            color: #0d9488; 
            letter-spacing: -0.5px;
          }
          .logo span {
            color: #1e293b;
          }
          .title { 
            font-size: 16px; 
            text-transform: uppercase; 
            letter-spacing: 1.5px; 
            color: #64748b; 
            font-weight: 700;
          }
          .meta-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin-bottom: 30px;
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
          }
          .section { 
            margin-bottom: 30px; 
            background: #ffffff; 
            padding: 20px; 
            border-radius: 12px; 
            border: 1px solid #e2e8f0; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          }
          .section-title { 
            font-weight: 800; 
            font-size: 13px; 
            text-transform: uppercase; 
            color: #0d9488; 
            margin-top: 0;
            margin-bottom: 15px; 
            border-bottom: 2px solid #f1f5f9; 
            padding-bottom: 6px; 
            letter-spacing: 0.5px;
          }
          .grid-2 { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
          }
          .label { 
            font-size: 11px; 
            color: #64748b; 
            font-weight: 700; 
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          .value { 
            font-size: 14px; 
            color: #0f172a; 
            margin-bottom: 12px; 
            font-weight: 500;
          }
          .badge { 
            display: inline-block; 
            padding: 6px 12px; 
            border-radius: 6px; 
            font-size: 12px; 
            font-weight: 700; 
            text-transform: uppercase;
          }
          .badge-mild { background-color: #dcfce7; color: #166534; }
          .badge-moderate { background-color: #fef3c7; color: #92400e; }
          .badge-severe { background-color: #fee2e2; color: #991b1b; }
          
          .disclaimer { 
            font-size: 10px; 
            color: #94a3b8; 
            text-align: center; 
            margin-top: 60px; 
            border-top: 1px solid #e2e8f0; 
            padding-top: 20px; 
            line-height: 1.6; 
          }
          .signature-area { 
            margin-top: 60px; 
            display: flex; 
            justify-content: space-between; 
            gap: 50px;
          }
          .sig-box { 
            flex: 1;
            border-top: 1px solid #cbd5e1; 
            text-align: center; 
            font-size: 12px; 
            padding-top: 8px; 
            color: #64748b; 
            font-weight: 600;
          }
          .italic-text {
            font-style: italic;
            color: #334155;
            background-color: #f8fafc;
            padding: 12px 16px;
            border-radius: 8px;
            border-left: 3px solid #cbd5e1;
            margin-bottom: 12px;
            font-size: 13px;
          }
          .doctor-block {
            border-left: 4px solid #0d9488;
            background-color: #f0fdfa;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Derma<span>Triage</span></div>
          <div class="title">Clinical Triage Report</div>
        </div>
        
        <div class="meta-grid">
          <div>
            <div class="label">Patient Name</div>
            <div class="value" style="font-size: 16px; font-weight: 700;">${assessment.patientName}</div>
            <div class="label">Demographics</div>
            <div class="value">${assessment.age} years / ${assessment.gender}</div>
          </div>
          <div>
            <div class="label">Report Reference ID</div>
            <div class="value" style="font-family: monospace; font-weight: 700;">${assessment.id.toUpperCase()}</div>
            <div class="label">Assessment Generated At</div>
            <div class="value">${new Date(assessment.date).toLocaleString()}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Patient Profile & History</div>
          <div class="grid-2">
            <div>
              <div class="label">Patient's Symptoms Description</div>
              <div class="value">${assessment.symptoms}</div>
            </div>
            <div>
              <div class="label">Symptom Timeline</div>
              <div class="value">Active for ${assessment.duration}</div>
              <div class="grid-2">
                <div>
                  <div class="label">Itch Severity</div>
                  <div class="value">${assessment.itching}</div>
                </div>
                <div>
                  <div class="label">Pain Level</div>
                  <div class="value">${assessment.pain}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">AI Analysis Classifier</div>
          <div class="grid-2">
            <div>
              <div class="label">CNN Diagnostic Indication</div>
              <div class="value" style="font-size: 18px; font-weight: 800; color: #0d9488;">${assessment.diseaseName}</div>
              <div class="label">Classifier Confidence</div>
              <div class="value">${assessment.confidence}% probability score</div>
            </div>
            <div>
              <div class="label">Severity Index</div>
              <div class="value" style="margin-top: 4px;">
                <span class="badge badge-${assessment.severity.toLowerCase()}">${assessment.severity}</span>
              </div>
              <div class="label">Clinical Triage Recommendation</div>
              <div class="value" style="font-weight: 700;">${assessment.referral}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Clinical Decision Support Explanation</div>
          <div class="label">AI Generated Report Details (Explainable LLM Model)</div>
          <div class="italic-text">"${assessment.llmExplanation}"</div>
          
          <div class="label" style="margin-top: 15px;">Next Step Action Guidelines</div>
          <div class="value" style="font-size: 13.5px; color: #334155;">${assessment.recommendation}</div>
        </div>

        ${assessment.doctorReplied ? `
        <div class="section doctor-block">
          <div class="section-title" style="color: #0f766e;">Clinical Verification Note</div>
          <div class="label">Authorized Reviewing Dermatologist</div>
          <div class="value" style="font-weight: 700; color: #0f766e;">Dr. Anjali Mehta, MD (Dermatology)</div>
          
          <div class="label">Verification Comments</div>
          <div class="italic-text" style="background-color: #ffffff; border-left-color: #0d9488;">
            "${assessment.doctorFeedback}"
          </div>
          
          <div class="label">Signature Timestamp</div>
          <div class="value" style="font-size: 12px; margin-bottom: 0;">${new Date(assessment.doctorRepliedAt).toLocaleString()}</div>
        </div>
        ` : ''}

        <div class="signature-area">
          <div class="sig-box">Patient Acknowledgment Signature</div>
          <div class="sig-box">
            ${assessment.doctorReplied ? 'Dr. Anjali Mehta, MD' : 'Automated AI Triage Seal'}
          </div>
        </div>

        <div class="disclaimer">
          <strong>LEGAL & SAFETY STATEMENT:</strong> This document is generated as part of a computerized medical decision-support audit. All diagnostic outputs, confidence scores, and visual segmentation overlays are simulated calculations. This does not constitute professional medical diagnosis. Patients are requested to present this summary report to an accredited dermatologist or emergency care clinic for proper clinical care.
        </div>
      </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DermaTriage_Report_${assessment.id}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
