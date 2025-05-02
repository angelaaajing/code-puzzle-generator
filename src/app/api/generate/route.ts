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

  const systemMessage = `You are a code puzzle generator. Given a programming task, generate a solution in 3-10 code blocks.
      For each block:
      1. Write a logical unit of the solution (e.g., a function, a loop body, or a meaningful group of statements)
      2. Provide a brief explanation of what that code does
      3. Specify where this block should go in a grid (row and column numbers, starting from 0)
      Format the response as a JSON array of objects with the following structure for each block:
      {
          "id": number (unique identifier),
          "code": "the code snippet without leading spaces",
          "explanation": "brief explanation of what this block does",
          "correctRow": number (vertical position, starting from 0),
          "correctCol": number (horizontal position, starting from 0, each indent level = 4 spaces)
      }
          Example Output:
          [
            {
              "id": 0,
              "code":"def sum_evens(nums):",
              "explanation":"Define the function header.",
              "correctRow":0,
              "correctCol":0
            },
            {
              "id": 1,
              "code":"total=0",
              "explanation":"Initialize the running sum to zero.",
              "correctRow":1,
              "correctCol":1
            },
          ]`;

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