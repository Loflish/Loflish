import nodemailer from 'nodemailer';
import { config } from './config';

/**
 * Les e-mails du musée : pour l'instant, le lien de connexion. Sans serveur
 * SMTP configuré (développement), le lien est écrit dans le journal du serveur.
 */
const transport = config.smtp.url ? nodemailer.createTransport(config.smtp.url) : null;

export async function envoyerLienConnexion(email: string, lien: string): Promise<void> {
  const texte = [
    'Bonjour,',
    '',
    'Voici ton lien pour entrer dans Nos mots mémoriaux. Il est valable 20 minutes et ne sert qu’une fois :',
    '',
    lien,
    '',
    'Si tu n’as rien demandé, ignore simplement ce message.',
    '',
    'Nos mots mémoriaux',
  ].join('\n');
  if (!transport) {
    console.log(`[courriel] lien de connexion pour ${email} : ${lien}`);
    return;
  }
  await transport.sendMail({ from: config.smtp.expediteur, to: email, subject: 'Ton lien pour entrer dans Nos mots mémoriaux', text: texte });
}
