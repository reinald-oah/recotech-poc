import PptxGenJS from 'pptxgenjs';
import { jsPDF } from 'jspdf';
import { writePsd } from 'ag-psd';
import { Recommendation, Client } from '../lib/supabase';
import { parseDescriptionIntoChapters } from '../lib/openai';

export const exportToPowerPoint = async (reco: Recommendation, clientName: string) => {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Recos Manager';
  pptx.title = reco.title;

  const categoryColors: Record<string, string> = {
    SEO: '10B981',
    'Social Media': 'EC4899',
    Content: '3B82F6',
    Design: '8B5CF6',
    Development: '06B6D4',
    Strategy: 'F97316'
  };

  const priorityColors: Record<string, string> = {
    High: 'EF4444',
    Medium: 'F59E0B',
    Low: '10B981'
  };

  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: 'F8FAFC' };

  titleSlide.addText(reco.title, {
    x: 0.5,
    y: 0.5,
    w: 8.5,
    h: 1,
    fontSize: 32,
    bold: true,
    color: '1E293B',
    fontFace: 'Arial'
  });

  titleSlide.addText(clientName, {
    x: 0.5,
    y: 1.6,
    fontSize: 18,
    color: '64748B',
    fontFace: 'Arial'
  });

  titleSlide.addShape(pptx.ShapeType.roundRect, {
    x: 0.5,
    y: 2.1,
    w: 1.5,
    h: 0.4,
    fill: { color: categoryColors[reco.category] || '64748B' },
    line: { type: 'none' }
  });

  titleSlide.addText(reco.category, {
    x: 0.5,
    y: 2.1,
    w: 1.5,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle',
    fontFace: 'Arial'
  });

  titleSlide.addShape(pptx.ShapeType.roundRect, {
    x: 2.2,
    y: 2.1,
    w: 1.5,
    h: 0.4,
    fill: { color: 'FFFFFF' },
    line: { color: priorityColors[reco.priority] || '64748B', width: 2 }
  });

  titleSlide.addText(`${reco.priority} Priority`, {
    x: 2.2,
    y: 2.1,
    w: 1.5,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: priorityColors[reco.priority] || '64748B',
    align: 'center',
    valign: 'middle',
    fontFace: 'Arial'
  });

  if (reco.context) {
    titleSlide.addShape(pptx.ShapeType.roundRect, {
      x: 0.5,
      y: 2.8,
      w: 8.5,
      h: 1.2,
      fill: { color: 'F1F5F9' },
      line: { type: 'none' }
    });

    titleSlide.addText('CONTEXTE', {
      x: 0.7,
      y: 2.9,
      fontSize: 12,
      bold: true,
      color: '475569',
      fontFace: 'Arial'
    });

    titleSlide.addText(reco.context, {
      x: 0.7,
      y: 3.2,
      w: 8.1,
      fontSize: 14,
      color: '334155',
      fontFace: 'Arial'
    });
  }

  if (reco.tags.length > 0) {
    const tagsY = reco.context ? 4.2 : 2.8;
    titleSlide.addText('Tags: ' + reco.tags.join(' • '), {
      x: 0.5,
      y: tagsY,
      fontSize: 12,
      color: '64748B',
      fontFace: 'Arial'
    });
  }

  try {
    const chapters = await parseDescriptionIntoChapters(reco.description);

    if (chapters && chapters.length > 0) {
      chapters.forEach((chapter, index) => {
        const contentSlide = pptx.addSlide();
        contentSlide.background = { color: 'F8FAFC' };

        contentSlide.addText(chapter.title, {
          x: 0.5,
          y: 0.4,
          w: 8.5,
          fontSize: 26,
          bold: true,
          color: '1E293B',
          fontFace: 'Arial'
        });

        contentSlide.addShape(pptx.ShapeType.rect, {
          x: 0.5,
          y: 1.1,
          w: 8.5,
          h: 0.02,
          fill: { color: categoryColors[reco.category] || '3B82F6' },
          line: { type: 'none' }
        });

        if (chapter.content) {
          const bulletMatch = chapter.content.match(/[-•*]\s+.+/g);

          if (bulletMatch) {
            const bullets = bulletMatch.map(b => b.replace(/^[-•*]\s+/, '').trim());
            const bulletData = bullets.map(bullet => ({
              text: bullet,
              options: { bullet: true }
            }));

            contentSlide.addText(bulletData, {
              x: 0.7,
              y: 1.5,
              w: 8.1,
              fontSize: 13,
              color: '334155',
              fontFace: 'Arial',
              lineSpacing: 18
            });
          } else {
            const cleanContent = chapter.content.replace(/\n+/g, '\n\n');

            contentSlide.addText(cleanContent, {
              x: 0.7,
              y: 1.5,
              w: 8.1,
              fontSize: 13,
              color: '334155',
              fontFace: 'Arial',
              lineSpacing: 16
            });
          }
        }

        contentSlide.addText(`${index + 1} / ${chapters.length}`, {
          x: 8.3,
          y: 5.1,
          w: 0.7,
          fontSize: 9,
          color: '94A3B8',
          align: 'right',
          fontFace: 'Arial'
        });
      });
    }
  } catch (error) {
    console.error('Error parsing chapters with AI, falling back to simple split:', error);

    const description = reco.description;
    const chapterMatches = description.match(/(\d+)\.\s+([^\n]+)(?:\n([^]*?))?(?=\n\d+\.\s+|\n*$)/g);

    if (chapterMatches && chapterMatches.length > 0) {
      chapterMatches.forEach((chapterText, index) => {
        const contentSlide = pptx.addSlide();
        contentSlide.background = { color: 'F8FAFC' };

        const titleMatch = chapterText.match(/^(\d+)\.\s+(.+?)$/m);
        const chapterNumber = titleMatch ? titleMatch[1] : (index + 1).toString();
        const chapterTitle = titleMatch ? titleMatch[2].trim() : `Chapitre ${index + 1}`;

        const contentStart = chapterText.indexOf('\n');
        const chapterContent = contentStart > -1 ? chapterText.substring(contentStart).trim() : '';

        contentSlide.addText(`${chapterNumber}. ${chapterTitle}`, {
          x: 0.5,
          y: 0.4,
          w: 8.5,
          fontSize: 26,
          bold: true,
          color: '1E293B',
          fontFace: 'Arial'
        });

        contentSlide.addShape(pptx.ShapeType.rect, {
          x: 0.5,
          y: 1.1,
          w: 8.5,
          h: 0.02,
          fill: { color: categoryColors[reco.category] || '3B82F6' },
          line: { type: 'none' }
        });

        if (chapterContent) {
          const bulletMatch = chapterContent.match(/[-•*]\s+.+/g);

          if (bulletMatch) {
            const bullets = bulletMatch.map(b => b.replace(/^[-•*]\s+/, '').trim());
            const bulletData = bullets.map(bullet => ({
              text: bullet,
              options: { bullet: true }
            }));

            contentSlide.addText(bulletData, {
              x: 0.7,
              y: 1.5,
              w: 8.1,
              fontSize: 13,
              color: '334155',
              fontFace: 'Arial',
              lineSpacing: 18
            });
          } else {
            const cleanContent = chapterContent.replace(/\n+/g, '\n\n');

            contentSlide.addText(cleanContent, {
              x: 0.7,
              y: 1.5,
              w: 8.1,
              fontSize: 13,
              color: '334155',
              fontFace: 'Arial',
              lineSpacing: 16
            });
          }
        }

        contentSlide.addText(`${index + 1} / ${chapterMatches.length}`, {
          x: 8.3,
          y: 5.1,
          w: 0.7,
          fontSize: 9,
          color: '94A3B8',
          align: 'right',
          fontFace: 'Arial'
        });
      });
    } else {
      const chapters = description.split(/\n\n+/).filter(c => c.trim().length > 0);

      chapters.forEach((chapter, index) => {
        const contentSlide = pptx.addSlide();
        contentSlide.background = { color: 'F8FAFC' };

        const lines = chapter.trim().split('\n');
        const title = lines[0].replace(/^#+\s*/, '').trim();
        const content = lines.slice(1).join('\n').trim();

        contentSlide.addText(title || `Section ${index + 1}`, {
          x: 0.5,
          y: 0.4,
          w: 8.5,
          fontSize: 26,
          bold: true,
          color: '1E293B',
          fontFace: 'Arial'
        });

        contentSlide.addShape(pptx.ShapeType.rect, {
          x: 0.5,
          y: 1.1,
          w: 8.5,
          h: 0.02,
          fill: { color: categoryColors[reco.category] || '3B82F6' },
          line: { type: 'none' }
        });

        if (content) {
          contentSlide.addText(content, {
            x: 0.7,
            y: 1.5,
            w: 8.1,
            fontSize: 13,
            color: '334155',
            fontFace: 'Arial',
            lineSpacing: 16
          });
        }

        contentSlide.addText(`${index + 1} / ${chapters.length}`, {
          x: 8.3,
          y: 5.1,
          w: 0.7,
          fontSize: 9,
          color: '94A3B8',
          align: 'right',
          fontFace: 'Arial'
        });
      });
    }
  }

  const fileName = `${reco.title.replace(/[^a-z0-9]/gi, '_')}.pptx`;
  pptx.writeFile({ fileName });
};

export const exportToPDF = async (reco: Recommendation, clientName: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;

  const categoryColors: Record<string, [number, number, number]> = {
    SEO: [16, 185, 129],
    'Social Media': [236, 72, 153],
    Content: [59, 130, 246],
    Design: [139, 92, 246],
    Development: [6, 182, 212],
    Strategy: [249, 115, 22]
  };

  const priorityColors: Record<string, [number, number, number]> = {
    High: [239, 68, 68],
    Medium: [245, 158, 11],
    Low: [16, 185, 129]
  };

  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(reco.title, margin, 30, { maxWidth });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(clientName, margin, 45);

  const categoryColor = categoryColors[reco.category] || [100, 116, 139];
  doc.setFillColor(...categoryColor);
  doc.roundedRect(margin, 55, 40, 8, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(reco.category, margin + 20, 61, { align: 'center' });

  const priorityColor = priorityColors[reco.priority] || [100, 116, 139];
  doc.setDrawColor(...priorityColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin + 45, 55, 40, 8, 2, 2);
  doc.setTextColor(...priorityColor);
  doc.text(`${reco.priority} Priority`, margin + 65, 61, { align: 'center' });

  let currentY = 75;

  if (reco.context) {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, currentY, maxWidth, 20, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('CONTEXTE', margin + 3, currentY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10);
    const contextLines = doc.splitTextToSize(reco.context, maxWidth - 6);
    doc.text(contextLines, margin + 3, currentY + 12);
    currentY += 30;
  }

  if (reco.tags.length > 0) {
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Tags: ' + reco.tags.join(' • '), margin, currentY);
    currentY += 10;
  }

  try {
    const chapters = await parseDescriptionIntoChapters(reco.description);

    if (chapters && chapters.length > 0) {
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];

        if (i > 0 || currentY > 100) {
          doc.addPage();
          currentY = 20;
          doc.setFillColor(248, 250, 252);
          doc.rect(0, 0, pageWidth, pageHeight, 'F');
        }

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        const titleLines = doc.splitTextToSize(chapter.title, maxWidth);
        doc.text(titleLines, margin, currentY);
        currentY += titleLines.length * 8 + 5;

        const categoryColor = categoryColors[reco.category] || [59, 130, 246];
        doc.setDrawColor(...categoryColor);
        doc.setLineWidth(0.5);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 8;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);

        if (chapter.content) {
          const contentLines = doc.splitTextToSize(chapter.content, maxWidth);
          for (let j = 0; j < contentLines.length; j++) {
            if (currentY > pageHeight - 30) {
              doc.addPage();
              currentY = 20;
              doc.setFillColor(248, 250, 252);
              doc.rect(0, 0, pageWidth, pageHeight, 'F');
            }
            doc.text(contentLines[j], margin, currentY);
            currentY += 6;
          }
        }

        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`${i + 1} / ${chapters.length}`, pageWidth - margin - 10, pageHeight - 10);
      }
    }
  } catch (error) {
    console.error('Error parsing chapters with AI, using simple split:', error);

    const description = reco.description;
    const paragraphs = description.split(/\n\n+/).filter(p => p.trim().length > 0);

    doc.addPage();
    currentY = 20;
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    for (const para of paragraphs) {
      const lines = doc.splitTextToSize(para, maxWidth);
      for (const line of lines) {
        if (currentY > pageHeight - 30) {
          doc.addPage();
          currentY = 20;
          doc.setFillColor(248, 250, 252);
          doc.rect(0, 0, pageWidth, pageHeight, 'F');
        }
        doc.text(line, margin, currentY);
        currentY += 6;
      }
      currentY += 4;
    }
  }

  const pdfFileName = `${reco.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
  doc.save(pdfFileName);
};

export const exportToCanva = async (reco: Recommendation, clientName: string) => {
  try {
    const chapters = await parseDescriptionIntoChapters(reco.description);

    const width = 1920;
    const height = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    const createTextLayer = (text: string, y: number, fontSize: number, layerName: string) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#1E293B';
      ctx.font = `${fontSize}px Arial`;
      ctx.textBaseline = 'top';

      const lines: string[] = [];
      const maxWidth = width - 100;
      const words = text.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      lines.forEach((line, i) => {
        ctx.fillText(line, 50, y + i * (fontSize + 10));
      });

      const imageData = ctx.getImageData(0, 0, width, height);
      return {
        name: layerName,
        canvas: imageData,
        opacity: 255,
        blendMode: 'normal'
      };
    };

    const layers: any[] = [];

    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, width, height);
    const bgImageData = ctx.getImageData(0, 0, width, height);
    layers.push({
      name: 'Background',
      canvas: bgImageData,
      opacity: 255,
      blendMode: 'normal'
    });

    layers.push(createTextLayer(reco.title, 50, 48, 'Title'));
    layers.push(createTextLayer(clientName, 120, 28, 'Client'));
    layers.push(createTextLayer(`${reco.category} • ${reco.priority} Priority`, 160, 20, 'Metadata'));

    if (reco.context) {
      layers.push(createTextLayer(`Context: ${reco.context}`, 210, 18, 'Context'));
    }

    if (chapters && chapters.length > 0) {
      let yPos = reco.context ? 300 : 250;
      chapters.forEach((chapter, index) => {
        layers.push(createTextLayer(chapter.title, yPos, 32, `Chapter ${index + 1} Title`));
        yPos += 60;

        if (chapter.content) {
          layers.push(createTextLayer(chapter.content, yPos, 18, `Chapter ${index + 1} Content`));
          yPos += 150;
        }
      });
    } else {
      layers.push(createTextLayer(reco.description, 250, 18, 'Description'));
    }

    if (reco.tags.length > 0) {
      layers.push(createTextLayer('Tags: ' + reco.tags.join(', '), height - 100, 16, 'Tags'));
    }

    const psd = {
      width,
      height,
      channels: 3,
      bitsPerChannel: 8,
      colorMode: 3,
      children: layers
    };

    const buffer = writePsd(psd);
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reco.title.replace(/[^a-z0-9]/gi, '_')}.psd`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);

  } catch (error) {
    console.error('Error exporting to PSD:', error);
    alert('Erreur lors de l\'exportation vers PSD. Vérifiez que votre clé API OpenAI est configurée.');
  }
};
