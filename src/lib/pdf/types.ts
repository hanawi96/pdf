export type ToolId =
	| 'merge'
	| 'split'
	| 'delete'
	| 'rotate'
	| 'organize'
	| 'images-to-pdf'
	| 'pdf-to-images'
	| 'page-numbers';

export type QuarterTurn = 0 | 90 | 180 | 270;

export type PageNumberPosition = 'tl' | 'tc' | 'tr' | 'bl' | 'bc' | 'br';

export type PageNumberTemplate = 'n' | 'n-of-total' | 'page-n';

export type PageNumberOptions = {
	position: PageNumberPosition;
	start: number;
	fontSize: number;
	margin: number;
	template: PageNumberTemplate;
	skipFirst: boolean;
	color: 'black' | 'white';
};

export type OutputFile = {
	name: string;
	data: Uint8Array;
	mime: string;
};

export type ImageInput = {
	data: Uint8Array;
	mime: string;
	name: string;
};

export type Job =
	| { tool: 'merge'; files: Uint8Array[]; names: string[] }
	| { tool: 'split'; file: Uint8Array; name: string; mode: 'each' | 'ranges'; ranges: string }
	| { tool: 'delete'; file: Uint8Array; name: string; pages: number[] }
	| { tool: 'rotate'; file: Uint8Array; name: string; rotations: Record<string, QuarterTurn> }
	| { tool: 'organize'; file: Uint8Array; name: string; order: number[] }
	| {
			tool: 'images-to-pdf';
			images: ImageInput[];
			pageSize: 'a4' | 'fit';
			name: string;
	  }
	| {
			tool: 'pdf-to-images';
			file: Uint8Array;
			name: string;
			format: 'jpeg' | 'png';
			quality: number;
			scale: number;
			pages: number[];
			password?: string;
	  }
	| { tool: 'page-numbers'; file: Uint8Array; name: string; options: PageNumberOptions };

export type ProgressFn = (progress: number | null, message: string) => void;

export type Inspection = {
	pageCount: number | null;
	encrypted: boolean;
	signed: boolean;
};
