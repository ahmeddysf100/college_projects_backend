export interface CreateArena {
  arena: Arena;
  accessToken: string;
}

export interface Arena {
  id: string;
  arenaQear: ArenaQear[];
  numOfPlayers: number;
  adminId: string;
  hasStarted: boolean;
  roundTime: number;
  participants: Nominations;
  nominations: Nominations;
  rankings: Nominations;
  results: any[];
}

export interface ArenaQear {
  id: number;
  Q_imageUrl: null | string;
  Q_text: null | string;
  correctAnswer: null;
  subjectId: number;
  createdAt: Date;
  updatedAt: Date;
  quizId: number;
  answers: Answer[] | null;
  AnswerExplanation: null;
  type: string;
}

export interface Answer {
  A_text: string;
}

export interface Nominations {}
