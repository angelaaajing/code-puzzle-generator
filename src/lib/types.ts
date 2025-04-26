export interface CodeBlock {
  id: number;           // unique line identifier
  code: string;         // one snippet of code
  explanation: string;  // hover tooltip text
  correctRow: number;   // target grid row
  correctCol: number;   // target grid column
}

export interface Puzzle {
  blocks: CodeBlock[];
}