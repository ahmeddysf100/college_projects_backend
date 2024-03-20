export interface Question {
  id: number;
  Q_imageUrl?: string;
  Q_text?: null;
  correctAnswer?: string;
  answers?: answers[];
  explanationText?: string;
  A_imageUrl?: null;
}

export interface answers {
  A_text: string;
  isCorrect: string;
}
