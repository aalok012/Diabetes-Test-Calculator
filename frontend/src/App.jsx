import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
} from 'recharts'
import './App.css'

/* ─── Field metadata ─────────────────────────────────────────── */
const FIELDS = [
  {
    key: 'Pregnancies',
    label: 'Pregnancies',
    unit: '',
    min: 0, max: 17, step: 1,
    description: 'Total number of pregnancies. Repeated pregnancies can influence insulin resistance over time.',
  },
  {
    key: 'Glucose',
    label: 'Plasma Glucose',
    unit: 'mg/dL',
    min: 50, max: 250, step: 1,
    description: 'Blood glucose concentration 2 hours after an oral glucose tolerance test — the strongest single predictor of diabetes risk.',
  },
  {
    key: 'BloodPressure',
    label: 'Diastolic Blood Pressure',
    unit: 'mmHg',
    min: 20, max: 130, step: 1,
    description: 'The lower number in a standard blood pressure reading. Elevated values often accompany insulin resistance.',
  },
  {
    key: 'SkinThickness',
    label: 'Triceps Skin Fold',
    unit: 'mm',
    min: 0, max: 100, step: 1,
    description: 'Thickness of the skin fold at the back of the upper arm — used as a proxy for body fat distribution.',
  },
  {
    key: 'Insulin',
    label: 'Serum Insulin',
    unit: 'µU/mL',
    min: 0, max: 850, step: 1,
    description: '2-hour serum insulin level. Elevated levels may indicate insulin resistance.',
  },
  {
    key: 'BMI',
    label: 'BMI',
    unit: 'kg/m²',
    min: 10, max: 70, step: 0.1,
    description: 'Body Mass Index — weight (kg) divided by height squared (m²). Values above 25 are associated with increased risk.',
  },
  {
    key: 'DiabetesPedigreeFunction',
    label: 'Pedigree Function',
    unit: '',
    min: 0.05, max: 2.5, step: 0.01,
    description: 'A score reflecting your family history of diabetes and its estimated genetic influence.',
  },
  {
    key: 'Age',
    label: 'Age',
    unit: 'years',
    min: 18, max: 100, step: 1,
    description: 'Current age in years. Risk increases substantially after age 45.',
  },
]

const DEFAULTS = {
  Pregnancies: 3,
  Glucose: 120,
  BloodPressure: 69,
  SkinThickness: 20,
  Insulin: 79,
  BMI: 32,
  DiabetesPedigreeFunction: 0.47,
  Age: 33,
}


// Population means from the Pima Indians Diabetes Dataset (NIDDK)
const DIABETIC_MEANS   = { Pregnancies: 4.87, Glucose: 141.3, BloodPressure: 70.8, SkinThickness: 33.0, Insulin: 100.3, BMI: 35.1, DiabetesPedigreeFunction: 0.55, Age: 37.1 }
const NONDIABETIC_MEANS = { Pregnancies: 3.30, Glucose: 109.9, BloodPressure: 68.2, SkinThickness: 27.2, Insulin:  68.8, BMI: 30.3, DiabetesPedigreeFunction: 0.43, Age: 31.2 }

// 5 features for the radar (most clinically meaningful)
const RADAR_KEYS = ['Glucose', 'BMI', 'BloodPressure', 'Insulin', 'Age', 'DiabetesPedigreeFunction']

/* ─── Gauge chart (speedometer) ─────────────────────────────── */
function GaugeChart({ probability }) {
  const pct = Math.round(probability * 100)
  const isHigh = probability >= 0.5

  const needleAngle = 180 - probability * 180  // 180° = 0%, 0° = 100%
  const rad = (needleAngle * Math.PI) / 180
  const cx = 110
  const cy = 100

  const gaugeColor = isHigh ? '#c1121f' : '#2d6a4f'

  return (
    <div className="gauge-wrap">
      <svg viewBox="0 0 220 120" width="100%" style={{ maxWidth: 280, display: 'block', margin: '0 auto' }}>
        {/* background track */}
        <path
          d="M 20 100 A 90 90 0 0 1 200 100"
          fill="none"
          stroke="#d8f3dc"
          strokeWidth="18"
          strokeLinecap="round"
        />
        {/* filled arc — approximate with PieChart trick via a foreignObject isn't clean; use a second path */}
        {/* We'll draw it with a proper arc calculation */}
        <ArcPath cx={cx} cy={cy} r={90} pct={probability} color={gaugeColor} />
        {/* needle */}
        <line
          x1={cx} y1={cy}
          x2={cx + 78 * Math.cos(rad)}
          y2={cy - 78 * Math.sin(rad)}
          stroke={gaugeColor}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="7" fill={gaugeColor} />
        {/* label */}
        <text x={cx} y={cy + 22} textAnchor="middle" fontSize="22" fontWeight="900"
          fontFamily="'Source Serif 4', Georgia, serif" fill={gaugeColor}>
          {pct}%
        </text>
        <text x={20} y={115} fontSize="8" fill="#52796f" fontFamily="'Open Sans', sans-serif">0%</text>
        <text x={188} y={115} fontSize="8" fill="#52796f" fontFamily="'Open Sans', sans-serif">100%</text>
        <text x={104} y={20} fontSize="8" fill="#52796f" fontFamily="'Open Sans', sans-serif">50%</text>
      </svg>
      <div className={`gauge-badge ${isHigh ? 'high' : 'low'}`}>
        {isHigh ? '⚠ High Risk' : '✓ Lower Risk'}
      </div>
    </div>
  )
}

/* Helper: draw a filled arc from 180° down by (pct * 180°) */
function ArcPath({ cx, cy, r, pct, color }) {
  if (pct <= 0) return null
  const startAngle = Math.PI          // 180° in radians
  const endAngle = Math.PI - pct * Math.PI  // sweeps left→right
  const x1 = cx + r * Math.cos(startAngle)
  const y1 = cy - r * Math.sin(startAngle)
  const x2 = cx + r * Math.cos(endAngle)
  const y2 = cy - r * Math.sin(endAngle)
  const largeArc = pct > 0.5 ? 1 : 0
  return (
    <path
      d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
      fill="none"
      stroke={color}
      strokeWidth="18"
      strokeLinecap="round"
    />
  )
}

/* ─── SHAP tooltip (must be declared outside render) ────────── */
function ShapTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const entry = payload[0].payload
  const v = entry.pos !== 0 ? entry.pos : entry.neg
  return (
    <div style={{
      background: '#fff', border: '1px solid #b7e4c7',
      borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem',
    }}>
      <strong>{entry.name}</strong><br />
      <span style={{ color: v > 0 ? '#c1121f' : '#2d6a4f' }}>
        {v > 0 ? '▲ Increases risk' : '▼ Decreases risk'}: {v > 0 ? '+' : ''}{v}
      </span>
    </div>
  )
}

/* ─── SHAP bar chart (Recharts) ──────────────────────────────── */
function ShapBarChart({ shapValues }) {
  const data = Object.entries(shapValues)
    .map(([key, val]) => {
      const v = parseFloat(val.toFixed(3))
      return {
        name: FIELDS.find(f => f.key === key)?.label ?? key,
        pos: v > 0 ? v : 0,
        neg: v < 0 ? v : 0,
      }
    })
    .sort((a, b) => (b.pos + b.neg) - (a.pos + a.neg))

  return (
    <div className="shap-chart-wrap">
      <h3 className="chart-title">Feature Influence (SHAP Values)</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 24, top: 4, bottom: 4 }}>
          <XAxis type="number" tick={{ fontSize: 10, fill: '#52796f' }} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 10, fill: '#52796f', fontFamily: "'Open Sans', sans-serif" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<ShapTooltip />} />
          <ReferenceLine x={0} stroke="#b7e4c7" strokeWidth={1.5} />
          <Bar dataKey="pos" stackId="a" fill="#c1121f" fillOpacity={0.85} radius={[0, 4, 4, 0]} maxBarSize={16} />
          <Bar dataKey="neg" stackId="a" fill="#2d6a4f" fillOpacity={0.85} radius={[0, 4, 4, 0]} maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
      <p style={{ fontSize: '0.7rem', color: '#52796f', textAlign: 'center', marginTop: 4 }}>
        Red = increases risk · Green = decreases risk
      </p>
    </div>
  )
}

/* ─── Result card ────────────────────────────────────────────── */
function ResultCard({ result, loading }) {
  if (loading) {
    return (
      <div className="result-card">
        <div className="result-card-header">
          <h2>Assessment Result</h2>
        </div>
        <div className="loading-state">
          <div className="spinner" />
          <p>Computing your risk profile…</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="result-card">
        <div className="result-empty">
          <span className="result-empty-icon">📋</span>
          <h3>Awaiting Your Responses</h3>
        </div>
      </div>
    )
  }

  const { probability, shap_values, risk_level } = result
  const isHigh = risk_level === 'high'

  return (
    <div className="result-card">
      <div className="result-card-header">
        <h2>Assessment Result</h2>
        <p>Based on the clinical parameters you provided.</p>
      </div>
      <div className="result-body">
        <GaugeChart probability={probability} />
        <p className="result-message">
          {isHigh
            ? <><strong>Elevated risk detected.</strong> Please consult a qualified healthcare professional for a comprehensive evaluation.</>
            : <><strong>Lower risk indicated.</strong> Continue maintaining a balanced diet, regular exercise, and routine check-ups.</>
          }
        </p>
        {shap_values && <ShapBarChart shapValues={shap_values} />}
      </div>
    </div>
  )
}

/* ─── Tooltip components (must live outside render) ─────────── */
function MetricTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#fff', border:'1px solid #b7e4c7', borderRadius:8, padding:'8px 12px', fontSize:'0.8rem' }}>
      <strong>{payload[0].payload.name}</strong>: {payload[0].value}%
    </div>
  )
}

function RadarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#fff', border:'1px solid #b7e4c7', borderRadius:8, padding:'8px 12px', fontSize:'0.8rem' }}>
      <strong>{label}</strong>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}%</div>
      ))}
    </div>
  )
}

/* ─── Graphs section ─────────────────────────────────────────── */
function GraphsSection({ formData }) {
  const [modelInfo, setModelInfo] = useState(null)

  useEffect(() => {
    fetch('https://diabetictor.onrender.com/model-info')
      .then(r => r.json())
      .then(setModelInfo)
      .catch(() => {})
  }, [])

  // Normalize a value to 0–100 using field min/max
  function norm(key, val) {
    const f = FIELDS.find(f => f.key === key)
    return Math.round(((val - f.min) / (f.max - f.min)) * 100)
  }

  // Build radar data: 6 key features, 3 series
  const radarData = RADAR_KEYS.map(key => {
    const field = FIELDS.find(f => f.key === key)
    return {
      feature: field.label,
      You:          norm(key, formData[key]),
      'Diabetic avg':    norm(key, DIABETIC_MEANS[key]),
      'Non-diabetic avg': norm(key, NONDIABETIC_MEANS[key]),
    }
  })

  // Model metrics bar data
  const metricsData = modelInfo
    ? [
        { name: 'AUC',       value: parseFloat((modelInfo.auc       * 100).toFixed(1)), fill: '#2d6a4f' },
        { name: 'Precision', value: parseFloat((modelInfo.precision * 100).toFixed(1)), fill: '#40916c' },
        { name: 'Recall',    value: parseFloat((modelInfo.recall    * 100).toFixed(1)), fill: '#74c69d' },
      ]
    : []

  return (
    <section className="graphs-section">
      <h2>Data Visualisations</h2>
      <p>Clinical profile analysis based on your submitted values.</p>
      <div className="graphs-grid">

        {/* Chart 1 — Radar: Your profile vs population */}
        <div className="graph-card">
          <h3 className="graph-card-title">Your Clinical Profile vs. Population</h3>
          <p className="graph-card-sub">Normalised feature values (0–100%) compared to diabetic and non-diabetic population averages.</p>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="#d8f3dc" />
              <PolarAngleAxis dataKey="feature" tick={{ fontSize: 11, fill: '#52796f', fontFamily: "'Open Sans', sans-serif" }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#52796f' }} tickCount={4} />
              <Radar name="You" dataKey="You" stroke="#1b4332" fill="#1b4332" fillOpacity={0.25} strokeWidth={2} dot={{ r: 3 }} />
              <Radar name="Diabetic avg" dataKey="Diabetic avg" stroke="#c1121f" fill="#c1121f" fillOpacity={0.12} strokeWidth={1.5} strokeDasharray="4 2" />
              <Radar name="Non-diabetic avg" dataKey="Non-diabetic avg" stroke="#74c69d" fill="#74c69d" fillOpacity={0.12} strokeWidth={1.5} strokeDasharray="4 2" />
              <Legend wrapperStyle={{ fontSize: '0.78rem', paddingTop: 8 }} />
              <Tooltip content={<RadarTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2 — Bar: Model performance metrics */}
        <div className="graph-card">
          <h3 className="graph-card-title">Model Performance Metrics</h3>
          <p className="graph-card-sub">Evaluated at a 0.5 probability threshold on the training dataset (Pima Indians, NIDDK).</p>
          {modelInfo ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={metricsData} layout="vertical" margin={{ left: 16, right: 32, top: 8, bottom: 8 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#52796f' }} tickLine={false} axisLine={false} unit="%" />
                  <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 11, fill: '#52796f', fontFamily: "'Open Sans', sans-serif" }} tickLine={false} axisLine={false} />
                  <Tooltip content={<MetricTooltip />} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28} fill="#2d6a4f" />
                </BarChart>
              </ResponsiveContainer>
              <div className="metrics-row">
                {metricsData.map(m => (
                  <div className="metric-chip" key={m.name}>
                    <span className="metric-chip-val" style={{ color: m.fill }}>{m.value}%</span>
                    <span className="metric-chip-label">{m.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="graph-loading">
              <div className="spinner" style={{ width: 32, height: 32, borderWidth: 4 }} />
              <p>Loading model metrics…</p>
            </div>
          )}

          {/* Chart 3 — Feature comparison bar */}
          <h3 className="graph-card-title" style={{ marginTop: 28 }}>Your Values vs. Population Averages</h3>
          <p className="graph-card-sub">Absolute values for each clinical parameter across three groups.</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={RADAR_KEYS.map(key => ({
                name: FIELDS.find(f => f.key === key).label,
                You:             formData[key],
                'Diabetic':      DIABETIC_MEANS[key],
                'Non-diabetic':  NONDIABETIC_MEANS[key],
              }))}
              margin={{ left: 0, right: 16, top: 8, bottom: 60 }}
            >
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#52796f', fontFamily: "'Open Sans', sans-serif" }} angle={-35} textAnchor="end" interval={0} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#52796f' }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: 4 }} />
              <Bar dataKey="You" fill="#1b4332" radius={[3,3,0,0]} maxBarSize={18} />
              <Bar dataKey="Diabetic" fill="#c1121f" fillOpacity={0.75} radius={[3,3,0,0]} maxBarSize={18} />
              <Bar dataKey="Non-diabetic" fill="#74c69d" radius={[3,3,0,0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </section>
  )
}

/* ─── Form card (multi-step) ─────────────────────────────────── */
function FormCard({ onResult, onLoading, onFormData }) {
  const [step, setStep] = useState(0)
  const [knowsValue, setKnowsValue] = useState(null)
  const [formData, setFormData] = useState({ ...DEFAULTS })

  const field = FIELDS[step]
  const progress = step >= 8 ? 100 : Math.round((step / FIELDS.length) * 100)

  function handleKnow(knows) {
    setKnowsValue(knows)
    if (!knows) setTimeout(() => advanceStep(), 800)
  }

  function advanceStep() {
    setKnowsValue(null)
    setStep(s => s + 1)
  }

  function handleSliderChange(e) {
    setFormData(prev => ({ ...prev, [field.key]: parseFloat(e.target.value) }))
  }

  async function handleSubmit() {
    onLoading(true)
    try {
      const res = await fetch('https://diabetictor.onrender.com/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail?.[0]?.msg || 'Server error')
      }
      const data = await res.json()
      onFormData(formData)
      onResult(data)
    } catch (e) {
      alert(`Error: ${e.message}`)
      onResult(null)
    } finally {
      onLoading(false)
    }
  }

  function handleRestart() {
    setStep(0)
    setKnowsValue(null)
    setFormData({ ...DEFAULTS })
    onFormData({ ...DEFAULTS })
    onResult(null)
  }

  return (
    <div className="form-card">
      <div className="form-card-header">
        <h2>Clinical Risk Questionnaire</h2>
        <p>
          {step < 8
            ? `Step ${step + 1} of ${FIELDS.length}`
            : 'Review your responses before submitting.'}
        </p>
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {step < 8 && (
        <>
          <div className="form-step">
            <p className="step-indicator">Question {step + 1} / {FIELDS.length}</p>
            <p className="step-question">Do you know your <em>{field.label}</em>?</p>
            <p className="step-description">{field.description}</p>

            {knowsValue === null && (
              <div className="know-buttons">
                <button className="btn-yes" onClick={() => handleKnow(true)}>Yes, I know it</button>
                <button className="btn-no" onClick={() => handleKnow(false)}>No, use default</button>
              </div>
            )}

            {knowsValue === true && (
              <div className="slider-section">
                <div className="slider-label-row">
                  <span className="slider-label">{field.label}</span>
                  <div className="slider-value-wrap">
                    <span className="slider-value">{formData[field.key]}</span>
                    {field.unit && <span className="slider-unit">{field.unit}</span>}
                  </div>
                </div>
                <input
                  type="range"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={formData[field.key]}
                  onChange={handleSliderChange}
                />
                <div className="slider-range-labels">
                  <span>{field.min}{field.unit ? ` ${field.unit}` : ''}</span>
                  <span>{field.max}{field.unit ? ` ${field.unit}` : ''}</span>
                </div>
                <button className="btn-next" onClick={advanceStep}>Confirm &amp; Continue →</button>
              </div>
            )}
          </div>

          {knowsValue === false && (
            <div className="default-note">
              <span className="default-note-icon">✅</span>
              <p>
                Using default value: <strong>{DEFAULTS[field.key]}{field.unit ? ` ${field.unit}` : ''}</strong> for <strong>{field.label}</strong>.
              </p>
            </div>
          )}
        </>
      )}

      {step === 8 && (
        <div className="review-section">
          <h3>Review Your Responses</h3>
          <div className="review-grid">
            {FIELDS.map(f => (
              <div className="review-item" key={f.key}>
                <div className="review-key">{f.label}</div>
                <div className="review-val">{formData[f.key]}{f.unit ? ` ${f.unit}` : ''}</div>
              </div>
            ))}
          </div>
          <button className="btn-submit" onClick={handleSubmit}>Submit &amp; Calculate Risk →</button>
          <button className="btn-restart" onClick={handleRestart}>Start over</button>
        </div>
      )}
    </div>
  )
}

/* ─── Root App ───────────────────────────────────────────────── */
export default function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submittedForm, setSubmittedForm] = useState({ ...DEFAULTS })

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <svg className="navbar-logo" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="currentColor"/>
          <rect x="13" y="5" width="6" height="22" rx="2" fill="#184e77"/>
          <rect x="5" y="13" width="22" height="6" rx="2" fill="#184e77"/>
        </svg>
        <span className="navbar-title"><span>Diabetictor</span>: Assess Your Risk of Diabetes</span>
      </nav>

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-inner">
          <span className="hero-eyebrow">Global Health Crisis</span>
          <h1><span>537 million adults</span> worldwide are living with diabetes today.</h1>
          <p>
            Diabetes is one of the fastest-growing chronic conditions of our time, with half of all cases
            going undiagnosed. Early detection saves lives. Complete the questionnaire below to receive
            your personalised risk estimate.
          </p>
        </div>
      </section>

      {/* Centred assessment */}
      <main className="main-content">
        <div className="assessment-layout">
          <FormCard onResult={setResult} onLoading={setLoading} onFormData={setSubmittedForm} />
          <ResultCard result={result} loading={loading} />
        </div>
      </main>

      <GraphsSection formData={submittedForm} />

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div>
            <h4>Medical Disclaimer</h4>
            <p>
              Diabetictor is an educational tool only and does not constitute a medical diagnosis or
              clinical recommendation. Always consult a qualified healthcare professional before making
              health-related decisions. Do not delay seeking medical advice based on results from this tool.
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>Diabetictor</span> · For educational use only · Not a substitute for professional medical advice · {new Date().getFullYear()}
        </div>
      </footer>
    </>
  )
}
