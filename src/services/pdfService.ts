import jsPDF from 'jspdf';
import type { Cliente, Proposta } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import zazLogo from '../assets/zaz-logo.jpg';

async function carregarLogoBase64(): Promise<string> {
  const res = await fetch(zazLogo);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const ROXO: [number, number, number] = [47, 111, 237];
const CINZA_ESCURO: [number, number, number] = [16, 18, 26];
const CINZA: [number, number, number] = [91, 95, 109];
const CINZA_CLARO: [number, number, number] = [238, 240, 246];

export async function gerarPdfProposta(proposta: Proposta, cliente?: Cliente): Promise<void> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = 0;

  // Cabeçalho
  doc.setFillColor(...ROXO);
  doc.rect(0, 0, pageWidth, 96, 'F');

  try {
    const logoBase64 = await carregarLogoBase64();
    doc.addImage(logoBase64, 'JPEG', margin, 22, 52, 52, undefined, 'FAST');
  } catch {
    // segue sem logo se falhar
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Proposta Comercial', margin + 66, 48);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('ZAZ Vendas · Central do Vendedor', margin + 66, 66);

  doc.setFontSize(10);
  doc.text(`Nº ${proposta.id.toUpperCase()}`, pageWidth - margin, 40, { align: 'right' });
  doc.text(formatDate(proposta.data), pageWidth - margin, 56, { align: 'right' });

  y = 132;

  // Dados do cliente
  doc.setTextColor(...CINZA_ESCURO);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Dados do cliente', margin, y);
  y += 18;

  doc.setDrawColor(...CINZA_CLARO);
  doc.setFillColor(...CINZA_CLARO);
  doc.roundedRect(margin, y, pageWidth - margin * 2, cliente ? 98 : 40, 8, 8, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...CINZA);

  if (cliente) {
    const linhas = [
      [`Nome fantasia:`, cliente.nomeFantasia],
      [`Razão social:`, cliente.razaoSocial],
      [`CNPJ:`, cliente.cnpj],
      [`Telefone:`, cliente.telefone],
      [`E-mail:`, cliente.email],
      [`Cidade/UF:`, `${cliente.cidade} - ${cliente.estado}`],
    ];
    let ly = y + 20;
    linhas.forEach(([label, value], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = margin + 16 + col * ((pageWidth - margin * 2 - 32) / 2);
      const yy = y + 20 + row * 24;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...CINZA_ESCURO);
      doc.text(label, x, yy);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...CINZA);
      doc.text(String(value), x, yy + 13, { maxWidth: (pageWidth - margin * 2 - 32) / 2 - 8 });
    });
    y += 98 + 24;
    void ly;
  } else {
    doc.text(proposta.clienteNome, margin + 16, y + 25);
    y += 40 + 24;
  }

  // Resumo financeiro
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...CINZA_ESCURO);
  doc.text('Resumo financeiro', margin, y);
  y += 18;

  const taxaAplicada = proposta.taxas.credito;
  const valorTaxa = proposta.valor * (taxaAplicada / 100);
  const valorLiquido = proposta.valor - valorTaxa;

  const resumoLinhas: [string, string][] = [
    ['Valor da venda', formatCurrency(proposta.valor)],
    ['Parcelamento', `${proposta.parcelamento}x`],
    ['Taxa aplicada', `${taxaAplicada.toFixed(2)}%`],
    ['Valor da taxa', formatCurrency(valorTaxa)],
    ['Valor líquido estimado', formatCurrency(valorLiquido)],
  ];

  resumoLinhas.forEach(([label, value], i) => {
    const rowY = y + i * 26;
    if (i % 2 === 0) {
      doc.setFillColor(...CINZA_CLARO);
      doc.rect(margin, rowY - 14, pageWidth - margin * 2, 24, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...CINZA);
    doc.text(label, margin + 12, rowY + 2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...CINZA_ESCURO);
    doc.text(value, pageWidth - margin - 12, rowY + 2, { align: 'right' });
  });

  y += resumoLinhas.length * 26 + 20;

  // Destaque valor líquido
  doc.setFillColor(...ROXO);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 52, 8, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Valor líquido a receber', margin + 16, y + 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(formatCurrency(valorLiquido), margin + 16, y + 40);
  y += 52 + 28;

  // Observações
  if (proposta.observacoes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...CINZA_ESCURO);
    doc.text('Observações', margin, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...CINZA);
    const linhas = doc.splitTextToSize(proposta.observacoes, pageWidth - margin * 2);
    doc.text(linhas, margin, y);
    y += linhas.length * 14 + 20;
  }

  // Rodapé
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...CINZA_CLARO);
  doc.line(margin, pageHeight - 60, pageWidth - margin, pageHeight - 60);
  doc.setFontSize(8);
  doc.setTextColor(...CINZA);
  doc.text('Documento gerado automaticamente pela Central do Vendedor - ZAZ Vendas.', margin, pageHeight - 42);
  doc.text('Proposta sujeita a análise e confirmação de taxas vigentes.', margin, pageHeight - 30);

  doc.save(`proposta-${proposta.clienteNome.replace(/\s+/g, '-').toLowerCase()}-${proposta.id.slice(-6)}.pdf`);
}
