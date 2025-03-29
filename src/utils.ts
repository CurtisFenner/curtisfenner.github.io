export function postIsDraft(post: { data: { published: string } }): boolean {
	return post.data.published.toLowerCase().includes("draft");
}

export function postUrl(post: { id: string, data: { topSlug?: string } }): string {
	if (post.data.topSlug) {
		return `/${post.data.topSlug}/`;
	} else {
		return `/blog/${post.id}/`;
	}
}
