/**
 * Tous les pays et territoires du monde (codes ISO 3166-1), nommés en français
 * par le navigateur et triés par ordre alphabétique ; « Autre » à la toute fin.
 * La personne choisit dans la liste : jamais de texte libre.
 */
const CODES =
  'AF ZA AX AL DZ DE AD AO AI AQ AG SA AR AM AW AU AT AZ BS BH BD BB BE BZ BJ BM BT BY BO BA BW BR BN BG BF BI KH CM CA CV CL CN CY CO KM CG CD KP KR CR CI HR CU CW DK DJ DM EG AE EC ER ES EE SZ US ET FJ FI FR GA GM GE GS GH GI GR GD GL GP GU GT GG GN GQ GW GY GF HT HN HK HU IM IN ID IQ IR IE IS IL IT JM JP JE JO KZ KE KG KI XK KW LA LS LV LB LR LY LI LT LU MO MK MG MY MW MV ML MT MA MQ MU MR YT MX FM MD MC MN ME MS MZ MM NA NR NP NI NE NG NU NO NC NZ OM UG UZ PK PW PS PA PG PY NL PE PH PN PL PF PR PT QA RE RO GB RU RW EH BL KN SM MF PM VC SH LC SB WS AS ST SN RS SC SL SG SX SK SI SO SD SS LK SE CH SR SJ SY TJ TW TZ TD CZ TF IO TH TL TG TK TO TT TN TM TC TR TV UA UY VU VA VE VG VI VN WF YE ZM ZW BQ CK FK FO KY MH MP NF UM'.split(' ');

/** La liste, calculée une fois (tous les navigateurs récents savent nommer les pays en français). */
let noms: string[] | null = null;

export function listePays(): string[] {
  if (noms) return noms;
  let nommer: (code: string) => string | undefined;
  try {
    const dn = new Intl.DisplayNames(['fr'], { type: 'region' });
    nommer = (c) => dn.of(c);
  } catch {
    nommer = () => undefined;
  }
  const vus = new Set<string>();
  for (const c of CODES) {
    const n = nommer(c);
    if (n && n !== c) vus.add(n);
  }
  noms = [...vus].sort((a, b) => a.localeCompare(b, 'fr'));
  return noms;
}

export const PAYS_AUTRE = 'Autre';
