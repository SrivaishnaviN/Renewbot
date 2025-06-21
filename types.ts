
import { GroundingChunk } from "@google/genai";

export enum SenderType {
  USER = 'user',
  BOT = 'bot',
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: SenderType;
  timestamp: Date;
  sources?: GroundingChunk[];
  isLoading?: boolean;
}
