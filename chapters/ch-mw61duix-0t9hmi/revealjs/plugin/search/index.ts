import type { RevealPlugin } from 'reveal.js';

import SearchImplementation from './plugin.js';

export interface SearchPlugin extends RevealPlugin {
	id: 'search';
	open(): void;
	close(): void;
	toggle(): void;
}

const Search = SearchImplementation as unknown as () => SearchPlugin;

export default Search;
