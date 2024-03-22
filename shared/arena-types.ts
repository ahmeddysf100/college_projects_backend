export type Participants = {
  [participantID: string]: string;
};

export type Nomination = {
  userId: string;
  name: string;
  Q_id: number;
  text: string;
  time: Date | string;
};

type NominationID = string;

export type Nominations = {
  [nominationID: NominationID]: Nomination;
};

export type Rankings = {
  [userID: string]: NominationID[];
};

export type Results = Array<{
  nominationID: NominationID;
  nominationText: string;
  score: number;
}>;

// export interface Arena {
//   id: string;
//   arenaQear: ArenaQear[];
//   numOfPlayers: number;
//   participants: Nominations;
//   nominations: Nominations;
//   rankings: Nominations;
//   results: any[];
//   adminId: string;
//   hasStarted: boolean;
// }

export interface ArenaGear {
  id: number;
  Q_imageUrl: null | string;
  Q_text: null | string;
  correctAnswer: null | string;
  subjectId: number;
  createdAt: Date;
  updatedAt: Date;
  quizId: number;
  answers: Answer[];
  AnswerExplanation: AnswerExplanation[];
}

export interface AnswerExplanation {
  id: number;
  explanationText: null | string;
  A_imageUrl: null;
  questionId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Answer {
  id: number;
  A_text: string;
  isCorrect: boolean;
  questionId: number;
  createdAt: Date;
  updatedAt: Date;
}
