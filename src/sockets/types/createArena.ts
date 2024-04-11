export interface Ranks {
  name: string;
  userId: string;
  rank: number;
}

export interface CreateArena {
  arena: Arena;
  accessToken: string;
}

export interface AddParticipant {
  arenaData: Arena;
  title: string;
}
export interface AddParticipantWithGear {
  arenaData: Arena;
  gearData: Arena_updated_gear | string;
  title: string;
}

export interface Arena_updated_gear {
  id: number;
  Q_imageUrl: string | null;
  Q_text: string | null;
  correctAnswer: string | null | number;
  subjectId: number;
  createdAt: Date;
  updatedAt: Date;
  quizId: number;
  answers: answers_Arena_gear[] | null;
  AnswerExplanation: null;
  type: string;
}

export interface answers_Arena_gear {
  A_text: string | number;
}

export interface Arena {
  id: string;
  arenaQear: Arena_updated_gear[];
  numOfPlayers: number;
  adminId: string;
  hasStarted: boolean;
  roundTime: number;
  participants: Nominations;
  nominations: Nominations;
  un_Solved_Quseions: any[];
  rankings: Rankings[];
  results: any[];
}

type NominationID = string;

export type Rankings = {
  [userID: string]: NominationID[];
};

export interface Nominations {}
