/**
 * Serviço de consulta pública de CNPJ.
 *
 * Utiliza a BrasilAPI (https://brasilapi.com.br), gratuita e sem necessidade
 * de chave de API. Em caso de indisponibilidade, tenta a API pública da
 * ReceitaWS como fallback.
 */

export interface DadosCNPJ {
  razaoSocial: string;
  nomeFantasia: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  situacao: string;
  cnaePrincipal: string;
  dataAbertura: string;
}

export class CNPJNaoEncontradoError extends Error {
  constructor() {
    super('CNPJ não encontrado.');
    this.name = 'CNPJNaoEncontradoError';
  }
}

function apenasDigitos(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

export function cnpjValido(cnpj: string): boolean {
  return apenasDigitos(cnpj).length === 14;
}

function formatarCEP(cep: string): string {
  const d = (cep || '').replace(/\D/g, '');
  if (d.length !== 8) return cep || '';
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

async function buscarNaBrasilAPI(digits: string): Promise<DadosCNPJ> {
  const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
  if (res.status === 404) throw new CNPJNaoEncontradoError();
  if (!res.ok) throw new Error('Falha ao consultar a BrasilAPI.');
  const data = await res.json();

  const ddd = data.ddd_telefone_1 ? data.ddd_telefone_1.replace(/\D/g, '') : '';

  return {
    razaoSocial: data.razao_social ?? '',
    nomeFantasia: data.nome_fantasia ?? '',
    endereco: [data.descricao_tipo_de_logradouro, data.logradouro].filter(Boolean).join(' ').trim(),
    numero: data.numero ?? '',
    bairro: data.bairro ?? '',
    cidade: data.municipio ?? '',
    estado: data.uf ?? '',
    cep: formatarCEP(data.cep ?? ''),
    telefone: ddd,
    email: data.email ?? '',
    situacao: data.descricao_situacao_cadastral ?? '',
    cnaePrincipal: data.cnae_fiscal_descricao ?? '',
    dataAbertura: data.data_inicio_atividade ?? '',
  };
}

async function buscarNaReceitaWS(digits: string): Promise<DadosCNPJ> {
  const res = await fetch(`https://receitaws.com.br/v1/cnpj/${digits}`);
  if (!res.ok) throw new Error('Falha ao consultar a ReceitaWS.');
  const data = await res.json();
  if (data.status === 'ERROR') throw new CNPJNaoEncontradoError();

  return {
    razaoSocial: data.nome ?? '',
    nomeFantasia: data.fantasia ?? '',
    endereco: [data.tipo_logradouro, data.logradouro].filter(Boolean).join(' ').trim(),
    numero: data.numero ?? '',
    bairro: data.bairro ?? '',
    cidade: data.municipio ?? '',
    estado: data.uf ?? '',
    cep: formatarCEP(data.cep ?? ''),
    telefone: (data.telefone ?? '').replace(/\D/g, ''),
    email: data.email ?? '',
    situacao: data.situacao ?? '',
    cnaePrincipal: data.atividade_principal?.[0]?.text ?? '',
    dataAbertura: data.abertura ?? '',
  };
}

export const cnpjService = {
  async consultar(cnpj: string): Promise<DadosCNPJ> {
    const digits = apenasDigitos(cnpj);
    if (digits.length !== 14) {
      throw new Error('CNPJ inválido. Verifique os dígitos informados.');
    }
    try {
      return await buscarNaBrasilAPI(digits);
    } catch (e) {
      if (e instanceof CNPJNaoEncontradoError) throw e;
      // fallback para a segunda fonte pública em caso de indisponibilidade
      return await buscarNaReceitaWS(digits);
    }
  },
};
