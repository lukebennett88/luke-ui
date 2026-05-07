import { Numeral } from '@luke-ui/react/numeral';
import { createWrappedStoryClient } from '../lib/story-wrapper';
import type { story } from './numeral.story';

export const storyClient = createWrappedStoryClient<typeof story>(Numeral);
