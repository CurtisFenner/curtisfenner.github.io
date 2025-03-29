import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE_DESCRIPTION, SITE_TITLE } from "../consts.js";
import { postIsDraft, postUrl } from "../utils.js";

export async function GET(context: any) {
	const posts = await getCollection("blog");
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts
			.filter(post => !postIsDraft(post))
			.map((post) => ({
				...post.data,
				link: postUrl(post),
			})),
	});
}
