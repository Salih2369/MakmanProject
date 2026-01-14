import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const Home = () => {
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="page-wrap">
      <section className="hero hero-pro">
        <div className="hero-grid">
          <motion.div className="hero-copy" variants={fadeUp} initial="hidden" animate="show">
            <h1 className="hero-title">نظام الذكاء الاصطناعي للأعمال</h1>
            <p className="hero-subtitle">
              راقب فروعك، حلل الفيديوهات لحظياً، واتخذ قرارات ذكية.
            </p>

            <div className="hero-actions">
              <button className="btn-register btn-ripple" onClick={() => navigate('/subscription')}>
                ابدأ الآن
              </button>
              <button className="btn-login btn-ripple" onClick={() => setShowDemo(true)}>
                مشاهدة تجربة النظام
              </button>
            </div>

            <div className="hero-proof">
              <div className="proof-item">
                <span className="proof-num">لحظي</span>
                <span className="proof-text">تنبيهات فورية</span>
              </div>
              <div className="proof-item">
                <span className="proof-num">AI</span>
                <span className="proof-text">تحليلات ذكية</span>
              </div>
              <div className="proof-item">
                <span className="proof-num">+24%</span>
                <span className="proof-text">رفع الكفاءة</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <div className="mock-card">
              <div className="mock-top">
                <div className="mock-dot" />
                <div className="mock-dot" />
                <div className="mock-dot" />
                <span className="mock-title">Makman Analytics</span>
              </div>

              <div className="mock-metrics">
                <div className="mock-kpi">
                  <span className="kpi-label">زوار اليوم</span>
                  <span className="kpi-val">1,284</span>
                </div>
                <div className="mock-kpi">
                  <span className="kpi-label">تنبيهات</span>
                  <span className="kpi-val danger">2</span>
                </div>
                <div className="mock-kpi">
                  <span className="kpi-label">الانتظار</span>
                  <span className="kpi-val ok">4m</span>
                </div>
              </div>

              <div className="mock-chart">
                <div className="chart-line" />
                <div className="chart-bars">
                  <span style={{ height: '35%' }} />
                  <span style={{ height: '55%' }} />
                  <span style={{ height: '40%' }} />
                  <span style={{ height: '70%' }} />
                  <span style={{ height: '85%' }} />
                  <span style={{ height: '60%' }} />
                </div>
              </div>

              <div className="mock-list">
                <div className="mock-row">
                  <span className="pill pill-ai">AI</span>
                  <span>نشاط غير اعتيادي - فرع العليا</span>
                  <span className="time">قبل 2 د</span>
                </div>
                <div className="mock-row">
                  <span className="pill pill-ok">OK</span>
                  <span>ازدحام متوسط - فرع النخيل</span>
                  <span className="time">قبل 8 د</span>
                </div>
              </div>
            </div>

            <div className="data-lines" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </motion.div>
        </div>
      </section>

      {/* =========================
          كيف يعمل النظام؟
      ========================== */}
      <section className="section-block">
        <div className="section-head">
          <h2 className="section-h">كيف يعمل النظام؟</h2>
          <p className="section-p">ثلاث خطوات بسيطة… ونتائج قوية.</p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">1</div>
            <h3 className="step-title">ربط الكاميرات / رفع الفيديو</h3>
            <p className="step-text">أضف مصدر الفيديو أو ملفاتك بسهولة.</p>
          </div>

          <div className="step-card">
            <div className="step-num">2</div>
            <h3 className="step-title">تحليل ذكي بالذكاء الاصطناعي</h3>
            <p className="step-text">نستخرج مؤشرات وتنبيهات تلقائياً.</p>
          </div>

          <div className="step-card">
            <div className="step-num">3</div>
            <h3 className="step-title">التنبيهات + تقارير ولوحات</h3>
            <p className="step-text">تابع كل شيء من لوحة واحدة وبوضوح.</p>
          </div>
        </div>

        {/* ✅ الإضافة المطلوبة: يناسب عدة قطاعات */}
        <div className="sectors-wrap">
          <div className="section-head">
            <h2 className="section-h">يناسب عدة قطاعات</h2>
            <p className="section-p">
              مكمن يدعم أعمال مختلفة بواجهة واحدة وتجربة موحدة.
            </p>
          </div>

          <div className="sectors-grid">
            <div className="sector-card">
              <div className="sector-icon">🛒</div>
              <h3 className="sector-title">المتاجر</h3>
              <p className="sector-text">
                مراقبة الازدحام وتحسين الخدمة وتقليل الخسائر.
              </p>
            </div>

            <div className="sector-card">
              <div className="sector-icon">☕</div>
              <h3 className="sector-title">المقاهي</h3>
              <p className="sector-text">
                قياس التدفق وتحسين وقت الانتظار وجودة التجربة.
              </p>
            </div>

            <div className="sector-card">
              <div className="sector-icon">🏢</div>
              <h3 className="sector-title">الشركات</h3>
              <p className="sector-text">
                لوحات أداء وتقارير تنفيذية لمتابعة العمليات.
              </p>
            </div>

            <div className="sector-card">
              <div className="sector-icon">🏬</div>
              <h3 className="sector-title">السوبرماركت</h3>
              <p className="sector-text">
                تحليل الحركة داخل الأقسام وتحسين توزيع الموظفين.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-card section-card-pro">
        <h2 className="section-title">خطوة واحدة نحو متجر أذكى</h2>
        <p className="section-subtitle">اختر خطة تناسبك وابدأ التجربة الآن.</p>
        <div className="cta-row">
          <button className="btn-register btn-ripple" onClick={() => navigate('/subscription')}>صفحة الاشتراكات</button>
        </div>
      </section>

      <footer className="footer-pro">
        <div className="footer-bottom">
          <span>© 2026 مكمن - جميع الحقوق محفوظة</span>
          <div className="footer-mini-links">
            <span className="footer-muted">الخصوصية</span>
            <span className="dot">•</span>
            <span className="footer-muted">الشروط</span>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      {showDemo && (
        <div className="modal-overlay" onClick={() => setShowDemo(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{
            position: 'relative', width: '90%', maxWidth: '900px',
            backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <button onClick={() => setShowDemo(false)} style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: '50%', width: '36px', height: '36px',
              color: '#fff', fontSize: '20px', cursor: 'pointer', zIndex: 10
            }}>×</button>
            <video
              controls
              autoPlay
              muted
              playsInline
              crossOrigin="anonymous"
              type="video/mp4"
              style={{ width: '100%', display: 'block' }}
              src={`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/demo-video/output_sos9 (16).mp4`}
            >
              المتصفح لا يدعم عرض الفيديو.
            </video>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;