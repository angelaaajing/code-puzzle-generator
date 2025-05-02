import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { CodeBlock } from '@/lib/types';

function shuffleInPlace<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    // pick a random index from 0 to i
    const j = Math.floor(Math.random() * (i + 1));
    // swap elements i and j
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { prompt, apiKey } = body;

  if (!prompt || !apiKey) {
    return NextResponse.json({ error: 'Missing prompt or API key' }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey });

  const systemMessage = `You are a **code puzzle generator**.  
    **Input:** A natural-language description of a programming task.  
    **Output:** A single JSON array of **3-15** objects, each describing one “tile” (code block) in the solution grid.  

      Format the response as a JSON array of objects with the following structure for each block:
    {
      "id":        0,               // integer, unique identifier for this block
      "code":      "print('…')",    // string, the code snippet **without** leading spaces
      "explanation":"…",            // string, a 1-2 sentence summary of what the snippet does
      "correctRow":0,               // integer, row index in the grid (0 = top)
      "correctCol":1                // integer, column index (0 = left; each indent level = 4 spaces)
    }
      `;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ],
      store: false,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      return NextResponse.json({ error: 'Failed to generate puzzle content' }, { status: 500 });
    }
    // Parse the response and format it into Puzzle type
    const blocks: CodeBlock[] = JSON.parse(response).map((block: CodeBlock) => ({
      id: block.id,
      code: block.code,
      explanation: block.explanation,
      correctRow: block.correctRow,
      correctCol: block.correctCol,
    }));

    // Validate the generated blocks
    if (!blocks.length || blocks.length < 3) {
      return NextResponse.json({ error: 'Generated puzzle does not have enough code blocks' }, { status: 500 });
    }

    // shuffle them in-place:
    shuffleInPlace(blocks);

    return NextResponse.json({ puzzle: { blocks } }, { status: 200 });

  } catch (e: unknown) {
    console.error('[OPENAI ERROR]', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Failed to generate code blocks' }, { status: 500 });
  }
}