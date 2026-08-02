import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Exporta o conteúdo de um elemento da tela (ex.: página de Relatórios) para
 * um PDF, respeitando cores e gráficos exatamente como aparecem na tela.
 * Divide automaticamente em várias páginas quando o conteúdo é mais alto
 * que uma folha A4.
 */
export async function exportarElementoParaPdf(elemento: HTMLElement, nomeArquivo: string, titulo?: string): Promise<void> {
  const canvas = await html2canvas(elemento, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
  });

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 24;
  const usableWidth = pageWidth - margin * 2;

  let offsetTop = margin;

  if (titulo) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(16, 18, 26);
    doc.text(titulo, margin, offsetTop + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(91, 95, 109);
    doc.text(new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }), margin, offsetTop + 24);
    offsetTop += 40;
  }

  const imgWidth = usableWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const usableHeightPerPage = pageHeight - margin * 2;

  const imgData = canvas.toDataURL('image/png');

  if (offsetTop + imgHeight <= pageHeight - margin) {
    // Cabe tudo numa página só.
    doc.addImage(imgData, 'PNG', margin, offsetTop, imgWidth, imgHeight);
  } else {
    // Divide a imagem em fatias, uma por página.
    const primeiraPaginaAltura = usableHeightPerPage - (offsetTop - margin);
    let renderizadoPx = 0;
    let pagina = 0;

    while (renderizadoPx < canvas.height) {
      const alturaDisponivelPt = pagina === 0 ? primeiraPaginaAltura : usableHeightPerPage;
      const alturaDisponivelPx = (alturaDisponivelPt * canvas.width) / imgWidth;
      const fatiaAlturaPx = Math.min(alturaDisponivelPx, canvas.height - renderizadoPx);

      const canvasFatia = document.createElement('canvas');
      canvasFatia.width = canvas.width;
      canvasFatia.height = fatiaAlturaPx;
      const ctx = canvasFatia.getContext('2d')!;
      ctx.drawImage(canvas, 0, renderizadoPx, canvas.width, fatiaAlturaPx, 0, 0, canvas.width, fatiaAlturaPx);

      const fatiaData = canvasFatia.toDataURL('image/png');
      const fatiaAlturaPt = (fatiaAlturaPx * imgWidth) / canvas.width;

      if (pagina > 0) doc.addPage();
      const y = pagina === 0 ? offsetTop : margin;
      doc.addImage(fatiaData, 'PNG', margin, y, imgWidth, fatiaAlturaPt);

      renderizadoPx += fatiaAlturaPx;
      pagina++;
    }
  }

  doc.save(nomeArquivo);
}
