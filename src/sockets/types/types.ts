import { Request } from 'express';
import { Nomination } from 'shared/arena-types';
import { Socket } from 'socket.io';

// service types
export type CreateArenaFields = {
  topic: string;
  votesPerVoter: number;
  name: string;
};

export type JoinArenaFields = {
  arenaId: string;
  name: string;
};

export type RejoinArenaFields = {
  arenaId: string;
  userId: string;
  name: string;
};

export type AddParticipantFields = {
  arenaId: string;
  userId: string;
  name: string;
};

export type AddNominationFields = {
  arenaId: string;
  userId: string;
  text: string;
  name: string;
  Q_id: number;
};

export type SubmitRankingsFields = {
  arenaId: string;
  userId: string;
  rankings: string[];
};

// repository types
export type CreateArenaData = {
  arenaId: string;
  topic: string;
  votesPerVoter: number;
  userId: string;
};

export type AddParticipantData = {
  arenaId: string;
  userId: string;
  name: string;
};

export type AddNominationData = {
  arenaId: string;
  nomination: Nomination;
};

export type AddParticipantRankingsData = {
  arenaId: string;
  userId: string;
  rankings: string[];
};

export interface StoredAnswers {
  Q_id: number;
  text: string;
  solver: Solver;
}

export interface Solver {
  userId: string;
  name: string;
}

// guard types
export type AuthPayload = {
  userId: string;
  arenaId: string;
  name: string;
};

export type RequestWithAuth = Request & AuthPayload;
export type SocketWithAuth = Socket & AuthPayload;
