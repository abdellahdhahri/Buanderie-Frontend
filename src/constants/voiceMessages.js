/* ═══════════════════════════════════════════════════════════════════════════
   ACCORD DES NOMBRES EN ARABE
   1 → « قطعة واحدة », 2 → duel « قطعتان », 3-10 → nombre en lettres au genre
   inverse du nom + pluriel « ثلاث قطع / ثلاثة أسرّة », 11-99 → singulier
   accusatif « 15 قطعةً », 100, 200… → singulier « 100 قطعة ».
   ═══════════════════════════════════════════════════════════════════════════ */
const AR_NOUNS = {
  piece:   { fem: true,  one: "قطعة واحدة", two: "قطعتان", twoGen: "قطعتين", few: "قطع",    many: "قطعةً", sing: "قطعة" },
  bed:     { fem: false, one: "سرير واحد",  two: "سريران", twoGen: "سريرين", few: "أسِرّة", many: "سريرًا", sing: "سرير" },
  bag:     { fem: false, one: "كيس واحد",   two: "كيسان",  twoGen: "كيسين",  few: "أكياس",  many: "كيسًا", sing: "كيس" },
  lot:     { fem: true,  one: "دفعة واحدة", two: "دفعتان", twoGen: "دفعتين", few: "دفعات",  many: "دفعةً", sing: "دفعة" },
  uniform: { fem: false, one: "زيّ واحد",   two: "زيّان",  twoGen: "زيّين",  few: "أزياء",  many: "زيًّا", sing: "زيّ" },
};

const AR_ADJ = {
  infected: {
    piece: ["مُلَوَّثة", "مُلَوَّثتان", "مُلَوَّثة", "مُلَوَّثة", "مُلَوَّثتين"],
    bag:   ["مُلَوَّث", "مُلَوَّثان", "مُلَوَّثة", "مُلَوَّثًا", "مُلَوَّثين"],
  },
  available: {
    piece:   ["متاحة", "متاحتان", "متاحة", "متاحة", "متاحتين"],
    uniform: ["متاح", "متاحان", "متاحة", "متاحًا", "متاحين"],
  },
};

// Nombre de 3 à 10 en lettres : masculin devant un nom féminin et inversement
const AR_3_10 = {
  forMasc: ["ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة"],
  forFem:  ["ثلاث", "أربع", "خمس", "ست", "سبع", "ثماني", "تسع", "عشر"],
};

// gen = true après une préposition ou un nom d'action (« تم تسجيل », « على »…) : duel en -ين
const arCountGen = (n, noun, adjective) => arCount(n, noun, adjective, true);

function arCount(n, noun, adjective, gen = false) {
  const w = AR_NOUNS[noun];
  n = Math.max(0, Math.round(Number(n) || 0));
  const adj = adjective ? AR_ADJ[adjective]?.[noun] : null;
  const withAdj = (text, i) => (adj ? `${text} ${adj[i]}` : text);
  if (n === 0) return withAdj(`صفر ${w.sing}`, 0);
  if (n === 1) return withAdj(w.one, 0);
  if (n === 2) return withAdj(gen ? w.twoGen : w.two, gen ? 4 : 1);
  if (n <= 10) return withAdj(`${(w.fem ? AR_3_10.forFem : AR_3_10.forMasc)[n - 3]} ${w.few}`, 2);
  const r = n % 100;
  if (r >= 3 && r <= 10) return withAdj(`${n} ${w.few}`, 2);
  if (r >= 11) return withAdj(`${n} ${w.many}`, 3);
  return withAdj(`${n} ${w.sing}`, 0);
}

export const MESSAGES = {
  fr: {
    // ── Démarrage ──────────────────────────────────────────────────────────
    bienvenue: (nom) =>
      `Bonjour ${nom}. Scannez le code-barres de la chambre pour commencer.`,

    // ── Chambre ────────────────────────────────────────────────────────────
    chambre_identifiee: (code, nbLits, nbLinges) =>
      `Chambre ${code} identifiée. ${nbLits} lit${nbLits > 1 ? "s" : ""}, `
      + `${nbLinges} linge${nbLinges > 1 ? "s" : ""} à collecter. Touchez un lit pour voir ses linges.`,
    chambre_erreur: () =>
      `Chambre introuvable. Vérifiez le code et réessayez.`,
    chambre_vide: () =>
      `Aucun linge à collecter dans cette chambre.`,

    // ── Lit ────────────────────────────────────────────────────────────────
    lit_normal: (code, nb) =>
      `Lit ${code}. ${nb} linge${nb > 1 ? "s" : ""} coché${nb > 1 ? "s" : ""}. Touchez un linge pour le retirer, puis scannez le bac blanc.`,
    lit_infecte: (code, nb) =>
      `Attention. Lit ${code} infecté. ${nb} linge${nb > 1 ? "s" : ""} coché${nb > 1 ? "s" : ""}. Touchez un linge pour le retirer, puis scannez le sac rouge.`,
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
      msg ? `Erreur. ${msg}. Réessayez.` : `Impossible d'enregistrer le contenant. Réessayez.`,

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
      msg ? `Erreur. ${msg}.` : `Une erreur est survenue. Réessayez.`,
    code_non_reconnu: () =>
      `Code non reconnu. Touchez un lit, ou scannez un bac ou votre badge.`,

    // ── Dialogue du lit (écran tactile) ────────────────────────────────────
    guide_chambre: () =>
      `Touchez un lit pour ouvrir ses linges, puis scannez le bac ou le sac.`,
    selection_vide: () =>
      `Aucun linge coché. Touchez les linges collectés avant de scanner.`,
    tout_coche: (n) =>
      `${n} linge${n > 1 ? "s" : ""} coché${n > 1 ? "s" : ""}.`,
    tout_decoche: () =>
      `Tous les linges sont décochés.`,
    linges_restants_lit: (n) =>
      `${n} linge${n > 1 ? "s" : ""} non coché${n > 1 ? "s" : ""}. Déclarez-les propres ou manquants.`,
    guide_infecte: () =>
      `Ce linge va être déclaré infecté. Placez-le dans un sac infecté puis scannez le sac.`,
    scanner_sac_infecte: () =>
      `Scannez maintenant le code du sac infecté.`,
    linge_infecte_ok: () =>
      `Le linge a été déclaré infecté et associé au sac infecté.`,
    guide_lit_en_attente: (codeLit) =>
      `Le lit ${codeLit} attend d'être traité. Scannez un bac blanc ou un sac rouge.`,

    // ── Distribution chambre ───────────────────────────────────────────────
    bienvenue_distribution: (nom) =>
      `Bonjour ${nom}. Scannez le code de la chambre pour commencer la distribution.`,
    chambre_distribution: (code, nbLits, nbDispo) =>
      `Chambre ${code}. ${nbLits} lit${nbLits > 1 ? "s" : ""}, ${nbDispo} linge${nbDispo > 1 ? "s" : ""} disponible${nbDispo > 1 ? "s" : ""}. Touchez un lit, puis scannez les linges à poser.`,
    chambre_distribution_vide: (code) =>
      `Chambre ${code}. Aucun linge disponible pour cette chambre.`,
    lit_distribution: (code, infecte) => infecte
      ? `Attention. Lit ${code} infecté. Scannez les linges à poser avec précaution.`
      : `Lit ${code} sélectionné. Scannez les linges à poser.`,
    choisir_lit: () =>
      `Touchez d'abord un lit avant de scanner un linge.`,
    linge_pose: (code, nb) =>
      `Posé. Lit ${code}, ${nb} linge${nb > 1 ? "s" : ""}.`,
    tous_linges_poses: () =>
      `Tous les linges disponibles sont posés. Scannez votre badge pour terminer.`,
    aucun_linge_distribue: () =>
      `Aucun linge distribué. Posez au moins un linge avant de terminer.`,
    distribution_terminee: (chambre, nb, lits) =>
      `Distribution de la chambre ${chambre} terminée. ${nb} linge${nb > 1 ? "s" : ""} sur ${lits} lit${lits > 1 ? "s" : ""}. Bien joué.`,

    // ── Distribution service ───────────────────────────────────────────────
    bienvenue_distribution_service: (nom) =>
      `Bonjour ${nom}. Scannez le code du service pour commencer la distribution.`,
    service_distribution: (nom, reste) =>
      `Distribution créée pour le service ${nom}. ${reste} article${reste > 1 ? "s" : ""} à livrer. Scannez les articles.`,
    article_livre: (reste) =>
      `Livré. Reste ${reste} article${reste > 1 ? "s" : ""}.`,
    article_refuse: (msg) =>
      msg ? `Article refusé. ${msg}.` : `Article refusé.`,
    distribution_service_complete: () =>
      `Tous les articles sont livrés. Distribution terminée.`,
    articles_restants_cloture: (n) =>
      `Attention. ${n} article${n > 1 ? "s" : ""} non livré${n > 1 ? "s" : ""}. Voulez-vous quand même clôturer ?`,
    distribution_service_cloturee: (nom) =>
      `Distribution du service ${nom} clôturée. Bien joué.`,

    // ── Distribution uniforme ──────────────────────────────────────────────
    bienvenue_distribution_uniforme: (nom) =>
      `Bonjour ${nom}. Scannez le badge du membre du personnel.`,
    personnel_distribution: (nom, nbDispo) => nbDispo > 0
      ? `${nom} identifié. ${nbDispo} uniforme${nbDispo > 1 ? "s" : ""} disponible${nbDispo > 1 ? "s" : ""}. Scannez les uniformes à remettre.`
      : `${nom} identifié. Aucun uniforme disponible.`,
    scanner_personnel_d_abord: () =>
      `Scannez d'abord le badge du membre du personnel.`,
    uniforme_distribue: (n) =>
      `Uniforme remis. ${n} au total.`,
    uniforme_retire: () =>
      `Uniforme retiré de la liste.`,
    aucun_uniforme_distribue: () =>
      `Aucun uniforme remis. Scannez au moins un uniforme avant de terminer.`,
    distribution_uniforme_terminee: (nom, n) =>
      `Distribution terminée pour ${nom}. ${n} uniforme${n > 1 ? "s" : ""} remis. Bien joué.`,

    // ── Lavage ─────────────────────────────────────────────────────────────
    bienvenue_lavage: (nom) =>
      `Bonjour ${nom}. Scannez le code de la machine pour commencer le lavage.`,
    machine_normale: (code) =>
      `Machine ${code} prête pour le linge blanc. Scannez ou touchez les lots à charger.`,
    machine_infectee: (code, nbSacs) =>
      `Attention. Machine ${code} pour le linge infecté. ${nbSacs} sac${nbSacs > 1 ? "s" : ""} en attente. Scannez les sacs à laver.`,
    machine_introuvable: () =>
      `Machine introuvable. Vérifiez le code et réessayez.`,
    lot_ajoute: (code, poids, capacite) => capacite
      ? `Lot ${code} ajouté. Charge ${poids} kilos sur ${capacite}.`
      : `Lot ${code} ajouté. Charge ${poids} kilos.`,
    lot_retire: (code) =>
      `Lot ${code} retiré du chargement.`,
    lot_deja_ajoute: (code) =>
      `Le lot ${code} est déjà dans le chargement.`,
    lot_introuvable: () =>
      `Lot introuvable ou pas encore trié.`,
    capacite_depassee: (capacite) =>
      `Capacité dépassée. La machine accepte ${capacite} kilos au maximum.`,
    lavage_demarre: (nbLots) =>
      `Lavage démarré avec ${nbLots} lot${nbLots > 1 ? "s" : ""}.`,
    lavage_termine: () =>
      `Lavage terminé. Vous pouvez décharger la machine.`,
    scanner_machine_d_abord: () =>
      `Scannez d'abord une machine.`,
    sac_ajoute: (code, nb) =>
      `Sac ${code} ajouté. ${nb} article${nb > 1 ? "s" : ""}.`,
    sac_introuvable: () =>
      `Sac introuvable.`,
    sac_deja_ajoute: (code) =>
      `Le sac ${code} est déjà ajouté.`,
    sac_deja_en_lavage: (code) =>
      `Le sac ${code} est déjà en lavage.`,
    cycle_deja_en_cours: () =>
      `Un cycle est déjà en cours sur cette machine.`,
    aucun_sac: () =>
      `Aucun sac sélectionné. Scannez au moins un sac.`,
    cycle_infecte_demarre: (n) =>
      `Lavage infecté démarré pour ${n} sac${n > 1 ? "s" : ""}.`,
    cycle_infecte_termine: (n) =>
      `Lavage infecté terminé. ${n} sac${n > 1 ? "s" : ""} lavé${n > 1 ? "s" : ""}.`,
    cycle_infecte_arrete: () =>
      `Cycle infecté arrêté.`,
     bienvenue_service: (nom) =>
      `Bonjour ${nom}. Scannez le code du service pour commencer.`,

    service_identifie: (code, nb) =>
      `Service ${code} identifié. ${nb} linge${nb>1?"s":""} à collecter. Scannez le bac blanc.`,

    bac_blanc_ok_service: (code) =>
      `Bac blanc ${code} enregistré. Scannez les linges blancs.`,

    guide_propre_manquant: () =>
      `Pour chaque linge, le bouton bleu le déclare propre, le bouton jaune le déclare manquant.`,

    linge_blanc_ok: () =>
      `Collecté en blanc.`,

    tous_traites_service: () =>
      `Tous les linges sont traités.`,

    cloture_erreur_service: () =>
      `Impossible de clôturer. Réessayez.`,

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

  // ═════════════════════════════════════════════════════════════════════════
  // ARABE — arabe standard simple : phrases courtes, un seul mot par notion
  // (قطعة، سرير، الصندوق الأبيض، الكيس الأحمر، القسم، الآلة، الدفعة، شارتك),
  // voyelles sur les mots ambigus et accord des nombres via arCount().
  // ═════════════════════════════════════════════════════════════════════════
  ar: {
    // ── البداية ────────────────────────────────────────────────────────────
    bienvenue: (nom) =>
      `مرحبًا ${nom}. امسَح رمز الغرفة للبدء.`,

    // ── الغرفة ─────────────────────────────────────────────────────────────
    chambre_identifiee: (code, nbLits, nbLinges) =>
      `الغرفة ${code}. ${arCount(nbLits, "bed")}، و${arCount(nbLinges, "piece")} للجمع. اضغط على سرير لعرض قطعه.`,
    chambre_erreur: () =>
      `لم يتم العثور على الغرفة. تحقَّق من الرمز، ثم أعِد المحاولة.`,
    chambre_vide: () =>
      `لا توجد قطع للجمع في هذه الغرفة.`,

    // ── السرير ─────────────────────────────────────────────────────────────
    lit_normal: (code, nb) =>
      `السرير ${code}. تم تحديد ${arCountGen(nb, "piece")}. اضغط على قطعة لإلغاء تحديدها، ثم امسَح الصندوق الأبيض.`,
    lit_infecte: (code, nb) =>
      `انتباه. السرير ${code} مُلَوَّث. تم تحديد ${arCountGen(nb, "piece")}. اضغط على قطعة لإلغاء تحديدها، ثم امسَح الكيس الأحمر.`,
    lit_deja_traite: (code) =>
      `السرير ${code} تمت معالجته من قبل.`,
    lit_vide: (code) =>
      `السرير ${code} لا توجد عليه قطع للجمع.`,

    // ── الصندوق والكيس ─────────────────────────────────────────────────────
    bac_blanc_ok: (nb, code) =>
      `ممتاز. تم جمع ${arCountGen(nb, "piece")} في الصندوق ${code}. انتقِل إلى السرير التالي.`,
    sac_infecte_ok: (nb, code) =>
      `تم تسجيل ${arCountGen(nb, "piece", "infected")} في الكيس ${code}. انتقِل إلى السرير التالي.`,
    contenant_erreur: (msg) =>
      msg ? `خطأ. ${msg}. أعِد المحاولة.` : `تعذَّر تسجيل الصندوق. أعِد المحاولة.`,

    // ── قطعة واحدة ─────────────────────────────────────────────────────────
    linge_propre: () =>
      `تم تسجيل القطعة نظيفة. اتركها في مكانها.`,
    linge_manquant: () =>
      `تم التصريح بقطعة مفقودة.`,
    linge_deja_traite: () =>
      `هذه القطعة تمت معالجتها من قبل.`,

    // ── التقدّم ────────────────────────────────────────────────────────────
    tous_lits_traites: () =>
      `تمت معالجة جميع الأسِرّة. امسَح شارَتَك لإنهاء الجمع.`,
    lits_restants: (n) =>
      `المتبقي: ${arCount(n, "bed")}. واصِل.`,

    // ── الإنهاء ────────────────────────────────────────────────────────────
    cloture_ok: (chambre, blancs, infectes, propres, manquants) =>
      `انتهى جمع الغرفة ${chambre}. `
      + `أبيض: ${blancs}. مُلَوَّث: ${infectes}. نظيف: ${propres}. مفقود: ${manquants}. أحسنت.`,
    cloture_lits_restants: (n) =>
      `انتباه. لم تتم معالجة ${arCountGen(n, "bed")}. هل تريد الإنهاء رغم ذلك؟`,
    cloture_erreur: () =>
      `تعذَّر الإنهاء. تأكَّد من معالجة جميع القطع.`,

    // ── أخطاء عامة ─────────────────────────────────────────────────────────
    erreur_reseau: () =>
      `خطأ في الاتصال. تحقَّق من الشبكة، ثم أعِد المحاولة.`,
    erreur_generique: (msg) =>
      msg ? `خطأ. ${msg}.` : `حدث خطأ. أعِد المحاولة.`,
    code_non_reconnu: () =>
      `رمز غير معروف. اضغط على سرير، أو امسَح صندوقًا، أو امسَح شارَتَك.`,

    // ── نافذة السرير (شاشة اللمس) ──────────────────────────────────────────
    guide_chambre: () =>
      `اضغط على سرير لعرض قطعه، ثم امسَح الصندوق أو الكيس.`,
    selection_vide: () =>
      `لم يتم تحديد أي قطعة. اضغط على القطع التي جمعتها، ثم امسَح.`,
    tout_coche: (n) =>
      `تم تحديد ${arCountGen(n, "piece")}.`,
    tout_decoche: () =>
      `تم إلغاء تحديد جميع القطع.`,
    linges_restants_lit: (n) =>
      `القطع غير المحدَّدة: ${arCount(n, "piece")}. صرِّح بها نظيفة أو مفقودة.`,
    guide_infecte: () =>
      `سيتم التصريح بهذه القطعة مُلَوَّثة. ضَعها في كيس أحمر، ثم امسَح الكيس.`,
    scanner_sac_infecte: () =>
      `امسَح الآن رمز الكيس الأحمر.`,
    linge_infecte_ok: () =>
      `تم التصريح بالقطعة مُلَوَّثة وربطها بالكيس الأحمر.`,
    guide_lit_en_attente: (codeLit) =>
      `السرير ${codeLit} في انتظار المعالجة. امسَح صندوقًا أبيض أو كيسًا أحمر.`,

    // ── التوزيع على الغرف ──────────────────────────────────────────────────
    bienvenue_distribution: (nom) =>
      `مرحبًا ${nom}. امسَح رمز الغرفة لبدء التوزيع.`,
    chambre_distribution: (code, nbLits, nbDispo) =>
      `الغرفة ${code}. ${arCount(nbLits, "bed")}، و${arCount(nbDispo, "piece", "available")}. اضغط على سرير، ثم امسَح القطع التي تضعها.`,
    chambre_distribution_vide: (code) =>
      `الغرفة ${code}. لا توجد قطع متاحة لهذه الغرفة.`,
    lit_distribution: (code, infecte) => infecte
      ? `انتباه. السرير ${code} مُلَوَّث. امسَح القطع بحذر.`
      : `تم اختيار السرير ${code}. امسَح القطع التي تضعها.`,
    choisir_lit: () =>
      `اضغط على سرير أولًا، ثم امسَح القطعة.`,
    linge_pose: (code, nb) =>
      `تم. السرير ${code}: ${arCount(nb, "piece")}.`,
    tous_linges_poses: () =>
      `تم وضع جميع القطع المتاحة. امسَح شارَتَك للإنهاء.`,
    aucun_linge_distribue: () =>
      `لم يتم توزيع أي قطعة. ضَع قطعة واحدة على الأقل قبل الإنهاء.`,
    distribution_terminee: (chambre, nb, lits) =>
      `انتهى توزيع الغرفة ${chambre}. ${arCount(nb, "piece")} على ${arCountGen(lits, "bed")}. أحسنت.`,

    // ── التوزيع على الأقسام ────────────────────────────────────────────────
    bienvenue_distribution_service: (nom) =>
      `مرحبًا ${nom}. امسَح رمز القسم لبدء التوزيع.`,
    service_distribution: (nom, reste) =>
      `تم إنشاء التوزيع لقسم ${nom}. ${arCount(reste, "piece")} للتسليم. امسَح القطع.`,
    article_livre: (reste) =>
      reste > 0 ? `تم التسليم. المتبقي: ${arCount(reste, "piece")}.` : `تم التسليم.`,
    article_refuse: (msg) =>
      msg ? `قطعة مرفوضة. ${msg}.` : `قطعة مرفوضة.`,
    distribution_service_complete: () =>
      `تم تسليم جميع القطع. انتهى التوزيع.`,
    articles_restants_cloture: (n) =>
      `انتباه. لم يتم تسليم ${arCountGen(n, "piece")}. هل تريد الإنهاء رغم ذلك؟`,
    distribution_service_cloturee: (nom) =>
      `تم إنهاء توزيع قسم ${nom}. أحسنت.`,

    // ── توزيع الأزياء ──────────────────────────────────────────────────────
    bienvenue_distribution_uniforme: (nom) =>
      `مرحبًا ${nom}. امسَح شارة الموظف.`,
    personnel_distribution: (nom, nbDispo) => nbDispo > 0
      ? `تم التعرف على ${nom}. ${arCount(nbDispo, "uniform", "available")}. امسَح الأزياء التي تسلِّمها.`
      : `تم التعرف على ${nom}. لا يوجد زيّ متاح.`,
    scanner_personnel_d_abord: () =>
      `امسَح شارة الموظف أولًا.`,
    uniforme_distribue: (n) =>
      `تم تسليم الزيّ. المجموع: ${n}.`,
    uniforme_retire: () =>
      `تم حذف الزيّ من القائمة.`,
    aucun_uniforme_distribue: () =>
      `لم يتم تسليم أي زيّ. امسَح زيًّا واحدًا على الأقل قبل الإنهاء.`,
    distribution_uniforme_terminee: (nom, n) =>
      `انتهى التوزيع لـ ${nom}. تم تسليم ${arCountGen(n, "uniform")}. أحسنت.`,

    // ── الغسيل ─────────────────────────────────────────────────────────────
    bienvenue_lavage: (nom) =>
      `مرحبًا ${nom}. امسَح رمز الآلة لبدء الغسيل.`,
    machine_normale: (code) =>
      `الآلة ${code} جاهزة للقطع البيضاء. امسَح الدفعات أو اضغط عليها لتحميلها.`,
    machine_infectee: (code, nbSacs) =>
      `انتباه. الآلة ${code} مخصَّصة للقطع المُلَوَّثة. ${arCount(nbSacs, "bag")} في الانتظار. امسَح الأكياس التي تغسلها.`,
    machine_introuvable: () =>
      `لم يتم العثور على الآلة. تحقَّق من الرمز، ثم أعِد المحاولة.`,
    lot_ajoute: (code, poids, capacite) => capacite
      ? `تمت إضافة الدفعة ${code}. الحمولة ${poids} من ${capacite} كيلوغرام.`
      : `تمت إضافة الدفعة ${code}. الحمولة ${poids} كيلوغرام.`,
    lot_retire: (code) =>
      `تم سحب الدفعة ${code} من الحمولة.`,
    lot_deja_ajoute: (code) =>
      `الدفعة ${code} موجودة في الحمولة.`,
    lot_introuvable: () =>
      `لم يتم العثور على الدفعة، أو لم يتم فرزها بعد.`,
    capacite_depassee: (capacite) =>
      `تم تجاوز السعة. الحد الأقصى للآلة ${capacite} كيلوغرام.`,
    lavage_demarre: (nbLots) =>
      `بدأ الغسيل بـ ${arCountGen(nbLots, "lot")}.`,
    lavage_termine: () =>
      `انتهى الغسيل. يمكنك تفريغ الآلة.`,
    scanner_machine_d_abord: () =>
      `امسَح رمز الآلة أولًا.`,
    sac_ajoute: (code, nb) =>
      `تمت إضافة الكيس ${code}. فيه ${arCount(nb, "piece")}.`,
    sac_introuvable: () =>
      `لم يتم العثور على الكيس.`,
    sac_deja_ajoute: (code) =>
      `الكيس ${code} مُضاف من قبل.`,
    sac_deja_en_lavage: (code) =>
      `الكيس ${code} قيد الغسيل حاليًّا.`,
    cycle_deja_en_cours: () =>
      `توجد دورة غسيل جارية على هذه الآلة.`,
    aucun_sac: () =>
      `لم يتم اختيار أي كيس. امسَح كيسًا واحدًا على الأقل.`,
    cycle_infecte_demarre: (n) =>
      `بدأ غسيل ${arCountGen(n, "bag", "infected")}.`,
    cycle_infecte_termine: (n) =>
      `انتهى الغسيل المُلَوَّث. تم غسل ${arCountGen(n, "bag")}.`,
    cycle_infecte_arrete: () =>
      `تم إيقاف دورة الغسيل المُلَوَّث.`,

    // ── جمع الأقسام ────────────────────────────────────────────────────────
    bienvenue_service: (nom) =>
      `مرحبًا ${nom}. امسَح رمز القسم للبدء.`,
    service_identifie: (code, nb) =>
      `القسم ${code}. ${arCount(nb, "piece")} للجمع. امسَح الصندوق الأبيض.`,
    bac_blanc_ok_service: (code) =>
      `تم تسجيل الصندوق الأبيض ${code}. امسَح القطع البيضاء.`,
    guide_propre_manquant: () =>
      `لكل قطعة: الزر الأزرق يعني نظيفة، والزر الأصفر يعني مفقودة.`,
    linge_blanc_ok: () =>
      `تم الجمع في الصندوق الأبيض.`,
    linge_propre_service: () =>
      `تم تسجيل القطعة نظيفة.`,
    linge_manquant_service: () =>
      `تم التصريح بقطعة مفقودة.`,
    sac_infecte_declare: (total) =>
      `تم تسجيل كيس أحمر. فيه ${arCount(total, "piece", "infected")}.`,
    tous_traites_service: () =>
      `تمت معالجة جميع القطع.`,
    cloture_ok_service: (service, blancs, infectes, manquants) =>
      `انتهى جمع قسم ${service}. أبيض: ${blancs}. مُلَوَّث: ${infectes}. مفقود: ${manquants}. أحسنت.`,
    cloture_erreur_service: () =>
      `تعذَّر الإنهاء. أعِد المحاولة.`,

    // ── جمع الأزياء ────────────────────────────────────────────────────────
    bienvenue_uniforme: (nom) =>
      `مرحبًا ${nom}. امسَح شارة الطبيب.`,
    badge_ok: (nom, nb, inf) => inf
      ? `انتباه. ${nom} كان على اتصال بحالة عدوى. عدد الأزياء: ${nb}. قد تكون مُلَوَّثة، امسَح بحذر.`
      : `تم التعرف على ${nom}. ${arCount(nb, "uniform")} للجمع. امسَح زيًّا.`,
    uniforme_ok: (code, inf) => inf
      ? `الزيّ ${code} مشكوك فيه. امسَح الصندوق الأحمر.`
      : `الزيّ ${code} عادي. امسَح الصندوق الأبيض.`,
    guide_manquant: () =>
      `للتصريح بزيّ مفقود، اضغط على الزر الأصفر بجانبه.`,
    bac_blanc_ok_uniforme: (code) =>
      `تم جمع الزيّ في الصندوق الأبيض ${code}.`,
    bac_rouge_ok: (code) =>
      `تم جمع الزيّ المُلَوَّث في الصندوق الأحمر ${code}.`,
    cloture_ok_uniforme: (nom, b, i, m) =>
      `انتهى جمع أزياء ${nom}. أبيض: ${b}. مُلَوَّث: ${i}. مفقود: ${m}. أحسنت.`,
  },
};
