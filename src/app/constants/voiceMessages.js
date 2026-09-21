export const MESSAGES = {
  fr: {
    // ── Démarrage ──────────────────────────────────────────────────────────
    bienvenue: (nom) =>
      `Bonjour ${nom}. Scannez le code-barres de la chambre pour commencer.`,

    // ── Chambre ────────────────────────────────────────────────────────────
    chambre_identifiee: (code, nbLits, nbLinges) =>
      `Chambre ${code} identifiée. ${nbLits} lit${nbLits > 1 ? "s" : ""}, `
      + `${nbLinges} linge${nbLinges > 1 ? "s" : ""} à collecter. Scannez un lit.`,
    chambre_erreur: () =>
      `Chambre introuvable. Vérifiez le code et réessayez.`,
    chambre_vide: () =>
      `Aucun linge à collecter dans cette chambre.`,

    // ── Lit ────────────────────────────────────────────────────────────────
    lit_normal: (code, nb) =>
      `Lit ${code}. ${nb} linge${nb > 1 ? "s" : ""} normal${nb > 1 ? "ux" : ""}. Scannez le bac blanc.`,
    lit_infecte: (code, nb) =>
      `Attention. Lit ${code} infecté. ${nb} linge${nb > 1 ? "s" : ""}. Scannez le sac rouge.`,
    lit_deja_traite: (code) =>
      `Le lit ${code} a déjà été traité.`,
    lit_vide: (code) =>
      `Le lit ${code} n'a aucun linge à collecter.`,

    // ── Traitement contenant ───────────────────────────────────────────────
    bac_blanc_ok: (nb, code) =>
      `Parfait. ${nb} linge${nb > 1 ? "s" : ""} collecté${nb > 1 ? "s" : ""} dans le bac ${code}. Passez au lit suivant.`,
    sac_infecte_ok: (nb, code) =>
      `${nb} linge${nb > 1 ? "s" : ""} infecté${nb > 1 ? "s" : ""} enregistré${nb > 1 ? "s" : ""} dans le sac ${code}. Passez au lit suivant.`,
    contenant_erreur: (msg) =>
      `Erreur. ${msg}. Réessayez.`,

    // ── Linge individuel ───────────────────────────────────────────────────
    linge_propre: () =>
      `Linge propre enregistré. Il reste en place.`,
    linge_manquant: () =>
      `Linge manquant signalé.`,
    linge_deja_traite: () =>
      `Ce linge a déjà été traité.`,

    // ── Progression ────────────────────────────────────────────────────────
    tous_lits_traites: () =>
      `Tous les lits ont été traités. Scannez votre badge pour clôturer la collecte.`,
    lits_restants: (n) =>
      `${n} lit${n > 1 ? "s" : ""} restant${n > 1 ? "s" : ""}. Continuez.`,

    // ── Clôture ────────────────────────────────────────────────────────────
    cloture_ok: (chambre, blancs, infectes, propres, manquants) =>
      `Collecte de la chambre ${chambre} terminée. `
      + `${blancs} blanc${blancs > 1 ? "s" : ""}, `
      + `${infectes} infecté${infectes > 1 ? "s" : ""}, `
      + `${propres} propre${propres > 1 ? "s" : ""}, `
      + `${manquants} manquant${manquants > 1 ? "s" : ""}. Bien joué.`,
    cloture_lits_restants: (n) =>
      `Attention. ${n} lit${n > 1 ? "s" : ""} non traité${n > 1 ? "s" : ""}. Voulez-vous quand même clôturer ?`,
    cloture_erreur: () =>
      `Impossible de clôturer. Vérifiez que tous les linges sont traités.`,

    // ── Erreurs générales ──────────────────────────────────────────────────
    erreur_reseau: () =>
      `Erreur de connexion. Vérifiez le réseau et réessayez.`,
    erreur_generique: (msg) =>
      `Erreur. ${msg}.`,
    code_non_reconnu: () =>
      `Code non reconnu. Scannez un lit, un bac ou votre badge.`,
     bienvenue_service: (nom) =>
      `Bonjour ${nom}. Scannez le code du service pour commencer.`,

    service_identifie: (code, nb) =>
      `Service ${code} identifié. ${nb} linge${nb>1?"s":""} à collecter. Scannez le bac blanc.`,

    bac_blanc_ok_service: (code) =>
      `Bac blanc ${code} enregistré. Scannez les linges blancs.`,

    guide_propre_manquant: () =>
      `Pour chaque linge, le bouton bleu le déclare propre, le bouton jaune le déclare manquant.`,

    linge_propre_service: () =>
      `Linge propre enregistré.`,

    linge_manquant_service: () =>
      `Linge manquant signalé.`,

    sac_infecte_declare: (total) =>
      `Sac infecté déclaré. ${total} linge${total>1?"s":""} infecté${total>1?"s":""}.`,

    cloture_ok_service: (service, blancs, infectes, manquants) =>
      `Collecte du service ${service} terminée. ${blancs} blanc${blancs>1?"s":""}, ${infectes} infecté${infectes>1?"s":""}, ${manquants} manquant${manquants>1?"s":""}. Bien joué.`,

    // ── UNIFORME — ajouter ici ────────────────────────────────────
    bienvenue_uniforme: (nom) =>
      `Bonjour ${nom}. Scannez le badge du médecin.`,

    badge_ok: (nom, nb, inf) => inf
      ? `Attention. ${nom} a eu un contact infectieux. ${nb} uniforme${nb>1?"s":""} potentiellement contaminé${nb>1?"s":""}. Scannez avec précaution.`
      : `${nom} identifié. ${nb} uniforme${nb>1?"s":""} à collecter. Scannez un uniforme.`,

    uniforme_ok: (code, inf) => inf
      ? `Uniforme ${code} suspect. Scannez le bac rouge.`
      : `Uniforme ${code} normal. Scannez le bac.`,

    guide_manquant: () =>
      `Pour déclarer un uniforme manquant, appuyez sur le bouton jaune à droite de l'uniforme.`,

    bac_blanc_ok_uniforme: (code) =>
      `Uniforme collecté dans le bac blanc ${code}.`,

    bac_rouge_ok: (code) =>
      `Uniforme infecté collecté dans le bac rouge ${code}.`,

    cloture_ok_uniforme: (nom, b, i, m) =>
      `Collecte uniformes de ${nom} terminée. ${b} blanc${b>1?"s":""}, ${i} infecté${i>1?"s":""}, ${m} manquant${m>1?"s":""}. Bien joué.`,
  
  },

  ar: {
    // ── Démarrage ──────────────────────────────────────────────────────────
    bienvenue: (nom) =>
      `مرحباً ${nom}. امسح رمز الغرفة للبدء.`,

    // ── Chambre ────────────────────────────────────────────────────────────
    chambre_identifiee: (code, nbLits, nbLinges) =>
      `تم التعرف على الغرفة ${code}. ${nbLits} ${nbLits > 1 ? "أسرة" : "سرير"}، `
      + `${nbLinges} ${nbLinges > 1 ? "قطع غسيل" : "قطعة غسيل"}. امسح سريراً.`,
    chambre_erreur: () =>
      `الغرفة غير موجودة. تحقق من الرمز وحاول مجدداً.`,
    chambre_vide: () =>
      `لا يوجد غسيل لجمعه في هذه الغرفة.`,

    // ── Lit ────────────────────────────────────────────────────────────────
    lit_normal: (code, nb) =>
      `السرير ${code}. ${nb} ${nb > 1 ? "قطع" : "قطعة"} عادية. امسح الصندوق الأبيض.`,
    lit_infecte: (code, nb) =>
      `تنبيه. السرير ${code} ملوث. ${nb} ${nb > 1 ? "قطع" : "قطعة"}. امسح الكيس الأحمر.`,
    lit_deja_traite: (code) =>
      `السرير ${code} تمت معالجته مسبقاً.`,
    lit_vide: (code) =>
      `السرير ${code} لا يحتوي على غسيل.`,

    // ── Traitement contenant ───────────────────────────────────────────────
    bac_blanc_ok: (nb, code) =>
      `ممتاز. تم جمع ${nb} ${nb > 1 ? "قطع" : "قطعة"} في الصندوق ${code}. انتقل للسرير التالي.`,
    sac_infecte_ok: (nb, code) =>
      `تم تسجيل ${nb} ${nb > 1 ? "قطع ملوثة" : "قطعة ملوثة"} في الكيس ${code}. انتقل للسرير التالي.`,
    contenant_erreur: (msg) =>
      `خطأ. ${msg}. حاول مجدداً.`,

    // ── Linge individuel ───────────────────────────────────────────────────
    linge_propre: () =>
      `تم تسجيل الغسيل نظيفاً. يبقى في مكانه.`,
    linge_manquant: () =>
      `تم الإبلاغ عن الغسيل المفقود.`,
    linge_deja_traite: () =>
      `هذه القطعة تمت معالجتها مسبقاً.`,

    // ── Progression ────────────────────────────────────────────────────────
    tous_lits_traites: () =>
      `تمت معالجة جميع الأسرة. امسح شارتك لإغلاق جمع الغسيل.`,
    lits_restants: (n) =>
      `${n} ${n > 1 ? "أسرة متبقية" : "سرير متبق"}. واصل العمل.`,

    // ── Clôture ────────────────────────────────────────────────────────────
    cloture_ok: (chambre, blancs, infectes, propres, manquants) =>
      `تم إغلاق جمع غسيل الغرفة ${chambre}. `
      + `${blancs} أبيض، ${infectes} ملوث، ${propres} نظيف، ${manquants} مفقود. أحسنت.`,
    cloture_lits_restants: (n) =>
      `تنبيه. ${n} ${n > 1 ? "أسرة لم تعالج" : "سرير لم يعالج"}. هل تريد الإغلاق؟`,
    cloture_erreur: () =>
      `تعذر الإغلاق. تحقق من معالجة جميع الغسيل.`,

    // ── Erreurs générales ──────────────────────────────────────────────────
    erreur_reseau: () =>
      `خطأ في الاتصال. تحقق من الشبكة وحاول مجدداً.`,
    erreur_generique: (msg) =>
      `خطأ. ${msg}.`,
    code_non_reconnu: () =>
      `الرمز غير معروف. امسح سريراً أو صندوقاً أو شارتك.`,

    guide_propre_manquant: () =>
  `Pour chaque linge, vous pouvez appuyer sur le bouton bleu pour le déclarer propre, ou le bouton jaune pour le déclarer manquant.`,

guide_lit_en_attente: (codeLit) =>
  `Le lit ${codeLit} attend d'être traité. Scannez un bac blanc ou un sac rouge.`,
guide_propre_manquant: () =>
  `لكل قطعة غسيل، يمكنك الضغط على الزر الأزرق لتعليمها نظيفة، أو الزر الأصفر للإبلاغ عنها كمفقودة.`,

guide_lit_en_attente: (codeLit) =>
  `السرير ${codeLit} في انتظار المعالجة. امسح صندوقاً أبيض أو كيساً أحمر.`,
 bienvenue_service: (nom) =>
      `مرحباً ${nom}. امسح رمز المصلحة للبدء.`,

    service_identifie: (code, nb) =>
      `تم التعرف على المصلحة ${code}. ${nb} ${nb>1?"قطع":"قطعة"} للجمع. امسح الصندوق الأبيض.`,

    bac_blanc_ok_service: (code) =>
      `تم تسجيل الصندوق الأبيض ${code}. امسح قطع الغسيل البيضاء.`,

    guide_propre_manquant: () =>
      `لكل قطعة، الزر الأزرق لتعليمها نظيفة، الزر الأصفر للإبلاغ عنها كمفقودة.`,

    linge_propre_service: () =>
      `تم تسجيل الغسيل نظيفاً.`,

    linge_manquant_service: () =>
      `تم الإبلاغ عن الغسيل المفقود.`,

    sac_infecte_declare: (total) =>
      `تم تسجيل كيس ملوث. ${total} ${total>1?"قطع ملوثة":"قطعة ملوثة"}.`,

    cloture_ok_service: (service, blancs, infectes, manquants) =>
      `تم إغلاق جمع مصلحة ${service}. ${blancs} أبيض، ${infectes} ملوث، ${manquants} مفقود. أحسنت.`,

    // ── UNIFORME ──────────────────────────────────────────────────
    bienvenue_uniforme: (nom) =>
      `مرحباً ${nom}. امسح شارة الطبيب.`,

    badge_ok: (nom, nb, inf) => inf
      ? `تنبيه. ${nom} كان على تماس ملوث. ${nb} ${nb>1?"قطع ملوثة محتملة":"قطعة"}. امسح بحذر.`
      : `تم التعرف على ${nom}. ${nb} ${nb>1?"قطع زي":"قطعة زي"}. امسح زياً.`,

    uniforme_ok: (code, inf) => inf
      ? `الزي ${code} مشبوه. امسح الصندوق الأحمر.`
      : `الزي ${code} عادي. امسح الصندوق.`,

    guide_manquant: () =>
      `للإبلاغ عن زي مفقود، اضغط على الزر الأصفر بجانب الزي.`,

    bac_blanc_ok_uniforme: (code) =>
      `تم جمع الزي في الصندوق الأبيض ${code}.`,

    bac_rouge_ok: (code) =>
      `تم جمع الزي الملوث في الصندوق الأحمر ${code}.`,

    cloture_ok_uniforme: (nom, b, i, m) =>
      `تم إغلاق جمع زي ${nom}. ${b} أبيض، ${i} ملوث، ${m} مفقود. أحسنت.`,
  },
};
