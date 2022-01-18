export interface ObjectStorage<Type> {
	set(key: string, obj: Type): Promise<void>;

	get(key: string): Promise<Type | null>;

	remove(key: string): Promise<void>;
}
