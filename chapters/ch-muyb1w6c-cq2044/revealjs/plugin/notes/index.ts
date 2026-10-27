import type { RevealPlugin } from 'reveal.js';

import NotesImplementation from './plugin.js';

export interface NotesPlugin extends RevealPlugin {
	id: 'notes';
	open(): void;
}

const Notes = NotesImplementation as unknown as () => NotesPlugin;

export default Notes;
