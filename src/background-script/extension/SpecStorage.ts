import { InMemoryStorage } from "../storage/InMemoryStorage";
import { Spec } from "./Spec";

export class SpecStorage extends InMemoryStorage<Spec>{ 
    async set(key: string, obj: Spec): Promise<void> {
        obj.setSpecStorage(null);
		super.set(key, obj);
	}
}