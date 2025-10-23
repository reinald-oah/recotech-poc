import PptxGenJS from 'pptxgenjs';
import { Recommendation, Client } from '../lib/supabase';

export const exportToPowerPoint = (reco: Recommendation, clientName: string) => {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Recos Manager';
  pptx.title = reco.title;

  const slide = pptx.addSlide();

  slide.background = { color: 'F8FAFC' };

  slide.addText(reco.title, {
    x: 0.5,
    y: 0.5,
    w: 8.5,
    h: 1,
    fontSize: 32,
    bold: true,
    color: '1E293B',
    fontFace: 'Arial'
  });

  slide.addText(clientName, {
    x: 0.5,
    y: 1.6,
    fontSize: 18,
    color: '64748B',
    fontFace: 'Arial'
  });

  const categoryColors: Record<string, string> = {
    SEO: '10B981',
    'Social Media': 'EC4899',
    Content: '3B82F6',
    Design: '8B5CF6',
    Development: '06B6D4',
    Strategy: 'F97316'
  };

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.5,
    y: 2.1,
    w: 1.5,
    h: 0.4,
    fill: { color: categoryColors[reco.category] || '64748B' },
    line: { type: 'none' }
  });

  slide.addText(reco.category, {
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

  const priorityColors: Record<string, string> = {
    High: 'EF4444',
    Medium: 'F59E0B',
    Low: '10B981'
  };

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 2.2,
    y: 2.1,
    w: 1.5,
    h: 0.4,
    fill: { color: 'FFFFFF' },
    line: { color: priorityColors[reco.priority] || '64748B', width: 2 }
  });

  slide.addText(`${reco.priority} Priority`, {
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
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.5,
      y: 2.8,
      w: 8.5,
      h: 1.2,
      fill: { color: 'F1F5F9' },
      line: { type: 'none' }
    });

    slide.addText('CONTEXTE', {
      x: 0.7,
      y: 2.9,
      fontSize: 12,
      bold: true,
      color: '475569',
      fontFace: 'Arial'
    });

    slide.addText(reco.context, {
      x: 0.7,
      y: 3.2,
      w: 8.1,
      fontSize: 14,
      color: '334155',
      fontFace: 'Arial'
    });
  }

  const descriptionY = reco.context ? 4.3 : 2.8;

  slide.addText('RECOMMANDATION', {
    x: 0.5,
    y: descriptionY,
    fontSize: 16,
    bold: true,
    color: '1E293B',
    fontFace: 'Arial'
  });

  slide.addText(reco.description, {
    x: 0.5,
    y: descriptionY + 0.4,
    w: 8.5,
    h: 2,
    fontSize: 14,
    color: '334155',
    fontFace: 'Arial',
    valign: 'top'
  });

  if (reco.tags.length > 0) {
    const tagsY = descriptionY + 2.6;
    slide.addText('Tags: ' + reco.tags.join(' • '), {
      x: 0.5,
      y: tagsY,
      fontSize: 12,
      color: '64748B',
      fontFace: 'Arial'
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

  const blob = new Blob([canvaText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${reco.title.replace(/[^a-z0-9]/gi, '_')}_canva.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  setTimeout(() => {
    window.open('https://www.canva.com/create/', '_blank');
  }, 500);
};
