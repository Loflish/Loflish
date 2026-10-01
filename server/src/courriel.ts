import nodemailer from 'nodemailer';
import { config } from './config';

/**
 * Les e-mails du musée : le code pour entrer, le code pour confirmer une
 * nouvelle adresse, et, pour le fondateur, chaque signalement reçu.
 * Des messages courts, sobres, en texte et en HTML simple.
 * Sans serveur SMTP configuré (développement), ils sont écrits dans le journal du serveur.
 */
const transport = config.smtp.url ? nodemailer.createTransport(config.smtp.url) : null;

const echapper = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Une page de lettre : papier clair, une seule police, le code bien lisible. */
function lettre(paragraphes: string[], code?: string): string {
  const p = (t: string) => `<p style="margin:0 0 16px">${echapper(t)}</p>`;
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#ece9e2;padding:32px 16px">
<div style="max-width:480px;margin:0 auto;background:#f6f4ef;border:1px solid #ddd8ce;border-radius:4px;padding:32px 28px;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.55;color:#2f2c33">
<p style="margin:0 0 24px;font-size:15px;letter-spacing:.04em;color:#712a39">Nos Mots Mémoriaux</p>
${paragraphes.slice(0, code ? 1 : paragraphes.length).map(p).join('')}
${code ? `<p style="margin:8px 0 24px;font-size:34px;letter-spacing:.32em;color:#2f2c33">${echapper(code)}</p>${paragraphes.slice(1).map(p).join('')}` : ''}
</div></body></html>`;
}

async function envoyer(email: string, sujet: string, texte: string, html: string, journal: string): Promise<void> {
  if (!transport) {
    console.log(`[courriel] ${journal}`);
    return;
  }
  await transport.sendMail({ from: config.smtp.expediteur, to: email, subject: sujet, text: texte, html });
}

export async function envoyerCodeConnexion(email: string, code: string): Promise<void> {
  const lignes = [
    'Bonjour,',
    `Voici ton code pour entrer dans Nos Mots Mémoriaux : ${code}`,
    'Il est valable 15 minutes et ne sert qu’une fois.',
    'Si tu n’as rien demandé, tu peux ignorer ce message.',
    'Nos Mots Mémoriaux',
  ];
  await envoyer(
    email,
    `Ton code : ${code}`,
    lignes.join('\n\n'),
    lettre(['Voici ton code pour entrer dans le musée :', 'Il est valable 15 minutes et ne sert qu’une fois.', 'Si tu n’as rien demandé, tu peux ignorer ce message.'], code),
    `code de connexion pour ${email} : ${code}`,
  );
}

/** Confirmer une nouvelle adresse : le code arrive à la nouvelle adresse ; rien ne change tant qu'il n'est pas donné. */
export async function envoyerCodeChangement(email: string, code: string): Promise<void> {
  const lignes = [
    'Bonjour,',
    'Tu as demandé à utiliser cette adresse pour entrer dans Nos Mots Mémoriaux.',
    `Pour confirmer que c’est bien toi, donne ce code sur la page Compte : ${code}`,
    'Il est valable 15 minutes. Si tu n’as rien demandé, ignore ce message : rien ne changera.',
    'Nos Mots Mémoriaux',
  ];
  await envoyer(
    email,
    `Confirme ta nouvelle adresse : ${code}`,
    lignes.join('\n\n'),
    lettre(
      [
        'Pour confirmer ta nouvelle adresse, donne ce code sur la page Compte :',
        'Il est valable 15 minutes. Si tu n’as rien demandé, ignore ce message : rien ne changera.',
      ],
      code,
    ),
    `code de changement d’adresse pour ${email} : ${code}`,
  );
}

const MOTIFS: Record<string, string> = {
  danger: 'Quelqu’un est en danger',
  haine: 'Haine, harcèlement ou violence',
  autre: 'Autre chose',
  intime: 'Vie privée exposée',
  usurpation: 'Usurpation',
};

/** Le fondateur reçoit chaque signalement, aussitôt (adresses de ADMIN_EMAILS). */
export async function envoyerSignalement(s: { motif: string; message?: string; traceId: string; traceNom: string }): Promise<void> {
  if (!config.admins.length) return;
  const motif = MOTIFS[s.motif] ?? s.motif;
  const lien = `${config.siteUrl}/#/trace/${s.traceId}`;
  const admin = `${config.siteUrl}/#/admin`;
  const lignes = [
    `Un signalement vient d’arriver : ${motif}.`,
    `Trace : ${s.traceNom} (${lien})`,
    s.message ? `Message : ${s.message}` : 'Pas de message.',
    `Pour décider (retirer la bulle, bannir, ou classer) : ${admin}`,
  ];
  const sujet = `${s.motif === 'danger' ? 'Urgent, ' : ''}signalement : ${motif}`;
  for (const email of config.admins)
    await envoyer(email, sujet, lignes.join('\n\n'), lettre(lignes), `signalement (${s.motif}) sur ${s.traceId} pour ${email}`).catch(() => undefined);
}
