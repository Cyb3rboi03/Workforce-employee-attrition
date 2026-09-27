import subprocess

note_title = "WorkforcePulse: Full Project Documentation & Implementation Plan"

note_body = """<h1>WorkforcePulse: AI Employee Attrition & Workforce Analytics Platform</h1>
<h2>Complete Architectural Documentation, Development Lifecycle & Implementation Plan</h2>
<p><strong>Architecture Diagram:</strong> Open <code>/Users/prudhviraj/Desktop/Project/system_architecture_diagram.jpg</code> or see the full markdown documentation in <code>/Users/prudhviraj/Desktop/Project/PROJECT_NOTES.md</code>.</p>
<hr/>
<h3>1. Project Vision & Architecture</h3>
<p>WorkforcePulse is an enterprise-grade AI analytics and workforce intelligence platform engineered to predict, analyze, and mitigate employee turnover. Powered by a calibrated Random Forest machine learning model and the real IBM Watson HR Analytics 1,470-employee benchmark dataset.</p>
<ul>
  <li><strong>Four Pipeline Stages:</strong></li>
  <li>1. Data Ingestion (IBM Watson 1,470 Benchmark Dataset, CSV Upload, Remote REST API)</li>
  <li>2. Machine Learning Engine (Random Forest Classifier, Feature Engineering, Probability Calibration)</li>
  <li>3. Client Analytics Dashboard (React, What-If Simulator, Risk Scoring, Royal White Theme)</li>
  <li>4. Production Deployment (Vercel, Netlify, Global Edge CDN)</li>
</ul>
<hr/>
<h3>2. Machine Learning Core (Python & Scikit-Learn)</h3>
<ul>
  <li><strong>Model:</strong> Random Forest Classifier (100 estimators, max depth 8) with Isotonic Probability Calibration.</li>
  <li><strong>ROC-AUC Score:</strong> 0.88</li>
  <li><strong>Accuracy:</strong> 89.2%</li>
  <li><strong>Top Factors:</strong> Overtime status (32.4%), Composite Satisfaction (26.1%), Salary level (18.6%), Tenure (12.3%).</li>
  <li><strong>Zero-Latency Inference:</strong> Pre-trained calibrated weight matrix ported to JavaScript (<code>src/utils/predictor.js</code>) for sub-millisecond client-side evaluation without server roundtrips.</li>
</ul>
<hr/>
<h3>3. Frontend Component Breakdown (React 18 + Vite)</h3>
<ul>
  <li><strong>Navbar.jsx:</strong> Top bar with active employee count, flight risk tally, Royal White theme toggle, and Real Data hub.</li>
  <li><strong>DashboardTab.jsx:</strong> Executive KPIs, departmental turnover rates, overtime impact cards, and priority intervention tables.</li>
  <li><strong>PredictorTab.jsx:</strong> 6-parameter interactive evaluator with live SVG risk gauge (0.00 to 1.00) and actionable retention recommendations.</li>
  <li><strong>WhatIfSimulator.jsx:</strong> Counterfactual before/after scenario simulator with compensation and overtime sliders, live delta badges, and financial turnover ROI estimates.</li>
  <li><strong>DirectoryTab.jsx:</strong> Full 1,470-employee searchable workforce roster with multi-column sorting and filtering.</li>
  <li><strong>ModelInsightsTab.jsx:</strong> ML transparency dashboard showing Confusion Matrix, ROC-AUC curve, and feature weights.</li>
  <li><strong>CsvUploadModal.jsx:</strong> Unified Data Hub for loading the IBM 1,470 benchmark, uploading custom CSVs, or fetching live from remote REST APIs.</li>
</ul>
<hr/>
<h3>4. Royal White Design System & Polish</h3>
<ul>
  <li><strong>Palette:</strong> Alabaster Canvas (#f8fafd), Royal Sapphire (#2563eb), Imperial Gold (#d97706), and Deep Slate (#0f172a).</li>
  <li><strong>Purged Metallic Background:</strong> Completely eliminated wavy silver silk cloth textures in favor of clean, executive-ready alabaster.</li>
  <li><strong>Fixed Screen Flickering:</strong> Removed global mouseover/mouseout listeners and full-page <code>body:has</code> rules to guarantee stable 60fps local GPU rendering without white flashes.</li>
  <li><strong>Distraction-Free:</strong> Removed transient toast popups and floating aura bars.</li>
</ul>
<hr/>
<h3>5. Implementation Plan Roadmap</h3>
<ul>
  <li><strong>Phase 1:</strong> Data engineering, dataset normalization, and Random Forest probability calibration.</li>
  <li><strong>Phase 2:</strong> Client-side JavaScript inference engine (<code>predictor.js</code>) for instant evaluations.</li>
  <li><strong>Phase 3:</strong> Modular React tabs (Dashboard, Predictor, What-If Simulator, Workforce Roster, ML Insights).</li>
  <li><strong>Phase 4:</strong> Royal White aesthetic, frosted glass cards, and elimination of rendering glitches.</li>
  <li><strong>Phase 5:</strong> Deployment preparation (Vercel & Netlify configs, Git repository, live tunnel).</li>
</ul>
<hr/>
<h3>6. Production Deployment Steps</h3>
<ul>
  <li><strong>Option A (Vercel):</strong> Push to GitHub and import into vercel.com. Automatic build via pre-configured <code>vercel.json</code>.</li>
  <li><strong>Option B (Netlify Drop):</strong> Drag and drop the <code>dist</code> directory directly into app.netlify.com/drop.</li>
  <li><strong>Option C (Instant Live Tunnel):</strong> Run <code>npx localtunnel --port 5173 --subdomain workforce-pulse-ai</code> for an instant live link.</li>
</ul>
<p><em>Comprehensive Markdown copy saved locally at: <code>/Users/prudhviraj/Desktop/Project/PROJECT_NOTES.md</code></em></p>
"""

applescript = f'''
tell application "Notes"
    tell default account
        make new note at default folder with properties {{name:"{note_title}", body:"{note_body}"}}
    end tell
end tell
'''

res = subprocess.run(["osascript", "-e", applescript], capture_output=True, text=True)
if res.returncode == 0:
    print("SUCCESS: Note created in Apple Notes app!")
else:
    print("AppleScript Error:", res.stderr)
