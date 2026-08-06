// Shared in-memory cache — BookPage prefetches here, ReadPage reads from here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chapterCache: Record<string, any> = {}
export default chapterCache
