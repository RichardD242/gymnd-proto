(function (global) {
  'use strict';

  const defaults = {
    provider: 'emailjs',
    brandName: 'Gymnasium Neusiedl am See',
    logoUrl: '',
    emailjsPublicKey: '',
    emailjsServiceId: '',
    emailjsTemplateId: ''
  };

  const cfg = Object.assign({}, defaults, global.EMAIL_CONFIG || {});

  function isConfigured() {
    if (cfg.provider === 'emailjs') {
      return !!(cfg.emailjsPublicKey && cfg.emailjsServiceId && cfg.emailjsTemplateId);
    }
    return false;
  }

  function init() {
    if (cfg.provider === 'emailjs') {
      if (!global.emailjs) {
        console.warn('[EmailService] EmailJS SDK fehlt. Binde die SDK vor email.js ein.');
        return;
      }
      if (cfg.emailjsPublicKey) {
        try { global.emailjs.init({ publicKey: cfg.emailjsPublicKey }); } catch (e) { console.warn('[EmailService] init Fehler:', e); }
      }
    }
  }

  async function sendVerificationEmail(toEmail, code) {
    if (!toEmail || !code) throw new Error('E-Mail oder Code fehlt');
    if (!isConfigured()) throw new Error('E-Mail Dienst nicht konfiguriert');

    if (cfg.provider === 'emailjs') {
      if (!global.emailjs) throw new Error('EmailJS SDK nicht geladen');
      const params = {
        to_email: toEmail,
        to: toEmail,
        user_email: toEmail,
        email: toEmail,
        code,
        brand_name: cfg.brandName,
        logo_url: cfg.logoUrl,
        year: new Date().getFullYear(),
        email_subject: `${cfg.brandName} – E-Mail-Verifizierung`,
        preheader: 'Bitte bestätige deine E-Mail-Adresse, indem du den Code eingibst.',
        reply_to: cfg.emailReplyTo || toEmail,
        to_name: '',
        from_name: cfg.brandName
      };
      return global.emailjs.send(cfg.emailjsServiceId, cfg.emailjsTemplateId, params);
    }

    throw new Error('Kein unterstützter Provider');
  }

  global.EmailService = {
    init,
    sendVerificationEmail,
    isConfigured: () => isConfigured(),
    config: cfg
  };

  try { init(); } catch (e) { /* noop */ }

})(window);
