// Envio de e-mail via Resend (HTTP API direto, sem SDK — é só um POST).
// RESEND_FROM_EMAIL pode ser trocado por um remetente com domínio
// verificado assim que ele estiver pronto no Resend, sem mexer em código.

const DEFAULT_FROM = 'TimeLabs <onboarding@resend.dev>'

export async function sendEmail(params: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY não configurada — e-mail não enviado:', params.subject, params.to)
    return
  }
  const from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: params.to, subject: params.subject, html: params.html }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('Falha ao enviar e-mail via Resend', res.status, body)
  }
}

// O nome do bloco é texto livre digitado no cadastro — nunca embutir
// direto no HTML do e-mail sem escapar, senão vira injeção de HTML
// pro que a diretoria recebe na caixa de entrada.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function directorWelcomeEmail(params: {
  blocoName: string
  loginUrl: string
  email: string
  whatsappLast6: string
}): { subject: string; html: string } {
  const blocoName = escapeHtml(params.blocoName)
  const email = escapeHtml(params.email)
  const subject = `${params.blocoName} está pronto no TimeLabs — seu acesso de diretoria`
  const html = `
    <div style="font-family: -apple-system, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #161616;">
      <h1 style="font-size: 20px;">${blocoName} está pronto! 🎉</h1>
      <p>O sistema de check-in do seu bloco já está ativo. Veja como entrar como diretoria:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; color: #8a8175; font-size: 13px;">Endereço do sistema</td>
        </tr>
        <tr>
          <td style="padding: 0 0 12px; font-weight: bold;">
            <a href="${params.loginUrl}">${params.loginUrl}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #8a8175; font-size: 13px;">E-mail de login</td>
        </tr>
        <tr>
          <td style="padding: 0 0 12px; font-weight: bold;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #8a8175; font-size: 13px;">Senha inicial</td>
        </tr>
        <tr>
          <td style="padding: 0 0 12px; font-weight: bold;">
            Os 6 últimos dígitos do seu WhatsApp (${params.whatsappLast6})
          </td>
        </tr>
      </table>
      <p style="font-size: 13px; color: #8a8175;">
        Assim que entrar, recomendamos trocar essa senha na opção "Trocar senha" dentro do sistema.
        O mesmo esquema (e-mail + 6 últimos dígitos do WhatsApp) vale pra cada membro que você
        cadastrar depois.
      </p>
      <p style="font-size: 13px; color: #8a8175; margin-top: 24px;">
        Dúvidas? Só responder este e-mail.
      </p>
    </div>
  `
  return { subject, html }
}
