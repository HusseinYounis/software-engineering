import type { RevealPlugin } from 'reveal.js';

import ZoomImplementation from './plugin.js';

export interface ZoomPlugin extends RevealPlugin {
	id: 'zoom';
}

const Zoom = ZoomImplementation as unknown as () => ZoomPlugin;

export default Zoom;
