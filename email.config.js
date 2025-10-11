window.EMAIL_CONFIG = {
  provider: 'emailjs',
  brandName: 'Gymnasium Neusiedl am See',
  logoUrl: 'https://raw.githubusercontent.com/RichardD242/gymnasium-ideeDB/main/gymlogo.png',
  emailjsPublicKey: '3FLDm1sIJDX3Jh2d_',
  emailjsServiceId: 'service_qf0i8b8',
  emailjsTemplateId: 'template_le118bq',
  emailReplyTo: 'ideenboerse.gymnasium@gmail.com'
};

(function(){
  try {
    if(!window.EMAIL_CONFIG.logoUrl){
      const link = document.createElement('a');
      link.href = 'gymlogo.png';
      window.EMAIL_CONFIG.logoUrl = link.href;
    }
  } catch(e){ /* noop */ }
})();
