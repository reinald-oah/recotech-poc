import PptxGenJS from 'pptxgenjs';
import { Recommendation, Client } from '../lib/supabase';

export const exportToPowerPoint = (reco: Recommendation, clientName: string) => {
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

  const fileName = `${reco.title.replace(/[^a-z0-9]/gi, '_')}.pptx`;
  pptx.writeFile({ fileName });
};

export const exportToCanva = (reco: Recommendation, clientName: string) => {
  const canvaText = `${reco.title}

Client: ${clientName}
Catégorie: ${reco.category}
Priorité: ${reco.priority}
${reco.context ? '\nContexte:\n' + reco.context : ''}

Recommandation:
${reco.description}

${reco.tags.length > 0 ? 'Tags: ' + reco.tags.join(', ') : ''}`;

  try {
    const blob = new Blob([canvaText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reco.title.replace(/[^a-z0-9]/gi, '_')}_canva.txt`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);

    setTimeout(() => {
      window.open('https://www.canva.com/create/', '_blank');
    }, 500);
  } catch (error) {
    console.error('Error exporting to Canva:', error);
    alert('Erreur lors de l\'exportation vers Canva');
  }
};
