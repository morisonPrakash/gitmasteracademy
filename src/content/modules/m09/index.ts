import type { ModuleContent } from '../../types';
import { lessonsA } from './lessons-a';
import { lessonsB } from './lessons-b';
import { quiz } from './quiz';

const content: ModuleContent = { id: 'm09', lessons: [...lessonsA, ...lessonsB], quiz };
export default content;
