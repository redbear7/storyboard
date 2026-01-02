
export type ImageStyle = 'cinematic' | 'webtoon_action' | 'webtoon_romance' | 'webtoon_thriller' | 'webtoon_yadam';
export type Era = 'modern' | 'joseon';
export type AspectRatio = '16:9' | '9:16';

export interface Character {
  id: string;
  name: string;
  description: string;
  imagePrompt: string;
  imageUrl?: string;
  isLoading: boolean;
  error?: string;
}

export interface Scene {
  id: string;
  chapterNumber?: number;
  title: string;
  summary: string;
  scriptSegment?: string;
  imagePrompt: string;
  isClimax: boolean;
  imageUrl?: string;
  isLoading: boolean;
  error?: string;
}

export interface Headline {
  line1: string;
  line2: string;
}

export interface AnalysisResult {
  headline: Headline;
  visualStyleGuide: string;
  characters: {
    name: string;
    description: string;
    imagePrompt: string;
  }[];
  climax: {
    title: string;
    summary: string;
    scriptSegment: string;
    imagePrompt: string;
  };
  chapters: {
    title: string;
    summary: string;
    scriptSegment: string;
    imagePrompt: string;
  }[];
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  CHARACTER_GEN = 'CHARACTER_GEN',
  CHARACTER_CONFIRM = 'CHARACTER_CONFIRM',
  GENERATING_IMAGES = 'GENERATING_IMAGES',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}
