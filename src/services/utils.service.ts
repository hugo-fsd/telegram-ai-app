export function removeEmpty<T>(obj: T): T {
	if (obj === null || obj === undefined) {
		return obj;
	}

	if (Array.isArray(obj)) {
		const filtered = obj
			.map((item) => removeEmpty(item))
			.filter((item) => item !== null && item !== undefined);

		return (filtered.length === 0 ? undefined : filtered) as T;
	}

	if (typeof obj === "object") {
		const result = Object.entries(obj).reduce((acc, [key, value]) => {
			const cleaned = removeEmpty(value);

			if (
				cleaned !== null &&
				cleaned !== undefined &&
				!(Array.isArray(cleaned) && cleaned.length === 0) &&
				!(typeof cleaned === "object" && Object.keys(cleaned).length === 0)
			) {
				acc[key] = cleaned;
			}

			return acc;
		}, {} as Record<string, unknown>);

		return result as T;
	}

	return obj;
}
