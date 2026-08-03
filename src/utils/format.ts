/**
 * Monta o link universal do WhatsApp (wa.me) a partir de um telefone
 * brasileiro. Abre o app de WhatsApp instalado no aparelho de quem clicar
 * (Business ou pessoal — isso é decidido pelo celular, não pelo link).
 */
export function linkWhatsApp(telefone: string, mensagem?: string): string | null {
  let digitos = (telefone || '').replace(/\D/g, '');
  if (!digitos) return null;
  // Remove um "0" de discagem interurbana que às vezes aparece antes do DDD.
  if (digitos.length === 11 && digitos.startsWith('0')) digitos = digitos.slice(1);
  // Adiciona o DDI 55 (Brasil) se ainda não tiver.
  if (digitos.length <= 11) digitos = `55${digitos}`;
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : '';
  return `https://wa.me/${digitos}${texto}`;
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR');
}

export function formatDateTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  }
  return digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
}

/** Nome de exibição de um cliente com cadastro parcial (campos agora são opcionais). */
export function nomeExibicaoCliente(cliente: { nomeFantasia?: string; razaoSocial?: string }): string {
  return cliente.nomeFantasia?.trim() || cliente.razaoSocial?.trim() || 'Cliente sem nome';
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}
