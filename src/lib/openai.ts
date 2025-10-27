export interface AIAssistRequest {
  action: 'generate' | 'improve' | 'expand';
  category?: string;
  context?: string;
  prompt?: string;
  currentTitle?: string;
  clientName?: string;
  industry?: string;
}

export interface Chapter {
  title: string;
  content: string;
}

export const getAIAssistance = async (request: AIAssistRequest): Promise<{ title: string; description: string }> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('Clé API OpenAI non configurée. Veuillez ajouter votre clé API dans le fichier .env');
  }

  let prompt = '';

  switch (request.action) {
    case 'generate':
      prompt = `Tu es un consultant en marketing digital expert. Génère une recommandation professionnelle pour un client.

Catégorie: ${request.category}
${request.clientName ? `Client: ${request.clientName}` : ''}
${request.industry ? `Secteur: ${request.industry}` : ''}
${request.context ? `Contexte: ${request.context}` : ''}
${request.prompt ? `Instructions spécifiques: ${request.prompt}` : ''}

Fournis une réponse au format JSON avec:
- title: un titre court et percutant (max 80 caractères)
- description: une description détaillée et actionnable (3-5 paragraphes)

La recommandation doit être professionnelle, spécifique et actionnable.`;
      break;

    case 'improve':
      prompt = `Tu es un consultant en marketing digital expert. Améliore cette recommandation pour la rendre plus professionnelle et impactante.

Titre actuel: ${request.currentTitle}
${request.context ? `Contexte: ${request.context}` : ''}
${request.prompt ? `Instructions spécifiques: ${request.prompt}` : ''}

Fournis une réponse au format JSON avec:
- title: un titre amélioré (max 80 caractères)
- description: une description améliorée et plus détaillée

Améliore la clarté, la structure et ajoute des détails pertinents.`;
      break;

    case 'expand':
      prompt = `Tu es un consultant en marketing digital expert. Enrichis cette recommandation avec du contenu additionnel pertinent.

Titre: ${request.currentTitle}
${request.context ? `Contexte: ${request.context}` : ''}
${request.prompt ? `Instructions spécifiques: ${request.prompt}` : ''}

Fournis une réponse au format JSON avec:
- title: le même titre ou légèrement amélioré
- description: une description enrichie avec:
  * Des exemples concrets
  * Des métriques ou KPIs à suivre
  * Des étapes d'implémentation
  * Des best practices

Ajoute du contenu de valeur.`;
      break;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert en marketing digital qui aide à créer des recommandations professionnelles pour des clients. Réponds toujours en français et au format JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Erreur lors de la communication avec OpenAI');
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  try {
    const parsed = JSON.parse(content);
    return {
      title: parsed.title || '',
      description: parsed.description || ''
    };
  } catch (e) {
    throw new Error('Erreur lors du parsing de la réponse AI');
  }
};

export const parseDescriptionIntoChapters = async (description: string): Promise<Chapter[]> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('Clé API OpenAI non configurée');
  }

  const prompt = `Analyse le texte suivant et identifie les chapitres/sections distincts.

Pour chaque chapitre identifié, fournis:
- Un titre court et descriptif
- Le contenu complet du chapitre

Texte à analyser:
${description}

Réponds au format JSON avec un tableau "chapters" contenant des objets avec "title" et "content".
Exemple de format attendu:
{
  "chapters": [
    {
      "title": "Introduction",
      "content": "Le contenu de l'introduction..."
    },
    {
      "title": "Stratégie",
      "content": "Le contenu de la stratégie..."
    }
  ]
}

Si le texte contient déjà des numéros de chapitres (1., 2., etc.), garde cette numérotation dans les titres.
Assure-toi que TOUT le contenu est inclus dans les chapitres - ne saute aucune partie du texte.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant expert en analyse de texte et structuration de contenu. Tu identifies les sections logiques dans un texte et les organises de manière claire.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Erreur lors de la communication avec OpenAI');
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  try {
    const parsed = JSON.parse(content);
    return parsed.chapters || [];
  } catch (e) {
    throw new Error('Erreur lors du parsing de la réponse AI');
  }
};
