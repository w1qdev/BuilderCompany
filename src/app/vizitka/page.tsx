"use client";

/* A4 flyer — 210×297mm at 96dpi ≈ 794×1123px */
export default function VizitkaPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,700;1,800&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          background: #888;
          display: flex;
          justify-content: center;
          padding: 20px 0;
        }

        .flyer {
          width: 794px;
          min-height: 1123px;
          position: relative;
          overflow: hidden;
          font-family: 'Montserrat', sans-serif;
          color: #2D1B0E;
          flex-shrink: 0;
        }

        /* Full background — warm copper/orange gradient with texture feel */
        .flyer-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 30% 15%, rgba(180, 80, 20, 0.9) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 10%, rgba(200, 120, 40, 0.7) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 50%, rgba(220, 180, 140, 0.3) 0%, transparent 60%),
            linear-gradient(180deg,
              #B8541A 0%,
              #C46020 5%,
              #D07830 8%,
              #D89048 11%,
              #E0A868 14%,
              #E8C090 17%,
              #F0D4B0 20%,
              #F5E0C8 23%,
              #EDE0D0 28%,
              #E8D8C8 35%,
              #E5D5C2 50%,
              #E2D0BC 65%,
              #DFC8B4 80%,
              #DCC4B0 100%
            );
        }

        /* Subtle noise texture */
        .flyer-noise {
          position: absolute;
          inset: 0;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          pointer-events: none;
        }

        /* ─── HEADER ─── */
        .header {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 28px 36px 22px;
        }

        .logo-text {
          font-size: 58px;
          font-weight: 900;
          color: #fff;
          letter-spacing: 3px;
          line-height: 1;
          text-shadow: 1px 2px 6px rgba(0,0,0,0.25);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-url {
          font-size: 19px;
          font-weight: 600;
          color: #fff;
          text-shadow: 1px 1px 4px rgba(0,0,0,0.2);
        }

        /* ─── TITLE BANNER ─── */
        .title-banner {
          position: relative;
          z-index: 2;
          background: rgba(255,248,240,0.88);
          padding: 24px 36px 22px;
        }

        .title-banner h1 {
          font-size: 29px;
          font-weight: 800;
          color: #1a0f05;
          line-height: 1.2;
          letter-spacing: -0.3px;
        }

        .title-banner .subtitle {
          font-size: 16.5px;
          color: #4a3828;
          margin-top: 6px;
          font-weight: 400;
        }

        .title-banner .experience {
          font-size: 15.5px;
          color: #E87A2E;
          margin-top: 5px;
          font-weight: 600;
        }

        .experience strong {
          color: #D4601A;
        }

        /* ─── HERO IMAGE ─── */
        .hero-image {
          position: relative;
          z-index: 2;
          height: 280px;
          overflow: hidden;
        }

        .hero-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 35%;
        }

        /* Warm tint overlay */
        .hero-image::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(180, 90, 30, 0.12) 0%,
            rgba(160, 80, 25, 0.08) 50%,
            rgba(140, 70, 20, 0.15) 100%
          );
          mix-blend-mode: multiply;
        }

        /* ─── CARDS SECTION ─── */
        .cards-grid {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: auto auto;
          gap: 14px;
          padding: 24px 30px 12px;
        }

        .card {
          background: rgba(255, 252, 248, 0.82);
          border-radius: 18px;
          padding: 22px 22px;
          box-shadow: 0 1px 8px rgba(100,60,20,0.06);
        }

        .card-services {
          grid-row: 1 / 3;
        }

        .card h2 {
          font-size: 19px;
          font-weight: 800;
          font-style: italic;
          color: #1a0f05;
          margin-bottom: 16px;
          line-height: 1.3;
        }

        /* Service items */
        .service-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 18px;
        }

        .service-item:last-child {
          margin-bottom: 0;
        }

        .service-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #F2842A;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(242, 132, 42, 0.3);
        }

        .service-icon svg {
          width: 26px;
          height: 26px;
          stroke: #fff;
          fill: none;
          stroke-width: 1.8;
        }

        .service-text {
          font-size: 14.5px;
          line-height: 1.4;
          padding-top: 2px;
        }

        .service-text strong {
          font-weight: 700;
        }

        /* Check items */
        .check-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 11px;
        }

        .check-item:last-child {
          margin-bottom: 0;
        }

        .check-circle {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #E87A2E;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .check-circle svg {
          width: 12px;
          height: 12px;
        }

        .check-text {
          font-size: 14px;
          line-height: 1.45;
        }

        /* Step items */
        .step-item {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          margin-bottom: 12px;
        }

        .step-item:last-child {
          margin-bottom: 0;
        }

        .step-num {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #E87A2E;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
          margin-top: 0px;
        }

        .step-text {
          font-size: 13.5px;
          line-height: 1.45;
          padding-top: 3px;
        }

        /* ─── BOTTOM NOTE ─── */
        .bottom-note {
          position: relative;
          z-index: 2;
          padding: 4px 34px 18px;
          font-size: 12.5px;
          color: #8a7a6a;
          line-height: 1.5;
          max-width: 400px;
          font-style: italic;
        }

        /* ─── CONTACT FOOTER ─── */
        .contact-footer {
          position: relative;
          z-index: 2;
          margin: 0 30px 30px;
          background: rgba(255, 252, 248, 0.88);
          border-radius: 18px;
          padding: 22px 28px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px 20px;
          box-shadow: 0 1px 8px rgba(100,60,20,0.06);
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .contact-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #E87A2E;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(232, 122, 46, 0.3);
        }

        .contact-icon svg {
          width: 20px;
          height: 20px;
          stroke: #fff;
          fill: none;
          stroke-width: 2;
        }

        .contact-label {
          font-size: 16px;
          font-weight: 600;
          color: #2D1B0E;
        }

        .contact-phone {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .contact-phone .divider {
          color: #ccc;
          font-weight: 300;
        }
      `}</style>

      <div className="flyer">
        <div className="flyer-bg" />
        <div className="flyer-noise" />

        {/* ── Header ── */}
        <div className="header">
          <div className="logo-text">ЦСМ</div>
          <div className="header-right">
            <span className="header-url">csm-center.ru</span>
          </div>
        </div>

        {/* ── Title Banner ── */}
        <div className="title-banner">
          <h1>Центр Стандартизации и Метрологии</h1>
          <div className="subtitle">Аттестация, поверка и калибровка оборудования</div>
          <div className="experience"><strong>+10 лет</strong> опыта работы</div>
        </div>

        {/* ── Hero Image ── */}
        <div className="hero-image">
          <img src="/images/hero/gauge4.webp" alt="Промышленные приборы" />
        </div>

        {/* ── Cards Grid ── */}
        <div className="cards-grid">
          {/* Services — spans 2 rows */}
          <div className="card card-services">
            <h2>Наши услуги:</h2>

            {/* 1. Поверка измерительных средств — циферблат + галочка */}
            <div className="service-item">
              <div className="service-icon">
                <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="13" r="8" />
                  <path d="M12 9v4l2.5 2.5" />
                  <path d="M12 5v1" />
                  <path d="M18 13h1" />
                  <path d="M5 13h1" />
                  <path d="M19 3l-2 2" />
                  <path d="M5 3l2 2" />
                </svg>
              </div>
              <div className="service-text"><strong>Поверка</strong> измерительных средств</div>
            </div>

            {/* 2. Аттестация оборудования — шестерёнка + документ */}
            <div className="service-item">
              <div className="service-icon">
                <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 3v4a1 1 0 001 1h4" />
                  <path d="M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
                  <circle cx="15.5" cy="15.5" r="2.5" />
                  <path d="M18.5 18.5l-0.7-0.7" />
                  <path d="M15.5 13v0.5" />
                  <path d="M13 15.5h0.5" />
                  <path d="M15.5 18v-0.5" />
                  <path d="M18 15.5h-0.5" />
                </svg>
              </div>
              <div className="service-text"><strong>Аттестация</strong> испытательного оборудования</div>
            </div>

            {/* 3. Аттестация лабораторий — колба + щит */}
            <div className="service-item">
              <div className="service-icon">
                <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 3h6" />
                  <path d="M10 3v6.5L5 19a1 1 0 001 1h12a1 1 0 001-1l-5-9.5V3" />
                  <path d="M8.5 14h7" />
                  <path d="M12 17l1-1.5L12 14l-1 1.5z" fill="#fff" stroke="none" />
                </svg>
              </div>
              <div className="service-text"><strong>Аттестация</strong> лабораторий и специалистов</div>
            </div>

            {/* 4. Поверка электроизмерительных — молния + циферблат */}
            <div className="service-item">
              <div className="service-icon">
                <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="13" rx="2" />
                  <path d="M6 7V5a2 2 0 012-2h8a2 2 0 012 2v2" />
                  <path d="M12 11v4" />
                  <path d="M8 15l4-4 4 4" />
                  <path d="M7 17h1" />
                  <path d="M16 17h1" />
                </svg>
              </div>
              <div className="service-text"><strong>Поверка</strong> электроизмерительных систем</div>
            </div>
          </div>

          {/* Why choose us */}
          <div className="card">
            <h2>Почему выбирают нас:</h2>

            <div className="check-item">
              <div className="check-circle">
                <svg fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="check-text">Внесение данных в ФГИС «Аршин»</div>
            </div>

            <div className="check-item">
              <div className="check-circle">
                <svg fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="check-text">Срочная поверка в срок <strong>от 1 дня</strong></div>
            </div>

            <div className="check-item">
              <div className="check-circle">
                <svg fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="check-text">Выездные работы по всей <strong>России</strong></div>
            </div>
          </div>

          {/* How we work */}
          <div className="card">
            <h2>Как мы работаем:</h2>

            <div className="step-item">
              <div className="step-num">1</div>
              <div className="step-text">Вы оставляете заявку, мы согласуем объём и сроки</div>
            </div>

            <div className="step-item">
              <div className="step-num">2</div>
              <div className="step-text">Мы изучаем ваше оборудование и согласовываем работы</div>
            </div>

            <div className="step-item">
              <div className="step-num">3</div>
              <div className="step-text">Выдаём работы <strong>по всей России</strong></div>
            </div>
          </div>
        </div>

        {/* ── Bottom Note ── */}
        <div className="bottom-note">
          + Сохраняем точность и высокое качество выполнения работ в соответствии с ГОСТ и ISO
        </div>

        {/* ── Contact Footer ── */}
        <div className="contact-footer">
          <div className="contact-item">
            <div className="contact-icon">
              <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="contact-label">zakaz@csm-center.ru</span>
          </div>

          <div className="contact-item">
            <div className="contact-icon">
              <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div className="contact-phone">
              <span className="contact-label">+7 (966) 730-30-03</span>
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-icon">
              <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
            </div>
            <span className="contact-label">csm-center.ru</span>
          </div>
        </div>
      </div>
    </>
  );
}
