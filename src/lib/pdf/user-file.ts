export type UserFile = {
	id: string;
	file: File;
	name: string;
	size: number;
	pageCount: number | null;
	encrypted: boolean;
	signed: boolean;
	error: string | null;
	password: string;
	coverUrl: string | null;
	fingerprint: string | null;
};
