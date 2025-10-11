(function (global) {
  'use strict';

  const defaults = {
    provider: 'emailjs', // 'emailjs' or 'custom'
    brandName: 'Gymnasium Neusiedl am See',
    logoUrl: '', // public URL to your school logo (PNG/SVG hosted online)
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
      // Siehe Hinweise unten zum EmailJS Template
      return global.emailjs.send(cfg.emailjsServiceId, cfg.emailjsTemplateId, params);
    }

    throw new Error('Kein unterstützter Provider');
  }

  // Expose API
  global.EmailService = {
    init,
    sendVerificationEmail,
    isConfigured: () => isConfigured(),
    config: cfg
  };

  // Auto init
  try { init(); } catch (e) { /* noop */ }

  /*
  EmailJS Einrichtung (empfohlen für statische Seiten):
  1) Account anlegen: https://www.emailjs.com/
  2) E-Mail Service verbinden (Gmail/SMTP o.ä.) -> Service ID notieren
  3) Template erstellen -> Template ID notieren
     Setze den Betreff (Subject) auf: {{email_subject}}
     Beispiel HTML (in EmailJS Template Editor einfügen):
     -----------------------------------------------
     <div style="font-family:Arial,Helvetica,sans-serif;color:#132022;background:#f7f9fa;padding:24px;">
       <!-- Preheader (versteckt, für Inbox-Vorschau) -->
       <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">{{preheader}}</div>
       <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #d9e0e2;border-radius:10px;">
         <tr>
           <td style="padding:24px 24px 12px 24px;text-align:center;">
             <img src="{{logo_url}}" alt="{{brand_name}}" style="max-width:180px;height:auto;display:inline-block;" />
           </td>
         </tr>
         <tr>
           <td style="padding:0 24px 8px 24px;text-align:center;">
             <h2 style="margin:0;color:#2f6b2f;font-family:Oswald,Arial Narrow,Arial,sans-serif;letter-spacing:0.6px;">E-Mail bestätigen</h2>
             <p style="margin:6px 0 0 0;color:#4a5a5e;">Dein Bestätigungscode lautet:</p>
           </td>
         </tr>
         <tr>
           <td style="padding:4px 24px 16px 24px;text-align:center;">
             <div style="display:inline-block;font-size:28px;letter-spacing:6px;background:#eef2f3;border:1px solid #d9e0e2;border-radius:8px;padding:12px 18px;color:#132022;font-weight:bold;">{{code}}</div>
           </td>
         </tr>
         <tr>
           <td style="padding:0 24px 24px 24px;color:#758589;text-align:center;font-size:14px;">
             <p style="margin:0;">Gib diesen Code in der Ideenbörse ein, um deine Einsendung zu bestätigen.</p>
             <p style="margin:4px 0 0 0;">Aus Sicherheitsgründen ist dieser Code nur kurz gültig. Teile ihn nicht mit anderen Personen.</p>
           </td>
         </tr>
         <tr>
           <td style="padding:16px 24px 24px 24px;text-align:center;color:#758589;font-size:12px;border-top:1px solid #eef2f3;">
             &copy; {{year}} {{brand_name}}
           </td>
         </tr>
       </table>
     </div>
     -----------------------------------------------
  4) In email.config.js die PUBLIC KEY, SERVICE ID, TEMPLATE ID und LOGO URL eintragen.
  */

})(window);
