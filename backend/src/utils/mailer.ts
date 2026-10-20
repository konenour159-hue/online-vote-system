import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import { logger } from './logger.js';
import { ServerError } from './errors.js';

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

const sendViaBrevo = async (mail: Mail): Promise<void> => {
  if (!config.brevo_api_key || !config.email_from) {
    throw new ServerError('Brevo is not configured (BREVO_API_KEY, EMAIL_FROM)');
  }
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': config.brevo_api_key, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: config.email_from_name, email: config.email_from },
      to: [{ email: mail.to }],
      subject: mail.subject,
      textContent: mail.text,
      htmlContent: mail.html
    })
  });
  if (!response.ok) {
    throw new ServerError(`Brevo refused the message (HTTP ${response.status})`);
  }
};

const sendViaSmtp = async (mail: Mail): Promise<void> => {
  if (!config.smtp_host || !config.email_from) {
    throw new ServerError('SMTP is not configured (SMTP_HOST, EMAIL_FROM)');
  }
  const transport = nodemailer.createTransport({
    host: config.smtp_host,
    port: config.smtp_port,
    secure: config.smtp_port === 465,
    auth: config.smtp_user ? { user: config.smtp_user, pass: config.smtp_pass } : undefined
  });
  await transport.sendMail({
    from: `"${config.email_from_name}" <${config.email_from}>`,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html
  });
};

/**
 * Envoie un e-mail. En développement le fournisseur « console » écrit le message dans les journaux
 * (le code de vérification y est lisible). En production il est refusé : un fournisseur réel est obligatoire.
 */
export const sendMail = async (mail: Mail): Promise<void> => {
  switch (config.email_provider) {
    case 'brevo':
      return sendViaBrevo(mail);
    case 'smtp':
      return sendViaSmtp(mail);
    case 'console':
      if (config.node_env === 'production') {
        throw new ServerError('EMAIL_PROVIDER=console is not allowed in production');
      }
      logger.info(`📧 [e-mail simulé] à ${mail.to} — ${mail.subject}\n${mail.text}`);
      return;
    default:
      throw new ServerError('No e-mail provider configured (set EMAIL_PROVIDER to brevo or smtp)');
  }
};

export const verificationCodeMail = (to: string, name: string, voteTitle: string, code: string): Mail => ({
  to,
  subject: `Votre code de vérification : ${code}`,
  text:
    `Bonjour ${name},\n\nVotre code pour participer au vote « ${voteTitle} » est : ${code}\n` +
    `Il est valable 10 minutes. Ne le partagez avec personne.\n\n` +
    `Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.`,
  html:
    `<p>Bonjour ${escapeHtml(name)},</p>` +
    `<p>Votre code pour participer au vote « ${escapeHtml(voteTitle)} » est :</p>` +
    `<p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p>` +
    `<p>Il est valable 10 minutes. Ne le partagez avec personne.</p>` +
    `<p style="color:#666">Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>`
});

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
